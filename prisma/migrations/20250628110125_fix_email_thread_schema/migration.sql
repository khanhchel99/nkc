/*
  Warnings:

  - You are about to drop the column `inquirySubmissionId` on the `email_threads` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inquiryId]` on the table `email_threads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerEmail` to the `email_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `email_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inquiryId` to the `email_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `email_threads` table without a default value. This is not possible if the table is not empty.

*/

-- Add the new columns with default values first
ALTER TABLE "email_threads" 
ADD COLUMN "customerEmail" TEXT DEFAULT 'unknown@example.com',
ADD COLUMN "customerName" TEXT DEFAULT 'Unknown Customer',
ADD COLUMN "inquiryId" TEXT,
ADD COLUMN "subject" TEXT DEFAULT 'Email Thread';

-- Update the new columns with data from the related inquiry submission
UPDATE "email_threads" 
SET "inquiryId" = "inquirySubmissionId",
    "customerEmail" = (SELECT "customerEmail" FROM "inquiry_submissions" WHERE "id" = "email_threads"."inquirySubmissionId"),
    "customerName" = (SELECT "customerName" FROM "inquiry_submissions" WHERE "id" = "email_threads"."inquirySubmissionId"),
    "subject" = 'Inquiry #' || (SELECT "id" FROM "inquiry_submissions" WHERE "id" = "email_threads"."inquirySubmissionId");

-- Make the columns NOT NULL now that they have values
ALTER TABLE "email_threads" 
ALTER COLUMN "customerEmail" SET NOT NULL,
ALTER COLUMN "customerName" SET NOT NULL,
ALTER COLUMN "inquiryId" SET NOT NULL,
ALTER COLUMN "subject" SET NOT NULL;

-- Remove default values
ALTER TABLE "email_threads" 
ALTER COLUMN "customerEmail" DROP DEFAULT,
ALTER COLUMN "customerName" DROP DEFAULT,
ALTER COLUMN "subject" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "email_threads" DROP CONSTRAINT "email_threads_inquirySubmissionId_fkey";

-- DropIndex
DROP INDEX "email_threads_inquirySubmissionId_key";

-- Drop the old column
ALTER TABLE "email_threads" DROP COLUMN "inquirySubmissionId";

-- CreateIndex
CREATE UNIQUE INDEX "email_threads_inquiryId_key" ON "email_threads"("inquiryId");

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
