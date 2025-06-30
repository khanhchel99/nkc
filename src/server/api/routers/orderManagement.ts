import { z } from "zod";
import { createTRPCRouter, adminProcedure, adminOrWholesaleQAProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

// Helper function to get status colors
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'yellow';
    case 'confirmed':
      return 'blue';
    case 'in_production':
      return 'purple';
    case 'quality_check':
      return 'orange';
    case 'shipped':
      return 'cyan';
    case 'delivered':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

// Helper function to update order inspection status
async function updateOrderInspectionStatus(db: any, orderId: string) {
  // Note: Inspection status is tracked at the item level via ProductInspection
  // This function can be used for additional order-level logic if needed
  
  const orderItems = await db.wholesaleOrderItem.findMany({
    where: { orderId },
    include: {
      inspection: {
        include: {
          photos: true,
        },
      },
    },
  });

  // Calculate overall order status for potential future use
  let allItemsReviewed = true;
  let anyItemRejected = false;

  for (const item of orderItems) {
    if (!item.inspection || !item.inspection.photos.length) {
      allItemsReviewed = false;
      continue;
    }

    const allPhotosReviewed = item.inspection.photos.every(
      (photo: any) => photo.reviewStatus === 'approved' || photo.reviewStatus === 'rejected'
    );
    
    if (!allPhotosReviewed) {
      allItemsReviewed = false;
    }

    const anyPhotoRejected = item.inspection.photos.some(
      (photo: any) => photo.reviewStatus === 'rejected'
    );
    
    if (anyPhotoRejected) {
      anyItemRejected = true;
    }
  }

  // For now, we don't update any order-level inspection status
  // since it's not in the schema. If needed in the future, 
  // add inspectionStatus field to WholesaleOrder model
  
  return {
    allItemsReviewed,
    anyItemRejected,
    status: allItemsReviewed ? (anyItemRejected ? 'partial_rejection' : 'approved') : 'pending_review'
  };
}

// Order validation schemas
const orderFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  userId: z.string().optional(),
  minTotal: z.number().optional(),
  maxTotal: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const updateOrderStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
});

const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(z.string()),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
});

