import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, getSearchParams } from '@/lib/api-helpers';

/**
 * GET /api/quality/defects
 * List all defects for the tenant, joined with inspection number.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 50);
  const skip = (page - 1) * limit;
  const severity = params.get('severity');
  const disposition = params.get('disposition');

  const where = {
    tenant_id: user.tenantId,
    ...(severity && { severity }),
    ...(disposition && { disposition }),
  };

  const [defects, total] = await Promise.all([
    prisma.qc_defects.findMany({
      where,
      include: {
        qc_inspections: {
          select: { inspection_no: true },
        },
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.qc_defects.count({ where }),
  ]);

  const data = defects.map((d) => ({
    defectId: d.id,
    inspectionNumber: d.qc_inspections?.inspection_no ?? null,
    defectCode: d.defect_code,
    defectType: d.defect_name,
    severity: d.severity,
    description: d.notes ?? null,
    disposition: d.disposition,
    createdAt: d.created_at,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});
