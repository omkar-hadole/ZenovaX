# ZenovaX — Infrastructure & Database Capacity Audit

> **Audit Date:** July 28, 2026
> **Database:** MySQL via Prisma ORM
> **Backend:** Node.js + Express
> **File Storage:** Cloudinary
> **Cache:** Redis (optional) / NodeCache fallback
> **Queue:** BullMQ (optional) / setTimeout fallback

---

## 1. Database Analysis

**Datasource:** MySQL (Prisma ORM) — `backend/prisma/schema.prisma:11`

### All Models & Estimated Row Sizes

| Table | Columns | Est. Avg Row | Est. Max Row | Storage Hotspots |
|---|---|---|---|---|
| **users** | 32 cols + 20 relations | ~1.2 KB | ~3 KB | `password` (60 chars bcrypt), `bio` (Text), `mentorSkills` (Text/JSON), `deviceTokens` (Text/JSON), `profilePicture` (URL string 200+ bytes) |
| **sessions** | 27 cols | ~800 B | ~2 KB | `description` (Text, up to 5000 chars), `topics` (Text/JSON up to 20 topics) |
| **session_requests** | 21 cols | ~900 B | ~2.5 KB | `description` (Text), `topics` (Text/JSON) |
| **bookings** | 19 cols | ~400 B | ~600 B | modest |
| **reviews** | 13 cols | ~400 B | ~1.5 KB | `comment` (optional Text, nullable) |
| **resources** | 16 cols | ~400 B | ~800 B | `fileUrl` (Cloudinary URL), `description` (Text) |
| **quizzes** | 17 cols | ~400 B | ~800 B | `description` (Text) |
| **questions** | 9 cols | ~500 B | ~3 KB | `questionText` (Text), `options` (Text/JSON — biggest consumer) |
| **quiz_attempts** | 12 cols | ~200 B | ~300 B | modest |
| **answers** | 8 cols | ~150 B | ~200 B | modest |
| **transactions** | 17 cols | ~400 B | ~600 B | `gatewaySignature` (string) |
| **mentor_wallets** | 9 cols | ~150 B | ~200 B | trivial |
| **mentor_ledger_entries** | 11 cols | ~200 B | ~400 B | `description` (optional) |
| **mentor_payouts** | 12 cols | ~250 B | ~500 B | `failureReason` (Text) |
| **mentor_payout_accounts** | 13 cols | ~400 B | ~800 B | raw bank account numbers (security concern) |
| **notifications** | 10 cols | ~400 B | ~2 KB | `message` (Text) |
| **admin_notification_logs** | 9 cols | ~400 B | ~2 KB | `message` (Text) |
| **reports** | 9 cols | ~300 B | ~2 KB | `reason` (Text) |
| **coding_questions** | 19 cols | ~2 KB | ~10 KB | `description` (Text), `testCases` (Text/JSON often large), `starterCode` (Text), `referenceSolution` (Text), `structuredTestCases` (Text/JSON), `parameters` (Text) — **most storage-heavy table per row** |
| **coding_submissions** | 7 cols | ~500 B | ~10 KB+ | `code` (Text — stores the entire user-submitted code. **Storing code in the database is the single largest storage concern in the project**) |
| **refresh_tokens** | 8 cols | ~200 B | ~300 B | `token` (hashed), `userAgent` (string up to 500 chars) |
| **follows** | 5 cols | ~100 B | ~100 B | trivial |
| **likes** | 5 cols | ~100 B | ~100 B | trivial |

### Indexes & Storage Overhead

The schema is reasonably well-indexed (most FK columns have indexes). However:

- **`@@fulltext([topics])` on `sessions`** and **`session_requests`**: Fulltext indexes on InnoDB can be 2-3x the data size. For 10K sessions, this adds ~20-40 MB extra.
- **Missing composite indexes** (see Section 4).
- **Duplicate index**: `@@index([token])` on `refresh_tokens` is redundant with `@unique` on `token` (Prisma creates a unique index already).

### JSON Fields Stored as `@db.Text`

