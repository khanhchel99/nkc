import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

// Define the locale schema
const localeSchema = z.enum(["en", "vi"]).default("en");

export const productRouter = createTRPCRouter({  // Get all products with optional filtering and locale support
  getAll: publicProcedure
    .input(z.object({
      room: z.string().optional(),
      type: z.string().optional(),
      combo: z.string().optional(),
      featured: z.boolean().optional(),
      inStock: z.boolean().optional(),
      locale: localeSchema,
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {};
      
      if (input?.room) {
        where.room = input.room;
      }
      if (input?.type) {
        where.type = input.type;
      }
      if (input?.combo) {
        where.combo = input.combo;
      }
      if (input?.featured !== undefined) {
        where.featured = input.featured;
      }
      if (input?.inStock !== undefined) {
        where.inStock = input.inStock;
      }

      const products = await ctx.db.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });      // Transform the data to include the correct language fields
      const locale = input?.locale || 'en';
      return products.map(product => {
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
      });
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
      return ctx.db.product.create({
        data: {
          ...input,
          specifications: input.specifications || {},
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
});
