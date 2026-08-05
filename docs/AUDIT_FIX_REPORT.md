# ZenovaX — Audit Fix Report

Comprehensive security & reliability hardening pass on the ZenovaX codebase.

- **Scope:** backend (Express/Prisma, AWS Lambda/serverless) + frontend (React/Vite SPA)
- **Date:** 2026
- **Approach:** Priorities fixed in severity order; smallest possible changes; no breaking changes; backward compatibility preserved; each fix verified (lint / module load / build) before moving on.
- **Status:** All **22 issues** fixed. Nothing was committed — review and commit when ready.

---

## Severity legend

| Severity | Meaning |
|---|---|
| **CRITICAL** | Remote code execution, credential/data exposure, production-broken behavior |
| **HIGH** | Financial loss, auth/permission bypass, XSS, deploy/config breaks |
| **MEDIUM** | Performance, hardening, cleanup |

---

## P1 — Critical

### P1.1 — Remote Code Execution in the JS code runner
- **Severity:** CRITICAL
- **Problem:** `backend/services/codeRunner.js` ran student-submitted JavaScript via `child_process.spawn('node', …)`. Any learner could execute arbitrary code server-side (read env vars, hit internal endpoints, etc.).
- **Solution:**
  - Removed `child_process`/`spawn` and the `executeJavaScriptLocally` export entirely.
  - All JS branches in `runTestCases` / `runStructuredTestCases` now go through `executePiston` (isolated execution service).
  - `executePiston` **fails closed**: returns 503 if `PISTON_API_URL` is not configured, and shims the missing `/execute` path on the base URL.
  - Removed the unused `JAVASCRIPT_TIMEOUT_MS` and the `ALLOWED_UNSAFE_APIS` allow-list block.
- **Files:** `backend/services/codeRunner.js`
- **Verification:** ESLint clean, module loads, `PISTON_API_URL` already present in `.env.example`/`template.yaml`.
- **Note for prod:** the default `PISTON_API_URL` points at a third-party service (`emkc.org`). Self-host Piston for production.

### P1.2 — Quiz answer leakage to learners
- **Severity:** CRITICAL
- **Problem:** `backend/routes/quiz.js` returned `correctAnswer` / `explanation` for every question to **any authenticated user**, including learners who had not attempted the quiz (and even learners not booked in the session).
- **Solution:**
  - Added helpers `stripAnswersFromQuestions(questions)` (destructures out `correctAnswer`/`explanation`) and `canViewAnswers(quiz, user)` (creator or `ADMIN`).
  - `GET /session/:sessionId` now 404s/403s unless `session.mentorId === req.user.id` or role `ADMIN`.
  - `GET /:id` is 403 for non-creator/admins.
  - `GET /:id/attempt` returns questions stripped of answers (both for fresh attempts and for the already-attempted result view, which uses the correct answers internally before stripping).
- **Files:** `backend/routes/quiz.js`
- **Verification:** ESLint clean, module loads.

### P1.3 — Coding-question answer/test-case leakage
- **Severity:** CRITICAL
- **Problem:** Learners could retrieve full coding questions including `referenceSolution`, `starterCode`, and **hidden test cases** through the session-list and single-question endpoints.
- **Solution:**
  - `sessionService.getSessionById` coding-question include narrowed to non-sensitive fields + `PASSED` submission ids.
  - `codingService.getCodingQuestionsBySession` now: 404s if the session is missing; restricts listing to the session mentor/`ADMIN` unless the user has a `CONFIRMED`/`COMPLETED` booking; strips `referenceSolution`/`starterCode` and redacts hidden tests for non-privileged users via `redactHiddenTestCases` / `redactHiddenStructuredTestCases`.
  - Controller passes `req.user.role` through.
  - Verified the single-question read path (`getCodingQuestionById`) already redacts `referenceSolution` and hidden tests for non-privileged users.
- **Files:** `backend/services/codingService.js`, `backend/services/sessionService.js`, `backend/controllers/codingChallengeController.js`
- **Verification:** ESLint clean, module loads.

