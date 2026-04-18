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

  const routing = await prisma.routings.create({
    data: {
      tenant_id: product.tenant_id,
      product_version_id: product.current_version_id,
      routing_code: body.routingCode,
      routing_steps: {
        create: (body.steps as Array<{
          stepNo: number;
          stepCode: string;
          stepName: string;
          workCenterId: string;
          standardMinutes?: number;
        }>).map((step) => ({
          tenant_id: product.tenant_id,
          step_no: step.stepNo,
          step_code: step.stepCode,
          step_name: step.stepName,
          work_center_id: step.workCenterId,
          standard_minutes: step.standardMinutes ?? 0,
        })),
      },
    },
    include: { routing_steps: true },
  });

  return json(routing, 201);
});
