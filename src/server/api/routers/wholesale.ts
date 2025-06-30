import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Helper function to verify wholesale user from session
const requireWholesaleUser = (user: any) => {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  
  if (user.userType !== 'wholesale') {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Wholesale access required",
    });
  }
  
  return user;
};

export const wholesaleRouter = createTRPCRouter({
  // Get dashboard data for wholesale users
  getDashboardData: protectedProcedure
    .query(async ({ ctx }) => {
      const user = requireWholesaleUser(ctx.session?.user);
      
      // Get real statistics from database
      const totalOrders = await ctx.db.wholesaleOrder.count({
        where: { companyId: user.companyId },
      });
      
      const pendingOrders = await ctx.db.wholesaleOrder.count({
        where: { 
          companyId: user.companyId,
          status: 'pending',
        },
      });
      
      // Get total value of all orders
      const orderValues = await ctx.db.wholesaleOrder.aggregate({
        where: { companyId: user.companyId },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      });
      
      // Get recent orders
      const recentOrders = await ctx.db.wholesaleOrder.findMany({
        where: { companyId: user.companyId },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      
      return {
        stats: {
          totalOrders,
          pendingOrders,
          totalValue: orderValues._sum.totalAmount ? Number(orderValues._sum.totalAmount) : 0,
          avgOrderValue: orderValues._avg.totalAmount ? Number(orderValues._avg.totalAmount) : 0,
        },
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          date: order.createdAt.toISOString().split('T')[0],
          status: order.status,
          value: Number(order.totalAmount),
          totalAmount: Number(order.totalAmount),
          items: order.items.length,
        })),
        notifications: [
          {
            id: "1",
            type: "order",
            message: "System notifications will be implemented here",
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }),

  // Get private products for the wholesale user's company
  getPrivateProducts: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      const user = requireWholesaleUser(ctx.session?.user);
      
      // Get total count for pagination
      const total = await ctx.db.privateProduct.count({
        where: {
          companyId: user.companyId,
        },
      });
      
      // Get products with pagination
      const products = await ctx.db.privateProduct.findMany({
        where: {
          companyId: user.companyId,
        },
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });
      
      return {
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description || '',
          price: product.basePrice ? Number(product.basePrice) : 0,
          category: product.category || 'Uncategorized',
          stock: product.status === 'active' ? 999 : 0, // Simplified stock logic
          images: product.images || [],
          wholesalePrice: product.basePrice ? Number(product.basePrice) : 0, // Private products are already wholesale prices
          specifications: product.specifications,
          status: product.status,
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get orders for the wholesale user's company
  getOrders: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      status: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const user = requireWholesaleUser(ctx.session?.user);
      
      // Build where clause for filtering
      const where: any = {
        companyId: user.companyId,
      };
      
      if (input.status) {
        where.status = input.status;
      }
      
      // Get total count for pagination
      const total = await ctx.db.wholesaleOrder.count({ where });
      
      // Get orders with pagination
      const orders = await ctx.db.wholesaleOrder.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          company: true,
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });
      
      return {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.createdAt.toISOString(),
          status: order.status,
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
          priority: order.priority,
          estimatedDelivery: order.estimatedDelivery?.toISOString(),
          actualDelivery: order.actualDelivery?.toISOString(),
          notes: order.notes,
          items: order.items.map(item => ({
            id: item.id.toString(),
            productName: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            specifications: item.specifications,
            notes: item.notes,
          })),
          shippingAddress: {
            company: order.company.name,
            street: order.company.address,
            city: order.company.address, // You might want to split this into separate fields
            country: "Denmark", // Default for now
            postalCode: "", // You might want to add this to company model
          },
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get financial records for the wholesale user's company
  getFinancialRecords: protectedProcedure
    .query(async ({ ctx }) => {
      const user = requireWholesaleUser(ctx.session?.user);
      
      // Get financial records from database
      const financialRecords = await ctx.db.financialRecord.findMany({
        where: { companyId: user.companyId },
        include: {
          order: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      
      // Calculate summary
      const totalPurchases = await ctx.db.financialRecord.aggregate({
        where: { 
          companyId: user.companyId,
          type: 'debit',
        },
        _sum: { amount: true },
      });
      
      const totalPayments = await ctx.db.financialRecord.aggregate({
        where: { 
          companyId: user.companyId,
          type: 'credit',
        },
        _sum: { amount: true },
      });
      
      const totalPurchaseAmount = totalPurchases._sum.amount ? Number(totalPurchases._sum.amount) : 0;
      const totalPaymentAmount = totalPayments._sum.amount ? Number(totalPayments._sum.amount) : 0;
      const outstandingBalance = totalPurchaseAmount - totalPaymentAmount;
      
      return {
        summary: {
          totalPurchases: totalPurchaseAmount,
          outstandingBalance: Math.max(0, outstandingBalance),
          creditLimit: 100000.00, // This could be stored in company settings
          availableCredit: Math.max(0, 100000.00 - outstandingBalance),
        },
        recentTransactions: financialRecords.map(record => ({
          id: record.id,
          date: record.createdAt.toISOString().split('T')[0],
          type: record.type === 'debit' ? 'purchase' : 'payment',
          description: record.description || (record.order ? `Order ${record.order.orderNumber}` : 'Transaction'),
          amount: record.type === 'debit' ? -Number(record.amount) : Number(record.amount),
          balance: 0, // Would need to calculate running balance
        })),
      };
    }),
});