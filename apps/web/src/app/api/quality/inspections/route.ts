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

  return json({ data: inspections, total, page, limit, totalPages: Math.ceil(total / limit) });
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
