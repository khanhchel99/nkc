import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * POST /api/sales-orders/manual
 * Manual order creation — accepts product codes & customer code instead of IDs.
 * Use this when the Excel import is not suitable.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  if (!body.customerCode) throw new BadRequestError('customerCode is required');
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw new BadRequestError('At least one line is required');
  }

  // Look up customer by code
  const customer = await prisma.customers.findUnique({
    where: { tenant_id_customer_code: { tenant_id: user.tenantId, customer_code: body.customerCode } },
  });
  if (!customer) throw new NotFoundError(`Customer "${body.customerCode}" not found`);

  // Look up products by code
  const productCodes = (body.lines as Array<{ productCode: string }>).map((l) => l.productCode);
  const products = await prisma.products.findMany({
    where: { tenant_id: user.tenantId, product_code: { in: productCodes }, status: 'active' },
    include: {
      product_versions_products_current_version_idToproduct_versions: true,
    },
  });
  const productMap = new Map(products.map((p) => [p.product_code, p]));

  // Validate all product codes exist
  for (const code of productCodes) {
    if (!productMap.has(code)) throw new NotFoundError(`Product "${code}" not found`);
  }

  const count = await prisma.sales_orders.count({ where: { tenant_id: user.tenantId } });
  const orderNo = generateOrderNumber('SO', count + 1);

  const lines = (body.lines as Array<{
    productCode: string;
    quantity: number;
    unitPrice: number;
    requestedETD?: string;
    priority?: string;
    notes?: string;
  }>);

  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const order = await prisma.sales_orders.create({
    data: {
      tenant_id: user.tenantId,
      order_no: orderNo,
      customer_id: customer.id,
      po_number: body.poNumber,
      order_date: body.orderDate ? new Date(body.orderDate) : new Date(),
      requested_etd: body.requestedETD ? new Date(body.requestedETD) : undefined,
      currency_code: body.currencyCode ?? customer.currency_code ?? 'USD',
      payment_term: body.paymentTerm ?? customer.payment_term,
      total_amount: totalAmount,
      notes: body.notes,
      created_by: user.userId,
      sales_order_lines: {
        create: lines.map((line, idx) => {
          const product = productMap.get(line.productCode)!;
          return {
            tenant_id: user.tenantId,
            line_no: idx + 1,
            product_id: product.id,
            product_version_id: product.current_version_id,
            product_code: product.product_code,
            product_name: product.product_name,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            requested_etd: line.requestedETD ? new Date(line.requestedETD) : undefined,
            priority: line.priority || 'normal',
            notes: line.notes,
          };
        }),
      },
    },
    include: { sales_order_lines: true },
  });

  return json(order, 201);
});