export const orderManagementRouter = createTRPCRouter({
  // Get all orders with filtering and pagination
  getOrders: adminProcedure
    .input(orderFiltersSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        status,
        userId,
        minTotal,
        maxTotal,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit,
      } = input;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.OrderWhereInput = {};

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { user: { 
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }},
        ];
      }

      if (status) where.status = status;
      if (userId) where.userId = userId;

      if (minTotal !== undefined || maxTotal !== undefined) {
        where.total = {};
        if (minTotal !== undefined) where.total.gte = minTotal;
        if (maxTotal !== undefined) where.total.lte = maxTotal;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get total count
      const total = await ctx.db.order.count({ where });

      // Get orders
      const orders = await ctx.db.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameVi: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single order by ID
  getOrder: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: {
                select: {
                  name: true,
                },
              },
              businessProfile: {
                select: {
                  companyName: true,
                  taxId: true,
                  verified: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameVi: true,
                  slug: true,
                  images: true,
                  price: true,
                  wholesalePrice: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      return order;
    }),

  // Update order status
  updateOrderStatus: adminProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, notes } = input;

      // Check if order exists
      const existingOrder = await ctx.db.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Update order
      const updatedOrder = await ctx.db.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Log the status change
      if (ctx.session?.user?.id) {
        await ctx.db.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: 'order_status_update',
            details: {
              orderId: id,
              oldStatus: existingOrder.status,
              newStatus: status,
              notes: notes || null,
            },
          },
        });
      }

      return updatedOrder;
    }),

  // Bulk update orders
  bulkUpdateOrders: adminProcedure
    .input(bulkOrderUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { orderIds, status } = input;

      if (status) {
        await ctx.db.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            status,
            updatedAt: new Date(),
          },
        });

        // Log bulk update
        if (ctx.session?.user?.id) {
          await ctx.db.auditLog.create({
            data: {
              userId: ctx.session.user.id,
              action: 'bulk_order_update',
              details: {
                orderIds,
                status,
                count: orderIds.length,
              },
            },
          });
        }
      }

      return { success: true, updatedCount: orderIds.length };
    }),

  // Get order statistics
  getOrderStats: adminProcedure
    .query(async ({ ctx }) => {
      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
      ] = await Promise.all([
        ctx.db.order.count(),
        ctx.db.order.count({ where: { status: 'pending' } }),
        ctx.db.order.count({ where: { status: 'confirmed' } }),
        ctx.db.order.count({ where: { status: 'shipped' } }),
        ctx.db.order.count({ where: { status: 'delivered' } }),
        ctx.db.order.count({ where: { status: 'cancelled' } }),
      ]);

      // Get revenue statistics
      const revenueStats = await ctx.db.order.aggregate({
        _sum: { total: true },
        _avg: { total: true },
        where: { status: { not: 'cancelled' } },
      });

      // Get recent order trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentOrders = await ctx.db.order.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      // Get top customers by order count
      const topCustomers = await ctx.db.order.groupBy({
        by: ['userId'],
        _count: { _all: true },
        _sum: { total: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      });

      // Get orders by status for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyOrdersByStatus = await ctx.db.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      });

      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: revenueStats._sum.total || 0,
        averageOrderValue: revenueStats._avg.total || 0,
        recentOrders,
        topCustomers,
        weeklyOrdersByStatus,
      };
    }),

  // Get filter options for dropdowns
  getFilterOptions: adminProcedure
    .query(async ({ ctx }) => {
      const [customers] = await Promise.all([
        ctx.db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
          },
          where: {
            orders: {
              some: {},
            },
          },
          orderBy: { name: 'asc' },
        }),
      ]);

      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

      return {
        customers,
        statuses,
      };
    }),

  // Delete order (admin only, with restrictions)
  deleteOrder: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if order exists
      const existingOrder = await ctx.db.order.findUnique({
        where: { id: input.id },
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Only allow deletion of pending or cancelled orders
      if (!['pending', 'cancelled'].includes(existingOrder.status)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete orders that are confirmed, shipped, or delivered',
        });
      }

      // Delete order (cascade will handle order items)
      await ctx.db.order.delete({
        where: { id: input.id },
      });

      // Log the deletion
      if (ctx.session?.user?.id) {
        await ctx.db.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: 'order_deletion',
            details: {
              orderId: input.id,
              orderStatus: existingOrder.status,
              orderTotal: existingOrder.total,
            },
          },
        });
      }

      return { success: true };
    }),

  // Export orders to CSV
  exportOrders: adminProcedure
    .input(z.object({
      format: z.enum(['csv', 'json']).default('csv'),
      filters: z.object({
        search: z.string().optional(),
        status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
        userId: z.string().optional(),
        minTotal: z.number().optional(),
        maxTotal: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.filters) {
        const { search, status, userId, minTotal, maxTotal, startDate, endDate } = input.filters;

        if (search) {
          where.OR = [
            { id: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ];
        }

        if (status) where.status = status;
        if (userId) where.userId = userId;
        if (minTotal || maxTotal) {
          where.total = {};
          if (minTotal) where.total.gte = minTotal;
          if (maxTotal) where.total.lte = maxTotal;
        }
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = startDate;
          if (endDate) where.createdAt.lte = endDate;
        }
      }

      const orders = await ctx.db.order.findMany({
        where,
        include: {
          user: {
            include: { role: true }
          },
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const exportData = orders.map(order => ({
        id: order.id,
        customerName: order.user.name || 'N/A',
        customerEmail: order.user.email || 'N/A',
        customerPhone: order.user.phone || 'N/A',
        status: order.status,
        total: Number(order.total),
        itemCount: order.items.length,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map(item => ({
          productName: item.product.nameEn,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      }));

      return {
        data: exportData,
        format: input.format,
        timestamp: new Date().toISOString(),
        totalRecords: exportData.length
      };
    }),

  // Advanced analytics
  getAdvancedAnalytics: adminProcedure
    .input(z.object({
      period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      includeComparison: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const periods = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
      };

      const periodMs = periods[input.period];
      const startDate = new Date(now.getTime() - periodMs);
      const previousStartDate = new Date(startDate.getTime() - periodMs);

      // Current period analytics
      const currentOrders = await ctx.db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Previous period for comparison
      const previousOrders = input.includeComparison 
        ? await ctx.db.order.findMany({
            where: {
              createdAt: {
                gte: previousStartDate,
                lt: startDate,
              },
            },
          })
        : [];

      // Calculate metrics
      const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
      
      const currentOrderCount = currentOrders.length;
      const previousOrderCount = previousOrders.length;

      const avgOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
      const previousAvgOrderValue = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

      // Status breakdown
      const statusBreakdown = currentOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top selling products
      const productSales = currentOrders.flatMap(order => order.items).reduce((acc, item) => {
        const key = item.product.nameEn;
        acc[key] = (acc[key] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));

      // Daily revenue trend
      const dailyRevenue = currentOrders.reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (date) {
          acc[date] = (acc[date] || 0) + Number(order.total);
        }
        return acc;
      }, {} as Record<string, number>);

      const revenueTrend = Object.entries(dailyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }));

      return {
        period: input.period,
        currentPeriod: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          revenue: currentRevenue,
          orderCount: currentOrderCount,
          avgOrderValue,
          statusBreakdown,
          topProducts,
          revenueTrend,
        },
        comparison: input.includeComparison ? {
          revenue: {
            current: currentRevenue,
            previous: previousRevenue,
            change: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
          },
          orderCount: {
            current: currentOrderCount,
            previous: previousOrderCount,
            change: previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0,
          },
          avgOrderValue: {
            current: avgOrderValue,
            previous: previousAvgOrderValue,
            change: previousAvgOrderValue > 0 ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : 0,
          },
        } : null,
      };
    }),

  // Get order activity timeline
  getOrderTimeline: adminProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Create timeline events
      const timeline = [
        {
          id: 1,
          type: 'created',
          title: 'Order Created',
          description: `Order placed by ${order.user.name || order.user.email}`,
          timestamp: order.createdAt,
          icon: 'plus',
          color: 'blue',
        },
      ];

      // Add status change events (simulated - in real app you'd have audit log)
      if (order.status !== 'pending') {
        timeline.push({
          id: 2,
          type: 'status_change',
          title: 'Status Updated',
          description: `Order status changed to ${order.status}`,
          timestamp: order.updatedAt,
          icon: 'refresh',
          color: 'green',
        });
      }

      // Sort by timestamp
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        order,
        timeline,
      };
    }),

  // Wholesale Orders Management
  // Get all wholesale orders for admin view
  getWholesaleOrders: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      companyId: z.string().optional(),
      minTotal: z.number().optional(),
      maxTotal: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount', 'status']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const {
        search,
        status,
        companyId,
        minTotal,
        maxTotal,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit,
      } = input;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { company: { name: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (companyId) {
        where.companyId = companyId;
      }

      if (minTotal !== undefined || maxTotal !== undefined) {
        where.totalAmount = {};
        if (minTotal !== undefined) where.totalAmount.gte = minTotal;
        if (maxTotal !== undefined) where.totalAmount.lte = maxTotal;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get total count
      const total = await ctx.db.wholesaleOrder.count({ where });

      // Get orders
      const orders = await ctx.db.wholesaleOrder.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              code: true,
              contactEmail: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
              statusHistory: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          priority: order.priority,
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
          itemCount: order._count.items,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          estimatedDelivery: order.estimatedDelivery,
          actualDelivery: order.actualDelivery,
          company: order.company,
          user: order.user,
          notes: order.notes,
          statusHistoryCount: order._count.statusHistory,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get wholesale order details
  getWholesaleOrderDetails: adminOrWholesaleQAProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.wholesaleOrder.findUnique({
        where: { id: input.id },
        include: {
          company: true,
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          financialRecords: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wholesale order not found',
        });
      }

      // Build timeline
      const timeline = [];

      // Add order creation
      timeline.push({
        id: 'created',
        title: 'Order Created',
        description: `Order ${order.orderNumber} was created`,
        timestamp: order.createdAt,
        icon: 'plus',
        color: 'blue',
      });

      // Add status history
      order.statusHistory.forEach(history => {
        timeline.push({
          id: `status-${history.id}`,
          title: `Status Updated`,
          description: `Status changed to ${history.status}${history.notes ? `: ${history.notes}` : ''}`,
          timestamp: history.createdAt,
          icon: 'refresh',
          color: getStatusColor(history.status),
        });
      });

      // Add financial records
      order.financialRecords.forEach(record => {
        timeline.push({
          id: `finance-${record.id}`,
          title: record.type === 'credit' ? 'Payment Received' : 'Invoice Created',
          description: record.description || `${record.type} of ${record.amount}`,
          timestamp: record.createdAt,
          icon: 'currency-dollar',
          color: record.type === 'credit' ? 'green' : 'orange',
        });
      });

      // Sort by timestamp
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        order: {
          ...order,
          totalAmount: Number(order.totalAmount),
          items: order.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          financialRecords: order.financialRecords.map(record => ({
            ...record,
            amount: Number(record.amount),
          })),
        },
        timeline,
      };
    }),

  // Update wholesale order status
  updateWholesaleOrderStatus: adminProcedure
    .input(z.object({
      id: z.string(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, status, notes } = input;

      // Update the order
      const updatedOrder = await ctx.db.wholesaleOrder.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date(),
        },
      });

      // Add to status history
      await ctx.db.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          notes,
          changedBy: ctx.session.user.id,
        },
      });

      return updatedOrder;
    }),

  // Get combined order statistics (both regular and wholesale)
  getCombinedOrderStats: adminProcedure
    .query(async ({ ctx }) => {
      // Regular orders stats
      const regularOrderStats = await ctx.db.order.aggregate({
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true },
      });

      const regularPendingCount = await ctx.db.order.count({
        where: { status: 'pending' },
      });

      // Wholesale orders stats
      const wholesaleOrderStats = await ctx.db.wholesaleOrder.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      });

      const wholesalePendingCount = await ctx.db.wholesaleOrder.count({
        where: { status: 'pending' },
      });

      return {
        regular: {
          total: regularOrderStats._count.id || 0,
          pending: regularPendingCount,
          totalValue: regularOrderStats._sum.total ? Number(regularOrderStats._sum.total) : 0,
          avgValue: regularOrderStats._avg.total ? Number(regularOrderStats._avg.total) : 0,
        },
        wholesale: {
          total: wholesaleOrderStats._count.id || 0,
          pending: wholesalePendingCount,
          totalValue: wholesaleOrderStats._sum.totalAmount ? Number(wholesaleOrderStats._sum.totalAmount) : 0,
          avgValue: wholesaleOrderStats._avg.totalAmount ? Number(wholesaleOrderStats._avg.totalAmount) : 0,
        },
        combined: {
          total: (regularOrderStats._count.id || 0) + (wholesaleOrderStats._count.id || 0),
          pending: regularPendingCount + wholesalePendingCount,
          totalValue: (regularOrderStats._sum.total ? Number(regularOrderStats._sum.total) : 0) + 
                     (wholesaleOrderStats._sum.totalAmount ? Number(wholesaleOrderStats._sum.totalAmount) : 0),
        },
      };
    }),

  // Get shipping information for a wholesale order
  getShippingInfo: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const shippingInfo = await ctx.db.shippingInfo.findUnique({
        where: { orderId: input.orderId },
      });
      return shippingInfo;
    }),

  // Update shipping information for a wholesale order
  updateShippingInfo: adminProcedure
    .input(z.object({
      orderId: z.string(),
      vesselName: z.string().optional(),
      vesselIMO: z.string().optional(),
      portOfLoading: z.string().optional(),
      portOfDischarge: z.string().optional(),
      etd: z.date().optional(),
      eta: z.date().optional(),
      actualDeparture: z.date().optional(),
      actualArrival: z.date().optional(),
      containerNumber: z.string().optional(),
      sealNumber: z.string().optional(),
      billOfLading: z.string().optional(),
      trackingUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orderId, ...data } = input;
      
      const shippingInfo = await ctx.db.shippingInfo.upsert({
        where: { orderId },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          orderId,
          ...data,
        },
      });
      
      return shippingInfo;
    }),

  // Get inspection details for an order item
  getInspectionDetails: adminOrWholesaleQAProcedure
    .input(z.object({ orderItemId: z.number() }))
    .query(async ({ ctx, input }) => {
      const inspection = await ctx.db.productInspection.findUnique({
        where: { orderItemId: input.orderItemId },
        include: {
          photos: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
      return inspection;
    }),

  // Create or update inspection
  updateInspection: adminProcedure
    .input(z.object({
      orderItemId: z.number(),
      status: z.string(),
      inspectedBy: z.string().optional(),
      notes: z.string().optional(),
      approved: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, ...data } = input;
      
      const inspection = await ctx.db.productInspection.upsert({
        where: { orderItemId },
        update: {
          ...data,
          inspectedAt: data.status === 'completed' ? new Date() : undefined,
          updatedAt: new Date(),
        },
        create: {
          orderItemId,
          ...data,
          inspectedAt: data.status === 'completed' ? new Date() : undefined,
        },
      });
      
      return inspection;
    }),

  // Add inspection photo
  addInspectionPhoto: adminProcedure
    .input(z.object({
      orderItemId: z.number(),
      category: z.string(),
      imageUrl: z.string(),
      caption: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, ...photoData } = input;
      
      // First ensure inspection exists
      const inspection = await ctx.db.productInspection.upsert({
        where: { orderItemId },
        update: {},
        create: {
          orderItemId,
          status: 'in_progress',
        },
      });
      
      const photo = await ctx.db.inspectionPhoto.create({
        data: {
          ...photoData,
          inspectionId: inspection.id,
          sortOrder: photoData.sortOrder || 0,
        },
      });
      
      return photo;
    }),

  // Delete inspection photo
  deleteInspectionPhoto: adminProcedure
    .input(z.object({ photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.inspectionPhoto.delete({
        where: { id: input.photoId },
      });
      return { success: true };
    }),

  // Submit photo review (for wholesale QA users)
  submitPhotoReview: adminOrWholesaleQAProcedure
    .input(z.object({
      orderItemId: z.number(),
      photoReviews: z.array(z.object({
        photoId: z.string(),
        status: z.enum(['approved', 'rejected']),
        rejectionReason: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orderItemId, photoReviews } = input;
      
      // Update each photo's review status
      await Promise.all(
        photoReviews.map(review => 
          ctx.db.inspectionPhoto.update({
            where: { id: review.photoId },
            data: {
              reviewStatus: review.status,
              reviewedBy: ctx.session.user.id,
              reviewedAt: new Date(),
              rejectionReason: review.status === 'rejected' ? review.rejectionReason : null,
            },
          })
        )
      );

      // Calculate overall item status
      const allPhotos = await ctx.db.inspectionPhoto.findMany({
        where: { 
          inspection: { 
            orderItemId 
          } 
        },
      });

      const allReviewed = allPhotos.every(photo => 
        photo.reviewStatus === 'approved' || photo.reviewStatus === 'rejected'
      );
      
      const anyRejected = allPhotos.some(photo => photo.reviewStatus === 'rejected');
      
      let customerStatus = 'pending_review';
      if (allReviewed) {
        customerStatus = anyRejected ? 'rejected' : 'approved';
      }

      // Update inspection status
      await ctx.db.productInspection.upsert({
        where: { orderItemId },
        update: {
          customerStatus,
          customerReviewedBy: ctx.session.user.id,
          customerReviewedAt: allReviewed ? new Date() : undefined,
        },
        create: {
          orderItemId,
          customerStatus,
          customerReviewedBy: ctx.session.user.id,
          customerReviewedAt: allReviewed ? new Date() : undefined,
        },
      });

      // Update overall order inspection status
      const orderItem = await ctx.db.wholesaleOrderItem.findUnique({
        where: { id: orderItemId },
        select: { orderId: true },
      });

      if (orderItem) {
        await updateOrderInspectionStatus(ctx.db, orderItem.orderId);
      }

      return { 
        success: true, 
        itemStatus: customerStatus,
        allReviewed,
        anyRejected 
      };
    }),

  // Get orders pending inspection review (for wholesale dashboard)
  getOrdersPendingReview: adminOrWholesaleQAProcedure
    .input(z.object({
      companyId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // If wholesale user, filter by their company
      let companyFilter = {};
      if (ctx.session.user.userType === 'wholesale' && ctx.session.user.companyId) {
        companyFilter = { companyId: ctx.session.user.companyId };
      } else if (input.companyId) {
        companyFilter = { companyId: input.companyId };
      }

      const orders = await ctx.db.wholesaleOrder.findMany({
        where: {
          ...companyFilter,
          items: {
            some: {
              inspection: {
                photos: {
                  some: {
                    reviewStatus: 'pending_review',
                  },
                },
              },
            },
          },
        },
        include: {
          company: true,
          items: {
            include: {
              product: true,
              inspection: {
                include: {
                  photos: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return orders.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          pendingPhotos: item.inspection?.photos?.filter(p => p.reviewStatus === 'pending_review').length || 0,
          totalPhotos: item.inspection?.photos?.length || 0,
        })),
      }));
    }),

  // Update order status to shipped and cleanup photos
  markOrderAsShipped: adminOrWholesaleQAProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;

      // Check if all inspection photos are approved
      const orderWithInspections = await ctx.db.wholesaleOrder.findFirst({
        where: { id: orderId },
        include: {
          items: {
            include: {
              inspection: {
                include: {
                  photos: true
                }
              }
            }
          }
        }
      });

      if (!orderWithInspections) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Check if all photos are approved
      const allPhotos = orderWithInspections.items.flatMap(item => 
        item.inspection?.photos || []
      );

      const pendingPhotos = allPhotos.filter(photo => 
        photo.reviewStatus === 'pending_review'
      );

      if (pendingPhotos.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot ship order: ${pendingPhotos.length} photos still pending review`,
        });
      }

      const rejectedPhotos = allPhotos.filter(photo => 
        photo.reviewStatus === 'rejected'
      );

      if (rejectedPhotos.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot ship order: ${rejectedPhotos.length} photos are rejected and need re-inspection`,
        });
      }

      // Update order status to shipped
      const updatedOrder = await ctx.db.wholesaleOrder.update({
        where: { id: orderId },
        data: { 
          status: 'shipped',
          actualDelivery: new Date()
        }
      });

      // Return order details for cleanup (will be handled on client side)
      return {
        ...updatedOrder,
        totalAmount: Number(updatedOrder.totalAmount),
        photosToDelete: allPhotos.map(photo => photo.imageUrl)
      };
    }),

  // Check if order can be shipped (all photos approved)
  checkOrderReadyToShip: adminOrWholesaleQAProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const orderWithInspections = await ctx.db.wholesaleOrder.findFirst({
        where: { id: input.orderId },
        include: {
          items: {
            include: {
              inspection: {
                include: {
                  photos: true
                }
              }
            }
          }
        }
      });

      if (!orderWithInspections) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      const allPhotos = orderWithInspections.items.flatMap(item => 
        item.inspection?.photos || []
      );

      const pendingCount = allPhotos.filter(photo => 
        photo.reviewStatus === 'pending_review'
      ).length;

      const rejectedCount = allPhotos.filter(photo => 
        photo.reviewStatus === 'rejected'
      ).length;

      const approvedCount = allPhotos.filter(photo => 
        photo.reviewStatus === 'approved'
      ).length;

      return {
        canShip: pendingCount === 0 && rejectedCount === 0 && allPhotos.length > 0,
        totalPhotos: allPhotos.length,
        approvedPhotos: approvedCount,
        pendingPhotos: pendingCount,
        rejectedPhotos: rejectedCount,
        currentStatus: orderWithInspections.status
      };
    }),

});
