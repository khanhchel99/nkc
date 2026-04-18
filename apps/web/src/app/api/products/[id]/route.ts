import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const GET = apiHandler(async (
  _request: NextRequest,
  context,
) => {
  const { id } = context!.params;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      product_versions_product_versions_product_idToproducts: {
        include: {
          bom_headers: { include: { bom_items: true } },
          routings: { include: { routing_steps: true } },
          packing_specs: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!product) throw new NotFoundError('Product not found');
  return json(product);
});
