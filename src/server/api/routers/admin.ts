import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { getEmailThread, sendReplyEmail } from "@/lib/email-service";

export const adminRouter = createTRPCRouter({
  // Get all inquiry submissions (admin only)
  getInquirySubmissions: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role.name !== 'admin') {
      throw new Error("Unauthorized");
    }

    return await ctx.db.inquirySubmission.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  // Update inquiry submission status (admin only)
  updateInquiryStatus: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      status: z.enum(['pending', 'reviewing', 'quoted', 'closed']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role.name !== 'admin') {
        throw new Error("Unauthorized");
      }

      return await ctx.db.inquirySubmission.update({
        where: {
          id: input.submissionId,
        },
        data: {
          status: input.status,
        },
      });
    }),

  // Get email thread for an inquiry submission (admin only)
  getEmailThread: protectedProcedure
    .input(z.object({
      inquirySubmissionId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role.name !== 'admin') {
        throw new Error("Unauthorized");
      }

      const emailThread = await getEmailThread(input.inquirySubmissionId);
      
      // Return null if no thread exists instead of throwing an error
      return emailThread;
    }),

  // Send admin reply to inquiry thread (admin only)
  sendReply: protectedProcedure
    .input(z.object({
      inquirySubmissionId: z.string(),
      subject: z.string(),
      htmlContent: z.string(),
      textContent: z.string().optional(),
      templateType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.session.user.role.name !== 'admin') {
        throw new Error("Unauthorized");
      }

      // Get the thread first to find the customer email
      const emailThread = await getEmailThread(input.inquirySubmissionId);
      if (!emailThread) {
        throw new Error("Email thread not found");
      }

      return await sendReplyEmail({
        threadId: emailThread.id,
        to: emailThread.customerEmail,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent,
        emailType: input.templateType || 'admin_reply',
        isFromAdmin: true,
      });
    }),
});
