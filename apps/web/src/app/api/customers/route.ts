import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError, getSearchParams } from '@/lib/api-helpers';

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

  return json({ data: customers, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const existing = await prisma.customers.findUnique({
    where: { tenant_id_customer_code: { tenant_id: user.tenantId, customer_code: body.customerCode } },
  });
  if (existing) throw new ConflictError('Customer code already exists');

  const customer = await prisma.customers.create({
    data: {
      tenant_id: user.tenantId,
      customer_code: body.customerCode,
      customer_name: body.customerName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      payment_term: body.paymentTerm,
      currency_code: body.currencyCode,
    },
  });

  return json(customer, 201);
});
