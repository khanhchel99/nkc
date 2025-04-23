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
    });

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
        data: {
          ...input,
          modifiedAt: new Date(),
        },
      });
    }),

  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        company: true,
        image: true,
      },
    });
  }),
});