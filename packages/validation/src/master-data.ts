import { z } from 'zod';

export const createProductSchema = z.object({
  productCode: z.string().min(1).max(50),
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  mainMaterial: z.string().min(1).max(100),
  weightNet: z.number().positive().optional(),
  weightGross: z.number().positive().optional(),
  cbm: z.number().positive().optional(),
});

export const createProductVersionSchema = z.object({
  versionNo: z.string().min(1).max(20),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const componentTypeEnum = z.enum(['panel', 'frame', 'hardware', 'packaging', 'assembly']);
export const materialTypeEnum = z.enum(['veneer', 'oak', 'mdf', 'metal', 'accessory', 'other']);

export const createComponentSchema = z.object({
  componentCode: z.string().min(1).max(50),
  componentName: z.string().min(1).max(200),
  componentType: componentTypeEnum,
  materialType: materialTypeEnum,
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  thickness: z.number().positive().optional(),
  specText: z.string().max(500).optional(),
  qtyPerProduct: z.number().int().positive(),
  edgeBandingRule: z.string().max(200).optional(),
  productionNote: z.string().max(500).optional(),
});

export const createBOMItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().min(1).max(20),
  wastePercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0),
});

export const createBOMSchema = z.object({
  bomCode: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  items: z.array(createBOMItemSchema).min(1),
});

export const createRoutingStepSchema = z.object({
  stepNo: z.number().int().positive(),
  workCenterId: z.string().uuid(),
  operationName: z.string().min(1).max(200),
  setupTimeMinutes: z.number().min(0).optional(),
  cycleTimeMinutes: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
});

export const createRoutingSchema = z.object({
  routingCode: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  steps: z.array(createRoutingStepSchema).min(1),
});

export const createCustomerSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  shippingAddress: z.string().max(500).optional(),
  billingAddress: z.string().max(500).optional(),
  paymentTermDays: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
});

export const createSupplierSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductVersionInput = z.infer<typeof createProductVersionSchema>;
export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type CreateBOMInput = z.infer<typeof createBOMSchema>;
export type CreateRoutingInput = z.infer<typeof createRoutingSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
