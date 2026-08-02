# ZenovaX

**A peer-to-peer learning platform for college students — mentors teach, learners learn, one-to-many.**

---

## 1. Why ZenovaX Exists

In college, if a student doesn't understand a topic, the only real options are booking a session with a teacher, or self-learning from the internet/YouTube. But often, the person who explains a topic best isn't the teacher — it's a classmate or senior who already gets it.

ZenovaX exists to formalize that: **students who understand a topic well can teach it, and students who don't can learn from them** — affordably, without the fear and friction of asking a teacher.

### Problems being solved
- Students are afraid to ask doubts in class.
- No personalized attention or treatment from teachers — doubts don't get properly solved.
- No personalized quizzes/notes for mid-sem or end-sem exam prep.
- No existing peer-to-peer learning culture in college, despite plenty of students who are already skilled/placed and capable of teaching.

### Core concept
- Mentors create **one-to-many sessions** (not 1:1 tutoring) — they set price, title, topics covered, timing, venue, and max participants.
- Sessions can be **free or paid** (e.g. ₹20/student — at 100 students, that's ₹2,000, framed as a way for a mentor to cover monthly expenses).
- A mentor can attach structured resources, a quiz, and coding questions to a session.
- Ratings (1–5 stars) + written reviews, with an anonymous posting option, build a mentor's reputation and drive future bookings.

---

## 2. Feature Priority Matrix

This is a rough build-order priority based on what makes the core loop work vs. what enhances it.

### P0 — Core loop (platform doesn't function without these)
- Auth: signup, email verification, login
- Role selection: Learner vs Mentor, with profile completion
- Mentor: Create Session (title, topics, mode, date/time, duration, capacity, price)
- Learner: Browse Sessions, view session detail, register/book a session
- Session admin approval flow (mentor submits → admin approves/rejects)
- My Bookings (learner) / My Session (mentor) — session status tracking
- Basic dashboards for both roles (sidebar nav, profile, logout)

### P1 — Trust, content, and monetization layer
- Ratings & reviews (incl. anonymous option) on mentors and sessions
- Mentor profiles (public-facing) with skills, bio, rating, reviews
- Course material: Resources upload (PDF/PPT/video/link/etc.)
- Quiz creation (mentor) + quiz taking & scorecard (learner)
- Coding question creation (manual: Legacy/Structured) + coding sandbox (learner)
- Mentor Earnings: balance tracking, payout via UPI, admin verification
- Offline session logistics: QR code/ticket generation + Scan Attendance verification
- Notifications system
- Settings: appearance, privacy, security, active sessions, account deactivation
- Help Centre: WhatsApp/email/call support + FAQ

### P2 — Differentiators / polish
- Zen AI (Cmd-K accessible) personalized to user context, with optional "connect your own ChatGPT" for unlimited chat
- AI "Generate Question" — auto-generate a full coding question from a name or LeetCode number
- AI coding helper with full context of the user's current code + problem
- Achievements/badges system (mentor gamification, ~15–20 badges)
- Follow/like mentors
- Add-to-Google-Calendar
- Share session button
- Report an issue / reports moderation dashboard
- Per-question quiz analytics for mentors
- Search across sessions/mentors from any screen

---

## 3. Onboarding Flow

1. **Landing page** — explains the platform, includes an explainer video (click-to-play) and a dashboard screenshot preview.
2. **Get Started button** → Create Account: name, surname, email, password, confirm password, agree to T&C.
3. **Email verification** — required before proceeding, prevents fake accounts.
4. **Complete Profile** — user chooses one of two roles:
   - **Learner**: profile picture (upload or choose predefined avatar), department, optional bio.
   - **Mentor**: original profile photo (required, not predefined), department, year, bio, skills they can teach (e.g. Data Structures, Finance Basics, Python), phone number (used by admin/learners to contact), optional LinkedIn URL.

---

## 4. Learner Experience

### 4.1 Dashboard
- Session calendar (upcoming/previous sessions)
- Browse sessions shortcut
- Mentors shortcut
- Top-right: profile icon, notification bell
- Cmd-K shortcut opens Zen AI

### 4.2 Sidebar navigation
Dashboard · Browse Session · Booking · My Bookings · Mentors · Help Centre · Settings · Chat with AI · **Logout** (bottom-right)

### 4.3 Zen AI (AI Assistant)
- Personalized to the learner: can answer questions about their upcoming/past sessions.
- Can also answer general questions unrelated to the platform (e.g. general knowledge).
- Triggered via Cmd-K from anywhere.
- Greets the user by name (e.g. "Good afternoon, [Name]").
- Model options: Default, or connect your own ChatGPT account for unlimited chats (with a disconnect option).
- Chat session persists locally (survives accidental reload) via a "New Chat" option.
- Disclaimer shown: "Zen AI is an AI and can make mistakes."

### 4.4 Browse Session
- **Filters**: price (free/paid/all), mode (online/offline), upcoming/past
- **Pagination**
- Session card → click to view full detail:
  - Mode, title, date, time, duration, venue (if offline)
  - About this session / what you'll learn (e.g. "loops, lists, recursion, modules, sets")
  - Instructor info: name, rating, view-profile button
  - Registration card: price, seats available, "Report an issue" button
  - Student reviews (if session completed)

### 4.5 Session Detail — Course Material (after registering)
Three sub-tabs: **Resources**, **Quiz**, **Coding**
- **Resources**: mentor-uploaded PDFs, PPTs, cheat sheets, etc.
- **Quiz**: see section 4.7
- **Coding**: see section 4.6

Other session-detail features:
- Post-session review (1–5 stars, optional anonymous)
- Share button (top-right corner)
- Add to Google Calendar
- If offline: auto-generated QR code / ticket ID for venue entry, ticket ID shown below the QR

### 4.6 Coding Question (Learner view)
- Opened from Course Material → Coding, shows all questions launched by the mentor with difficulty (easy/medium/hard)
- **Solve view**:
  - Top: question title, difficulty, "Submit" button
  - Language switch: JavaScript / Python / Java
  - Code formatter (spacing only, not syntax correction)
  - Left panel: problem description, 2 example test cases (mentor can increase visible test cases, default 2, e.g. up to 3), function signature
  - Right panel: code editor
  - Bottom terminal: test case pass/fail, XP earned, expected vs. actual output, console output, submission history
  - **Ask Zen AI**: has full context of the user's current code + problem statement + example test cases; can discuss approach, time complexity, space complexity
  - Sidebar AI prompts: "debug my code," hints with "no spoiler" mode, optimize approach, explain the problem, or free-form questions (including off-topic ones)
  - Back-to-session button

### 4.7 Quiz (Learner view)
- Opened from Course Material → Quiz, shows quiz title and live/closed status
- 4-option multiple choice, plus a "Don't Select" option
- Navigate between questions from the right side
- **Scorecard on submission**:
  - Percentage, score (e.g. 8/10), questions correct, passing marks, time taken
  - Answer review: which were answered correctly/incorrectly, with correct option shown
  - Personalized pass/fail message (e.g. "Great work")
- Back-to-session button

### 4.8 Mentors Directory
- **Filter** by department, **search** by name, **pagination**
- Mentor card: profile image, name, department, current rating, sessions completed, "View Profile" button
- **Full mentor profile**:
  - Department, mobile number (if mentor allows sharing), current year, bio, skills/expertise
  - Latest 3 reviews + overall rating out of 5 (e.g. 4.7/5)
  - Follow / Like buttons, current follower/like counts
  - Achievements/badges (see section 7)

### 4.9 My Bookings
- Same card style as Browse Session, plus a status badge: **Review Pending**, **Completed**, **Upcoming**, **Live**
- "View Ticket" button for offline sessions
- Pagination, filter by mode/status, search by session title or mentor name

### 4.10 Help Centre (Learner)
- WhatsApp chat support: 10 AM – 8 PM
- Email support: response within 24–48 hours
- Call support: urgent only, 10 AM – 6 PM
- AI quick assistant
- FAQ (e.g. "How do I book a session?", "Can I cancel or reschedule a booking?")

### 4.11 Settings (Learner)
- **Appearance**: light/dark mode (dark mode currently in beta)
- **Privacy**: control visibility of info like mobile number to other users
- **Security**: update password (current + new x2)
- **Active Sessions**: see logged-in devices (e.g. "Chrome on macOS"), log out other devices
- **Danger Zone**: deactivate account

### 4.12 Global elements (Learner)
- Top-right: search bar (search any session/mentor from anywhere), profile icon, notification bell, AI access
- Greeting message: "Welcome back, [username]"

---

## 5. Mentor Experience

### 5.1 Dashboard
Stats shown: total sessions, learners helped, total hours, average rating, upcoming sessions, session requests, recent activity.

**Quick Actions**: Create Session · Upload Resources · Launch Quiz · Launch Code

Top-right: profile icon, notification bell, Zen AI (Ask), Cmd-K shortcut, search bar (search own sessions), greeting message (e.g. "Hello [Name]")

### 5.2 Sidebar navigation
Dashboard · My Session · Coding Questions · Report · Mentor · Scan Attendance · Review Received · Help Center · Earning · **Logout**

### 5.3 Quick Action: Create Session
Fields: session title, what learners will learn, subject, department, topics covered, mode (online/offline), date, time, duration, max participants, session type (free/paid) + price if paid, live preview.
→ Submits a **Request Session** to admin for approval/rejection.

### 5.4 Quick Action: Upload Resources
Fields: resource title, optional description, resource URL, target session, resource type (PDF, PPT, Word doc, video, image, external link, or other).

### 5.5 Quick Action: Launch Quiz
Fields: target session, quiz title, description, duration, per-question marks (customizable per difficulty), passing marks threshold → **Launch Now**.

### 5.6 Quick Action: Launch Code
This is the most feature-dense area of the platform.

**AI-assisted creation ("Generate Question")** — flagship feature:
- Give a question name (e.g. "Two Pointer," "Two Sum") or a LeetCode question number
- AI auto-generates: title, points, difficulty, time limit, problem statement, test cases, starter code — a full end-to-end coding question

**Manual creation**:
- Select target session, question title, difficulty (easy/medium/hard), points, time limit, problem statement
- **Question type**:
  - **Legacy** — freeform input/output; simpler to set up but requires manual grading
  - **Structured** — define function name, return type, parameter names/types (int, string, boolean, etc.), test cases with expected input/output
- Starter code provided per language: JavaScript, Python, Java
- Mentor controls how many test cases are visible to learners (default: 2)
- Final actions: **Launch** (goes live immediately) or **Save Draft** (appears in Coding Questions sidebar for later)

### 5.7 My Session (Mentor)
- Pagination, filters (upcoming/completed/all, mode), search by title
- Card shows date, time, duration; status indicators: "Session Completed," "Join Now" (if live), registered count (e.g. "3/13")
- Detail view mirrors the learner's session detail, except:
  - Mentor cannot register for their own session
  - Course Material → mentor sees **quiz results in detail** instead of taking the quiz

**Quiz Results (mentor view)**:
- Total attempts, pass/fail counts (numbers + %), average score
- Per-student results: name, score, %, pass/fail status, completion time
- Filter: latest first / highest score / fastest time
- **Question-level analytics**: per question — marks, response count, correct-answer percentage
- Close Quiz button (top-right)

### 5.8 Coding Questions (sidebar section)
- Filter by draft / live / closed, search by title
- "New Question" shortcut button (top-right)
- Card shows: title, short description, submission count, difficulty, status
- Actions: **Edit**, **Preview**, **Close**, and **Launch** (if currently in draft — lets mentors pre-build questions before a session and launch them live with one click during the session)

### 5.9 Report Section
- Total reports, pending count, unsolved/pending detail, resolved count
- View full report content
- Filter by pending / resolved / ignored, search reports

### 5.10 Scan Attendance
- For offline sessions only — prevents unregistered or non-paying users from attending
- "Open Scanner" scans a learner's QR/ticket and validates:
  - Whether it belongs to this specific session
  - Whether it belongs to this specific mentor
  - Whether it has already been scanned (prevents duplicate use)
- Purpose: instant attendance verification and anti-fraud at the door

### 5.11 Review Received
- Average rating, total reviews received, % positive feedback
- Recent reviews: session name, star rating, review text, learner name (unless posted anonymously)
- Filter: newest first / highest rated / lowest rated

### 5.12 Help Center (Mentor)
Same channels as learner (WhatsApp, email, call, Zen AI) but with a mentor-specific FAQ set.

### 5.13 Settings (Mentor)
Same structure as learner settings, plus:
- **Privacy**: mentor can choose to hide mobile number from learners (admin can always see it)

### 5.14 Earnings
- **Available balance** and **pending balance** — pending = revenue from sessions not yet marked complete (e.g. ₹20 × 10 students = ₹200 held until session completion)
- **Total earnings** and **total payout** (amount withdrawn to date)
- **Payout account setup**: account holder name + UPI ID, submitted for admin verification/approval
- **Request Payout** — only available once account is verified
- **Payout history**
- **Recent activity**: every wallet credit/debit (e.g. a paid registration reflects here immediately)

### 5.15 Mentor Profile Page
- Back button (top-left), Edit Profile (top-right)
- Department, mobile, current year, about, skills/expertise
- Top 3 recent reviews, overall rating, followers, likes
- Achievements: X/15 unlocked — hover on a locked achievement to see the unlock requirement and a progress bar (e.g. "Loved" badge needs 20 likes; shows "15/20" progress)

### 5.16 Notifications (Mentor)
- Examples: new review received, achievement unlocked, session approved
- Mark-as-read option
- Auto-deleted after 30 days

---

## 6. Cross-Cutting / Shared Systems

- **Ratings & Reviews**: 1–5 stars + text, optional anonymous posting, drives mentor discoverability and booking decisions
- **Notifications**: role-specific, mark-as-read, 30-day auto-expiry
- **AI Assistant**: personalized per user, Cmd-K accessible, connects to user's own ChatGPT account, session persists locally
- **Settings**: appearance (light/dark), privacy, security, active sessions, account deactivation — same shape for both roles
- **Help Centre**: WhatsApp/email/call support + role-specific FAQ, same shape for both roles
- **Admin layer** (implied, not fully detailed in source notes): approves/rejects session requests, verifies mentor payout details, retains visibility into mentor mobile numbers even when hidden from learners

---

## 7. Achievements / Badges (Mentor Gamification)

- ~15–20 total badges
- Examples given:
  - First session completed → **"First Step"** badge
  - Maintain 4+ rating → **"Well-Rated"** badge
  - Maintain 4.5+ rating → **"Top-Rated"** badge
  - 20 likes → **"Loved"** badge
- Progress bars shown for locked achievements the mentor is close to unlocking

---

## 8. Open Questions / Inconsistencies to Resolve

- **Admin role/flow**: referenced repeatedly (approves sessions, verifies payouts) but never fully specified — needs its own dedicated spec.
- **Dark mode**: explicitly flagged as beta/unfinished — decide whether it ships in v1 or gets cut.
- **Legacy vs. Structured coding questions**: grading behavior for "Legacy" type is manual/human — needs a defined workflow for who grades it and when.