- `users.mentorSkills` — JSON array of skills
- `users.deviceTokens` — JSON array of FCM tokens
- `sessions.topics` — JSON array
- `session_requests.topics` — JSON array
- `questions.options` — JSON array of answer options
- `coding_questions.testCases` — JSON array of test cases
- `coding_questions.starterCode` — JSON map
- `coding_questions.referenceSolution` — JSON
- `coding_questions.parameters` — JSON
- `coding_questions.structuredTestCases` — JSON
- `coding_questions.allowedLanguages` — JSON array

**Problem:** Using `@db.Text` for JSON means MySQL cannot validate JSON structure and cannot use JSON path indexing. All JSON parsing is done in application code. This works but loses MySQL's JSON optimization capabilities.

---

## 2. Storage Projections

### Assumptions (per user per month)

| Metric | Per active user/month |
|---|---|
| Quiz attempts | 3 (per session, ~10% of users are active daily) |
| Coding submissions | 2 (each stores code in DB = ~2 KB avg) |
| Sessions created | 0.05 per user (mentors:learners ~ 1:10) |
| Bookings | 2 per user/month |
| Reviews | 0.5 per user/month |
| Notifications | 15 per user/month |
| Refresh tokens | 2 per user (active) + cleanup |
| Reports | 0.01 per user |
| Transactions | 0.5 per user |
| Answers | 15 per quiz attempt x 3 = 45 per active user |
| Ledger entries | 1 per paid booking |

### Storage per 1000 users (monthly growth)

| Table | per 1K users/month |
|---|---|
| Users | 1.2 MB (one-time) |
| Sessions | 100 sessions x 800 B = 80 KB |
| SessionRequests | 50 x 900 B = 45 KB |
| Bookings | 2000 x 400 B = 800 KB |
| Reviews | 500 x 400 B = 200 KB |
| QuizAttempts + Answers | 1000 x 200 B + 15000 x 150 B = 2.45 MB |
| CodingSubmissions | 2000 x 2 KB = **4 MB** |
| Notifications | 15000 x 400 B = **6 MB** |
| RefreshTokens | 2000 x 200 B = 400 KB |
| Transactions | 500 x 400 B = 200 KB |
| CodingQuestions | 50 x 2 KB = 100 KB |
| Reports | 10 x 300 B = 3 KB |
| Follows/Likes | 500 x 100 B = 50 KB |
| Wallet/Ledger/Payouts | 200 x 200 B = 40 KB |
| **Monthly total** | ~**15.5 MB / 1K users** |

### Total Estimated Usage

| Users | Base (Users + initial data) | Monthly growth | 6-month total | 12-month total |
|---|---|---|---|---|
| **500** | 0.6 MB | 7.75 MB/mo | **47 MB** | **93 MB** |
| **1,000** | 1.2 MB | 15.5 MB/mo | **94 MB** | **187 MB** |
| **2,000** | 2.4 MB | 31 MB/mo | **188 MB** | **374 MB** |
| **5,000** | 6 MB | 77.5 MB/mo | **471 MB** | **936 MB** |
| **10,000** | 12 MB | 155 MB/mo | **942 MB** | **1.87 GB** |
| **25,000** | 30 MB | 387.5 MB/mo | **2.36 GB** | **4.68 GB** |

**Coding submissions are the #1 storage driver** — storing user code (`@db.Text`) in the database.

Notifications are the #2 storage driver (15/user/month at 400B each).

---

## 3. Can Supabase Free Handle This?

**Supabase Free limits:** 500 MB PostgreSQL, 500 MB RAM, shared CPU.

### Storage Limit Analysis

| Users | Time to exceed 500 MB |
|---|---|
| 500 | ~**64 months** — safe |
| 1,000 | ~**32 months** — safe |
| 2,000 | ~**16 months** — borderline |
| 5,000 | ~**6.5 months** — will exceed |
| 10,000 | ~**3.2 months** — will exceed quickly |

### Memory & CPU Analysis

- Supabase Free uses **shared CPU** (burstable, ~0.25 vCPU equivalent).
- The app uses polling-based architecture:
  - `queue.js:97` — `setInterval` every **60 seconds** runs session completion check, booking sweep, notification cleanup, AND token cleanup sequentially.
  - This poller does 4-6 queries per interval. At 10K users with 500 active sessions, this burns significant CPU on shared hardware.