### P1.4 — Background worker never runs on serverless
- **Severity:** CRITICAL
- **Problem:** Session completion, mentor earnings release, stale-booking cancellation, notification cleanup, and badge calculation were driven by an in-process `setInterval` worker. AWS Lambda **freezes** a function after it responds, so that timer never fires in production — earnings were never released and stale seats never freed.
- **Solution:**
  - Rewrote `backend/utils/queue.js`:
    - `runWorkerPass(prisma)` — one complete maintenance sweep (marks ended sessions `COMPLETED`, enqueues badge calc, releases mentor earnings, cancels stale `PENDING` bookings, cleans notifications/refresh tokens), guarded by a non-overlap flag.
    - `drainBadgeQueue(prisma)` — spins up a short-lived BullMQ `Worker` (autorun off) that claims and completes queued jobs.
    - `startQueueWorker(prisma)` — recursive `setTimeout` loop for long-lived (non-serverless) processes.
  - New `backend/lambda-worker.js` entry point — the scheduled Lambda that runs one full pass (`runWorkerPass` + `drainBadgeQueue`) synchronously and returns.
  - Added `BackgroundWorker` (scheduled `rate(1 minute)`) to `backend/template.yaml`, sharing the same `CodeUri`.
- **Files:** `backend/utils/queue.js`, `backend/lambda-worker.js` (new), `backend/template.yaml`
- **Verification:** ESLint clean; module-load smoke test; YAML validated.

### P1.5 — Email configuration mismatch (emails silently never sent in prod)
- **Severity:** CRITICAL
- **Problem:** Code read `EMAIL_USER`/`EMAIL_PASS`, but `.env.example` and `template.yaml` defined `GMAIL_USER`/`GMAIL_APP_PASSWORD` — so in production the Lambda had no usable credentials and **no email was ever sent**. `FRONTEND_URL` was also missing from the Lambda environment, so every verification/reset link pointed at `http://localhost:5173`.
- **Solution:**
  - `backend/utils/emailService.js` now resolves `EMAIL_USER/EMAIL_PASS` with a backward-compatible `GMAIL_USER/GMAIL_APP_PASSWORD` fallback; centralized `EMAIL_SERVICE`, `EMAIL_FROM`, and `FRONTEND_URL` resolution.
  - `.env.example` uses the canonical `EMAIL_*` names.
  - `template.yaml` now passes `EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS/EMAIL_FROM/FRONTEND_URL` (and new `Email*`/`FrontendUrl` parameters).
- **Files:** `backend/utils/emailService.js`, `backend/.env.example`, `backend/template.yaml`
- **Verification:** ESLint clean, module loads.

---

## P2 — High (Financial)

### P2.1 — Financial race conditions (double-credit / overdraw / double-release)
- **Severity:** HIGH
- **Problem:** Several money-moving operations read-then-write without atomicity:
  - Booking confirm: webhook + client callback could both pass the status check → **double mentor credit**.
  - Earnings release: two overlapping worker passes could **release the same earnings twice**.
  - Payout request: two simultaneous requests could **overdraw** `balanceAvailable`.
  - Mark-payout-paid/failed: concurrent admin calls could **double-count / double-refund**.
- **Solution:** Introduced atomic "claim" writes via conditional `updateMany` in each path:
  - `confirmBookingPaid`: claim `status NOT IN (CONFIRMED, COMPLETED)`, skip if `count === 0`.
  - `releaseEarningsForSession`: per-booking claim `earningsReleased: false`, skip if `count === 0`.
  - `requestPayout`: decrement only when `balanceAvailable >= amount`, else reject.
  - `markPayoutPaid` / `markPayoutFailed`: claim on payout status `IN (PENDING, PROCESSING)`.
- **Files:** `backend/services/sessionService.js`, `backend/services/mentorWalletService.js`
- **Verification:** ESLint clean, module loads.

### P2.2 — Webhook/client-callback amount verification
- **Severity:** HIGH
- **Problem:** The Razorpay webhook trusted the webhook body's `order_id`/`payment_id` and confirmed bookings without checking the captured **amount**. An attacker who could forge/relay events (or a partial-payment scenario) could confirm a booking for less than the full price.
- **Solution:** Both the webhook (`paymentController.handleWebhook`) and the client callback (`sessionService.verifyPayment`) now re-fetch the payment from Razorpay via `paymentService.fetchPayment` and require:
  - `payment.status === 'captured'`,
  - `payment.id === paymentId`, `payment.order_id === orderId`,
  - `payment.amount` (paise) === `round(totalAmount * 100)`.
  - Webhook returns 500 (Razorpay retries) on a transient verification-fetch failure, and refuses to confirm on mismatch.
