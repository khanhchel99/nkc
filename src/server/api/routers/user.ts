import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        role: true,
        businessProfile: true,
      }
    });

    return user;
  }),

  getCurrentUserOptional: publicProcedure.query(async ({ ctx }) => {
    console.log('DEBUG: Session in getCurrentUserOptional:', ctx.session?.user?.id);
    
    if (!ctx.session?.user?.id) {
      return null;
    }

    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        role: true,
        businessProfile: true,
      }
    });

    console.log('DEBUG: User found:', user?.name, user?.role?.name);
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        createdAt: true,
      },
    });
  }),
});