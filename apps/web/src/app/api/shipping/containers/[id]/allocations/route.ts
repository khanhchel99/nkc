import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requirePermissions } from '@/lib/auth';
import { apiHandler, json, BadRequestError, NotFoundError } from '@/lib/api-helpers';

/**
 * POST /api/shipping/containers/[id]/allocations
 * Allocate packing units to a container.
 */
export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = getAuthUser(request);
  requirePermissions(user, 'shipping.create');
  const { id } = context!.params;
  const body = await request.json();

  const container = await prisma.containers.findUnique({ where: { id } });
  if (!container || container.tenant_id !== user.tenantId) {
    throw new NotFoundError('Container not found');
  }
  if (container.status !== 'open') {
    throw new BadRequestError('Can only allocate to open containers');
  }

  if (!Array.isArray(body.allocations) || body.allocations.length === 0) {
    throw new BadRequestError('allocations array is required');
  }

  // Get current max sequence
  const maxSeq = await prisma.container_allocations.aggregate({
    where: { container_id: id },
    _max: { allocation_seq: true },
  });
  let seq = maxSeq._max.allocation_seq || 0;

  const created = await prisma.$transaction(
    body.allocations.map(
      (alloc: { packingUnitId: string; allocatedCbm?: number; allocatedWeightKg?: number }) => {
        if (!alloc.packingUnitId) {
          throw new BadRequestError('Each allocation requires packingUnitId');
        }
        seq++;
        return prisma.container_allocations.create({
          data: {
            tenant_id: user.tenantId,
            container_id: id,
            packing_unit_id: alloc.packingUnitId,
            allocation_seq: seq,
            allocated_cbm: alloc.allocatedCbm || null,
            allocated_weight_kg: alloc.allocatedWeightKg || null,
          },
        });
      },
    ),
  );

  // Update packing unit status to allocated
  const puIds = body.allocations.map((a: { packingUnitId: string }) => a.packingUnitId);
  await prisma.packing_units.updateMany({
    where: { id: { in: puIds }, tenant_id: user.tenantId, status: 'packed' },
    data: { status: 'allocated' },
  });

  return json({ data: created }, 201);
});
