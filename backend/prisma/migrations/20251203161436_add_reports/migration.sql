/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `collegeName` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `bio` TEXT NULL,
    `profilePicture` VARCHAR(191) NULL,
    `mentorSkills` TEXT NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'MENTOR', 'LEARNER', 'BOTH') NOT NULL DEFAULT 'LEARNER',
    `isProfileComplete` BOOLEAN NOT NULL DEFAULT false,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationToken` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `totalSessions` INTEGER NOT NULL DEFAULT 0,
    `totalRating` DOUBLE NOT NULL DEFAULT 0,
    `averageRating` DOUBLE NOT NULL DEFAULT 0,
    `badgeLevel` ENUM('BRONZE', 'SILVER', 'GOLD', 'VERIFIED') NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `totalReviews` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `users_verificationToken_key`(`verificationToken`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phoneNumber_idx`(`phoneNumber`),
    INDEX `users_collegeName_idx`(`collegeName`),
    INDEX `users_department_idx`(`department`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_averageRating_idx`(`averageRating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follows` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `followingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `follows_followerId_idx`(`followerId`),
    INDEX `follows_followingId_idx`(`followingId`),
    UNIQUE INDEX `follows_followerId_followingId_key`(`followerId`, `followingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mentorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `likes_userId_idx`(`userId`),
    INDEX `likes_mentorId_idx`(`mentorId`),
    UNIQUE INDEX `likes_userId_mentorId_key`(`userId`, `mentorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_requests` (
    `id` VARCHAR(191) NOT NULL,
    `mentorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `topics` TEXT NOT NULL,
    `mode` ENUM('ONLINE', 'OFFLINE') NOT NULL,
    `priceType` ENUM('FREE', 'PAID') NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `maxSeats` INTEGER NOT NULL,
    `venue` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `proposedDate` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `adminNote` TEXT NULL,
    `verificationCall` BOOLEAN NOT NULL DEFAULT false,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,

    INDEX `session_requests_mentorId_idx`(`mentorId`),
    INDEX `session_requests_status_idx`(`status`),
    INDEX `session_requests_requestedAt_idx`(`requestedAt`),
    INDEX `session_requests_subject_idx`(`subject`),
    INDEX `session_requests_department_idx`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `topics` TEXT NOT NULL,
    `mentorId` VARCHAR(191) NOT NULL,
    `mode` ENUM('ONLINE', 'OFFLINE') NOT NULL,
    `priceType` ENUM('FREE', 'PAID') NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `platformFee` DOUBLE NOT NULL DEFAULT 0,
    `maxSeats` INTEGER NOT NULL,
    `availableSeats` INTEGER NOT NULL,
    `venue` VARCHAR(191) NULL,
    `meetingLink` VARCHAR(191) NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `isLive` BOOLEAN NOT NULL DEFAULT false,
    `joinEnabled` BOOLEAN NOT NULL DEFAULT false,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `requestId` VARCHAR(191) NULL,

    UNIQUE INDEX `sessions_requestId_key`(`requestId`),
    INDEX `sessions_mentorId_idx`(`mentorId`),
    INDEX `sessions_subject_idx`(`subject`),
    INDEX `sessions_department_idx`(`department`),
    INDEX `sessions_mode_idx`(`mode`),
    INDEX `sessions_priceType_idx`(`priceType`),
    INDEX `sessions_scheduledAt_idx`(`scheduledAt`),
    INDEX `sessions_status_idx`(`status`),
    INDEX `sessions_availableSeats_idx`(`availableSeats`),
    INDEX `sessions_isLive_idx`(`isLive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `seatNumber` INTEGER NULL,
    `amountPaid` DOUBLE NOT NULL DEFAULT 0,
    `platformFee` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentId` VARCHAR(191) NULL,
    `attended` BOOLEAN NOT NULL DEFAULT false,
    `joinedAt` DATETIME(3) NULL,
    `canReview` BOOLEAN NOT NULL DEFAULT false,
    `hasReviewed` BOOLEAN NOT NULL DEFAULT false,
    `bookedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_paymentId_key`(`paymentId`),
    INDEX `bookings_userId_idx`(`userId`),
    INDEX `bookings_sessionId_idx`(`sessionId`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_bookedAt_idx`(`bookedAt`),
    INDEX `bookings_attended_idx`(`attended`),
    UNIQUE INDEX `bookings_userId_sessionId_key`(`userId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `mentorId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `helpfulCount` INTEGER NOT NULL DEFAULT 0,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reviews_mentorId_idx`(`mentorId`),
    INDEX `reviews_sessionId_idx`(`sessionId`),
    INDEX `reviews_rating_idx`(`rating`),
    INDEX `reviews_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `reviews_authorId_sessionId_key`(`authorId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` VARCHAR(191) NOT NULL,
    `uploaderId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` ENUM('PDF', 'PPT', 'DOC', 'IMAGE', 'VIDEO', 'LINK', 'OTHER') NOT NULL,
    `fileSize` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `availableDuring` BOOLEAN NOT NULL DEFAULT true,
    `availableAfter` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `resources_uploaderId_idx`(`uploaderId`),
    INDEX `resources_sessionId_idx`(`sessionId`),
    INDEX `resources_fileType_idx`(`fileType`),
    INDEX `resources_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizzes` (
    `id` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `duration` INTEGER NULL,
    `totalMarks` INTEGER NOT NULL DEFAULT 0,
    `passingMarks` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'LIVE', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `isLive` BOOLEAN NOT NULL DEFAULT false,
    `availableDuring` BOOLEAN NOT NULL DEFAULT true,
    `availableAfter` BOOLEAN NOT NULL DEFAULT true,
    `launchedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `quizzes_creatorId_idx`(`creatorId`),
    INDEX `quizzes_sessionId_idx`(`sessionId`),
    INDEX `quizzes_status_idx`(`status`),
    INDEX `quizzes_isLive_idx`(`isLive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `questionText` TEXT NOT NULL,
    `options` TEXT NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `marks` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL,
    `explanation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `questions_quizId_idx`(`quizId`),
    INDEX `questions_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `totalMarks` INTEGER NOT NULL,
    `isPassed` BOOLEAN NOT NULL DEFAULT false,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `timeTaken` INTEGER NULL,

    INDEX `quiz_attempts_userId_idx`(`userId`),
    INDEX `quiz_attempts_quizId_idx`(`quizId`),
    INDEX `quiz_attempts_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `answers` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selectedAnswer` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `marksObtained` INTEGER NOT NULL DEFAULT 0,
    `answeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `answers_attemptId_idx`(`attemptId`),
    INDEX `answers_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('SESSIONS_COMPLETED', 'HIGH_RATING', 'LEARNERS_HELPED', 'PERFECT_ATTENDANCE', 'EARLY_ADOPTER', 'RESOURCE_CONTRIBUTOR', 'QUIZ_MASTER', 'FIRST_SESSION') NOT NULL,
    `requirement` INTEGER NOT NULL,
    `badgeIcon` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `achievements_name_key`(`name`),
    INDEX `achievements_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progress` INTEGER NOT NULL DEFAULT 0,

    INDEX `user_achievements_userId_idx`(`userId`),
    INDEX `user_achievements_achievementId_idx`(`achievementId`),
    UNIQUE INDEX `user_achievements_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `platformFee` DOUBLE NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('RAZORPAY', 'PHONEPE', 'UPI', 'CARD', 'NETBANKING') NULL,
    `gatewayOrderId` VARCHAR(191) NULL,
    `gatewayPaymentId` VARCHAR(191) NULL,
    `gatewaySignature` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `transactions_bookingId_key`(`bookingId`),
    UNIQUE INDEX `transactions_gatewayOrderId_key`(`gatewayOrderId`),
    UNIQUE INDEX `transactions_gatewayPaymentId_key`(`gatewayPaymentId`),
    INDEX `transactions_userId_idx`(`userId`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('BOOKING_CONFIRMED', 'SESSION_REMINDER', 'SESSION_STARTING', 'SESSION_LIVE', 'SESSION_COMPLETED', 'SESSION_CANCELLED', 'NEW_REVIEW', 'ACHIEVEMENT_UNLOCKED', 'PAYMENT_SUCCESS', 'SEAT_AVAILABLE', 'QUIZ_LAUNCHED', 'RESOURCE_UPLOADED', 'SESSION_REQUEST_APPROVED', 'SESSION_REQUEST_REJECTED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'IGNORED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `reports_reporterId_idx`(`reporterId`),
    INDEX `reports_sessionId_idx`(`sessionId`),
    INDEX `reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follows` ADD CONSTRAINT `follows_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_requests` ADD CONSTRAINT `session_requests_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `session_requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_mentorId_fkey` FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answers` ADD CONSTRAINT `answers_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `quiz_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answers` ADD CONSTRAINT `answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
