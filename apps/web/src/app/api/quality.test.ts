import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, parseResponse, setupEnv, createRouteContext, uuid, TEST_TENANT_ID } from '@/__tests__/helpers';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    qc_plans: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    qc_inspections: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    qc_defects: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@nkc/utils', () => ({
  generateOrderNumber: (prefix: string, seq: number) => `${prefix}-${String(seq).padStart(6, '0')}`,
}));
setupEnv();

import { GET as listPlans, POST as createPlan } from '@/app/api/quality/plans/route';
import { GET as getPlan, PATCH as patchPlan } from '@/app/api/quality/plans/[id]/route';
import { GET as listInspections, POST as createInspection } from '@/app/api/quality/inspections/route';
import { GET as getInspection, PATCH as patchInspection } from '@/app/api/quality/inspections/[id]/route';
import { GET as listDefects, POST as createDefect } from '@/app/api/quality/inspections/[id]/defects/route';

// ================================================================
// QC PLANS
// ================================================================
describe('QC Plans Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/quality/plans', () => {
    it('should return paginated QC plans', async () => {
      mockPrisma.qc_plans.findMany.mockResolvedValue([
        { id: uuid(1), qc_plan_code: 'QCP-001', qc_plan_name: 'Final Inspection', qc_checklist_items: [] },
      ]);
      mockPrisma.qc_plans.count.mockResolvedValue(1);

      const req = createRequest('/api/quality/plans');
      const res = await listPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty list when no plans', async () => {
      mockPrisma.qc_plans.findMany.mockResolvedValue([]);
      mockPrisma.qc_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/plans');
      const res = await listPlans(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should filter by qcType', async () => {
      mockPrisma.qc_plans.findMany.mockResolvedValue([]);
      mockPrisma.qc_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/plans?qcType=incoming');
      const res = await listPlans(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.qc_plans.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ qc_type: 'incoming' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.qc_plans.findMany.mockResolvedValue([]);
      mockPrisma.qc_plans.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/plans?status=active');
      const res = await listPlans(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.qc_plans.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  describe('POST /api/quality/plans', () => {
    it('should create a QC plan with checklist items', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);
      mockPrisma.qc_plans.create.mockResolvedValue({
        id: uuid(1),
        qc_plan_code: 'QCP-NEW',
        qc_plan_name: 'New Plan',
        qc_type: 'final',
        qc_checklist_items: [
          { id: uuid(2), line_no: 1, item_name: 'Surface finish' },
        ],
      });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: {
          qcPlanCode: 'QCP-NEW',
          qcPlanName: 'New Plan',
          qcType: 'final',
          checklistItems: [
            { itemName: 'Surface finish', checkMethod: 'Visual', expectedValue: 'Smooth', isRequired: true },
          ],
        },
      });
      const res = await createPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.qc_checklist_items).toHaveLength(1);
    });

    it('should create plan with incoming qcType', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);
      mockPrisma.qc_plans.create.mockResolvedValue({
        id: uuid(1),
        qc_plan_code: 'QCP-INC',
        qc_plan_name: 'Incoming Check',
        qc_type: 'incoming',
        qc_checklist_items: [],
      });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-INC', qcPlanName: 'Incoming Check', qcType: 'incoming' },
      });
      const res = await createPlan(req);

      expect(res.status).toBe(201);
    });

    it('should create plan with in_process qcType', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);
      mockPrisma.qc_plans.create.mockResolvedValue({
        id: uuid(1),
        qc_plan_code: 'QCP-IP',
        qc_plan_name: 'In-Process Check',
        qc_type: 'in_process',
        qc_checklist_items: [],
      });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-IP', qcPlanName: 'In-Process Check', qcType: 'in_process' },
      });
      const res = await createPlan(req);

      expect(res.status).toBe(201);
    });

    it('should create plan with empty checklist items', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);
      mockPrisma.qc_plans.create.mockResolvedValue({
        id: uuid(1),
        qc_plan_code: 'QCP-EMPTY',
        qc_plan_name: 'Empty Plan',
        qc_type: 'final',
        qc_checklist_items: [],
      });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-EMPTY', qcPlanName: 'Empty Plan', qcType: 'final' },
      });
      const res = await createPlan(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.qc_checklist_items).toEqual([]);
    });

    it('should create plan with productVersionId and routingStepId', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);
      mockPrisma.qc_plans.create.mockResolvedValue({
        id: uuid(1),
        qc_plan_code: 'QCP-LINKED',
        qc_plan_name: 'Linked Plan',
        qc_type: 'in_process',
        product_version_id: uuid(20),
        routing_step_id: uuid(30),
        qc_checklist_items: [],
      });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: {
          qcPlanCode: 'QCP-LINKED',
          qcPlanName: 'Linked Plan',
          qcType: 'in_process',
          productVersionId: uuid(20),
          routingStepId: uuid(30),
        },
      });
      const res = await createPlan(req);

      expect(res.status).toBe(201);
    });

    it('should return 409 for duplicate QC plan code', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({ id: uuid(1) });

      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-001', qcPlanName: 'Dup', qcType: 'final' },
      });
      const res = await createPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-NEW' },
      });
      const res = await createPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for invalid qcType', async () => {
      const req = createRequest('/api/quality/plans', {
        method: 'POST',
        body: { qcPlanCode: 'QCP-NEW', qcPlanName: 'Test', qcType: 'invalid' },
      });
      const res = await createPlan(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });
  });

  describe('GET /api/quality/plans/[id]', () => {
    it('should return QC plan detail', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        qc_plan_code: 'QCP-001',
        qc_checklist_items: [],
        qc_inspections: [],
      });

      const req = createRequest('/api/quality/plans/' + uuid(1));
      const res = await getPlan(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.qc_plan_code).toBe('QCP-001');
    });

    it('should return 404 for missing plan', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/plans/' + uuid(99));
      const res = await getPlan(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('PATCH /api/quality/plans/[id]', () => {
    it('should update plan status', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_plans.update.mockResolvedValue({
        id: uuid(1),
        status: 'inactive',
        qc_checklist_items: [],
      });

      const req = createRequest('/api/quality/plans/' + uuid(1), {
        method: 'PATCH',
        body: { status: 'inactive' },
      });
      const res = await patchPlan(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe('inactive');
    });

    it('should return 404 for non-existent plan', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/plans/' + uuid(99), {
        method: 'PATCH',
        body: { status: 'inactive' },
      });
      const res = await patchPlan(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});

// ================================================================
// QC INSPECTIONS
// ================================================================
describe('QC Inspections Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/quality/inspections', () => {
    it('should return paginated inspections', async () => {
      mockPrisma.qc_inspections.findMany.mockResolvedValue([
        { id: uuid(1), inspection_no: 'QCI-000001', result: 'pending' },
      ]);
      mockPrisma.qc_inspections.count.mockResolvedValue(1);

      const req = createRequest('/api/quality/inspections');
      const res = await listInspections(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty list', async () => {
      mockPrisma.qc_inspections.findMany.mockResolvedValue([]);
      mockPrisma.qc_inspections.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/inspections');
      const res = await listInspections(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should filter by result', async () => {
      mockPrisma.qc_inspections.findMany.mockResolvedValue([]);
      mockPrisma.qc_inspections.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/inspections?result=passed');
      const res = await listInspections(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.qc_inspections.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ result: 'passed' }),
        }),
      );
    });

    it('should filter by refType', async () => {
      mockPrisma.qc_inspections.findMany.mockResolvedValue([]);
      mockPrisma.qc_inspections.count.mockResolvedValue(0);

      const req = createRequest('/api/quality/inspections?refType=incoming_receipt');
      const res = await listInspections(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.qc_inspections.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ref_type: 'incoming_receipt' }),
        }),
      );
    });
  });

  describe('POST /api/quality/inspections', () => {
    it('should create an inspection', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.count.mockResolvedValue(0);
      mockPrisma.qc_inspections.create.mockResolvedValue({
        id: uuid(1),
        inspection_no: 'QCI-000001',
        result: 'pending',
        qc_plans: { id: uuid(10) },
      });

      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: {
          qcPlanId: uuid(10),
          refType: 'work_order_step',
          refId: uuid(20),
          inspectedQty: 100,
        },
      });
      const res = await createInspection(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.inspection_no).toBe('QCI-000001');
    });

    it('should create inspection with incoming_receipt refType', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.count.mockResolvedValue(1);
      mockPrisma.qc_inspections.create.mockResolvedValue({
        id: uuid(1),
        inspection_no: 'QCI-000002',
        ref_type: 'incoming_receipt',
        result: 'pending',
        qc_plans: { id: uuid(10) },
      });

      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: {
          qcPlanId: uuid(10),
          refType: 'incoming_receipt',
          refId: uuid(20),
          inspectedQty: 50,
        },
      });
      const res = await createInspection(req);

      expect(res.status).toBe(201);
    });

    it('should create inspection with shipment refType', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.count.mockResolvedValue(2);
      mockPrisma.qc_inspections.create.mockResolvedValue({
        id: uuid(1),
        inspection_no: 'QCI-000003',
        ref_type: 'shipment',
        result: 'pending',
        qc_plans: { id: uuid(10) },
      });

      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: {
          qcPlanId: uuid(10),
          refType: 'shipment',
          refId: uuid(20),
          inspectedQty: 200,
        },
      });
      const res = await createInspection(req);

      expect(res.status).toBe(201);
    });

    it('should create inspection with all optional fields', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue({
        id: uuid(10),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.count.mockResolvedValue(0);
      mockPrisma.qc_inspections.create.mockResolvedValue({
        id: uuid(1),
        inspection_no: 'QCI-000001',
        result: 'passed',
        qc_plans: { id: uuid(10) },
      });

      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: {
          qcPlanId: uuid(10),
          refType: 'work_order_step',
          refId: uuid(20),
          inspectedQty: 100,
          passedQty: 95,
          failedQty: 5,
          result: 'passed',
          notes: 'Minor surface defects on 5 units',
          inspectedAt: new Date().toISOString(),
          inspectorUserId: uuid(30),
        },
      });
      const res = await createInspection(req);

      expect(res.status).toBe(201);
    });

    it('should return 400 for missing fields', async () => {
      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: { qcPlanId: uuid(10) },
      });
      const res = await createInspection(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for invalid refType', async () => {
      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: { qcPlanId: uuid(10), refType: 'invalid', refId: uuid(20), inspectedQty: 100 },
      });
      const res = await createInspection(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent QC plan', async () => {
      mockPrisma.qc_plans.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/inspections', {
        method: 'POST',
        body: { qcPlanId: uuid(99), refType: 'work_order_step', refId: uuid(20), inspectedQty: 100 },
      });
      const res = await createInspection(req);
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('GET /api/quality/inspections/[id]', () => {
    it('should return inspection detail with defects', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
        inspection_no: 'QCI-000001',
        qc_plans: { qc_checklist_items: [] },
        qc_defects: [],
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1));
      const res = await getInspection(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.inspection_no).toBe('QCI-000001');
    });

    it('should return 404 for missing inspection', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/inspections/' + uuid(99));
      const res = await getInspection(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('PATCH /api/quality/inspections/[id]', () => {
    it('should update inspection result to passed', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({
        id: uuid(1),
        result: 'passed',
        passed_qty: 100,
        qc_defects: [],
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1), {
        method: 'PATCH',
        body: { result: 'passed', passedQty: 100 },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.result).toBe('passed');
    });

    it('should update inspection result to failed with failedQty', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({
        id: uuid(1),
        result: 'failed',
        passed_qty: 80,
        failed_qty: 20,
        qc_defects: [],
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1), {
        method: 'PATCH',
        body: { result: 'failed', passedQty: 80, failedQty: 20 },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.result).toBe('failed');
    });

    it('should update to partial result', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({
        id: uuid(1),
        result: 'partial',
        qc_defects: [],
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1), {
        method: 'PATCH',
        body: { result: 'partial' },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(200);
    });

    it('should update notes and inspectedAt', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({
        id: uuid(1),
        notes: 'Updated notes',
        qc_defects: [],
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1), {
        method: 'PATCH',
        body: { notes: 'Updated notes', inspectedAt: new Date().toISOString() },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid result', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1), {
        method: 'PATCH',
        body: { result: 'invalid_result' },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent inspection', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/inspections/' + uuid(99), {
        method: 'PATCH',
        body: { result: 'passed' },
      });
      const res = await patchInspection(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});

// ================================================================
// QC DEFECTS
// ================================================================
describe('QC Defects Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/quality/inspections/[id]/defects', () => {
    it('should list defects for an inspection', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.findMany.mockResolvedValue([
        { id: uuid(2), defect_name: 'Scratch', severity: 'minor' },
      ]);

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects');
      const res = await listDefects(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toHaveLength(1);
    });

    it('should return empty defect list', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.findMany.mockResolvedValue([]);

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects');
      const res = await listDefects(req, createRouteContext({ id: uuid(1) }));
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('should return 404 for non-existent inspection', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/inspections/' + uuid(99) + '/defects');
      const res = await listDefects(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe('POST /api/quality/inspections/[id]/defects', () => {
    it('should log a defect with disposition', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.create.mockResolvedValue({
        id: uuid(2),
        defect_name: 'Scratch',
        severity: 'minor',
        disposition: 'rework',
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({});

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: {
          defectName: 'Scratch',
          severity: 'minor',
          disposition: 'rework',
          defectQty: 5,
          defectCode: 'SCR-001',
        },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(201);
      // defectQty > 0 should increment failed_qty on inspection
      expect(mockPrisma.qc_inspections.update).toHaveBeenCalled();
    });

    it('should log defect with major severity and scrap disposition', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.create.mockResolvedValue({
        id: uuid(2),
        defect_name: 'Cracked panel',
        severity: 'major',
        disposition: 'scrap',
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({});

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: {
          defectName: 'Cracked panel',
          severity: 'major',
          disposition: 'scrap',
          defectQty: 10,
        },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(201);
    });

    it('should log defect with critical severity and hold disposition', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.create.mockResolvedValue({
        id: uuid(2),
        defect_name: 'Structural failure',
        severity: 'critical',
        disposition: 'hold',
      });
      mockPrisma.qc_inspections.update.mockResolvedValue({});

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: {
          defectName: 'Structural failure',
          severity: 'critical',
          disposition: 'hold',
          defectQty: 3,
          notes: 'Full batch quarantine',
        },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(201);
    });

    it('should log defect with use_as_is disposition and no defectQty', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });
      mockPrisma.qc_defects.create.mockResolvedValue({
        id: uuid(2),
        defect_name: 'Color variation',
        severity: 'minor',
        disposition: 'use_as_is',
        defect_qty: 0,
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: {
          defectName: 'Color variation',
          severity: 'minor',
          disposition: 'use_as_is',
        },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));

      expect(res.status).toBe(201);
      // No defectQty means no failed_qty increment
      expect(mockPrisma.qc_inspections.update).not.toHaveBeenCalled();
    });

    it('should return 400 for missing fields', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: { defectName: 'Scratch' },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for invalid severity', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: { defectName: 'Scratch', severity: 'extreme', disposition: 'rework' },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 400 for invalid disposition', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue({
        id: uuid(1),
        tenant_id: TEST_TENANT_ID,
      });

      const req = createRequest('/api/quality/inspections/' + uuid(1) + '/defects', {
        method: 'POST',
        body: { defectName: 'Scratch', severity: 'minor', disposition: 'destroy' },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(1) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent inspection', async () => {
      mockPrisma.qc_inspections.findUnique.mockResolvedValue(null);

      const req = createRequest('/api/quality/inspections/' + uuid(99) + '/defects', {
        method: 'POST',
        body: { defectName: 'Test', severity: 'minor', disposition: 'rework' },
      });
      const res = await createDefect(req, createRouteContext({ id: uuid(99) }));
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });
});
