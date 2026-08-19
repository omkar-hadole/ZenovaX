# ZenovaX

A peer-to-peer learning platform where students teach students — sessions, quizzes, live coding sandboxes, and verified mentorship, all in one place.

<p align="center">
  <img src="frontend/src/assets/dashboard-mockup.webp" alt="ZenovaX learner dashboard showing upcoming peer sessions and recommended mentors" width="840">
</p>

<p align="center">
  <em>Learn from peers who just cracked it — no fear, no formality, just people who've been in your seat.</em>
</p>

---

## Why ZenovaX exists

Every college has that one senior or classmate who can explain a topic in five minutes better than three weeks of lectures managed to. ZenovaX exists to make that person findable, bookable, and worth their time.

The platform isn't trying to replace structured education — it's filling the gap right next to it. The specific, unglamorous moment where a student is stuck on one topic, doesn't want to sit through a full course to get past it, and would rather learn from someone who solved the exact same problem a semester ago. That session should be easy to find, cheap or free, and backed by actual practice afterward — not just a video that ends and leaves you exactly as stuck as before.

Mentors on ZenovaX aren't professional tutors. They're students and recent grads who know a topic cold and want to teach it, earn from it, and build a reputation doing it. The platform's job is to make that low-friction: set a price (including free), open a session, and let ratings do the rest.

---

## Table of contents

