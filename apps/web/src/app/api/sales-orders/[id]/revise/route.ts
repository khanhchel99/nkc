import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const POST = apiHandler(async (
  request: NextRequest,
  context,
) => {
  const { id } = context!.params;
  const user = getAuthUser(request);
  const { changeReason } = await request.json();

  const order = await prisma.sales_orders.findUnique({
    where: { id },
    include: { sales_order_lines: true },
  });
  if (!order) throw new NotFoundError('Sales order not found');

  await prisma.order_revisions.create({
    data: {
      tenant_id: order.tenant_id,
      sales_order_id: id,
      revision_no: order.revision_no + 1,
      change_reason: changeReason,
      snapshot: JSON.parse(JSON.stringify(order)),
      created_by: user.userId,
    },
  });

  const updated = await prisma.sales_orders.update({
    where: { id },
    data: { status: 'revised', revision_no: order.revision_no + 1, updated_by: user.userId },
    include: { sales_order_lines: true },
  });

  return json(updated);
});
