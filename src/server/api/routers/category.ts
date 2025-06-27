import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const createCategorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameVi: z.string().min(1, "Vietnamese name is required"),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().optional(),
  descriptionVi: z.string().optional(),
  image: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().default(0),
});

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string(),
});

const createSubcategorySchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameVi: z.string().min(1, "Vietnamese name is required"),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().optional(),
  descriptionVi: z.string().optional(),
  categoryId: z.string(),
  displayOrder: z.number().default(0),
});

const updateSubcategorySchema = createSubcategorySchema.partial().extend({
  id: z.string(),
});

export const categoryRouter = createTRPCRouter({
  // Get all categories with subcategories
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }),

  // Get all categories for admin (including inactive)
  getAllForAdmin: protectedProcedure.query(async ({ ctx }) => {
    // Check if user has admin permissions
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { role: true },
    });

    if (user?.role.name !== 'admin') {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Admin access required',
      });
    }

    return ctx.db.category.findMany({
      include: {
        subcategories: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }),

  // Get category by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { slug: input.slug, isActive: true },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    }),

  // Create category (admin only)
  create: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { role: true },
      });

      if (user?.role.name !== 'admin') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin access required',
        });
      }

      // Check if slug already exists
      const existingCategory = await ctx.db.category.findUnique({
        where: { slug: input.slug },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A category with this slug already exists',
        });
      }

      return ctx.db.category.create({
        data: input,
      });
    }),

  // Update category (admin only)
  update: protectedProcedure
    .input(updateCategorySchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { role: true },
      });

      if (user?.role.name !== 'admin') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin access required',
        });
      }

      const { id, ...updateData } = input;

      // Check if slug already exists (if updating slug)
      if (input.slug) {
        const existingCategory = await ctx.db.category.findFirst({
          where: { 
            slug: input.slug,
            NOT: { id },
          },
        });

        if (existingCategory) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A category with this slug already exists',
          });
        }
      }

      return ctx.db.category.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete category (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin permissions
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { role: true },
      });

      if (user?.role.name !== 'admin') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Admin access required',
        });
      }

      // Check if category has products
      const categoryWithProducts = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: { _count: { select: { products: true } } },
      });

      if (categoryWithProducts?._count.products > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete category that has products. Move or delete products first.',
        });
      }

      return ctx.db.category.delete({
        where: { id: input.id },
      });
    }),

  // Subcategory operations
  subcategory: createTRPCRouter({
    // Create subcategory (admin only)
    create: protectedProcedure
      .input(createSubcategorySchema)
      .mutation(async ({ ctx, input }) => {
        // Check if user has admin permissions
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { role: true },
        });

        if (user?.role.name !== 'admin') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // Check if slug already exists
        const existingSubcategory = await ctx.db.subcategory.findUnique({
          where: { slug: input.slug },
        });

        if (existingSubcategory) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A subcategory with this slug already exists',
          });
        }

        return ctx.db.subcategory.create({
          data: input,
        });
      }),

    // Update subcategory (admin only)
    update: protectedProcedure
      .input(updateSubcategorySchema)
      .mutation(async ({ ctx, input }) => {
        // Check if user has admin permissions
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { role: true },
        });

        if (user?.role.name !== 'admin') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        const { id, ...updateData } = input;

        // Check if slug already exists (if updating slug)
        if (input.slug) {
          const existingSubcategory = await ctx.db.subcategory.findFirst({
            where: { 
              slug: input.slug,
              NOT: { id },
            },
          });

          if (existingSubcategory) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A subcategory with this slug already exists',
            });
          }
        }

        return ctx.db.subcategory.update({
          where: { id },
          data: updateData,
        });
      }),

    // Delete subcategory (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user has admin permissions
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { role: true },
        });

        if (user?.role.name !== 'admin') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // Check if subcategory has products
        const subcategoryWithProducts = await ctx.db.subcategory.findUnique({
          where: { id: input.id },
          include: { _count: { select: { products: true } } },
        });

        if (subcategoryWithProducts?._count.products > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete subcategory that has products. Move or delete products first.',
          });
        }

        return ctx.db.subcategory.delete({
          where: { id: input.id },
        });
      }),
  }),
});
