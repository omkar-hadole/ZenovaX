-- Performance indexes for hot query patterns (see audit).
-- Mirrors the @@index(...) entries added to prisma/schema.prisma.

-- Session list browsing: filter on status range + scheduledAt.
CREATE INDEX IF NOT EXISTS "sessions_status_scheduledAt_idx" ON "sessions"("status", "scheduledAt");
-- Mentor's own session lists: filter on mentorId + status.
CREATE INDEX IF NOT EXISTS "sessions_mentorId_status_idx" ON "sessions"("mentorId", "status");
-- Soft-delete filter is injected into every session query.
CREATE INDEX IF NOT EXISTS "sessions_isDeleted_idx" ON "sessions"("isDeleted");

-- Bookings per session by status (e.g. "can this learner take this quiz").
CREATE INDEX IF NOT EXISTS "bookings_sessionId_status_idx" ON "bookings"("sessionId", "status");

-- Unread-notification count per user.
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- Ledger summary: newest entries per wallet.
CREATE INDEX IF NOT EXISTS "mentor_ledger_entries_walletId_createdAt_idx" ON "mentor_ledger_entries"("walletId", "createdAt");

-- LIVE coding questions per session.
CREATE INDEX IF NOT EXISTS "coding_questions_status_idx" ON "coding_questions"("status");

-- Mentor discovery: role + profile completeness.
CREATE INDEX IF NOT EXISTS "users_role_isProfileComplete_idx" ON "users"("role", "isProfileComplete");
-- Soft-delete filter is injected into every user query.
CREATE INDEX IF NOT EXISTS "users_isDeleted_idx" ON "users"("isDeleted");

-- Refresh-token lookups by user + revoked status.
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_revoked_idx" ON "refresh_tokens"("userId", "revoked");
-- `token` is already UNIQUE, so the separate non-unique index on it never helps; drop it.
DROP INDEX IF EXISTS "refresh_tokens_token_idx";