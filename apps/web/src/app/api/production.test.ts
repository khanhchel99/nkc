import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    work_orders: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    work_order_steps: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    work_order_executions: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    scrap_logs: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    downtime_logs: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    stock_transactions: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    stock_balances: {
      updateMany: vi.fn(),
    },
    production_plans: {
      findFirst: vi.fn(),
    },
    sales_orders: {
      findFirst: vi.fn(),
    },
    routing_steps: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: (prefix: string, seq: number) => `${prefix}-${String(seq).padStart(6, '0')}`,
}));
setupEnv();

import { GET as listWO, POST as createWO } from '@/app/api/production/work-orders/route';
import { GET as getWO, PATCH as patchWO } from '@/app/api/production/work-orders/[id]/route';
import { PATCH as patchStep } from '@/app/api/production/work-orders/[id]/steps/[stepId]/route';
import { GET as listExec, POST as createExec } from '@/app/api/production/work-orders/[id]/steps/[stepId]/executions/route';
import { GET as listScrap, POST as createScrap } from '@/app/api/production/work-orders/[id]/steps/[stepId]/scrap/route';
import { GET as listDowntime, POST as createDowntime } from '@/app/api/production/work-orders/[id]/steps/[stepId]/downtime/route';
import { GET as listMaterials, POST as issueMaterial } from '@/app/api/production/work-orders/[id]/materials/route';

