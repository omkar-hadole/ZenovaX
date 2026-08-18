# ZenovaX

**A peer-to-peer learning platform where students teach students — sessions, quizzes, live coding sandboxes, and verified mentorship, all in one place.**

<p align="center">
  <img src="frontend/src/assets/dashboard-mockup.webp" alt="ZenovaX learner dashboard showing upcoming peer sessions and recommended mentors" width="840">
</p>

> "Learn from peers who just cracked it — no fear, no formality, just people who've been in your seat."

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [The Solution](#the-solution)
4. [Key Features](#key-features)
5. [User Roles](#user-roles)
6. [System Architecture](#system-architecture)
7. [Tech Stack](#tech-stack)
8. [Third-Party Integrations](#third-party-integrations)
9. [Project Structure](#project-structure)
10. [Getting Started](#getting-started)
11. [Deployment](#deployment)
12. [Security & Privacy](#security--privacy)
13. [Limitations](#limitations)
14. [Roadmap](#roadmap)
15. [Contributing](#contributing)
16. [License](#license)

---

## Overview

ZenovaX formalizes the best thing about college: **the classmate or senior who finally makes a topic click.** Students who understand a topic well can teach it as a one-to-many session (free or paid), and students who don't — can book that session, work through the attached resources, quizzes, and coding challenges, and leave honest ratings that build the mentor's reputation.

Mentors set their own price (many sessions are free), earn directly into a UPI-linked wallet, and build a verified teaching portfolio with badges and followers. Learners get affordable, relatable, topic-level help with real practice — not just another video library.

---

## Problem Statement

Modern students face a broken support system:

1. **Doubt resolution is slow or intimidating** — office hours are time-constrained, and asking in a packed lecture hall is scary.
2. **Tutoring is expensive** — professional 1-on-1 coaching is out of reach for most college students.
3. **Video courses are not personal** — pre-recorded content is broad, passive, and never answers *your* specific blocker or micro-topic.
4. **No structured post-session practice** — after a lecture, there's nothing that tests whether you actually got it.
5. **Peer expertise goes untapped** — plenty of skilled, placed students can teach, but there's no infrastructure or incentive to do it.

---

## The Solution

ZenovaX turns knowledgeable peers into **verified mentors** and makes learning from them effortless:

- **Book a session** — free or paid, online or in person, on a niche topic ("Reverse a Linked List", "Advanced React Patterns", "Finance Basics").
- **Practice what you learn** — every session can carry structured resources, a topic-based quiz, and live coding questions.
- **Learn with a sandbox** — an in-browser Monaco editor with test cases, XP, and AI help; no separate tab, no context switching.
- **Trust by rating** — mentors are rated (1–5 stars + written reviews, optionally anonymous) by real students.
- **Mentoring pays** — earnings land in the mentor's wallet at session completion and are withdrawn to UPI after verification.

---

## Key Features

### Learner experience

- **Dashboard** — upcoming/previous sessions, browse shortcuts, recommended mentors, Zen AI (Cmd+K) access.
- **Browse Sessions** — filter by price (free/paid), mode (online/offline), and upcoming/past; paginated.
- **Session details** — mode, date, time, venue, what-you'll-learn, instructor card with rating, seats remaining, "Report an issue".
- **Course Material** — three sub-tabs per session: **Resources**, **Quiz**, **Coding**.
  - **Resources**: PDFs, PPTs, videos, cheat sheets uploaded by the mentor.
  - **Quiz**: 4-option MCQs with a "Don't Select" option, question navigator, and a detailed scorecard (score, %, time taken, answer review, pass/fail message).
  - **Coding**: solve view with problem statement, example test cases, function signature, JavaScript/Python/Java editor, and a test-console showing pass/fail, expected vs actual, and submission history.
- **Zen AI** — personalized assistant accessible via Cmd+K from anywhere; knows your sessions and progress, can discuss approach/time/space complexity of your current code, and can answer general questions too. Option to connect your own ChatGPT for unlimited chat.
- **Mentors directory** — search by name, filter by department, paginated mentor cards; full mentor profiles with skills, bio, recent reviews, follow/like, and achievement badges.
- **My Bookings** — status badges (Upcoming, Live, Completed, Review Pending), view/download QR ticket for offline sessions.
- **QR tickets** — confirmed offline bookings generate a printable entry ticket with a unique QR code.
- **Settings** — light/dark appearance, privacy (control phone-number visibility), security (password change), active sessions (revoke devices), account deactivation.
- **Help Centre** — WhatsApp/email/call support plus a role-specific FAQ and an AI quick assistant.

### Mentor experience

- **Dashboard** — total sessions, learners helped, hours taught, average rating, upcoming sessions, session requests, recent activity; quick actions to create sessions, upload resources, launch quizzes, and launch coding questions.
- **Create Session** — title, what you'll teach, subject, department, topics, mode, date/time, duration, capacity, free/paid + price, live preview → submitted for admin approval.
- **Upload Resources** — title, description, URL, target session, resource type.
- **Launch Quiz** — target session, title, duration, per-question marks, passing threshold.
- **Launch Code** — the flagship area:
  - **AI Generate Question**: give a name or a LeetCode number → full question generated (title, points, difficulty, time limit, statement, test cases, starter code).
  - **Manual**: Legacy (freeform input/output) or Structured (function signature + typed parameters + test cases); starter code for JS/Python/Java; control how many test cases learners see; Launch or Save Draft.
- **My Sessions** — paginated/filtered list with "Join Now" (live), registered-count, and status; mentor-side detail shows per-question quiz analytics and per-student results.
- **Scan Attendance** — mobile QR scanner validates that a ticket belongs to this session and mentor, and hasn't already been scanned (anti-fraud at the door for offline sessions).
- **Earnings** — available + pending balance (held until session completion), total earnings, payout history, UPI payout account setup, and admin-verified **Request Payout**.
- **Reviews Received** — average rating, % positive, filterable review list (anonymous reviewers hidden).
- **Reports** — view, resolve, or ignore reported sessions with pending/unsolved/resolved counts.
- **Coding Questions** — draft/live/closed filter, edit, preview, close, and one-click **Launch during a live session**.
- **Achievements** — ~15–20 badges (First Step, Session Pro, Veteran, Elite Mentor, Master Mentor, Well-Rated, Top-Rated, Loved…) with progress bars on locked ones.
- **Notifications** — reviews, approvals, achievements; mark-as-read; auto-expiry after 30 days.

### Platform-wide

- **Ratings & reviews** — 1–5 stars + text, optional anonymous posting.
- **Follow & like** mentors to build a follower base.
- **Add to Google Calendar** and **share sessions**.
- **Search** across sessions and mentors from any screen.
- **Admin panel** — approve/reject session requests, verify mentor payout details, moderate reports, manage users and push notifications.

---

## User Roles

| Role | What they do |
|------|--------------|
| **Learner** | Browse sessions, book/register, attend, access resources/quizzes/coding, review mentors. |
| **Mentor** | Create sessions (pending admin approval), upload resources, launch quizzes/coding questions, scan attendance, earn payouts, build a reputation. |
| **Both** | Dual-role profile — a single account can act as learner and mentor. |
| **Admin** | Session moderation, payout verification, report handling, users, payments, push notifications. |

---

## System Architecture

Decoupled client-server architecture with transactional safety and a background job layer:

```
React 19 SPA (Amplify)
   │  HTTPS + cookies (SameSite=None; Secure)
   ▼
API Gateway → Express 5 Lambda (single function) → lambda-worker (scheduled)
   │
   ├── Prisma ORM ─────────────► MySQL (Aiven)
   ├── Redis (ioredis) ─────────► BullMQ queues + distributed seat locks
   ├── Piston API ──────────────► sandboxed Python/Java execution
   ├── Gemini AI ───────────────► Zen AI assistant + question generation
   ├── Cloudinary ──────────────► media storage (profiles, resources)
   ├── Razorpay ────────────────► payments + refunds
   └── Sentry ─────────────────► error telemetry
```

**Highlights:**

- **Double-booking-safe reservations** — seat booking flows through a BullMQ queue with a Redis distributed lock (`lock:session:<id>`), eliminating race conditions on limited seats.
- **Smart compiler sandbox** — JavaScript runs client-side in a sandboxed wrapper (zero-latency); Python/Java run in isolated Piston containers with a server-side driver wrapper.
- **Code-split, animation-driven frontend** — React.lazy + Suspense, GSAP ScrollTrigger, and Lenis smooth scrolling keep first paint fast.
- **Single Lambda backend** — all Express routes behind one HTTP API Gateway proxy (`serverless-http`), plus a scheduled background worker Lambda for maintenance jobs (EventBridge `rate(1 minute)`).

---

## Tech Stack

### Frontend

| Concern | Technology |
|---------|------------|
| Framework | React 19, Vite 7 |
| Routing | React Router DOM v7 |
| Styling | TailwindCSS v4, Framer Motion, GSAP + ScrollTrigger, Lenis |
| Editor | Monaco (@monaco-editor/react) |
| QR / tickets | html5-qrcode, react-qr-code, dom-to-image-more |
| 3D / hero | Three.js |
| Monitoring | @sentry/react |
| PWA | vite-plugin-pwa |

### Backend

| Concern | Technology |
|---------|------------|
| Runtime | Node.js, Express 5 |
| ORM | Prisma 6 (`@prisma/client`) |
| Database | MySQL (Aiven) |
| Queues | BullMQ v5 + Redis (Aiven, ioredis) |
| Auth | JWT (jose), double-submit CSRF cookies, bcryptjs |
| AI | @google/generative-ai (Gemini), ai + @openai-oauth (BYO ChatGPT) |
| Payments | Razorpay |
| Email | Nodemailer SMTP |
| Media | Cloudinary |
| Logging/telemetry | Winston, @sentry/node |
| Code execution | Piston API, pyodide |
| Security | helmet, xss, express-rate-limit + rate-limit-redis, zod validation |

### Deployment

| Component | Platform |
|-----------|----------|
| Frontend | AWS Amplify Hosting (auto-deploy on push to `main`) |
| Backend | AWS Lambda (single function + background worker) via GitHub Actions + API Gateway |
| Scheduler | Amazon EventBridge (worker schedule) |
| Database / cache | Aiven MySQL, Aiven Redis |

---

## Third-Party Integrations

1. **Google Gemini AI** — powers Zen AI (personalized assistant) and AI question generation.
2. **Piston API** — secure, isolated execution of Python/Java submissions.
3. **Razorpay** — payment processing and refunds for paid sessions.
4. **Cloudinary** — profile pictures and session resources.
5. **Nodemailer** — email verification and password reset tokens.
6. **Sentry** — crash and error monitoring on frontend and backend.
7. **Google Calendar** — "Add to Calendar" for booked sessions.

---

## Project Structure

```
ZenovaX_advance/
├── frontend/
│   ├── src/
│   │   ├── assets/              # static media, mockups, logos
│   │   ├── components/          # home, dashboard (learner/mentor), common, profile-setup
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── layouts/             # LearnerLayout, MentorLayout, AdminLayout
│   │   ├── pages/               # Home, Auth, learner/, mentor/, admin/, settings
│   │   ├── utils/               # api, gsapSetup, cloudinary, analytics
│   │   ├── App.jsx              # routes + lazy loading
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/                  # environment configuration
│   ├── controllers/             # request handlers (auth, profile, session, quiz, coding…)
│   ├── middleware/              # auth gates, CSRF, rate limiting
│   ├── prisma/                  # schema.prisma + migrations
│   ├── routes/                  # Express route bindings
│   ├── services/                # business logic (session, wallet, badge, admin…)
│   ├── utils/                   # caches, queues, logger, sessionUtils
│   ├── lambda.js                # Lambda handler (serverless-http)
│   ├── lambda-worker.js         # scheduled background worker
│   ├── server.js                # dev entry point
│   └── template.yaml            # AWS SAM template
├── docs/                        # detailed project documentation
└── .github/workflows/           # CI + deploy-backend pipelines
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL instance (or PostgreSQL with schema adjustments)
- Redis (optional in dev — falls back to an in-memory `node-cache`)
- A Gemini API key for Zen AI / question generation

### Backend

```bash
cd backend
npm install            # runs prisma generate via postinstall
cp .env.example .env   # fill in DB, Redis, secrets
npx prisma migrate dev
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL → http://localhost:3001/api
npm run dev            # http://localhost:5173
```

---

## Deployment

### Frontend — AWS Amplify

Connect the GitHub repo to Amplify; `amplify.yml` (monorepo, `appRoot: frontend`) is already committed. Set `VITE_API_URL` (API Gateway URL + `/api`) and add the standard SPA rewrite rule. Every push to `main` redeploys.

### Backend — AWS Lambda (GitHub Actions)

`.github/workflows/deploy-backend.yml` runs on pushes touching `backend/`:

1. `npm ci` + slim the Prisma footprint (drop CLI-only packages + non-arm64 engines) and zip.
2. `aws lambda update-function-code` → wait → `update-function-configuration` (full env mirrored from secrets).
3. Create/update the background worker Lambda (`zenovax-background-worker`).
4. Ensure the worker's EventBridge schedule (`rate(1 minute)`).

Secrets live in GitHub Actions secrets; the IAM deploy user needs `lambda:*`, `events:PutRule/PutTargets`, and related permissions on the rule/function resources.

---

## Security & Privacy

- **Auth** — JWT access tokens (15 min) + rotating refresh tokens stored hashed; role baked into the JWT and re-issued on role change.
- **CSRF** — double-submit cookie validation on all state-changing requests.
- **Rate limiting** — express-rate-limit backed by Redis.
- **Input hygiene** — Prisma parameterization + `xss` sanitization + zod validation.
- **CSP / CORS** — Helmet headers and a strict `ALLOWED_ORIGINS` whitelist.
- **Privacy controls** — users choose what is visible on their profile (e.g. phone number); admins can always see it.
- **Anonymous reviews** — learners can review mentors without exposing their identity.

---

## Limitations

1. **No native video calls** — online sessions use external links (Zoom/Meet) rather than embedded WebRTC.
2. **No collaborative whiteboard** — live classrooms offer media controls and chat, not real-time shared boards.
3. **Manual refunds** — financial refunds are reviewed manually, not auto-reversed by the gateway.
4. **Desktop-first UI** — advanced layouts (Monaco playground, live session) are designed for desktop; mobile gets functional fallbacks.

---

## Roadmap

- [ ] Embedded Zoom/Jitsi video calls in the live classroom.
- [ ] Collaborative live code editing (Yjs / OT) in the Monaco editor.
- [ ] Automated gateway rollbacks on mentor cancellation.
- [ ] Submission analytics (runtime, memory) with peer comparison charts.
- [ ] Custom coding contests / department hackathons.

---

## Contributing

ZenovaX is an open educational project. Ideas to improve peer learning? Open an issue or submit a PR. Please run `npm run lint` in the relevant package before submitting.

---

## License

MIT — free for educational and community use; may be extended commercially with further development.