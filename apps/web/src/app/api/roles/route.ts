import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError } from '@/lib/api-helpers';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);

  const roles = await prisma.roles.findMany({
    where: { tenant_id: user.tenantId },
    include: { role_permissions: { include: { permissions: true } } },
  });

  return json(roles);
});

export const POST = apiHandler(async (request: NextRequest) => {
  const authUser = getAuthUser(request);
  const { code, name, permissionIds } = await request.json();

  const existing = await prisma.roles.findUnique({
    where: { tenant_id_code: { tenant_id: authUser.tenantId, code } },
  });
  if (existing) throw new ConflictError('Role code already exists for this tenant');

  const role = await prisma.roles.create({
    data: {
      tenant_id: authUser.tenantId,
      code,
      name,
      role_permissions: permissionIds
        ? { create: permissionIds.map((permission_id: string) => ({ permission_id })) }
        : undefined,
    },
    include: { role_permissions: { include: { permissions: true } } },
  });

  return json(role, 201);
});
