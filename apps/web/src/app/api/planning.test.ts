import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID, TEST_USER_ID } from '@/__tests__/helpers';
import { Prisma } from '@nkc/database';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    material_requirement_plans: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    production_plans: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    sales_orders: {
      findFirst: vi.fn(),
    },
    products: {
      findFirst: vi.fn(),
    },
    items: {
      findMany: vi.fn(),
    },
    bom_headers: {
      findFirst: vi.fn(),
    },
    routings: {
      findFirst: vi.fn(),
    },
    work_centers: {
      findFirst: vi.fn(),
    },
    stock_balances: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: vi.fn((prefix: string, n: number) => `${prefix}-0000-${String(n).padStart(5, '0')}`),
}));
setupEnv();

import { GET as getMrpPlans, POST as createMrpPlan } from '@/app/api/planning/mrp/route';
import { GET as getMrpPlanById } from '@/app/api/planning/mrp/[id]/route';
import { GET as getProductionPlans, POST as createProductionPlan } from '@/app/api/planning/production-plans/route';
import { GET as getProductionPlanById } from '@/app/api/planning/production-plans/[id]/route';

// =============================================================================
// MRP ROUTES
// =============================================================================
describe('MRP Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/planning/mrp', () => {
    it('should return paginated MRP plans', async () => {
      mockPrisma.material_requirement_plans.findMany.mockResolvedValue([
        { id: uuid(1), plan_no: 'MRP-0000-00001', status: 'draft', material_requirement_lines: [] },
      ]);
      mockPrisma.material_requirement_plans.count.mockResolvedValue(1);

      const req = createRequest('/api/planning/mrp');
      const res = await getMrpPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].plan_no).toBe('MRP-0000-00001');
    });

    it('should return empty when no plans', async () => {
      mockPrisma.material_requirement_plans.findMany.mockResolvedValue([]);
      mockPrisma.material_requirement_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/planning/mrp');
      const res = await getMrpPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should filter by status', async () => {
      mockPrisma.material_requirement_plans.findMany.mockResolvedValue([]);
      mockPrisma.material_requirement_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/planning/mrp?status=draft');
      const res = await getMrpPlans(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.material_requirement_plans.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });
  });

  describe('POST /api/planning/mrp', () => {
    it('should create MRP plan with BOM explosion', async () => {
      // Setup confirmed sales order with a line
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        requested_etd: new Date('2026-06-01'),
        sales_order_lines: [
          {
            id: uuid(10),
            product_id: uuid(20),
            quantity: new Prisma.Decimal(10),
            requested_etd: null,
          },
        ],
      });

      // Product with current version
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20),
        current_version_id: uuid(30),
      });

      // Active BOM with items
      mockPrisma.bom_headers.findFirst.mockResolvedValue({
        id: uuid(40),
        status: 'active',
        bom_items: [
          {
            item_id: uuid(50),
            component_code: 'WOOD-001',
            component_name: 'Plywood Sheet',
            qty_per_product: new Prisma.Decimal(2),
            scrap_percent: new Prisma.Decimal(5),
            uom_code: 'SHT',
          },
          {
            item_id: uuid(51),
            component_code: 'SCREW-001',
            component_name: 'Wood Screw',
            qty_per_product: new Prisma.Decimal(20),
            scrap_percent: new Prisma.Decimal(0),
            uom_code: 'PC',
          },
        ],
      });

      // Stock balances — plywood has inventory, screws have none
      mockPrisma.stock_balances.findMany.mockResolvedValue([
        {
          item_id: uuid(50),
          on_hand_qty: new Prisma.Decimal(10),
          reserved_qty: new Prisma.Decimal(0),
        },
      ]);

      // Items with supplier info
      mockPrisma.items.findMany.mockResolvedValue([
        { id: uuid(50), supplier_id: uuid(60) },
        { id: uuid(51), supplier_id: uuid(61) },
      ]);

      // MRP plan count for numbering
      mockPrisma.material_requirement_plans.count.mockResolvedValue(0);
      mockPrisma.material_requirement_plans.create.mockResolvedValue({
        id: uuid(100),
        plan_no: 'MRP-0000-00001',
        status: 'draft',
        material_requirement_lines: [
          {
            item_code: 'WOOD-001',
            gross_required_qty: new Prisma.Decimal(21), // 2 * 10 * 1.05
            available_qty: new Prisma.Decimal(10),
            shortage_qty: new Prisma.Decimal(11),
          },
          {
            item_code: 'SCREW-001',
            gross_required_qty: new Prisma.Decimal(200), // 20 * 10 * 1.0
            available_qty: new Prisma.Decimal(0),
            shortage_qty: new Prisma.Decimal(200),
          },
        ],
      });

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createMrpPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.plan_no).toBe('MRP-0000-00001');
      expect(body.material_requirement_lines).toHaveLength(2);
    });

    it('should skip BOM items without item_id', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        requested_etd: new Date('2026-06-01'),
        sales_order_lines: [
          { id: uuid(10), product_id: uuid(20), quantity: new Prisma.Decimal(5), requested_etd: null },
        ],
      });
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20), current_version_id: uuid(30),
      });
      // BOM has one item with null item_id and one valid
      mockPrisma.bom_headers.findFirst.mockResolvedValue({
        id: uuid(40),
        status: 'active',
        bom_items: [
          { item_id: null, component_code: 'CUSTOM', component_name: 'Custom Part', qty_per_product: new Prisma.Decimal(1), scrap_percent: new Prisma.Decimal(0), uom_code: 'PC' },
          { item_id: uuid(50), component_code: 'WOOD-001', component_name: 'Plywood', qty_per_product: new Prisma.Decimal(2), scrap_percent: new Prisma.Decimal(0), uom_code: 'SHT' },
        ],
      });
      mockPrisma.stock_balances.findMany.mockResolvedValue([]);
      mockPrisma.items.findMany.mockResolvedValue([{ id: uuid(50), supplier_id: null }]);
      mockPrisma.material_requirement_plans.count.mockResolvedValue(0);
      mockPrisma.material_requirement_plans.create.mockResolvedValue({
        id: uuid(100),
        plan_no: 'MRP-0000-00001',
        material_requirement_lines: [
          { item_code: 'WOOD-001', shortage_qty: new Prisma.Decimal(10) },
        ],
      });

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createMrpPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      // Only the item with valid item_id should be in results
      expect(body.material_requirement_lines).toHaveLength(1);
    });

    it('should return 400 without salesOrderId', async () => {
      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: {},
      });
      const res = await createMrpPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent sales order', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(99) },
      });
      const res = await createMrpPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for non-confirmed order', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'draft',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createMrpPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 when no BOM data found', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        sales_order_lines: [
          { id: uuid(10), product_id: uuid(20), quantity: new Prisma.Decimal(5) },
        ],
      });
      // Product has no current_version_id
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20),
        current_version_id: null,
      });

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createMrpPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for revised order status', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'revised',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/planning/mrp', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createMrpPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });

  describe('GET /api/planning/mrp/[id]', () => {
    it('should return MRP plan detail with summary', async () => {
      mockPrisma.material_requirement_plans.findFirst.mockResolvedValue({
        id: uuid(1),
        plan_no: 'MRP-0000-00001',
        material_requirement_lines: [
          { item_code: 'WOOD-001', shortage_qty: new Prisma.Decimal(11) },
          { item_code: 'SCREW-001', shortage_qty: new Prisma.Decimal(0) },
        ],
      });

      const req = createRequest('/api/planning/mrp/' + uuid(1));
      const res = await getMrpPlanById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.summary.totalItems).toBe(2);
      expect(body.summary.shortageItems).toBe(1);
      expect(body.summary.fullyAvailable).toBe(1);
    });

    it('should return 404 for non-existent plan', async () => {
      mockPrisma.material_requirement_plans.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/planning/mrp/' + uuid(99));
      const res = await getMrpPlanById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return plan with all items fully available', async () => {
      mockPrisma.material_requirement_plans.findFirst.mockResolvedValue({
        id: uuid(1),
        plan_no: 'MRP-0000-00002',
        material_requirement_lines: [
          { item_code: 'WOOD-001', shortage_qty: new Prisma.Decimal(0) },
          { item_code: 'SCREW-001', shortage_qty: new Prisma.Decimal(0) },
        ],
      });

      const req = createRequest('/api/planning/mrp/' + uuid(1));
      const res = await getMrpPlanById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.summary.shortageItems).toBe(0);
      expect(body.summary.fullyAvailable).toBe(2);
    });
  });
});