- Each `GET /api/sessions` does 2 queries (count + findMany) + N+1 booking lookups.
- `GET /api/sessions/:id` does 1 large query with 7+ included relations.
- Dashboard queries are cached (5-min TTL) but cache misses hit hard.

### Bottleneck Order

1. **CPU** (will hit first around 800-1200 concurrent users)
2. **RAM** (shared 500MB — Node.js instance + MySQL compete)
3. **Storage** (around 1,500-2,000 users after 6 months)

**Verdict:** You will hit CPU/RAM constraints around **1,000-1,500 active users** before the 500 MB storage limit.

---

## 4. Performance Analysis

### N+1 Queries Found

**Critical:**

1. **`sessionService.getAllSessions`** (`backend/services/sessionService.js:872-878`): After fetching sessions, loops through to check user bookings separately. This is 1 + N queries per page (12 sessions = 13 queries).

2. **`profileService.getMentors`** (`backend/services/profileService.js:510-525`): After fetching mentors, makes 2 additional queries for follows/likes. This is already batched (good) but the main mentor list query includes 5 sub-counts inside `_count`.

3. **`dashboardService.getDashboardData`** (`backend/services/dashboardService.js:115-151`): Fetches upcoming sessions, then makes **2 additional queries** for user's bookings.

4. **`reportService.getReportsForMentor`** (`backend/services/reportService.js:20-32`): First fetches all session IDs, then queries reports by `sessionId IN (...)`. This is 2 queries but scales with session count.

**Moderate:**

5. **Review stats endpoints** (`routes/reviews.js:236-260`, `routes/reviews.js:266-291`): `findMany` with `select: { rating: true }` loads ALL ratings into memory then processes in JS. At scale (5000+ reviews), this will be slow.

6. **Quiz results** (`routes/quiz.js:552-669`): Loads attempt + answers + user + question data in one massive nested `include`. Works fine at small scale but at 500+ attempts per quiz, the response payload can exceed 5 MB.

### Missing Indexes

| Table | Missing Index | Impact |
|---|---|---|
| `notifications` | Composite `(userId, isRead, createdAt)` for notification listing | Currently has separate indexes; `findMany` with status filter + sort scans |
| `bookings` | Composite `(sessionId, status)` for session booking lookups | Used in `getUniqueLearnersCount`, `releaseEarningsForSession` |
| `sessions` | Composite `(mentorId, status, scheduledAt)` | Used by `getMySessions`, `getFinishedSessionsCount` |
| `coding_submissions` | Composite `(codingQuestionId, userId, status)` | Used by `getCodingQuestionById:431-433` |
| `quiz_attempts` | Composite `(quizId, userId)` | Used in quiz attempt and submit endpoints |
| `review` | Composite `(mentorId, createdAt)` | Used in mentor stats and review listing |

### Large SELECT * Issues

- **`sessionService.getSessionById`** (`services/sessionService.js:894-929`): Includes `resources: true` (all columns), `quizzes: true` (all columns), `codingQuestions` with nested `submissions`. For a single session detail page, this returns far more data than needed.
- **`quiz results`** (`routes/quiz.js:552-669`): The nested `include` for `attempts -> answers -> question` loads **all answers with full question data** into memory.

### Slow Pagination

All pagination uses **offset-based** (`skip/take`). At page 100+, `OFFSET 990 LIMIT 10` scans 1000 rows in MySQL. For admin pages with thousands of records, this will become slow. However, given the user base size (< 25K), this is acceptable.

### Cursor-based pagination

**Not used anywhere.** For admin pages with large datasets (users, sessions, transactions), cursor pagination would be more efficient.

### Duplicate Queries

- `getUniqueLearnersCount` in `sessionUtils.js:31-41` is called multiple times in booking flow (once in `executeBookingTransaction`, once in `confirmBookingPaid`).
- `getFinishedSessionsCount` is called in `profileService.getMe`, `getProfileById`, `badgeService`, `getMentors` — each call is a separate DB query.

### Expected Query Performance

