import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

// Product validation schemas
const createProductSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameVi: z.string().min(1, "Vietnamese name is required"),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionVi: z.string().min(1, "Vietnamese description is required"),
  price: z.number().min(0, "Price must be positive"),
  wholesalePrice: z.number().min(0, "Wholesale price must be positive").optional(),
  originalPrice: z.number().min(0, "Original price must be positive").optional(),
  stock: z.number().min(0, "Stock must be non-negative").default(0),
  images: z.array(z.string()).min(1, "At least one image is required"),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  room: z.string(),
  type: z.string(),
  category: z.string(),
  combo: z.string().optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  featuresEn: z.array(z.string()).default([]),
  featuresVi: z.array(z.string()).default([]),
  longDescriptionEn: z.string().optional(),
  longDescriptionVi: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  metaTitleEn: z.string().optional(),
  metaTitleVi: z.string().optional(),
  specificationsEn: z.record(z.any()).optional(),
  specificationsVi: z.record(z.any()).optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string(),
});

const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  room: z.string().optional(),
  type: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(['nameEn', 'nameVi', 'price', 'createdAt', 'updatedAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const productManagementRouter = createTRPCRouter({
  // Get all products with filtering and pagination
  getProducts: adminProcedure
    .input(productFiltersSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        categoryId,
        subcategoryId,
        room,
        type,
        inStock,
        featured,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        page,
        limit,
      } = input;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProductWhereInput = {};

      if (search) {
        where.OR = [
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameVi: { contains: search, mode: 'insensitive' } },
          { descriptionEn: { contains: search, mode: 'insensitive' } },
          { descriptionVi: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) where.categoryId = categoryId;
      if (subcategoryId) where.subcategoryId = subcategoryId;
      if (room) where.room = room;
      if (type) where.type = type;
      if (inStock !== undefined) where.inStock = inStock;
      if (featured !== undefined) where.featured = featured;

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      // Get total count
      const total = await ctx.db.product.count({ where });

      // Get products
      const products = await ctx.db.product.findMany({
        where,
        include: {
          categoryRef: true,
          subcategoryRef: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single product by ID
  getProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          categoryRef: true,
          subcategoryRef: true,
        },
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      return product;
    }),

  // Create new product
  createProduct: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existingProduct = await ctx.db.product.findUnique({
        where: { slug: input.slug },
      });

      if (existingProduct) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Product with this slug already exists',
        });
      }

      const product = await ctx.db.product.create({
        data: input,
        include: {
          categoryRef: true,
          subcategoryRef: true,
        },
      });

      return product;
    }),

  // Update product
  updateProduct: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if product exists
      const existingProduct = await ctx.db.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Check if slug conflicts with another product
      if (updateData.slug && updateData.slug !== existingProduct.slug) {
        const slugConflict = await ctx.db.product.findUnique({
          where: { slug: updateData.slug },
        });

        if (slugConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Product with this slug already exists',
          });
        }
      }

      const product = await ctx.db.product.update({
        where: { id },
        data: updateData,
        include: {
          categoryRef: true,
          subcategoryRef: true,
        },
      });

      return product;
    }),

  // Delete product
  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if product exists
      const existingProduct = await ctx.db.product.findUnique({
        where: { id: input.id },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Check if product is referenced in orders, cart items, or inquiry items
      const [orderItems, cartItems, inquiryItems] = await Promise.all([
        ctx.db.orderItem.count({ where: { productId: input.id } }),
        ctx.db.cartItem.count({ where: { productId: input.id } }),
        ctx.db.inquiryListItem.count({ where: { productId: input.id } }),
      ]);

      if (orderItems > 0 || cartItems > 0 || inquiryItems > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete product that is referenced in orders, carts, or inquiries',
        });
      }

      await ctx.db.product.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Bulk operations
  bulkUpdateProducts: adminProcedure
    .input(z.object({
      productIds: z.array(z.string()),
      updates: z.object({
        inStock: z.boolean().optional(),
        featured: z.boolean().optional(),
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
        room: z.string().optional(),
        type: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { productIds, updates } = input;

      await ctx.db.product.updateMany({
        where: { id: { in: productIds } },
        data: updates,
      });

      return { success: true, updatedCount: productIds.length };
    }),

  // Get product statistics
  getProductStats: adminProcedure
    .query(async ({ ctx }) => {
      const [
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        featuredProducts,
        lowStockProducts,
      ] = await Promise.all([
        ctx.db.product.count(),
        ctx.db.product.count({ where: { inStock: true } }),
        ctx.db.product.count({ where: { inStock: false } }),
        ctx.db.product.count({ where: { featured: true } }),
        ctx.db.product.count({ where: { stock: { lte: 10 } } }),
      ]);

      // Get products by category
      const categoryCounts = await ctx.db.product.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
        where: { categoryId: { not: null } },
      });

      // Get top selling products (based on order items)
      const topProducts = await ctx.db.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      });

      return {
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        featuredProducts,
        lowStockProducts,
        categoryCounts,
        topProducts,
      };
    }),

  // Get filter options for dropdowns
  getFilterOptions: adminProcedure
    .query(async ({ ctx }) => {
      const [categories, subcategories, rooms, types] = await Promise.all([
        ctx.db.category.findMany({
          where: { isActive: true },
          orderBy: { nameEn: 'asc' },
        }),
        ctx.db.subcategory.findMany({
          where: { isActive: true },
          include: { category: true },
          orderBy: { nameEn: 'asc' },
        }),
        ctx.db.product.findMany({
          select: { room: true },
          distinct: ['room'],
          orderBy: { room: 'asc' },
        }),
        ctx.db.product.findMany({
          select: { type: true },
          distinct: ['type'],
          orderBy: { type: 'asc' },
        }),
      ]);

      return {
        categories,
        subcategories,
        rooms: rooms.map((r: { room: string }) => r.room),
        types: types.map((t: { type: string }) => t.type),
      };
    }),
});
