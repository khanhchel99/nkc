import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@nkc/database';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

const VALID_RESULTS = ['pending', 'passed', 'failed', 'partial'] as const;

/**
 * GET /api/quality/inspections/[id]
 * Get inspection detail with defects.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const inspection = await prisma.qc_inspections.findUnique({
    where: { id },
    include: {
      qc_plans: { include: { qc_checklist_items: { orderBy: { line_no: 'asc' } } } },
      qc_defects: { orderBy: { created_at: 'desc' } },
    },
  });

  if (!inspection || inspection.tenant_id !== user.tenantId) {
    throw new NotFoundError('Inspection not found');
  }

  return json(inspection);
});

/**
 * PATCH /api/quality/inspections/[id]
 * Record/update inspection results.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;
  const body = await request.json();

  const inspection = await prisma.qc_inspections.findUnique({ where: { id } });
  if (!inspection || inspection.tenant_id !== user.tenantId) {
    throw new NotFoundError('Inspection not found');
  }

  const data: Record<string, unknown> = {};

  if (body.result) {
    if (!VALID_RESULTS.includes(body.result)) {
      throw new BadRequestError(`result must be one of: ${VALID_RESULTS.join(', ')}`);
    }
    data.result = body.result;
  }
  if (body.passedQty !== undefined) data.passed_qty = new Prisma.Decimal(body.passedQty);
  if (body.failedQty !== undefined) data.failed_qty = new Prisma.Decimal(body.failedQty);
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.inspectedAt) data.inspected_at = new Date(body.inspectedAt);

  const updated = await prisma.qc_inspections.update({
    where: { id },
    data,
    include: { qc_defects: true },
  });

  return json(updated);
});
