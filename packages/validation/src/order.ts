import { z } from 'zod';

export const orderPriorityEnum = z.enum(['normal', 'high', 'urgent']);

export const uploadOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
});

export const parsedOrderLineSchema = z.object({
  productCode: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive().optional(),
  requestedETD: z.string().optional(),
  priority: orderPriorityEnum.optional(),
  note: z.string().max(500).optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  poNumber: z.string().max(100).optional(),
  orderDate: z.string().datetime(),
  requestedETD: z.string().datetime(),
  currency: z.string().length(3),
  paymentTermDays: z.number().int().positive().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        requestedETD: z.string().datetime().optional(),
        priority: orderPriorityEnum.default('normal'),
        note: z.string().max(500).optional(),
      }),
    )
    .min(1),
});

export const confirmOrderSchema = z.object({
  salesOrderId: z.string().uuid(),
});

export const reviseOrderSchema = z.object({
  changeDescription: z.string().min(1).max(1000),
  lines: z
    .array(
      z.object({
        lineId: z.string().uuid().optional(),
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        requestedETD: z.string().datetime().optional(),
        priority: orderPriorityEnum.default('normal'),
        note: z.string().max(500).optional(),
      }),
    )
    .min(1),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type ReviseOrderInput = z.infer<typeof reviseOrderSchema>;
