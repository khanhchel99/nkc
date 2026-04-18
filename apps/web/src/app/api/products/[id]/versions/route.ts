import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const POST = apiHandler(async (
  request: NextRequest,
  context,
) => {
  const { id: productId } = context!.params;
  const body = await request.json();

  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  const version = await prisma.product_versions.create({
    data: {
      tenant_id: product.tenant_id,
      product_id: productId,
      version_no: body.versionNo,
      effective_from: new Date(body.effectiveFrom),
      effective_to: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
      notes: body.notes,
    },
  });

  await prisma.products.update({
    where: { id: productId },
    data: { current_version_id: version.id },
  });

  return json(version, 201);
});