| User count | Session listing (cached) | Session listing (miss) | Session detail | Quiz submit | Dashboard |
|---|---|---|---|---|---|
| 500 | ~5ms | ~40ms | ~30ms | ~50ms | ~100ms |
| 2,000 | ~5ms | ~80ms | ~60ms | ~100ms | ~200ms |
| 10,000 | ~5ms | ~300ms+ | ~200ms+ | ~500ms+ | ~800ms+ |

The dashboard is the **biggest problem** at scale — it does 8-10 queries per load on cache miss.

---

## 5. Storage Optimization

| Optimization | Est. Savings | Difficulty |
|---|---|---|
| **Move code out of DB** — Store `coding_submissions.code` in S3/Cloudinary, reference by URL | **60-70% of coding_submissions storage** (~2.8 MB/mo per 1K users) | Medium |
| **Archive old notifications** — Delete or move to archive table after 90 days (currently 30 day retention in `storageCleanup.js:3`) | ~70% of notification storage | Easy |
| **Reduce refresh token lifespan** — Currently 7-30 days. Reduce to 1-7 days (1 day for non-remember-me) | ~50% of refresh_tokens | Easy |
| **Remove `deviceTokens` JSON from User** — Move to separate table with FK index; JSON Text column currently loads with every profile read | Reduces user row from ~1.2KB to ~800B | Medium |
| **Use proper JSON columns** via MySQL `@db.Json` instead of `@db.Text` | No direct storage savings, but enables JSON path indexes > fewer application-level parsing | Low |
| **Drop `mentorPayoutAccount` raw bank fields** after gateway linkage — store only `gatewayLinkedAccountId` | ~300-400B/row | Easy |
| **Delete soft-deleted data** — Currently `isDeleted` with soft delete. Periodic hard-delete of records older than 6 months. | Variable, 5-10% of users table | Medium |
| **Reduce `mentorSkills` JSON size** — Limit max skills to 10 (currently unlimited) | Negligible per row, but good UX | Easy |
| **Monthly archive of completed sessions + related bookings** — Move to archive tables | ~30% of sessions/bookings data | Hard |

---

## 6. Uploads

**Uploads are stored on Cloudinary, not in MySQL.**

Evidence:
- `backend/utils/cloudinary.js:15-34` — `uploadToCloudinary` uploads to Cloudinary folder `zenovax/profiles`
- Profile pictures: URL stored in `users.profilePicture`
- Resources: `fileUrl` stored in `resources.fileUrl` points to Cloudinary URL

**However, coding_submissions.code IS stored in the database** (`backend/prisma/schema.prisma:864` — `code String @db.Text`). This is a problem because:
- Code strings can be 1-50 KB each
- A learner who submits 10 solutions generates 10-500 KB of DB storage
- At 10K users with 2 submissions/month = 20 MB/month of raw code in the DB
- MySQL Text columns with large data degrade InnoDB buffer pool efficiency
- Code does not need ACID compliance or transactional integrity

---

## 7. Scalability

| Metric | Realistic Limit | What Breaks First |
|---|---|---|
| **Concurrent users** | ~800-1,200 | Shared CPU on Supabase Free; Express event loop slows |
| **Concurrent quiz attempts** | ~100-200 | The quiz submit endpoint does 5 DB queries + 1 write in a transaction. Multiple simultaneous submits queued on MySQL row locks on `quiz_attempts`. |
| **Concurrent coding submissions** | ~50-100 | Code execution is CPU-bound (Piston/Pyodide in-process). In `backend/services/codingService.js:347-413`, each submission calls `codeRunner.runTestCases()` which is synchronous and blocks the event loop. |
| **Concurrent mentor bookings** | ~200-300 | `executeBookingTransaction` (`sessionService.js:292-421`) has a 15-second timeout transaction with seat decrement. Row-level lock contention on `sessions.availableSeats` becomes the bottleneck. |

**The worker in `queue.js:97`** runs every 60 seconds and blocks all background jobs sequentially. Sessions that ended 59 seconds ago won't be marked COMPLETED until the next poll cycle.

---

## 8. Cost Projection

