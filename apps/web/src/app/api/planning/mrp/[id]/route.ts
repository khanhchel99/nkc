import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const plan = await prisma.material_requirement_plans.findFirst({
    where: { id, tenant_id: user.tenantId },
    include: {
      material_requirement_lines: {
        orderBy: { item_code: 'asc' },
      },
    },
  });

  if (!plan) throw new NotFoundError('MRP plan not found');

  // Compute summary stats
  const totalItems = plan.material_requirement_lines.length;
  const shortageItems = plan.material_requirement_lines.filter(
    (l) => l.shortage_qty.greaterThan(0),
  ).length;
  const fullyAvailable = totalItems - shortageItems;

  return json({
    ...plan,
    summary: {
      totalItems,
      shortageItems,
      fullyAvailable,
    },
  });
});
