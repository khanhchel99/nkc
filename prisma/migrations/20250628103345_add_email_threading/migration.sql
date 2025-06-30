-- CreateTable
CREATE TABLE "email_threads" (
    "id" TEXT NOT NULL,
    "inquirySubmissionId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "emailType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_threads_inquirySubmissionId_key" ON "email_threads"("inquirySubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "email_threads_threadId_key" ON "email_threads"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "emails"("messageId");

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_inquirySubmissionId_fkey" FOREIGN KEY ("inquirySubmissionId") REFERENCES "inquiry_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
