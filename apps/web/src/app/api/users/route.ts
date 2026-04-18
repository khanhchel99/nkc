import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ConflictError, getSearchParams } from '@/lib/api-helpers';

const userSelect = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  tenant_id: true,
  status: true,
  created_at: true,
  user_roles: { include: { roles: true } },
} as const;

export const GET = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);
  const params = getSearchParams(request);
  const page = params.getNumber('page', 1);
  const limit = params.getNumber('limit', 20);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where: { tenant_id: user.tenantId },
      select: userSelect,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.users.count({ where: { tenant_id: user.tenantId } }),
  ]);

  return json({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const authUser = getAuthUser(request);
  const body = await request.json();
  const { email, password, fullName, phone, roleIds } = body;

  const existing = await prisma.users.findUnique({
    where: { tenant_id_email: { tenant_id: authUser.tenantId, email } },
  });
  if (existing) throw new ConflictError('Email already in use for this tenant');

  const password_hash = await bcrypt.hash(password, 12);

  const created = await prisma.users.create({
    data: {
      email,
      password_hash,
      full_name: fullName,
      phone,
      tenant_id: authUser.tenantId,
      user_roles: roleIds
        ? { create: roleIds.map((role_id: string) => ({ role_id })) }
        : undefined,
    },
    select: userSelect,
  });

  return json(created, 201);
});