- **Files:** `backend/controllers/paymentController.js`, `backend/services/sessionService.js`, `backend/services/paymentService.js` (used existing `fetchPayment`)
- **Verification:** ESLint clean, module loads.

### P2.3 — Review rating validation + duplicate-review race
- **Severity:** HIGH
- **Problem:** `POST /api/reviews/create` accepted any integer rating (including `0`, `10`, `NaN` → 0), and the `hasReviewed` check was read-then-write outside the transaction, so a double-submit created duplicate reviews.
- **Solution:**
  - Rating validated to a whole number 1–5 before any DB work.
  - Inside the transaction, the booking is atomically claimed via `updateMany({ where: { id, hasReviewed: false } })`; `count === 0` short-circuits with "already reviewed".
- **Files:** `backend/routes/reviews.js`
- **Verification:** ESLint clean, module loads.

---

## P3 — High (Security / Platform)

### P3.1 — Rate limiting was a no-op in serverless
- **Severity:** HIGH
- **Problem:** `express-rate-limit` used an in-memory store. Each Lambda instance kept its own counters, so limits reset on every warm spin-up — effectively disabled in production. `rate-limit-redis` was installed but unused.
- **Solution:** Wired `RedisStore` (via the shared ioredis client) into every limiter with per-limit key prefixes; falls back to the default memory store when Redis is unavailable.
- **Files:** `backend/middleware/rateLimiter.js`
- **Verification:** ESLint clean, module loads.

### P3.2 — Internal error details leaked to clients
- **Severity:** HIGH
- **Problem:** The Express 500 handler returned `details: err.message`, leaking stack traces / DB / vendor internals to end users.
- **Solution:** Internal details are now only included for `4xx` client errors; 500s return a generic message.
- **Files:** `backend/server.js`
- **Verification:** ESLint clean.

### P3.3 — `process.exit` on unhandled rejection in Lambda
- **Severity:** HIGH
- **Problem:** `process.on('unhandledRejection')` called `process.exit(1)`, which aborts a shared Lambda warm instance and kills concurrent in-flight requests.
- **Solution:** Log-only in Lambda (`AWS_EXECUTION_ENV`); keep the exiting behavior for long-lived processes.
- **Files:** `backend/server.js`
- **Verification:** ESLint clean.

### P3.4 — Auth middleware: redundant DB lookups
- **Severity:** HIGH (perf/scale)
- **Problem:** Every protected request performed up to 3 DB round-trips: refresh-token revocation check, `requireProfileComplete` lookup, and an `authorize` role lookup that duplicated the role already in the verified JWT.
- **Solution:** `authorize` now reads `req.user.role` from the JWT (signed at login), removing one round-trip per request. (Role changes take effect on next login/refresh.) `requireProfileComplete` intentionally keeps its DB check to avoid stale-profile lockouts.
- **Files:** `backend/middleware/auth.js`
- **Verification:** ESLint clean, module loads; confirmed `authorize` is always used after `protect`.

### P3.5 — Stored XSS via `linkedinUrl`
- **Severity:** HIGH
- **Problem:** A user-controlled `linkedinUrl` was rendered directly into `<a href>`; `javascript:`/`data:` URLs were accepted (the old `isValidUrl` accepted any scheme `new URL()` can parse) and would execute in other viewers' browsers.
- **Solution:**
  - Frontend: render-time guard `isSafeHttpUrl` (http/https only) in `Profile.jsx`.
  - Backend: new `isHttpUrl` helper in `utils/validation.js`; profile create + update now validate `linkedinUrl` with it (both paths).
- **Files:** `frontend/src/pages/Profile.jsx`, `backend/utils/validation.js`, `backend/services/profileService.js`
- **Verification:** ESLint clean; confirmed `javascript:` rejected / `https:` accepted; no other `dangerouslySetInnerHTML` in the app.

### P3.6 — Stale quiz auto-submit (frontend)
- **Severity:** HIGH
- **Problem:** The auto-submit-on-timeout effect in `QuizAttempt.jsx` closed over `answers` captured at render time; answers typed near the deadline could be lost, submitting a stale set.
- **Solution:** Added `answersRef` kept in sync every render; `handleSubmit` reads `answersRef.current`.
- **Files:** `frontend/src/pages/QuizAttempt.jsx`
- **Verification:** ESLint clean, production build passes.

