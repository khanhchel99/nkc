import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError, BadRequestError, getSearchParams } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customers.findMany({
      where: { tenant_id: user.tenantId },
      skip,
      take: limit,
    }),
    prisma.customers.count({ where: { tenant_id: user.tenantId } }),
  ]);

  const data = customers.map((c) => ({
    customerId: c.id,
    code: c.customer_code,
    name: c.customer_name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    status: c.status,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  // Accept both camelCase (from web UI) and explicit fields
  const customerCode = body.code ?? body.customerCode;
  const customerName = body.name ?? body.customerName;

  if (!customerCode || !customerName) {
    throw new BadRequestError('code (or customerCode) and name (or customerName) are required');
  }

  const existing = await prisma.customers.findUnique({
    where: { tenant_id_customer_code: { tenant_id: user.tenantId, customer_code: customerCode } },
  });
  if (existing) throw new ConflictError('Customer code already exists');

  const customer = await prisma.customers.create({
    data: {
      tenant_id: user.tenantId,
      customer_code: customerCode,
      customer_name: customerName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      payment_term: body.paymentTerm,
      currency_code: body.currencyCode,
    },
  });

  return json({
    customerId: customer.id,
    code: customer.customer_code,
    name: customer.customer_name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    status: customer.status,
  }, 201);
});
