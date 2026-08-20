-- CreateEnum
CREATE TYPE "LearningRequestStatus" AS ENUM ('OPEN', 'SESSION_CREATED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PreferredMode" AS ENUM ('ONLINE', 'OFFLINE', 'EITHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LEARNING_REQUEST_SESSION_CREATED';

-- AlterTable
ALTER TABLE "session_requests" ADD COLUMN     "learningRequestId" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "learningRequestId" TEXT;

-- CreateTable
CREATE TABLE "learning_requests" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredMode" "PreferredMode" NOT NULL DEFAULT 'EITHER',
    "status" "LearningRequestStatus" NOT NULL DEFAULT 'OPEN',
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_request_interests" (
    "id" TEXT NOT NULL,
    "learningRequestId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_request_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_requests_sessionId_key" ON "learning_requests"("sessionId");

-- CreateIndex
CREATE INDEX "learning_requests_creatorId_idx" ON "learning_requests"("creatorId");

-- CreateIndex
CREATE INDEX "learning_requests_status_idx" ON "learning_requests"("status");

-- CreateIndex
CREATE INDEX "learning_requests_topic_idx" ON "learning_requests"("topic");

-- CreateIndex
CREATE INDEX "learning_requests_preferredMode_idx" ON "learning_requests"("preferredMode");

-- CreateIndex
CREATE INDEX "learning_requests_createdAt_idx" ON "learning_requests"("createdAt");

-- CreateIndex
CREATE INDEX "learning_request_interests_learnerId_idx" ON "learning_request_interests"("learnerId");

-- CreateIndex
CREATE INDEX "learning_request_interests_learningRequestId_idx" ON "learning_request_interests"("learningRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_request_interests_learningRequestId_learnerId_key" ON "learning_request_interests"("learningRequestId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "session_requests_learningRequestId_key" ON "session_requests"("learningRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_learningRequestId_key" ON "sessions"("learningRequestId");

-- AddForeignKey
ALTER TABLE "session_requests" ADD CONSTRAINT "session_requests_learningRequestId_fkey" FOREIGN KEY ("learningRequestId") REFERENCES "learning_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_requests" ADD CONSTRAINT "learning_requests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_requests" ADD CONSTRAINT "learning_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_request_interests" ADD CONSTRAINT "learning_request_interests_learningRequestId_fkey" FOREIGN KEY ("learningRequestId") REFERENCES "learning_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_request_interests" ADD CONSTRAINT "learning_request_interests_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