// ================================================================
// WORK ORDERS
// ================================================================
describe('Work Orders Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/production/work-orders', () => {
    it('should return paginated work orders', async () => {
      mockPrisma.work_orders.findMany.mockResolvedValue([
        { id: uuid(1), work_order_no: 'WO-000001', status: 'released' },
      ]);
      mockPrisma.work_orders.count.mockResolvedValue(1);

      const req = createRequest('/api/production/work-orders');
      const res = await listWO(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty list', async () => {
      mockPrisma.work_orders.findMany.mockResolvedValue([]);
      mockPrisma.work_orders.count.mockResolvedValue(0);

      const req = createRequest('/api/production/work-orders');
      const res = await listWO(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('POST /api/production/work-orders', () => {
    it('should generate work orders from a production plan', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
        sales_order_id: uuid(20),
        status: 'confirmed',
        production_plan_lines: [
          { id: uuid(30), sales_order_line_id: uuid(40), routing_step_id: uuid(50), work_center_id: uuid(60), planned_start_at: new Date(), planned_end_at: new Date(), priority_seq: 1 },
        ],
      });
      mockPrisma.sales_orders.findFirst.mockResolvedValue({
        id: uuid(20),
        tenant_id: TEST_TENANT_ID,
        sales_order_lines: [
          { id: uuid(40), product_id: uuid(70), product_version_id: uuid(80), quantity: 100 },
        ],
      });
      mockPrisma.routing_steps.findMany.mockResolvedValue([
        { id: uuid(50), routing_id: uuid(90), step_code: 'CUT', step_name: 'Cutting', is_qc_required: false },
      ]);
      mockPrisma.work_orders.count.mockResolvedValue(0);
      mockPrisma.work_orders.create.mockResolvedValue({
        id: uuid(1),
        work_order_no: 'WO-000001',
        status: 'released',
        work_order_steps: [{ id: uuid(2), step_no: 1, step_code: 'CUT' }],
      });

      const req = createRequest('/api/production/work-orders', {
        method: 'POST',
        body: { productionPlanId: uuid(10) },
      });
      const res = await createWO(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body).toHaveLength(1);
    });

    it('should return 400 if productionPlanId missing', async () => {
      const req = createRequest('/api/production/work-orders', {
        method: 'POST',
        body: {},
      });
      const res = await createWO(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent plan', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders', {
        method: 'POST',
        body: { productionPlanId: uuid(99) },
      });
      const res = await createWO(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return 400 for non-confirmed plan', async () => {
      mockPrisma.production_plans.findFirst.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
        status: 'draft',
        production_plan_lines: [],
      });

      const req = createRequest('/api/production/work-orders', {
        method: 'POST',
        body: { productionPlanId: uuid(10) },
      });
      const res = await createWO(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });

  describe('GET /api/production/work-orders/[id]', () => {
    it('should return work order detail', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        work_order_no: 'WO-000001',
        work_order_steps: [{ id: uuid(2), step_no: 1, work_order_executions: [], scrap_logs: [], downtime_logs: [] }],
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1));
      const res = await getWO(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.work_order_no).toBe('WO-000001');
    });

    it('should return 404 for missing WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(99));
      const res = await getWO(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('PATCH /api/production/work-orders/[id]', () => {
    it('should update status and priority', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'released',
      });
      mockPrisma.work_orders.update.mockResolvedValue({
        id: uuid(1),
        status: 'in_progress',
        priority: 'high',
        work_order_steps: [],
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1), {
        method: 'PATCH',
        body: { status: 'in_progress', priority: 'high' },
      });
      const res = await patchWO(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(99), {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      const res = await patchWO(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});

// ================================================================
// STEP PROGRESSION
// ================================================================
describe('Step Progression', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('PATCH /api/production/work-orders/[id]/steps/[stepId]', () => {
    it('should transition step from pending to ready', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'pending',
        actual_start_at: null,
        work_orders: { status: 'released' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({
        id: uuid(2),
        status: 'ready',
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'ready' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
    });

    it('should transition ready to in_progress and set actual_start_at', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'ready',
        actual_start_at: null,
        work_orders: { status: 'released' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), status: 'in_progress' });
      // Also updates WO to in_progress when released
      mockPrisma.work_orders.update.mockResolvedValue({ id: uuid(1), status: 'in_progress' });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      // WO should also be updated to in_progress
      expect(mockPrisma.work_orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'in_progress' }),
        }),
      );
    });

    it('should transition in_progress to paused', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'in_progress',
        actual_start_at: new Date(),
        work_orders: { status: 'in_progress' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), status: 'paused' });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'paused' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(200);
    });

    it('should transition paused back to in_progress', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'paused',
        actual_start_at: new Date(), // already started before
        work_orders: { status: 'in_progress' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), status: 'in_progress' });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(200);
      // Should NOT update WO since it's already in_progress
      expect(mockPrisma.work_orders.update).not.toHaveBeenCalled();
    });

    it('should transition pending to cancelled', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'pending',
        actual_start_at: null,
        work_orders: { status: 'released' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), status: 'cancelled' });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'cancelled' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(200);
    });

    it('should reject invalid transition', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'completed',
        work_orders: { status: 'in_progress' },
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'pending' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should reject transition from skipped to any', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'skipped',
        work_orders: { status: 'in_progress' },
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should reject transition from cancelled to any', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'cancelled',
        work_orders: { status: 'in_progress' },
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should auto-complete WO when all steps done', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'in_progress',
        actual_start_at: new Date(),
        work_orders: { status: 'in_progress' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), status: 'completed' });

      // Mock Decimal operations
      const { Prisma } = await import('@nkc/database');
      mockPrisma.work_order_steps.findMany.mockResolvedValue([
        { id: uuid(2), status: 'completed', completed_qty: new Prisma.Decimal(50), scrapped_qty: new Prisma.Decimal(2) },
      ]);
      mockPrisma.work_orders.update.mockResolvedValue({ id: uuid(1), status: 'completed' });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { status: 'completed' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(200);
      expect(mockPrisma.work_orders.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) }),
      );
    });

    it('should update completedQty and scrappedQty', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'in_progress',
        actual_start_at: new Date(),
        work_orders: { status: 'in_progress' },
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({ id: uuid(2), completed_qty: 25, scrapped_qty: 3 });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2), {
        method: 'PATCH',
        body: { completedQty: 25, scrappedQty: 3 },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent step', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(99), {
        method: 'PATCH',
        body: { status: 'ready' },
      });
      const res = await patchStep(req, createRouteContext({ id: uuid(1), stepId: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});

// ================================================================
// EXECUTION LOGGING
// ================================================================
describe('Execution Logging', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/.../executions', () => {
    it('should list execution logs', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.work_order_executions.findMany.mockResolvedValue([
        { id: uuid(3), started_at: new Date() },
      ]);
      mockPrisma.work_order_executions.count.mockResolvedValue(1);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/executions');
      const res = await listExec(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return 404 for non-existent step', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(99) + '/executions');
      const res = await listExec(req, createRouteContext({ id: uuid(1), stepId: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('POST /api/.../executions', () => {
    it('should create an execution log', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.work_order_executions.create.mockResolvedValue({
        id: uuid(3),
        started_at: new Date(),
        output_qty: 10,
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({});

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/executions', {
        method: 'POST',
        body: { startedAt: new Date().toISOString(), outputQty: 10, inputQty: 12, scrapQty: 2 },
      });
      const res = await createExec(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      // outputQty should increment completed_qty, scrapQty should increment scrapped_qty
      expect(mockPrisma.work_order_steps.update).toHaveBeenCalledTimes(2);
    });

    it('should create execution with only startedAt and outputQty', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.work_order_executions.create.mockResolvedValue({
        id: uuid(3),
        started_at: new Date(),
        output_qty: 5,
      });
      mockPrisma.work_order_steps.update.mockResolvedValue({});

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/executions', {
        method: 'POST',
        body: { startedAt: new Date().toISOString(), outputQty: 5 },
      });
      const res = await createExec(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(201);
      // Only outputQty update, no scrapQty update
      expect(mockPrisma.work_order_steps.update).toHaveBeenCalledTimes(1);
    });

    it('should create execution with all optional fields', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.work_order_executions.create.mockResolvedValue({
        id: uuid(3),
        started_at: new Date(),
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/executions', {
        method: 'POST',
        body: {
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          operatorUserId: uuid(70),
          teamCode: 'TEAM-A',
          inputQty: 15,
          outputQty: 12,
          scrapQty: 3,
          pauseReason: 'Material shortage',
          notes: 'Resumed after restock',
        },
      });
      const res = await createExec(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));

      expect(res.status).toBe(201);
    });

    it('should return 400 without startedAt', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/executions', {
        method: 'POST',
        body: { outputQty: 10 },
      });
      const res = await createExec(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});

// ================================================================
// SCRAP LOGGING
// ================================================================
describe('Scrap Logging', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/.../scrap', () => {
    it('should list scrap logs', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.scrap_logs.findMany.mockResolvedValue([{ id: uuid(3), quantity: 5 }]);
      mockPrisma.scrap_logs.count.mockResolvedValue(1);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/scrap');
      const res = await listScrap(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('POST /api/.../scrap', () => {
    it('should create a scrap log and update quantities', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.scrap_logs.create.mockResolvedValue({ id: uuid(3), quantity: 5 });
      mockPrisma.work_order_steps.update.mockResolvedValue({});
      mockPrisma.work_orders.update.mockResolvedValue({});

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/scrap', {
        method: 'POST',
        body: { quantity: 5, scrapReason: 'Material defect', defectCode: 'DEF-001' },
      });
      const res = await createScrap(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      expect(mockPrisma.work_order_steps.update).toHaveBeenCalled();
      expect(mockPrisma.work_orders.update).toHaveBeenCalled();
    });

    it('should return 400 for zero quantity', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/scrap', {
        method: 'POST',
        body: { quantity: 0, scrapReason: 'test' },
      });
      const res = await createScrap(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 without scrapReason', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/scrap', {
        method: 'POST',
        body: { quantity: 5 },
      });
      const res = await createScrap(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});

// ================================================================
// DOWNTIME LOGGING
// ================================================================
describe('Downtime Logging', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/.../downtime', () => {
    it('should list downtime logs', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.downtime_logs.findMany.mockResolvedValue([{ id: uuid(3), downtime_reason: 'Machine failure' }]);
      mockPrisma.downtime_logs.count.mockResolvedValue(1);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/downtime');
      const res = await listDowntime(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('POST /api/.../downtime', () => {
    it('should create a downtime log', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        work_center_id: uuid(60),
      });
      mockPrisma.downtime_logs.create.mockResolvedValue({
        id: uuid(3),
        downtime_reason: 'Machine failure',
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/downtime', {
        method: 'POST',
        body: { startAt: new Date().toISOString(), downtimeReason: 'Machine failure' },
      });
      const res = await createDowntime(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should return 400 without startAt', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/downtime', {
        method: 'POST',
        body: { downtimeReason: 'Machine failure' },
      });
      const res = await createDowntime(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 without downtimeReason', async () => {
      mockPrisma.work_order_steps.findUnique.mockResolvedValue({
        id: uuid(2),
        work_order_id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/steps/' + uuid(2) + '/downtime', {
        method: 'POST',
        body: { startAt: new Date().toISOString() },
      });
      const res = await createDowntime(req, createRouteContext({ id: uuid(1), stepId: uuid(2) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });
});

// ================================================================
// MATERIAL ISSUANCE
// ================================================================
describe('Material Issuance', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockTx = {
    stock_transactions: { count: vi.fn(), create: vi.fn() },
    stock_balances: { updateMany: vi.fn() },
  };

  describe('GET /api/.../materials', () => {
    it('should list material issuances for a WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.stock_transactions.findMany.mockResolvedValue([
        { id: uuid(3), transaction_type: 'issue', ref_type: 'work_order' },
      ]);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials');
      const res = await listMaterials(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return 404 for non-existent WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(99) + '/materials');
      const res = await listMaterials(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });

    it('should return empty list when no materials issued', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.stock_transactions.findMany.mockResolvedValue([]);

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials');
      const res = await listMaterials(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });

  describe('POST /api/.../materials', () => {
    it('should issue materials from inventory', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        work_order_no: 'WO-000001',
        status: 'in_progress',
      });
      mockTx.stock_transactions.count.mockResolvedValue(0);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(3),
        transaction_type: 'issue',
      });
      mockTx.stock_balances.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials', {
        method: 'POST',
        body: { warehouseId: uuid(10), itemId: uuid(20), quantity: 50, uomCode: 'PCS' },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
    });

    it('should issue with optional binLocationId and lotId', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        work_order_no: 'WO-000001',
        status: 'in_progress',
      });
      mockTx.stock_transactions.count.mockResolvedValue(5);
      mockTx.stock_transactions.create.mockResolvedValue({
        id: uuid(3),
        transaction_type: 'issue',
      });
      mockTx.stock_balances.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials', {
        method: 'POST',
        body: {
          warehouseId: uuid(10),
          itemId: uuid(20),
          quantity: 25,
          uomCode: 'PCS',
          binLocationId: uuid(30),
          lotId: uuid(40),
          reason: 'Custom reason',
        },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(201);
    });

    it('should return 400 for completed WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'completed',
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials', {
        method: 'POST',
        body: { warehouseId: uuid(10), itemId: uuid(20), quantity: 50, uomCode: 'PCS' },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for cancelled WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'cancelled',
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials', {
        method: 'POST',
        body: { warehouseId: uuid(10), itemId: uuid(20), quantity: 50, uomCode: 'PCS' },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        status: 'in_progress',
      });

      const req = createRequest('/api/production/work-orders/' + uuid(1) + '/materials', {
        method: 'POST',
        body: { warehouseId: uuid(10) },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent WO', async () => {
      mockPrisma.work_orders.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/production/work-orders/' + uuid(99) + '/materials', {
        method: 'POST',
        body: { warehouseId: uuid(10), itemId: uuid(20), quantity: 50, uomCode: 'PCS' },
      });
      const res = await issueMaterial(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});
