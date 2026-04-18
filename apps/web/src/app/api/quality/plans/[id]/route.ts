import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/quality/plans/[id]
 * Get QC plan detail with checklist items and inspections.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const plan = await prisma.qc_plans.findUnique({
    where: { id },
    include: {
      qc_checklist_items: { orderBy: { line_no: 'asc' } },
      qc_inspections: { orderBy: { created_at: 'desc' }, take: 10 },
    },
  });

  if (!plan || plan.tenant_id !== user.tenantId) {
    throw new NotFoundError('QC plan not found');
  }

  return json(plan);
});

/**
 * PATCH /api/quality/plans/[id]
 * Update QC plan status (active/inactive).
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;
  const body = await request.json();

  const plan = await prisma.qc_plans.findUnique({ where: { id } });
  if (!plan || plan.tenant_id !== user.tenantId) {
    throw new NotFoundError('QC plan not found');
  }

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.qcPlanName) data.qc_plan_name = body.qcPlanName;

  const updated = await prisma.qc_plans.update({
    where: { id },
    data,
    include: { qc_checklist_items: { orderBy: { line_no: 'asc' } } },
  });

  return json(updated);
});