### P3.7 — Client-side code-runner sandbox escape
- **Severity:** HIGH
- **Problem:** Student JS ran via `new Function` with access to the worker's global scope — `self`, `postMessage`, `fetch`, `importScripts`, `WebSocket`, `XMLHttpRequest`, `indexedDB`, `Worker`. Malicious code could exfiltrate data or forge results.
- **Solution:** Shadowed the dangerous globals by passing them as `undefined` parameters to the generated function (`SANDBOX_GLOBALS` + `SHADOWED`). `console` is intentionally left accessible so logging still works.
- **Files:** `frontend/src/workers/codeRunner.worker.js`
- **Verification:** ESLint clean, build passes.

### P3.8 — CI only deployed code, never env/config
- **Severity:** HIGH
- **Problem:** `.github/workflows/deploy-backend.yml` only ran `aws lambda update-function-code` — the environment variables (including the newly required `EMAIL_*`, `FRONTEND_URL`, `PISTON_API_URL`, Razorpay) were never pushed, and the new background worker was never deployed.
- **Solution:** Extended the workflow to:
  - Update the API function's **environment** (`update-function-configuration`) mirroring `template.yaml`.
  - Deploy the `zenovax-background-worker` (idempotent create-or-update, same `function.zip`).
  - Ensure the worker runs on a schedule via an EventBridge `rate(1 minute)` rule + Lambda permission.
  - Added missing payment/runtime parameters (`RazorpayKeyId/KeySecret/WebhookSecret`, `PlatformFeePercent`, `BookingHoldMinutes`) to `template.yaml`.
- **Files:** `.github/workflows/deploy-backend.yml`, `backend/template.yaml`
- **Verification:** YAML validated (Ruby parser).
- **Note for deploy:** new GitHub secrets must be configured (`DATABASE_URL`, `EMAIL_USER`, `EMAIL_PASS`, `FRONTEND_URL`, `PISTON_API_URL`, `AWS_LAMBDA_ROLE_ARN`, Razorpay secrets, …) — see the workflow.

### P3.9 — Dependency vulnerabilities (npm audit)
- **Severity:** HIGH
- **Problem:** Backend `axios@1.17.0` (many advisories); frontend `react-router-dom@7.18.1` (RSC-mode CSRF), `brace-expansion <1.1.17` (DoS), plus a transitive vulnerable `dompurify` via `monaco-editor`.
- **Solution:**
  - Backend: `npm audit fix` → `axios@1.19.0`, **0 vulnerabilities**.
  - Frontend: `npm audit fix` for `brace-expansion`; `react-router-dom@7.18.2`; restored the `dompurify ^3.4.12` override pinning the transitive copy. Build re-verified.
- **Files:** `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`
- **Residual:** the react-router RSC CSRF advisory (`GHSA-qwww-vcr4-c8h2`) cannot be cleared without a **breaking** react-router 7→8 migration (requires react ≥ 19.2.7). It only affects React Router's RSC mode, which this SPA does not use — documented, not "fixed" per the no-breaking-changes rule.

### P3.10 — BullMQ queue with no worker
- **Severity:** HIGH
- **Problem:** Badge jobs were enqueued to BullMQ but nothing consumed the queue, so badges were never awarded in Redis-backed (production) mode.
- **Solution:** Covered by P1.4 — `drainBadgeQueue` now consumes/processes/completes jobs (in the scheduled Lambda and in the long-lived loop after each maintenance pass).
- **Files:** `backend/utils/queue.js`, `backend/lambda-worker.js`

### P3.11 — Stale caches (`all_sessions_*`, `mentor_list_*`)
- **Severity:** HIGH (freshness)
- **Problem:** `all_sessions_*` was **never** invalidated, so newly approved/updated/deleted sessions were invisible for up to 15 min; `mentor_list_*` wasn't busted when mentors updated their profile.
- **Solution:** `cache.delPattern('all_sessions_*')` added to `approveSession`, `deleteSession`, and report-action `DELETE_SESSION`; `cache.delPattern('mentor_list_*')` added to both profile update paths.
- **Files:** `backend/services/adminService.js`, `backend/services/profileService.js`
- **Verification:** ESLint clean, module loads.

---

## P4 — Medium (Performance / Hardening)

**P4 — Performance & quality pass**

