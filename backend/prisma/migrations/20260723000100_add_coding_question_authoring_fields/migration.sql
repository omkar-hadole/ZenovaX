-- AlterTable
ALTER TABLE `coding_questions`
    ADD COLUMN `allowedLanguages` TEXT NULL,
    ADD COLUMN `starterCode` TEXT NULL,
    ADD COLUMN `referenceSolution` TEXT NULL,
    ADD COLUMN `timeLimitMinutes` INTEGER NULL,
    ADD COLUMN `points` INTEGER NULL DEFAULT 100;