- [The problem](#the-problem)
- [How it works](#how-it-works)
- [Feature overview](#feature-overview)
- [User roles](#user-roles)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Third-party integrations](#third-party-integrations)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Security and privacy](#security-and-privacy)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## The problem

Modern students are stuck with a few bad options when they hit a wall:

- **Office hours are scarce and intimidating.** A ten-minute slot once a week, if you're lucky, and asking a "basic" question in front of a packed lecture hall isn't appealing to most people.
- **Tutoring is expensive.** Professional 1-on-1 coaching is priced for a market most college students aren't part of.
- **Video courses aren't personal.** Pre-recorded content is built for the average learner. It doesn't know what *you're* stuck on and won't answer the one question actually blocking you.
- **There's no practice loop.** Even a good lecture ends, and there's rarely anything after it that tests whether the concept actually stuck.
- **Peer expertise is wasted.** Plenty of students are perfectly capable of teaching a topic well — there's just no infrastructure or incentive for them to do it.

ZenovaX is built around closing that specific gap, not replacing the broader systems around it.

---

## How it works

1. A mentor who knows a topic opens a **session** — free or paid, online or in person, scoped narrowly ("Reverse a Linked List," not "Data Structures").
2. A learner **books** it, shows up, and gets access to whatever the mentor attached: resources, a quiz, a coding challenge, or all three.
3. After the session, the learner works through **Course Material** to check whether the concept landed — not just whether they sat through it.
4. The learner leaves a **rating**, which builds the mentor's reputation and feeds the mentor's earnings, badges, and visibility.
5. Mentors get paid directly into a **UPI-linked wallet**, released once the session is marked complete.

That loop — book, learn, practice, rate, pay — is the whole product.

---

## Feature overview

### Learner experience

| Area | What it does |
|---|---|
| Dashboard | Upcoming and past sessions, quick browse shortcuts, recommended mentors, and Zen AI access via Cmd+K. |
| Browse sessions | Filter by price, mode (online/offline), and time (upcoming/past), paginated. |
| Session details | Mode, date, time, venue, what you'll learn, instructor card with rating, seats remaining, and a "report an issue" option. |
| Course material | Three tabs per session — **Resources** (PDFs, PPTs, videos, cheat sheets), **Quiz** (MCQs with a navigator and a detailed post-quiz scorecard), and **Coding** (in-browser editor, test console with pass/fail and expected-vs-actual output, submission history). |
| Zen AI | A Cmd+K assistant that knows your sessions and progress, can talk through the complexity of code you're working on, and answers general questions. Learners can also connect their own ChatGPT account for unlimited use. |
| Mentors directory | Search and filter by department, with full mentor profiles — skills, bio, reviews, follow/like, badges. |
| My bookings | Status tracking (upcoming, live, completed, review pending) with downloadable QR tickets for offline sessions. |
| Settings | Appearance, privacy controls (e.g. phone number visibility), password and session security, account deactivation. |
| Help centre | WhatsApp, email, and call support, plus a role-specific FAQ and a quick AI assistant. |

### Mentor experience

| Area | What it does |
|---|---|
| Dashboard | Total sessions, learners helped, hours taught, average rating, and quick actions for creating sessions or content. |
| Create session | Title, topics, mode, schedule, capacity, and pricing, with a live preview — goes to admin approval before going live. |
| Resources and quizzes | Upload materials and build quizzes per session, with configurable duration, marks, and passing threshold. |
| Launch code | The flagship mentor tool. AI-generate a full coding question from a name or a LeetCode number, or build one manually — legacy freeform or structured with typed parameters and test cases — with starter code across JavaScript, Python, and Java. |
| My sessions | Filtered session list with live "join now" state, registration counts, and per-question analytics after the fact. |
| Scan attendance | A mobile QR scanner that validates a ticket belongs to this session and mentor and hasn't already been used — the anti-fraud layer for offline sessions. |
| Earnings | Available and pending balance (held until session completion), payout history, UPI setup, and admin-verified payout requests. |
| Reviews and reports | Filterable review history and a queue for handling reported sessions. |
| Achievements | Fifteen-plus badges (First Step, Session Pro, Veteran, Elite Mentor, and others) with progress tracking on locked ones. |

### Platform-wide

- Ratings and written reviews, with an optional anonymous mode.
- Follow and like mentors to build a following.
- Add sessions to Google Calendar and share them directly.
- Global search across sessions and mentors.
- An admin panel for approving sessions, verifying payouts, and moderating reports.

---

## User roles

| Role | What they do |
|---|---|
| Learner | Browse, book, attend, work through course material, and review mentors. |
| Mentor | Create sessions, upload material, launch quizzes and coding challenges, scan attendance, and get paid. |

---

## Architecture

ZenovaX runs a decoupled client-server setup with a background job layer handling anything that shouldn't block a request.

```
                     React 19 SPA (Amplify)
                              │
                HTTPS + cookies (SameSite=None; Secure)
                              ▼
        API Gateway → Express 5 Lambda (single function)
                              │
                              ├── lambda-worker (scheduled, EventBridge)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   Prisma ORM            Redis (ioredis)        Piston API
        │               BullMQ queues +        sandboxed Python
        ▼               distributed locks       / Java execution
   MySQL (Aiven)
        
        Also wired in: Gemini AI (Zen AI + question generation),
        Cloudinary (media), Razorpay (payments), Sentry (telemetry)
```

A few decisions worth calling out:

- **Seat booking is race-condition-safe.** Reservations flow through a BullMQ queue with a Redis distributed lock (`lock:session:<id>`), so two learners can't grab the last seat at the same time.
- **Code execution is split by language.** JavaScript runs client-side in a sandboxed wrapper for zero-latency feedback; Python and Java run in isolated Piston containers behind a server-side driver.
- **The frontend is code-split and animation-driven.** React.lazy plus Suspense, GSAP ScrollTrigger, and Lenis smooth scrolling keep first paint fast without sacrificing feel.
- **The backend is one Lambda.** All Express routes sit behind a single HTTP API Gateway proxy via `serverless-http`, with a separate scheduled worker Lambda handling maintenance jobs every minute.

---

## Tech stack

**Frontend** — React 19, Vite 7, React Router DOM v7, TailwindCSS v4, Framer Motion, GSAP with ScrollTrigger, Lenis, Monaco Editor, Three.js, html5-qrcode / react-qr-code for tickets, Sentry for monitoring, vite-plugin-pwa.

**Backend** — Node.js, Express 5, Prisma 6, MySQL (Aiven), BullMQ v5 with Redis (Aiven, ioredis), JWT auth via `jose` with double-submit CSRF cookies and bcryptjs, Google Gemini for AI features, Razorpay for payments, Nodemailer for email, Cloudinary for media, Winston and Sentry for logging, Piston API and pyodide for code execution, and helmet / xss / express-rate-limit / zod for hardening.

**Deployment** — Frontend on AWS Amplify Hosting with auto-deploy on push to `main`. Backend on AWS Lambda (main function plus a background worker) shipped through GitHub Actions and fronted by API Gateway. Scheduling via Amazon EventBridge. Database and cache on Aiven.

---

## Third-party integrations

| Service | Role |
|---|---|
| Google Gemini AI | Powers Zen AI and AI-assisted question generation |
| Piston API | Secure, isolated execution of Python and Java submissions |
| Razorpay | Payment processing and refunds |
| Cloudinary | Profile pictures and session resource storage |
| Nodemailer | Email verification and password reset |
| Sentry | Crash and error monitoring, frontend and backend |
| Google Calendar | "Add to calendar" for booked sessions |

---

## Project structure

```
ZenovaX_advance/
├── frontend/
│   ├── src/
│   │   ├── assets/          static media, mockups, logos
│   │   ├── components/      home, dashboard (learner/mentor), common, profile-setup
│   │   ├── context/         AuthContext, ThemeContext
│   │   ├── layouts/         LearnerLayout, MentorLayout, AdminLayout
│   │   ├── pages/           Home, Auth, learner/, mentor/, admin/, settings
│   │   ├── utils/           api, gsapSetup, cloudinary, analytics
│   │   ├── App.jsx          routes + lazy loading
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/               environment configuration
│   ├── controllers/          request handlers (auth, profile, session, quiz, coding...)
│   ├── middleware/           auth gates, CSRF, rate limiting
│   ├── prisma/                schema.prisma + migrations
│   ├── routes/                Express route bindings
│   ├── services/               business logic (session, wallet, badge, admin...)
│   ├── utils/                   caches, queues, logger, sessionUtils
│   ├── lambda.js                Lambda handler (serverless-http)
│   ├── lambda-worker.js         scheduled background worker
│   ├── server.js                dev entry point
│   └── template.yaml            AWS SAM template
├── docs/                        detailed project documentation
└── .github/workflows/           CI + deploy-backend pipelines
```

---

## Getting started

### Prerequisites

- Node.js 18 or later
- A MySQL instance (or PostgreSQL with schema adjustments)
- Redis, optional in development — falls back to an in-memory cache
- A Gemini API key for Zen AI and question generation

### Backend

```bash
cd backend
npm install            # runs prisma generate via postinstall
cp .env.example .env   # fill in DB, Redis, and secrets
npx prisma migrate dev
npm run dev             # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_URL to http://localhost:3001/api
npm run dev              # http://localhost:5173
```

---

## Deployment

**Frontend — AWS Amplify.** Connect the repo to Amplify. `amplify.yml` is already committed for the monorepo setup (`appRoot: frontend`). Set `VITE_API_URL` to the API Gateway URL plus `/api`, and add the standard SPA rewrite rule. Every push to `main` redeploys automatically.

**Backend — AWS Lambda via GitHub Actions.** `.github/workflows/deploy-backend.yml` runs on any push touching `backend/`:

1. `npm ci`, then slim the Prisma footprint (drop CLI-only packages and non-arm64 engines) and zip it.
2. `aws lambda update-function-code`, wait for it to settle, then `update-function-configuration` with the full environment mirrored from secrets.
3. Create or update the background worker Lambda (`zenovax-background-worker`).
4. Confirm the worker's EventBridge schedule (`rate(1 minute)`).

Secrets live in GitHub Actions secrets. The IAM deploy user needs `lambda:*` plus `events:PutRule` / `PutTargets` on the relevant rule and function resources.

---

## Security and privacy

- **Auth** — Short-lived JWT access tokens (15 minutes) with rotating refresh tokens stored hashed. Role is baked into the JWT and reissued on any role change.
- **CSRF** — Double-submit cookie validation on all state-changing requests.
- **Rate limiting** — `express-rate-limit`, backed by Redis.
- **Input hygiene** — Prisma parameterization, `xss` sanitization, and zod validation on the way in.
- **CSP / CORS** — Helmet headers plus a strict `ALLOWED_ORIGINS` whitelist.
- **Privacy controls** — Users choose what's visible on their profile (phone number, for instance); admins retain visibility for moderation.
- **Anonymous reviews** — Learners can rate mentors without exposing their identity.

---

## Known limitations

Being upfront about what this isn't, at least not yet:

1. **No native video calls.** Online sessions rely on external links (Zoom, Meet) rather than embedded WebRTC.
2. **No collaborative whiteboard.** Live sessions have media controls and chat, not a shared real-time board.
3. **Refunds are manual.** They're reviewed by a person, not auto-reversed by the payment gateway.
4. **The UI is desktop-first.** The Monaco playground and live-session views are built for desktop; mobile gets a functional but reduced experience.

---

## Roadmap

- Embedded Zoom or Jitsi video calls inside the live classroom.
- Collaborative live code editing (Yjs or operational transforms) in the Monaco editor.
- Automated gateway rollbacks when a mentor cancels.
- Submission analytics — runtime, memory, and peer comparison charts.
- Custom coding contests and department-level hackathons.

---

## Contributing

ZenovaX is an open educational project. If you have ideas for improving how peers learn from each other, open an issue or submit a PR. Run `npm run lint` in the relevant package before submitting.

---

## License

MIT — free for educational and community use, and open to commercial extension with further development.