| Users | Supabase Free OK? | Timeline to outgrow | Recommended tier |
|---|---|---|---|
| **500** | Yes, indefinitely | Never | Free |
| **2,000** | **Maybe** — storage OK for ~16 months, but CPU becomes tight around 1,500 users | ~6-8 months | **Pro** ($25/mo) |
| **5,000** | **No** — storage exceeded in ~6 months, CPU constrained immediately | Day 1 | **Pro** or **Team** ($25-69/mo) |
| **10,000** | **No** — all limits exceeded within 3 months | Day 1 | **Team** ($69/mo) or dedicated |

**The real cost driver is NOT storage — it's CPU.** The app uses polling (`setInterval` 60s), synchronous code execution, and no worker pool. Upgrading CPU (Supabase Pro has dedicated CPU) is the first necessary upgrade.

---

## 9. Production Readiness Scores

### Database Design: **7/10**
- **+** Well-normalized schema with proper relations, UUIDs, and cascading deletes
- **+** Comprehensive enum usage
- **-** Using `@db.Text` for JSON fields instead of `@db.Json`, losing JSON validation and path indexing
- **-** Storing code submissions in the database
- **-** Storing raw bank account numbers (commented as placeholder, but still present)
- **-** Soft-delete without hard-delete strategy or archiving

### Scalability: **4/10**
- **+** Caching layer (Redis/NodeCache) with 5-min TTL on dashboard/mentor list
- **+** Rate limiting on auth endpoints
- **-** Polling-based architecture (60s interval) instead of event-driven
- **-** Synchronous code execution blocks the event loop
- **-** No connection pooling configuration visible
- **-** Offset pagination everywhere (no cursor)
- **-** No message queue for background jobs (BullMQ optional, falls back to `setTimeout`)

### Storage Efficiency: **5/10**
- **+** Cloudinary for file storage
- **+** 30-day notification retention via cleanup job
- **-** Code stored in DB (biggest storage issue)
- **-** No archival strategy for old data
- **-** JSON fields stored as Text (larger than necessary)
- **-** `deviceTokens` embedded in User table as Text/JSON

### Query Efficiency: **5/10**
- **+** Good use of batched queries for follow/like lookups
- **+** Selective projections (mostly use `select` not `include: true`)
- **-** N+1 in session booking status check
- **-** Review stats load all ratings into memory
- **-** Dashboard does 8-10 queries uncached
- **-** Several COUNT queries that could use cached counters

### Indexing: **6/10**
- **+** Most FK columns are indexed
- **+** Unique composite constraints on critical paths (e.g., `userId_sessionId`)
- **-** Missing composite indexes for common query patterns (notifications listing, quiz attempts lookup)
- **-** Redundant `@@index([token])` on refresh_tokens (duplicate of unique index)
- **-** No partial indexes for soft-delete filtering

### Security: **8/10**
- **+** JWT with short expiry (15 min), refresh token rotation
- **+** Rate limiting on auth endpoints
- **+** CSRF protection
- **+** bcrypt password hashing (cost 10)
- **+** CORS, helmet
- **+** Timing-safe comparison for webhook signatures
- **+** XSS sanitization
- **-** Raw bank account numbers stored (even if placeholder)
- **-** Verification tokens stored in plain hashed form (okay, but could be improved)

### Reliability: **5/10**
- **+** Transactional booking flow with rollback
- **+** Idempotent `confirmBookingPaid`
- **+** Webhook + client callback both handled (race-safe)
- **-** No health checks
- **-** Background queue falls back to `setTimeout` — jobs lost on crash
- **-** Redis dependency is optional; in-memory cache loses data on restart
- **-** No DB connection retry/health check logic visible

### Maintainability: **7/10**
- **+** Clean separation: routes -> controllers -> services
- **+** Consistent error handling via custom error classes
- **+** Good logging with winston
- **+** Comprehensive doc comments in schema and services
- **-** Inline SQL in route files (`routes/quiz.js`, `routes/reviews.js`) instead of service layer
- **-** Some business logic duplicated (badge calculation, unique learner counting)

---

## 10. Final Verdict

### 1. Can this project comfortably run on Supabase Free?
**No, not comfortably beyond ~1,000 users.** You will hit CPU constraints first (the polling worker + synchronous code execution are CPU-heavy). Storage is fine for the first 6-12 months for 1K-2K users.

