import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { Prisma } from '@nkc/database';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';

const VALID_REF_TYPES = ['incoming_receipt', 'work_order_step', 'shipment'] as const;

/**
 * GET /api/quality/inspections
 * List QC inspections with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const result = params.get('result');
  const refType = params.get('refType');

  const where = {
    tenant_id: user.tenantId,
    ...(result && { result }),
    ...(refType && { ref_type: refType }),
  };

  const [inspections, total] = await Promise.all([
    prisma.qc_inspections.findMany({
      where,
      include: { qc_defects: true, qc_plans: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.qc_inspections.count({ where }),
  ]);

  // Resolve work order numbers for work_order_step refs
  const woStepIds = inspections
    .filter((i) => i.ref_type === 'work_order_step')
    .map((i) => i.ref_id);
  const woStepMap = new Map<string, string>(); // stepId → work_order_no
  if (woStepIds.length) {
    const steps = await prisma.work_order_steps.findMany({
      where: { id: { in: woStepIds } },
      select: { id: true, work_order_id: true },
    });
    const woIds = [...new Set(steps.map((s) => s.work_order_id))];
    const wos = await prisma.work_orders.findMany({
      where: { id: { in: woIds } },
      select: { id: true, work_order_no: true },
    });
    const woNoMap = new Map(wos.map((w) => [w.id, w.work_order_no]));
    for (const step of steps) {
      woStepMap.set(step.id, woNoMap.get(step.work_order_id) ?? step.work_order_id);
    }
  }

  // Resolve inspector names
  const inspectorIds = inspections
    .map((i) => i.inspector_user_id)
    .filter((id): id is string => id !== null);
  const inspectorMap = new Map<string, string>();
  if (inspectorIds.length) {
    const users = await prisma.users.findMany({
      where: { id: { in: inspectorIds } },
      select: { id: true, full_name: true },
    });
    for (const u of users) inspectorMap.set(u.id, u.full_name);
  }

  const data = inspections.map((i) => ({
    inspectionId: i.id,
    inspectionNumber: i.inspection_no,
    workOrderNumber: i.ref_type === 'work_order_step' ? (woStepMap.get(i.ref_id) ?? null) : null,
    refType: i.ref_type,
    refId: i.ref_id,
    status: i.result, // result field maps to status in the UI
    result: i.result,
    inspectorName: i.inspector_user_id ? (inspectorMap.get(i.inspector_user_id) ?? null) : null,
    createdAt: i.created_at,
    inspectedQty: Number(i.inspected_qty),
    passedQty: Number(i.passed_qty),
    failedQty: Number(i.failed_qty),
    notes: i.notes,
    // snake_case aliases (mobile compatibility)
    inspection_no: i.inspection_no,
    ref_type: i.ref_type,
    ref_id: i.ref_id,
    inspected_qty: Number(i.inspected_qty),
    passed_qty: Number(i.passed_qty),
    failed_qty: Number(i.failed_qty),
    inspected_at: i.inspected_at,
    qc_plans: i.qc_plans ? { plan_name: i.qc_plans.qc_plan_name } : null,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/quality/inspections
 * Create a QC inspection.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.qcPlanId || !body.refType || !body.refId || !body.inspectedQty) {
    throw new BadRequestError('qcPlanId, refType, refId, and inspectedQty are required');
  }
  if (!VALID_REF_TYPES.includes(body.refType)) {
    throw new BadRequestError(`refType must be one of: ${VALID_REF_TYPES.join(', ')}`);
  }

  // Verify QC plan exists
  const plan = await prisma.qc_plans.findUnique({ where: { id: body.qcPlanId } });
  if (!plan || plan.tenant_id !== user.tenantId) {
    throw new NotFoundError('QC plan not found');
  }

  const count = await prisma.qc_inspections.count({ where: { tenant_id: user.tenantId } });
  const inspectionNo = generateOrderNumber('QCI', count + 1);

  const inspection = await prisma.qc_inspections.create({
    data: {
      tenant_id: user.tenantId,
      qc_plan_id: body.qcPlanId,
      inspection_no: inspectionNo,
      ref_type: body.refType,
      ref_id: body.refId,
      inspected_qty: new Prisma.Decimal(body.inspectedQty),
      passed_qty: body.passedQty ? new Prisma.Decimal(body.passedQty) : new Prisma.Decimal(0),
      failed_qty: body.failedQty ? new Prisma.Decimal(body.failedQty) : new Prisma.Decimal(0),
      result: body.result || 'pending',
      notes: body.notes,
      inspected_at: body.inspectedAt ? new Date(body.inspectedAt) : null,
      inspector_user_id: body.inspectorUserId || user.userId,
    },
    include: { qc_plans: true },
  });

  return json(inspection, 201);
});
