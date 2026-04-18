import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

export const POST = apiHandler(async (
  request: NextRequest,
  context,
) => {
  const { id } = context!.params;
  const user = getAuthUser(request);

  const order = await prisma.sales_orders.findUnique({ where: { id } });
  if (!order) throw new NotFoundError('Sales order not found');
  if (order.status !== 'draft' && order.status !== 'pending_review') {
    throw new BadRequestError('Order can only be confirmed from draft or pending_review status');
  }

  const updated = await prisma.sales_orders.update({
    where: { id },
    data: { status: 'confirmed', updated_by: user.userId },
    include: { sales_order_lines: true },
  });

  return json(updated);
});
