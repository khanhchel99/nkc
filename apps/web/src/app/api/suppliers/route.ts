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

  const [suppliers, total] = await Promise.all([
    prisma.suppliers.findMany({
      where: { tenant_id: user.tenantId },
      skip,
      take: limit,
    }),
    prisma.suppliers.count({ where: { tenant_id: user.tenantId } }),
  ]);

  return json({ data: suppliers, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const existing = await prisma.suppliers.findUnique({
    where: { tenant_id_supplier_code: { tenant_id: user.tenantId, supplier_code: body.supplierCode } },
  });
  if (existing) throw new ConflictError('Supplier code already exists');

  const supplier = await prisma.suppliers.create({
    data: {
      tenant_id: user.tenantId,
      supplier_code: body.supplierCode,
      supplier_name: body.supplierName,
      email: body.email,
      phone: body.phone,
      address: body.address,
    },
  });

  return json(supplier, 201);
});
