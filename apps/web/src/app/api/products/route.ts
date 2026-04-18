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

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: { tenant_id: user.tenantId },
      include: {
        product_versions_product_versions_product_idToproducts: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.products.count({ where: { tenant_id: user.tenantId } }),
  ]);

  return json({ data: products, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  const existing = await prisma.products.findUnique({
    where: { tenant_id_product_code: { tenant_id: user.tenantId, product_code: body.productCode } },
  });
  if (existing) throw new ConflictError('Product code already exists');

  const product = await prisma.products.create({
    data: {
      tenant_id: user.tenantId,
      product_code: body.productCode,
      product_name: body.productName,
      category: body.category,
      length_mm: body.lengthMm,
      width_mm: body.widthMm,
      height_mm: body.heightMm,
      main_material: body.mainMaterial,
      weight_net_kg: body.weightNetKg,
      weight_gross_kg: body.weightGrossKg,
      cbm: body.cbm,
    },
  });

  return json(product, 201);
});