- **DB indexes** (`backend/prisma/schema.prisma` + new migration `prisma/migrations/0002_performance_indexes/migration.sql`):
  - `sessions (status, scheduledAt)`, `sessions (mentorId, status)`, `sessions (isDeleted)`
  - `bookings (sessionId, status)`
  - `notifications (userId, isRead)`
  - `mentor_ledger_entries (walletId, createdAt)`
  - `coding_questions (status)`
  - `users (role, isProfileComplete)`, `users (isDeleted)`
  - `refresh_tokens (userId, revoked)`; dropped the redundant `refresh_tokens (token)` index (token is already `@unique`).
- **N+1 / bulk query:** `getUniqueLearnersCount` switched from `findMany` + `distinct` (materializes all rows) to `groupBy` + count.
- **Transaction timeouts:** explicit `{ timeout: 15000 }` added to payout request/paid/failed, earnings release, `cancelPendingBooking`, `rejectSession`, and admin notification-broadcast transactions (previously relied on the 30s HTTP timeout and could pin DB connections).
- **AI rate limiting:** new per-user `aiLimiter` (Redis-backed, keyed by user id) mounted on all `/api/help/*` routes — the Gemini endpoints previously relied only on the per-IP general limiter.
- **Bundle:** split `katex`/`rehype-katex` and `three` into their own vendor chunks in `vite.config.js` (in addition to existing splits).

**Verification:** full backend + frontend ESLint, production builds, module-load smoke tests.

---

## P5 — Medium (Cleanup)

**P5 — Dead code / unused dependencies / assets**

- Deleted dead source files: `frontend/src/pages/learner/ComingSoonPage.jsx` (lazy-import removed from `App.jsx`, was never routed) and `frontend/src/utils/sanitize.js` (zero importers).
- Deleted unused assets: `src/assets/Avatars/*` (duplicate of `public/avatars/`), `src/assets/react.svg`, `src/assets/favicon.png`, `public/vite.svg`.
- Removed unused dependencies: `prismjs`, `react-simple-code-editor`, `qrcode`, `react-router`, `dompurify` (the `dompurify` **override** was retained to pin the safe version for the transitive `monaco-editor` copy).
- Verified the remaining heavy deps (`three`, `react-syntax-highlighter`, `katex`, `html5-qrcode`, `@monaco-editor/react`) are all genuinely imported.

**Verification:** `npm run lint` clean, `npm run build` passes, precache count down, dead `ComingSoonPage` chunk gone.

---

## Verification summary

| Check | Result |
|---|---|
| Backend ESLint (full tree) | ✅ 0 warnings |
| Backend module load | ✅ 53/53 app modules (only `pyodideWorker.js` "fails" — it's a worker-thread script spawned via `new Worker`, not require-able by design) |
| `prisma validate` | ✅ schema valid |
| `prisma format` diff | ✅ minimal (only intended index lines) |
| Frontend ESLint | ✅ 0 warnings |
| Frontend production build | ✅ passes; katex/three split into own chunks |
| Backend `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| Frontend `npm audit` | ⚠️ residual react-router RSC advisory only (see P3.9) |
| Workflow YAML | ✅ valid |

---

## Deferred / intentionally not changed

1. **react-router 7 → 8 migration** (clears the residual advisory) — breaking change (requires react ≥ 19.2.7), explicitly out of scope for this pass.
2. **Component consolidation** — `ConfirmModal` exists in `common/` and `profile-setup/` with different prop APIs, and the `Toast` pattern is copy-pasted across ~18 files. Consolidating risks breaking `CompleteProfile` and 18 pages; cosmetic only.
3. **Pagination on low-traffic list endpoints** (e.g. admin payouts, wallet history, quiz results) — changing these alters API response shape and would need frontend coordination; left for a feature-level change.

## Actions required from you (outside code)

1. Apply the new index migration: `prisma migrate deploy` (or `npx prisma migrate dev` locally).
2. Configure the new GitHub Actions secrets referenced in `.github/workflows/deploy-backend.yml`.
3. Provide `EmailUser`/`EmailPass`/`FrontendUrl`/`Razorpay*`/`PlatformFeePercent`/`BookingHoldMinutes` at the next SAM deploy (`sam deploy --guided`) so the Lambda env matches the new `template.yaml`.
4. Self-host Piston and point `PISTON_API_URL` at it for production.
