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
  if (!product || !product.current_version_id) {
    throw new NotFoundError('Product or current version not found');
  }

  const bom = await prisma.bom_headers.create({
    data: {
      tenant_id: product.tenant_id,
      product_version_id: product.current_version_id,
      bom_code: body.bomCode,
      notes: body.description,
      bom_items: {
        create: (body.items as Array<{
          componentCode: string;
          componentName: string;
          componentType: string;
          itemId?: string;
          qtyPerProduct: number;
          uomCode: string;
          scrapPercent?: number;
        }>).map((item, idx) => ({
          tenant_id: product.tenant_id,
          line_no: idx + 1,
          component_code: item.componentCode,
          component_name: item.componentName,
          component_type: item.componentType,
          item_id: item.itemId,
          qty_per_product: item.qtyPerProduct,
          uom_code: item.uomCode,
          scrap_percent: item.scrapPercent ?? 0,
        })),
      },
    },
    include: { bom_items: true },
  });

  return json(bom, 201);
});
