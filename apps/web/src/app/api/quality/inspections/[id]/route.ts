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

  return json({
    id: inspection.id,
    inspectionId: inspection.id,
    inspection_no: inspection.inspection_no,
    inspectionNumber: inspection.inspection_no,
    ref_type: inspection.ref_type,
    ref_id: inspection.ref_id,
    result: inspection.result,
    status: inspection.result,
    inspected_qty: Number(inspection.inspected_qty),
    passed_qty: Number(inspection.passed_qty),
    failed_qty: Number(inspection.failed_qty),
    notes: inspection.notes,
    inspected_at: inspection.inspected_at,
    created_at: inspection.created_at,
    qc_plans: inspection.qc_plans
      ? {
          id: inspection.qc_plans.id,
          plan_name: inspection.qc_plans.qc_plan_name,
          qc_plan_name: inspection.qc_plans.qc_plan_name,
          qc_plan_code: inspection.qc_plans.qc_plan_code,
          qc_checklist_items: inspection.qc_plans.qc_checklist_items.map((item) => ({
            id: item.id,
            seq: item.line_no,
            line_no: item.line_no,
            check_point: item.item_name,
            item_name: item.item_name,
            method: item.check_method,
            check_method: item.check_method,
            accept_criteria: item.expected_value,
            expected_value: item.expected_value,
            is_required: item.is_required,
          })),
        }
      : null,
    qc_defects: inspection.qc_defects.map((d) => ({
      id: d.id,
      defect_type: d.defect_name,
      defect_name: d.defect_name,
      defect_code: d.defect_code,
      description: d.notes,
      notes: d.notes,
      qty: Number(d.defect_qty),
      defect_qty: Number(d.defect_qty),
      severity: d.severity,
      disposition: d.disposition,
      created_at: d.created_at,
    })),
  });
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
