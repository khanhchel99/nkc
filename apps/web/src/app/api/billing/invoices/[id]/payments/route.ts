import { NextRequest } from 'next/server';
import { Prisma } from '@nkc/database';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { generateOrderNumber } from '@nkc/utils';
import { apiHandler, json, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * GET /api/billing/invoices/[id]/payments
 * List payments for an invoice.
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.read');
  const { id } = context!.params;

  const invoice = await prisma.invoices.findUnique({ where: { id } });
  if (!invoice || invoice.tenant_id !== user.tenantId) {
    throw new NotFoundError('Invoice not found');
  }

  const payments = await prisma.payment_receipts.findMany({
    where: { invoice_id: id, tenant_id: user.tenantId },
    orderBy: { payment_date: 'desc' },
  });

  return json({ data: payments });
});

/**
 * POST /api/billing/invoices/[id]/payments
 * Record a payment for an invoice. Auto-updates invoice paid_amount and status.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.create');
  const { id } = context!.params;
  const body = await request.json();

  if (!body.paymentDate) throw new BadRequestError('paymentDate is required');
  if (!body.amount || body.amount <= 0) throw new BadRequestError('amount must be > 0');

  const invoice = await prisma.invoices.findUnique({ where: { id } });
  if (!invoice || invoice.tenant_id !== user.tenantId) {
    throw new NotFoundError('Invoice not found');
  }
  if (['void', 'paid'].includes(invoice.status)) {
    throw new BadRequestError(`Cannot record payment for ${invoice.status} invoice`);
  }
  if (invoice.status === 'draft') {
    throw new BadRequestError('Invoice must be issued before recording payments');
  }

  const count = await prisma.payment_receipts.count({ where: { tenant_id: user.tenantId } });
  const receiptNo = generateOrderNumber('PAY', count + 1);

  const newPaidAmount = new Prisma.Decimal(invoice.paid_amount).plus(new Prisma.Decimal(body.amount));
  const totalAmount = new Prisma.Decimal(invoice.total_amount);
  const newStatus = newPaidAmount.gte(totalAmount) ? 'paid' : 'partially_paid';

  const [receipt] = await prisma.$transaction([
    prisma.payment_receipts.create({
      data: {
        tenant_id: user.tenantId,
        receipt_no: receiptNo,
        invoice_id: id,
        payment_date: new Date(body.paymentDate),
        amount: body.amount,
        payment_method: body.paymentMethod || null,
        reference_no: body.referenceNo || null,
        notes: body.notes || null,
      },
    }),
    prisma.invoices.update({
      where: { id },
      data: {
        paid_amount: newPaidAmount,
        status: newStatus,
      },
    }),
  ]);

  return json(receipt, 201);
});
