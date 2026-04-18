import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, getSearchParams, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/billing/invoices
 * List invoices with optional filters.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.read');
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;
  const status = params.get('status');
  const customerId = params.get('customerId');

  const where = {
    tenant_id: user.tenantId,
    ...(status && { status }),
    ...(customerId && { customer_id: customerId }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoices.findMany({
      where,
      include: { invoice_lines: { orderBy: { line_no: 'asc' } } },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.invoices.count({ where }),
  ]);

  return json({ data: invoices, total, page, limit, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/billing/invoices
 * Create a new invoice with line items.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.create');
  const body = await request.json();

  if (!body.customerId) throw new BadRequestError('customerId is required');
  if (!body.invoiceDate) throw new BadRequestError('invoiceDate is required');
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw new BadRequestError('At least one line item is required');
  }

  // Verify customer exists
  const customer = await prisma.customers.findFirst({
    where: { id: body.customerId, tenant_id: user.tenantId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  // Validate lines and compute total
  let totalAmount = 0;
  const lineData = body.lines.map(
    (
      line: {
        description: string;
        quantity: number;
        unitPrice: number;
        salesOrderLineId?: string;
      },
      i: number,
    ) => {
      if (!line.description) throw new BadRequestError(`Line ${i + 1}: description is required`);
      if (!line.quantity || line.quantity <= 0) throw new BadRequestError(`Line ${i + 1}: quantity must be > 0`);
      if (line.unitPrice === undefined || line.unitPrice < 0) throw new BadRequestError(`Line ${i + 1}: unitPrice is required`);

      const lineAmount = Math.round(line.quantity * line.unitPrice * 100) / 100;
      totalAmount += lineAmount;
      return {
        tenant_id: user.tenantId,
        line_no: i + 1,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        line_amount: lineAmount,
        sales_order_line_id: line.salesOrderLineId || null,
      };
    },
  );

  const count = await prisma.invoices.count({ where: { tenant_id: user.tenantId } });
  const invoiceNo = generateOrderNumber('INV', count + 1);

  const invoice = await prisma.invoices.create({
    data: {
      tenant_id: user.tenantId,
      invoice_no: invoiceNo,
      customer_id: body.customerId,
      sales_order_id: body.salesOrderId || null,
      shipment_id: body.shipmentId || null,
      invoice_date: new Date(body.invoiceDate),
      due_date: body.dueDate ? new Date(body.dueDate) : null,
      currency_code: body.currencyCode || 'USD',
      total_amount: totalAmount,
      notes: body.notes || null,
      invoice_lines: {
        create: lineData,
      },
    },
    include: { invoice_lines: { orderBy: { line_no: 'asc' } } },
  });

  return json(invoice, 201);
});
