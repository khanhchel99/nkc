import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (
  request: NextRequest,
  context,
) => {
  const user = getAuthUser(request);
  const { id } = context!.params;

  const order = await prisma.sales_orders.findUnique({
    where: { id, tenant_id: user.tenantId },
    include: { sales_order_lines: true, order_revisions: true },
  });

  if (!order) throw new NotFoundError('Sales order not found');

  // Look up customer name
  const customer = await prisma.customers.findUnique({
    where: { id: order.customer_id },
    select: { customer_name: true, customer_code: true },
  });

  return json({
    orderId: order.id,
    orderNumber: order.order_no,
    customerId: order.customer_id,
    customerName: customer?.customer_name ?? order.customer_id,
    status: order.status,
    orderDate: order.order_date,
    requestedDate: order.requested_etd,
    notes: order.notes,
    totalAmount: Number(order.total_amount),
    priority: order.priority,
    lines: order.sales_order_lines.map((l) => ({
      lineId: l.id,
      lineNumber: l.line_no,
      productId: l.product_id,
      productName: l.product_name,
      sku: l.product_code,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      requestedDate: l.requested_etd,
      status: l.status,
      notes: l.notes,
    })),
  });
});
