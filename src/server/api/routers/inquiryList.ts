import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { sendInquiryAcknowledgment } from "@/lib/email-service";

export const inquiryListRouter = createTRPCRouter({
  // Get user's inquiry list items
  getItems: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.inquiryListItem.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        product: {
          include: {
            categoryRef: true,
            subcategoryRef: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  // Add product to inquiry list
  addItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().min(1).default(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.inquiryListItem.upsert({
        where: {
          userId_productId: {
            userId: ctx.session.user.id,
            productId: input.productId,
          },
        },
        create: {
          userId: ctx.session.user.id,
          productId: input.productId,
          quantity: input.quantity,
          notes: input.notes,
        },
        update: {
          quantity: input.quantity,
          notes: input.notes,
          updatedAt: new Date(),
        },
        include: {
          product: true,
        },
      });
    }),

  // Remove item from inquiry list
  removeItem: protectedProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.inquiryListItem.deleteMany({
        where: {
          userId: ctx.session.user.id,
          productId: input.productId,
        },
      });
    }),

  // Update notes for an inquiry list item
  updateNotes: protectedProcedure
    .input(z.object({
      productId: z.string(),
      notes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.inquiryListItem.update({
        where: {
          userId_productId: {
            userId: ctx.session.user.id,
            productId: input.productId,
          },
        },
        data: {
          notes: input.notes,
        },
      });
    }),

  // Update quantity for an inquiry list item
  updateQuantity: protectedProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.inquiryListItem.update({
        where: {
          userId_productId: {
            userId: ctx.session.user.id,
            productId: input.productId,
          },
        },
        data: {
          quantity: input.quantity,
        },
      });
    }),

  // Clear all items from inquiry list
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.inquiryListItem.deleteMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),

  // Check if product is in inquiry list
  isInList: protectedProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.inquiryListItem.findUnique({
        where: {
          userId_productId: {
            userId: ctx.session.user.id,
            productId: input.productId,
          },
        },
      });
      return !!item;
    }),

  // Submit inquiry for selected items
  submitInquiry: protectedProcedure
    .input(z.object({
      selectedItemIds: z.array(z.string()),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      companyName: z.string().optional(),
      phone: z.string().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the selected items with product details
      const selectedItems = await ctx.db.inquiryListItem.findMany({
        where: {
          userId: ctx.session.user.id,
          id: {
            in: input.selectedItemIds,
          },
        },
        include: {
          product: true,
        },
      });

      if (selectedItems.length === 0) {
        throw new Error("No items selected for inquiry");
      }

      // Prepare items data for storage
      const itemsData = selectedItems.map(item => ({
        productId: item.productId,
        productName: item.product.nameEn,
        quantity: item.quantity,
        notes: item.notes,
      }));

      // Create inquiry submission
      const submission = await ctx.db.inquirySubmission.create({
        data: {
          userId: ctx.session.user.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          companyName: input.companyName,
          phone: input.phone,
          message: input.message,
          items: itemsData,
        },
      });

      // Send automatic acknowledgment email
      try {
        await sendInquiryAcknowledgment({
          inquiry: submission,
          user: ctx.session.user,
        });
      } catch (emailError) {
        console.error('Failed to send acknowledgment email:', emailError);
        // Don't fail the inquiry submission if email fails
      }

      // Remove submitted items from inquiry list
      await ctx.db.inquiryListItem.deleteMany({
        where: {
          userId: ctx.session.user.id,
          id: {
            in: input.selectedItemIds,
          },
        },
      });

      return submission;
    }),
});
