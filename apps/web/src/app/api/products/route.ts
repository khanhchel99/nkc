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

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: { tenant_id: user.tenantId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.products.count({ where: { tenant_id: user.tenantId } }),
  ]);

  const data = products.map((p) => ({
    productId: p.id,
    sku: p.product_code,
    name: p.product_name,
    category: p.category,
    activeVersionId: p.current_version_id,
    status: p.status,
    createdAt: p.created_at,
  }));

  return json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const body = await request.json();

  // Accept both camelCase (from web UI) and explicit field names
  const productCode = body.sku ?? body.productCode ?? body.product_code;
  const productName = body.name ?? body.productName ?? body.product_name;
  const category = body.category ?? 'general';

  if (!productCode || !productName) {
    throw new BadRequestError('sku (or productCode) and name (or productName) are required');
  }

  const existing = await prisma.products.findUnique({
    where: { tenant_id_product_code: { tenant_id: user.tenantId, product_code: productCode } },
  });
  if (existing) throw new ConflictError('Product code already exists');

  const product = await prisma.products.create({
    data: {
      tenant_id: user.tenantId,
      product_code: productCode,
      product_name: productName,
      category,
      length_mm: body.lengthMm,
      width_mm: body.widthMm,
      height_mm: body.heightMm,
      main_material: body.mainMaterial,
      weight_net_kg: body.weightNetKg,
      weight_gross_kg: body.weightGrossKg,
      cbm: body.cbm,
    },
  });

  return json({
    productId: product.id,
    sku: product.product_code,
    name: product.product_name,
    category: product.category,
    activeVersionId: product.current_version_id,
    status: product.status,
    createdAt: product.created_at,
  }, 201);
});
