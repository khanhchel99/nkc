import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (
  _request: NextRequest,
  context,
) => {
  const { id } = context!.params;

  const order = await prisma.sales_orders.findUnique({
    where: { id },
    include: { sales_order_lines: true, order_revisions: true },
  });

  if (!order) throw new NotFoundError('Sales order not found');
  return json(order);
});
