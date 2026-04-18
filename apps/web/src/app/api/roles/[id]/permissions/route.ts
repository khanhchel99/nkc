import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, json, NotFoundError } from '@/lib/api-helpers';

export const POST = apiHandler(async (
  request: NextRequest,
  context,
) => {
  const { id: roleId } = context!.params;
  const { permissionIds } = await request.json();

  const role = await prisma.roles.findUnique({ where: { id: roleId } });
  if (!role) throw new NotFoundError('Role not found');

  await prisma.role_permissions.deleteMany({ where: { role_id: roleId } });

  await prisma.role_permissions.createMany({
    data: (permissionIds as string[]).map((permission_id) => ({ role_id: roleId, permission_id })),
  });

  const updated = await prisma.roles.findUnique({
    where: { id: roleId },
    include: { role_permissions: { include: { permissions: true } } },
  });

  return json(updated);
});
