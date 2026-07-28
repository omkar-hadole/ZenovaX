-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MENTOR', 'LEARNER', 'BOTH');

-- CreateEnum
CREATE TYPE "BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'VERIFIED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'PPT', 'DOC', 'IMAGE', 'VIDEO', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'PHONEPE', 'UPI', 'CARD', 'NETBANKING');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('BOOKING_CREDIT', 'RELEASE', 'PAYOUT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'SESSION_REMINDER', 'SESSION_STARTING', 'SESSION_LIVE', 'SESSION_COMPLETED', 'SESSION_CANCELLED', 'NEW_REVIEW', 'ACHIEVEMENT_UNLOCKED', 'PAYMENT_SUCCESS', 'SEAT_AVAILABLE', 'QUIZ_LAUNCHED', 'CODING_QUESTION_LAUNCHED', 'RESOURCE_UPLOADED', 'SESSION_REQUEST_APPROVED', 'SESSION_REQUEST_REJECTED', 'ADMIN_BROADCAST');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ALL', 'LEARNERS', 'MENTORS', 'COURSE_ENROLLED', 'SINGLE_USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "department" TEXT,
    "year" INTEGER,
    "bio" TEXT,
    "profilePicture" TEXT,
    "mentorSkills" TEXT,
    "linkedinUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVisible" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "badgeLevel" "BadgeLevel",
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "uniqueLearners" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deviceTokens" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_requests" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "topics" TEXT,
    "mode" "SessionMode" NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSeats" INTEGER NOT NULL,
    "venue" TEXT,
    "meetingLink" TEXT,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "verificationCall" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "session_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "topics" TEXT,
    "mentorId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSeats" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "venue" TEXT,
    "meetingLink" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "joinEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "requestId" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "seatNumber" INTEGER,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "earningsReleased" BOOLEAN NOT NULL DEFAULT false,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "canReview" BOOLEAN NOT NULL DEFAULT false,
    "hasReviewed" BOOLEAN NOT NULL DEFAULT false,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" "ResourceType" NOT NULL,
    "fileSize" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "availableDuring" BOOLEAN NOT NULL DEFAULT true,
    "availableAfter" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "passingMarks" INTEGER NOT NULL DEFAULT 0,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "availableDuring" BOOLEAN NOT NULL DEFAULT true,
    "availableAfter" BOOLEAN NOT NULL DEFAULT true,
    "launchedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT,
    "options" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalMarks" INTEGER NOT NULL,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeTaken" INTEGER,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "marksObtained" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_wallets" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "balancePending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAvailable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaidOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_ledger_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "bookingId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_payouts" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gatewayPayoutId" TEXT,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "mentor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_payout_accounts" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "accountHolderName" TEXT,
    "bankAccountNumber" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "gatewayLinkedAccountId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notification_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "audienceType" "AudienceType" NOT NULL,
    "audienceId" TEXT,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "sessionId" TEXT,
    "reason" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_questions" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "testCases" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "allowedLanguages" TEXT,
    "starterCode" TEXT,
    "referenceSolution" TEXT,
    "timeLimitMinutes" INTEGER,
    "points" INTEGER DEFAULT 100,
    "questionType" TEXT DEFAULT 'legacy',
    "functionName" TEXT,
    "parameters" TEXT,
    "returnType" TEXT,
    "structuredTestCases" TEXT,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codingQuestionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_averageRating_idx" ON "users"("averageRating");

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE INDEX "likes_mentorId_idx" ON "likes"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_mentorId_key" ON "likes"("userId", "mentorId");

-- CreateIndex
CREATE INDEX "session_requests_mentorId_idx" ON "session_requests"("mentorId");

-- CreateIndex
CREATE INDEX "session_requests_status_idx" ON "session_requests"("status");

-- CreateIndex
CREATE INDEX "session_requests_requestedAt_idx" ON "session_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "session_requests_subject_idx" ON "session_requests"("subject");

-- CreateIndex
CREATE INDEX "session_requests_department_idx" ON "session_requests"("department");

-- CreateIndex
CREATE INDEX "session_requests_topics_idx" ON "session_requests"("topics");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_requestId_key" ON "sessions"("requestId");

-- CreateIndex
CREATE INDEX "sessions_mentorId_idx" ON "sessions"("mentorId");

-- CreateIndex
CREATE INDEX "sessions_subject_idx" ON "sessions"("subject");

-- CreateIndex
CREATE INDEX "sessions_department_idx" ON "sessions"("department");

-- CreateIndex
CREATE INDEX "sessions_mode_idx" ON "sessions"("mode");

-- CreateIndex
CREATE INDEX "sessions_priceType_idx" ON "sessions"("priceType");

