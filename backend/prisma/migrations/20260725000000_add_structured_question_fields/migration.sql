-- AlterTable: Add structured question fields to coding_questions
ALTER TABLE `coding_questions` 
ADD COLUMN `questionType` VARCHAR(191) NULL DEFAULT 'legacy',
ADD COLUMN `functionName` VARCHAR(191) NULL,
ADD COLUMN `parameters` TEXT NULL,
ADD COLUMN `returnType` VARCHAR(191) NULL,
ADD COLUMN `structuredTestCases` TEXT NULL;