// =============================================================================
// PRODUCTION PLAN ROUTES
// =============================================================================
describe('Production Plan Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/planning/production-plans', () => {
    it('should return paginated production plans', async () => {
      mockPrisma.production_plans.findMany.mockResolvedValue([
        { id: uuid(1), plan_no: 'PP-0000-00001', status: 'draft', production_plan_lines: [] },
      ]);
      mockPrisma.production_plans.count.mockResolvedValue(1);

      const req = createRequest('/api/planning/production-plans');
      const res = await getProductionPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty list when no plans exist', async () => {
      mockPrisma.production_plans.findMany.mockResolvedValue([]);
      mockPrisma.production_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/planning/production-plans');
      const res = await getProductionPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should filter by status', async () => {
      mockPrisma.production_plans.findMany.mockResolvedValue([]);
      mockPrisma.production_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/planning/production-plans?status=draft');
      const res = await getProductionPlans(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.production_plans.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'draft' }),
        }),
      );
    });
  });

  describe('POST /api/planning/production-plans', () => {
    it('should create production plan with routing steps', async () => {
      // Confirmed sales order with one line
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        requested_etd: new Date('2026-06-01'),
        sales_order_lines: [
          {
            id: uuid(10),
            product_id: uuid(20),
            quantity: new Prisma.Decimal(5),
            requested_etd: null,
          },
        ],
      });

      // Product with current version
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20),
        current_version_id: uuid(30),
      });

      // Active routing with steps
      mockPrisma.routings.findFirst.mockResolvedValue({
        id: uuid(40),
        status: 'active',
        routing_steps: [
          {
            id: uuid(41),
            step_no: 1,
            standard_minutes: 30,
            queue_minutes: 5,
            work_center_id: uuid(60),
          },
          {
            id: uuid(42),
            step_no: 2,
            standard_minutes: 20,
            queue_minutes: 3,
            work_center_id: uuid(61),
          },
        ],
      });

      // Work centers with capacity
      mockPrisma.work_centers.findFirst
        .mockResolvedValueOnce({ id: uuid(60), capacity_minutes_per_day: 480 })
        .mockResolvedValueOnce({ id: uuid(61), capacity_minutes_per_day: 480 });

      mockPrisma.production_plans.count.mockResolvedValue(0);
      mockPrisma.production_plans.create.mockResolvedValue({
        id: uuid(100),
        plan_no: 'PP-0000-00001',
        status: 'draft',
        etd_risk_level: 'low',
        production_plan_lines: [
          { routing_step_id: uuid(41), planned_qty: 5 },
          { routing_step_id: uuid(42), planned_qty: 5 },
        ],
      });

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(1), startDate: '2026-04-01' },
      });
      const res = await createProductionPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.plan_no).toBe('PP-0000-00001');
      expect(body.production_plan_lines).toHaveLength(2);
    });

    it('should return 400 without salesOrderId', async () => {
      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: {},
      });
      const res = await createProductionPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for missing sales order', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(99) },
      });
      const res = await createProductionPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for non-confirmed order', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'draft',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createProductionPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for cancelled order', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'cancelled',
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createProductionPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should create plan line without routing for product without version', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        requested_etd: new Date('2026-06-01'),
        sales_order_lines: [
          {
            id: uuid(10),
            product_id: uuid(20),
            quantity: new Prisma.Decimal(5),
            requested_etd: null,
          },
        ],
      });
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20),
        current_version_id: null,
      });
      mockPrisma.production_plans.count.mockResolvedValue(0);
      mockPrisma.production_plans.create.mockResolvedValue({
        id: uuid(100),
        plan_no: 'PP-0000-00001',
        status: 'draft',
        etd_risk_level: 'low',
        production_plan_lines: [
          { routing_step_id: null, planned_qty: 5 },
        ],
      });

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createProductionPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.production_plan_lines[0].routing_step_id).toBeNull();
    });

    it('should use line-level requested_etd when available', async () => {
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(1),
        status: 'confirmed',
        tenant_id: TEST_TENANT_ID,
        requested_etd: new Date('2026-06-01'),
        sales_order_lines: [
          {
            id: uuid(10),
            product_id: uuid(20),
            quantity: new Prisma.Decimal(3),
            requested_etd: new Date('2026-05-15'), // line-level ETD override
          },
        ],
      });
      mockPrisma.products.findFirst.mockResolvedValue({
        id: uuid(20),
        current_version_id: null,
      });
      mockPrisma.production_plans.count.mockResolvedValue(0);
      mockPrisma.production_plans.create.mockResolvedValue({
        id: uuid(100),
        plan_no: 'PP-0000-00001',
        status: 'draft',
        etd_risk_level: 'low',
        production_plan_lines: [{ routing_step_id: null, planned_qty: 3 }],
      });

      const req = createRequest('/api/planning/production-plans', {
        method: 'POST',
        body: { salesOrderId: uuid(1) },
      });
      const res = await createProductionPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });
  });

  describe('GET /api/planning/production-plans/[id]', () => {
    it('should return plan detail with summary', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue({
        id: uuid(1),
        plan_no: 'PP-0000-00001',
        production_plan_lines: [
          { status: 'pending', priority_seq: 1 },
          { status: 'pending', priority_seq: 2 },
          { status: 'in_progress', priority_seq: 3 },
        ],
      });

      const req = createRequest('/api/planning/production-plans/' + uuid(1));
      const res = await getProductionPlanById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.summary.totalLines).toBe(3);
      expect(body.summary.byStatus.pending).toBe(2);
      expect(body.summary.byStatus.in_progress).toBe(1);
    });

    it('should return 404 for non-existent plan', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/planning/production-plans/' + uuid(99));
      const res = await getProductionPlanById(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return plan with all lines completed', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue({
        id: uuid(1),
        plan_no: 'PP-0000-00002',
        production_plan_lines: [
          { status: 'completed', priority_seq: 1 },
          { status: 'completed', priority_seq: 2 },
        ],
      });

      const req = createRequest('/api/planning/production-plans/' + uuid(1));
      const res = await getProductionPlanById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.summary.totalLines).toBe(2);
      expect(body.summary.byStatus.completed).toBe(2);
    });

    it('should return plan with mixed statuses', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue({
        id: uuid(1),
        plan_no: 'PP-0000-00003',
        production_plan_lines: [
          { status: 'completed', priority_seq: 1 },
          { status: 'in_progress', priority_seq: 2 },
          { status: 'pending', priority_seq: 3 },
          { status: 'cancelled', priority_seq: 4 },
        ],
      });

      const req = createRequest('/api/planning/production-plans/' + uuid(1));
      const res = await getProductionPlanById(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.summary.totalLines).toBe(4);
      expect(body.summary.byStatus.completed).toBe(1);
      expect(body.summary.byStatus.in_progress).toBe(1);
      expect(body.summary.byStatus.pending).toBe(1);
      expect(body.summary.byStatus.cancelled).toBe(1);
    });
  });
});
