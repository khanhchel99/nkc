import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.sales_orders.findMany({
      where: { tenant_id: user.tenantId },
      include: { sales_order_lines: { select: { id: true } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.sales_orders.count({ where: { tenant_id: user.tenantId } }),
  ]);

  // Resolve customer names with a single secondary query
  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const customers = customerIds.length
    ? await prisma.customers.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, customer_name: true },
      })
    : [];
  const customerMap = new Map(customers.map((c) => [c.id, c.customer_name]));

  const data = orders.map((o) => ({
    orderId: o.id,
    orderNumber: o.order_no,
    customerName: customerMap.get(o.customer_id) ?? o.customer_id,
    status: o.status,
    orderDate: o.order_date,
    requestedDate: o.requested_etd,
    totalLines: o.sales_order_lines.length,
    totalAmount: Number(o.total_amount),
    priority: o.priority,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const count = await prisma.sales_orders.count({ where: { tenant_id: user.tenantId } });
  const orderNo = generateOrderNumber('SO', count + 1);

  const totalAmount = (body.lines as Array<{ quantity: number; unitPrice: number }>).reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0,
  );

  const order = await prisma.sales_orders.create({
    data: {
      tenant_id: user.tenantId,
      order_no: orderNo,
      customer_id: body.customerId,
      po_number: body.poNumber,
      order_date: new Date(body.orderDate),
      requested_etd: body.requestedETD ? new Date(body.requestedETD) : undefined,
      currency_code: body.currencyCode ?? 'USD',
      payment_term: body.paymentTerm,
      total_amount: totalAmount,
      created_by: user.userId,
      sales_order_lines: {
        create: (body.lines as Array<{
          productId: string;
          productCode: string;
          productName: string;
          quantity: number;
          unitPrice: number;
          requestedETD?: string;
          priority?: string;
          notes?: string;
        }>).map((line, idx) => ({
          tenant_id: user.tenantId,
          line_no: idx + 1,
          product_id: line.productId,
          product_code: line.productCode,
          product_name: line.productName,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          requested_etd: line.requestedETD ? new Date(line.requestedETD) : undefined,
          priority: line.priority || 'normal',
          notes: line.notes,
        })),
      },
    },
    include: { sales_order_lines: true },
  });

  return json(order, 201);
});
