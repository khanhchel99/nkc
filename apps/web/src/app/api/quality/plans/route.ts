import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams, BadRequestError, ConflictError } from '@/lib/api-helpers';

const VALID_QC_TYPES = ['incoming', 'in_process', 'final'] as const;

/**
 * GET /api/quality/plans
 * List QC plans with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const qcType = params.get('qcType');
  const status = params.get('status');

  const where = {
    tenant_id: user.tenantId,
    ...(qcType && { qc_type: qcType }),
    ...(status && { status }),
  };

  const [plans, total] = await Promise.all([
    prisma.qc_plans.findMany({
      where,
      include: { qc_checklist_items: { orderBy: { line_no: 'asc' } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.qc_plans.count({ where }),
  ]);

  return json({ data: plans, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/quality/plans
 * Create a QC plan with checklist items.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.qcPlanCode || !body.qcPlanName || !body.qcType) {
    throw new BadRequestError('qcPlanCode, qcPlanName, and qcType are required');
  }
  if (!VALID_QC_TYPES.includes(body.qcType)) {
    throw new BadRequestError(`qcType must be one of: ${VALID_QC_TYPES.join(', ')}`);
  }

  // Check duplicate
  const existing = await prisma.qc_plans.findUnique({
    where: { tenant_id_qc_plan_code: { tenant_id: user.tenantId, qc_plan_code: body.qcPlanCode } },
  });
  if (existing) throw new ConflictError(`QC plan code '${body.qcPlanCode}' already exists`);

  const plan = await prisma.qc_plans.create({
    data: {
      tenant_id: user.tenantId,
      qc_plan_code: body.qcPlanCode,
      qc_plan_name: body.qcPlanName,
      qc_type: body.qcType,
      product_version_id: body.productVersionId,
      routing_step_id: body.routingStepId,
      status: 'active',
      qc_checklist_items: {
        create: (body.checklistItems || []).map(
          (item: { itemName: string; checkMethod?: string; expectedValue?: string; isRequired?: boolean }, idx: number) => ({
            tenant_id: user.tenantId,
            line_no: idx + 1,
            item_name: item.itemName,
            check_method: item.checkMethod,
            expected_value: item.expectedValue,
            is_required: item.isRequired ?? true,
          }),
        ),
      },
    },
    include: { qc_checklist_items: { orderBy: { line_no: 'asc' } } },
  });

  return json(plan, 201);
});
