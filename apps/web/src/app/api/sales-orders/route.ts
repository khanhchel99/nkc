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
      include: { sales_order_lines: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.sales_orders.count({ where: { tenant_id: user.tenantId } }),
  ]);

  return json({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
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
