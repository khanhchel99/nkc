import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@nkc/database';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

const VALID_SEVERITIES = ['minor', 'major', 'critical'] as const;
const VALID_DISPOSITIONS = ['rework', 'scrap', 'use_as_is', 'hold'] as const;

/**
 * GET /api/quality/inspections/[id]/defects
 * List defects for an inspection.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: inspectionId } = context!.params;

  const inspection = await prisma.qc_inspections.findUnique({ where: { id: inspectionId } });
  if (!inspection || inspection.tenant_id !== user.tenantId) {
    throw new NotFoundError('Inspection not found');
  }

  const defects = await prisma.qc_defects.findMany({
    where: { qc_inspection_id: inspectionId, tenant_id: user.tenantId },
    orderBy: { created_at: 'desc' },
  });

  return json({ data: defects });
});

/**
 * POST /api/quality/inspections/[id]/defects
 * Log a defect for an inspection with disposition.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id: inspectionId } = context!.params;
  const body = await request.json();

  const inspection = await prisma.qc_inspections.findUnique({ where: { id: inspectionId } });
  if (!inspection || inspection.tenant_id !== user.tenantId) {
    throw new NotFoundError('Inspection not found');
  }

  if (!body.defectName || !body.severity || !body.disposition) {
    throw new BadRequestError('defectName, severity, and disposition are required');
  }
  if (!VALID_SEVERITIES.includes(body.severity)) {
    throw new BadRequestError(`severity must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }
  if (!VALID_DISPOSITIONS.includes(body.disposition)) {
    throw new BadRequestError(`disposition must be one of: ${VALID_DISPOSITIONS.join(', ')}`);
  }

  const defect = await prisma.qc_defects.create({
    data: {
      tenant_id: user.tenantId,
      qc_inspection_id: inspectionId,
      defect_code: body.defectCode,
      defect_name: body.defectName,
      severity: body.severity,
      defect_qty: body.defectQty ? new Prisma.Decimal(body.defectQty) : new Prisma.Decimal(0),
      disposition: body.disposition,
      notes: body.notes,
    },
  });

  // Update inspection failed_qty if defectQty provided
  if (body.defectQty && body.defectQty > 0) {
    await prisma.qc_inspections.update({
      where: { id: inspectionId },
      data: {
        failed_qty: { increment: new Prisma.Decimal(body.defectQty) },
      },
    });
  }

  return json(defect, 201);
});