-- CreateIndex
CREATE INDEX "sessions_scheduledAt_idx" ON "sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_availableSeats_idx" ON "sessions"("availableSeats");

-- CreateIndex
CREATE INDEX "sessions_isLive_idx" ON "sessions"("isLive");

-- CreateIndex
CREATE INDEX "sessions_topics_idx" ON "sessions"("topics");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_paymentId_key" ON "bookings"("paymentId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_sessionId_idx" ON "bookings"("sessionId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_bookedAt_idx" ON "bookings"("bookedAt");

-- CreateIndex
CREATE INDEX "bookings_attended_idx" ON "bookings"("attended");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_userId_sessionId_key" ON "bookings"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "reviews_mentorId_idx" ON "reviews"("mentorId");

-- CreateIndex
CREATE INDEX "reviews_sessionId_idx" ON "reviews"("sessionId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_authorId_sessionId_key" ON "reviews"("authorId", "sessionId");

-- CreateIndex
CREATE INDEX "resources_uploaderId_idx" ON "resources"("uploaderId");

-- CreateIndex
CREATE INDEX "resources_sessionId_idx" ON "resources"("sessionId");

-- CreateIndex
CREATE INDEX "resources_fileType_idx" ON "resources"("fileType");

-- CreateIndex
CREATE INDEX "resources_createdAt_idx" ON "resources"("createdAt");

-- CreateIndex
CREATE INDEX "quizzes_creatorId_idx" ON "quizzes"("creatorId");

-- CreateIndex
CREATE INDEX "quizzes_sessionId_idx" ON "quizzes"("sessionId");

-- CreateIndex
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");

-- CreateIndex
CREATE INDEX "quizzes_isLive_idx" ON "quizzes"("isLive");

-- CreateIndex
CREATE INDEX "questions_quizId_idx" ON "questions"("quizId");

-- CreateIndex
CREATE INDEX "questions_order_idx" ON "questions"("order");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_idx" ON "quiz_attempts"("userId");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_idx" ON "quiz_attempts"("quizId");

-- CreateIndex
CREATE INDEX "quiz_attempts_startedAt_idx" ON "quiz_attempts"("startedAt");

-- CreateIndex
CREATE INDEX "answers_attemptId_idx" ON "answers"("attemptId");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bookingId_key" ON "transactions"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_gatewayOrderId_key" ON "transactions"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_gatewayPaymentId_key" ON "transactions"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_wallets_mentorId_key" ON "mentor_wallets"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_ledger_entries_walletId_idx" ON "mentor_ledger_entries"("walletId");

-- CreateIndex
CREATE INDEX "mentor_ledger_entries_bookingId_idx" ON "mentor_ledger_entries"("bookingId");

-- CreateIndex
CREATE INDEX "mentor_ledger_entries_type_idx" ON "mentor_ledger_entries"("type");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payouts_gatewayPayoutId_key" ON "mentor_payouts"("gatewayPayoutId");

-- CreateIndex
CREATE INDEX "mentor_payouts_mentorId_idx" ON "mentor_payouts"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_payouts_status_idx" ON "mentor_payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payout_accounts_mentorId_key" ON "mentor_payout_accounts"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payout_accounts_gatewayLinkedAccountId_key" ON "mentor_payout_accounts"("gatewayLinkedAccountId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "admin_notification_logs_adminId_idx" ON "admin_notification_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_notification_logs_createdAt_idx" ON "admin_notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "reports_sessionId_idx" ON "reports"("sessionId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "coding_questions_creatorId_idx" ON "coding_questions"("creatorId");

-- CreateIndex
CREATE INDEX "coding_questions_sessionId_idx" ON "coding_questions"("sessionId");

-- CreateIndex
CREATE INDEX "coding_submissions_userId_idx" ON "coding_submissions"("userId");

-- CreateIndex
CREATE INDEX "coding_submissions_codingQuestionId_idx" ON "coding_submissions"("codingQuestionId");

-- CreateIndex
CREATE INDEX "coding_submissions_userId_codingQuestionId_idx" ON "coding_submissions"("userId", "codingQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_requests" ADD CONSTRAINT "session_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "session_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_wallets" ADD CONSTRAINT "mentor_wallets_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_ledger_entries" ADD CONSTRAINT "mentor_ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "mentor_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_ledger_entries" ADD CONSTRAINT "mentor_ledger_entries_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "mentor_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "mentor_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payout_accounts" ADD CONSTRAINT "mentor_payout_accounts_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notification_logs" ADD CONSTRAINT "admin_notification_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_questions" ADD CONSTRAINT "coding_questions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_questions" ADD CONSTRAINT "coding_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_codingQuestionId_fkey" FOREIGN KEY ("codingQuestionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

