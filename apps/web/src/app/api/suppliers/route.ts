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

  const [suppliers, total] = await Promise.all([
    prisma.suppliers.findMany({
      where: { tenant_id: user.tenantId },
      skip,
      take: limit,
    }),
    prisma.suppliers.count({ where: { tenant_id: user.tenantId } }),
  ]);

  const data = suppliers.map((s) => ({
    supplierId: s.id,
    code: s.supplier_code,
    name: s.supplier_name,
    email: s.email,
    phone: s.phone,
    address: s.address,
    leadTimeDays: s.lead_time_days,
    status: s.status,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  // Accept both camelCase (from web UI) and explicit fields
  const supplierCode = body.code ?? body.supplierCode;
  const supplierName = body.name ?? body.supplierName;

  if (!supplierCode || !supplierName) {
    throw new BadRequestError('code (or supplierCode) and name (or supplierName) are required');
  }

  const existing = await prisma.suppliers.findUnique({
    where: { tenant_id_supplier_code: { tenant_id: user.tenantId, supplier_code: supplierCode } },
  });
  if (existing) throw new ConflictError('Supplier code already exists');

  const supplier = await prisma.suppliers.create({
    data: {
      tenant_id: user.tenantId,
      supplier_code: supplierCode,
      supplier_name: supplierName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      lead_time_days: body.leadTimeDays ?? body.lead_time_days ?? 0,
    },
  });

  return json({
    supplierId: supplier.id,
    code: supplier.supplier_code,
    name: supplier.supplier_name,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    leadTimeDays: supplier.lead_time_days,
    status: supplier.status,
  }, 201);
});
