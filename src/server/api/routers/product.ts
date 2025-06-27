import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

// Define the locale schema
const localeSchema = z.enum(["en", "vi"]).default("en");

export const productRouter = createTRPCRouter({  // Get all products with optional filtering, pagination, and locale support
  getAll: publicProcedure
    .input(z.object({
      room: z.string().optional(),
      type: z.string().optional(),
      combo: z.string().optional(),
      featured: z.boolean().optional(),
      inStock: z.boolean().optional(),
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
      locale: localeSchema,
      page: z.number().default(1),
      limit: z.number().min(1).max(50).default(12),
      sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const {
        room,
        type,
        combo,
        featured,
        inStock,
        categoryId,
        subcategoryId,
        locale: requestedLocale = 'en',
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = input || {};

      const where: any = {};
      
      if (room) {
        where.room = room;
      }
      if (type) {
        where.type = type;
      }
      if (combo) {
        where.combo = combo;
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (subcategoryId) {
        where.subcategoryId = subcategoryId;
      }
      if (featured !== undefined) {
        where.featured = featured;
      }
      if (inStock !== undefined) {
        where.inStock = inStock;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build orderBy based on sortBy and locale
      let orderBy: any;
      if (sortBy === 'name') {
        orderBy = requestedLocale === 'vi' ? { nameVi: sortOrder } : { nameEn: sortOrder };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }

      // Get total count for pagination
      const totalCount = await ctx.db.product.count({ where });

      // Get products with pagination
      const products = await ctx.db.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      });      // Transform the data to include the correct language fields
      const transformedProducts = products.map(product => {
        const isVietnamese = requestedLocale === 'vi';
        
        // Create a properly typed product object
        const transformedProduct = {
          id: product.id,
          slug: product.slug,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          room: product.room,
          type: product.type,
          combo: product.combo,
          category: product.category,
          inStock: product.inStock,
          featured: product.featured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          // Add the localized content
          name: isVietnamese ? (product as any).nameVi : (product as any).nameEn,
          description: isVietnamese ? (product as any).descriptionVi : (product as any).descriptionEn,
          longDescription: isVietnamese ? (product as any).longDescriptionVi : (product as any).longDescriptionEn,
          specifications: isVietnamese ? (product as any).specificationsVi : (product as any).specificationsEn,
          features: isVietnamese ? (product as any).featuresVi : (product as any).featuresEn,
          metaTitle: isVietnamese ? (product as any).metaTitleVi : (product as any).metaTitleEn,
          metaDescription: isVietnamese ? (product as any).metaDescriptionVi : (product as any).metaDescriptionEn,
        };
        
        return transformedProduct;
      });

      // Return paginated response
      return {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
        },
      };
    }),
  // Get product by slug with locale support
  getBySlug: publicProcedure
    .input(z.object({ 
      slug: z.string(),
      locale: localeSchema,
    }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug },
      });

      if (!product) return null;      // Transform the data to include the correct language fields
      const locale = input.locale;
      const isVietnamese = locale === 'vi';
      
      // Create a properly typed product object
      const transformedProduct = {
        id: product.id,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        room: product.room,
        type: product.type,
        combo: product.combo,
        category: product.category,
        inStock: product.inStock,
        featured: product.featured,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Add the localized content
        name: isVietnamese ? (product as any).nameVi : (product as any).nameEn,
        description: isVietnamese ? (product as any).descriptionVi : (product as any).descriptionEn,
        longDescription: isVietnamese ? (product as any).longDescriptionVi : (product as any).longDescriptionEn,
        specifications: isVietnamese ? (product as any).specificationsVi : (product as any).specificationsEn,
        features: isVietnamese ? (product as any).featuresVi : (product as any).featuresEn,
        metaTitle: isVietnamese ? (product as any).metaTitleVi : (product as any).metaTitleEn,
        metaDescription: isVietnamese ? (product as any).metaDescriptionVi : (product as any).metaDescriptionEn,
      };
      
      return transformedProduct;
    }),

  // Get filter options with counts for better UX
  getFilterOptions: publicProcedure.query(async ({ ctx }) => {
    // Get room types with counts
    const roomCounts = await ctx.db.product.groupBy({
      by: ['room'],
      _count: { room: true },
      where: { inStock: true },
    });

    // Get furniture types with counts
    const typeCounts = await ctx.db.product.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { inStock: true },
    });

    // Get combo types with counts
    const comboCounts = await ctx.db.product.groupBy({
      by: ['combo'],
      _count: { combo: true },
      where: { 
        combo: { not: null },
        inStock: true 
      },
    });

    return {
      rooms: roomCounts.map(item => ({
        value: item.room,
        count: item._count.room,
      })),
      types: typeCounts.map(item => ({
        value: item.type,
        count: item._count.type,
      })),
      combos: comboCounts.map(item => ({
        value: item.combo!,
        count: item._count.combo,
      })),
    };
  }),

  // Get unique room types
  getRoomTypes: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      select: { room: true },
      distinct: ['room'],
    });
    return products.map(p => p.room);
  }),

  // Get unique furniture types
  getFurnitureTypes: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    return products.map(p => p.type);
  }),

  // Get unique combo types
  getComboTypes: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      select: { combo: true },
      distinct: ['combo'],
      where: {
        combo: {
          not: null,
        },
      },
    });
    return products.map(p => p.combo).filter(Boolean);
  }),

  // Create a new product (protected)
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      longDescription: z.string().optional(),
      price: z.number(),
      originalPrice: z.number().optional(),
      images: z.array(z.string()),
      room: z.string(),
      type: z.string(),
      combo: z.string().optional(),
      category: z.string(),
      inStock: z.boolean().default(true),
      featured: z.boolean().default(false),
      specifications: z.record(z.string(), z.string()).optional(),
      features: z.array(z.string()),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { specifications, ...productData } = input;
      return ctx.db.product.create({
        data: {
          ...productData,
          nameEn: input.name, // Map to English name
          nameVi: input.name, // Use same for Vietnamese (can be updated later)
          descriptionEn: input.description, // Map to English description
          descriptionVi: input.description, // Use same for Vietnamese
          specificationsEn: specifications || {},
          specificationsVi: specifications || {},
        },
      });
    }),

  // Update a product (protected)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      longDescription: z.string().optional(),
      price: z.number().optional(),
      originalPrice: z.number().optional(),
      images: z.array(z.string()).optional(),
      room: z.string().optional(),
      type: z.string().optional(),
      combo: z.string().optional(),
      category: z.string().optional(),
      inStock: z.boolean().optional(),
      featured: z.boolean().optional(),
      specifications: z.record(z.string(), z.string()).optional(),
      features: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.product.update({
        where: { id },
        data,
      });
    }),

  // Delete a product (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({
        where: { id: input.id },
      });
    }),

  // Get category counts for the main categories page
  getCategoryCounts: publicProcedure.query(async ({ ctx }) => {
    const categoryCounts = await ctx.db.product.groupBy({
      by: ['room'],
      _count: { room: true },
      where: { inStock: true },
    });

    return categoryCounts.map(item => ({
      room: item.room,
      count: item._count.room,
    }));
  }),
});
