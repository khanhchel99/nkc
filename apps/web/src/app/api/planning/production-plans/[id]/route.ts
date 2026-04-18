import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const plan = await prisma.production_plans.findFirst({
    where: { id, tenant_id: user.tenantId },
    include: {
      production_plan_lines: {
        orderBy: { priority_seq: 'asc' },
      },
    },
  });

  if (!plan) throw new NotFoundError('Production plan not found');

  // Compute summary
  const totalLines = plan.production_plan_lines.length;
  const byStatus = plan.production_plan_lines.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return json({
    ...plan,
    summary: {
      totalLines,
      byStatus,
    },
  });
});
