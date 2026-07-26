-- AlterEnum: Add ADMIN_BROADCAST to NotificationType
ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM('BOOKING_CONFIRMED', 'SESSION_REMINDER', 'SESSION_STARTING', 'SESSION_LIVE', 'SESSION_COMPLETED', 'SESSION_CANCELLED', 'NEW_REVIEW', 'ACHIEVEMENT_UNLOCKED', 'PAYMENT_SUCCESS', 'SEAT_AVAILABLE', 'QUIZ_LAUNCHED', 'CODING_QUESTION_LAUNCHED', 'RESOURCE_UPLOADED', 'SESSION_REQUEST_APPROVED', 'SESSION_REQUEST_REJECTED', 'ADMIN_BROADCAST') NOT NULL;

-- AlterTable: Add deviceTokens column to users
ALTER TABLE `users` ADD COLUMN `deviceTokens` TEXT NULL;

-- CreateTable: admin_notification_logs
CREATE TABLE `admin_notification_logs` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `audienceType` ENUM('ALL', 'LEARNERS', 'MENTORS', 'COURSE_ENROLLED', 'SINGLE_USER') NOT NULL,
    `audienceId` VARCHAR(191) NULL,
    `totalSent` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `admin_notification_logs_adminId_idx` (`adminId`),
    INDEX `admin_notification_logs_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_notification_logs` ADD CONSTRAINT `admin_notification_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