### 2. Approximately how many users can it realistically support?
**Hard limit:** ~1,500 concurrent users on Supabase Free before CPU degradation becomes noticeable.
**Storage limit:** ~2,000 users for 12 months (approaching 500 MB).
**Realistic comfortable max:** ~**800-1,000 active users**.

### 3. What is the first bottleneck?
**CPU.** The combination of:
- `queue.js` 60-second poller (4+ queries per cycle)
- Synchronous code execution for coding challenges (`codeRunner` blocks the event loop)
- No worker pool for background jobs
- 100 req/min general rate limiter (configurable but shared CPU can't sustain that)

### 4. What should I optimize before launching?

**Immediate (before launch):**

1. **Move `coding_submissions.code` out of MySQL** — Store in S3/Cloudinary. This is the single biggest storage optimization. Change `code` column to store a URL reference.
2. **Add composite indexes** — At minimum on `notifications(userId, isRead, createdAt)`, `bookings(sessionId, status)`, `sessions(mentorId, status, scheduledAt)`.
3. **Reduce the 60-second poll interval to 30 seconds** OR better, replace polling with an event-driven approach (hook into session status changes).
4. **Remove raw bank account numbers** — Even as a placeholder, storing `bankAccountNumber`, `ifscCode`, `upiId` on the `mentor_payout_accounts` table is a liability. Replace with `gatewayLinkedAccountId` as the comment suggests.
5. **Add a composite index on `quiz_attempts(quizId, userId)`** — Every quiz submit and view does a lookup here.

**Short-term (first 3 months):**

6. **Add cursor-based pagination** for admin user listing and session listing.
7. **Run code execution in a separate worker process** (not in the request-response cycle).
8. **Set up proper BullMQ with Redis** (currently falls back to `setTimeout` — unreliable).
9. **Monthly hard-delete** of soft-deleted records older than 90 days.

### 5. Is PostgreSQL a better choice than MySQL for this project?
**Yes, for this specific schema.** Reasons:
- You have 11 JSON fields stored as `@db.Text` — PostgreSQL's native `JSONB` would give you partial index updates, GIN indexes, and `->>` path queries without application-level JSON.parse.
- Full-text search (`@@fulltext([topics])`) is significantly better in PostgreSQL (tsvector vs MySQL's InnoDB fulltext).
- PostgreSQL's `ON CONFLICT ... DO UPDATE` would simplify the payout account upsert.
- Supabase **is** PostgreSQL — migrating to Supabase from MySQL would mean re-writing the Prisma datasource provider and testing every query.

**However,** if you stay on MySQL, switching to PlanetScale or a managed MySQL service is also valid.

### 6. If this were your production project, what would I change before launch?

1. **Move code out of the database** — This is the #1 change. Store `coding_submissions.code` in S3/Cloudinary, reference by key.

2. **Remove synchronous code execution from the request path** — Spin up a dedicated worker or use BullMQ with proper workers for code execution. A single slow submission blocks ALL other requests.

3. **Replace the 60-second poller with event hooks** — When a session is created/updated, schedule its completion. When a booking expires, cancel it. The `setInterval` approach wastes CPU scanning the entire sessions table every minute.

4. **Add the 5 missing composite indexes** listed in Section 4.

5. **Switch JSON Text columns to actual JSON** — If on MySQL 8.0+, use `@db.Json` in Prisma for all 11 JSON fields. If on PostgreSQL (recommended), use `Json`/`JsonB`.

6. **Fix the N+1 in `getAllSessions`** — Instead of fetching user bookings separately after sessions, add a `bookings` include with `where: { userId, status }`.

7. **Dogfood the memory limit** — Supabase Free has 500 MB RAM. Your Node.js app with Prisma + Express + Winston + ioredis will use ~150-200 MB baseline. MySQL on the same 500 MB leaves very little headroom. Consider separating DB and app server.

8. **Add `cursor` based pagination** to admin pages before you hit 500+ users.

9. **Remove raw financial data** from `mentor_payout_accounts` before any real money flows through the system.

10. **Enable `compression` middleware** — It's already in `package.json:28` (`compression: ^1.8.1`) but I don't see it applied in `server.js`. Enable it for API responses (especially quiz results which can be 5+ MB).
