import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, NotFoundError, BadRequestError } from '@/lib/api-helpers';

const VALID_STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'void'];
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['issued', 'void'],
  issued: ['partially_paid', 'paid', 'void'],
  partially_paid: ['paid', 'void'],
  paid: [],
  void: [],
};

/**
 * GET /api/billing/invoices/[id]
 */
export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.read');
  const { id } = context!.params;

  const invoice = await prisma.invoices.findUnique({
    where: { id },
    include: {
      invoice_lines: { orderBy: { line_no: 'asc' } },
      payment_receipts: { orderBy: { payment_date: 'desc' } },
    },
  });

  if (!invoice || invoice.tenant_id !== user.tenantId) {
    throw new NotFoundError('Invoice not found');
  }

  return json(invoice);
});

/**
 * PATCH /api/billing/invoices/[id]
 * Update invoice status or details.
 */
export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'billing.update');
  const { id } = context!.params;
  const body = await request.json();

  const invoice = await prisma.invoices.findUnique({ where: { id } });
  if (!invoice || invoice.tenant_id !== user.tenantId) {
    throw new NotFoundError('Invoice not found');
  }

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      throw new BadRequestError(`Invalid status: ${body.status}`);
    }
    const allowed = VALID_TRANSITIONS[invoice.status] || [];
    if (!allowed.includes(body.status)) {
      throw new BadRequestError(
        `Cannot transition from '${invoice.status}' to '${body.status}'`,
      );
    }
  }

  const updated = await prisma.invoices.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.dueDate !== undefined && { due_date: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { invoice_lines: { orderBy: { line_no: 'asc' } }, payment_receipts: true },
  });

  return json(updated);
});
