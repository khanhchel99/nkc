import { NextRequest } from 'next/server';
import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-for-unit-tests';

export const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000010';
export const TEST_USER_EMAIL = 'admin@nkc.com';

export interface MockAuthOptions {
  userId?: string;
  tenantId?: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

export function createTestToken(opts: MockAuthOptions = {}): string {
  return jwt.sign(
    {
      sub: opts.userId ?? TEST_USER_ID,
      tenantId: opts.tenantId ?? TEST_TENANT_ID,
      email: opts.email ?? TEST_USER_EMAIL,
      roles: opts.roles ?? ['admin'],
      permissions: opts.permissions ?? [],
    },
    TEST_JWT_SECRET,
    { expiresIn: '15m' },
  );
}

/**
 * Create a NextRequest with auth header and optional body.
 */
export function createRequest(
  url: string,
  opts: {
    method?: string;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {},
): NextRequest {
  const fullUrl = `http://localhost:3100${url}`;
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opts.token !== null && {
        authorization: `Bearer ${opts.token ?? createTestToken()}`,
      }),
      ...opts.headers,
    },
  };
  if (opts.body) {
    init.body = JSON.stringify(opts.body);
  }
  return new NextRequest(fullUrl, init);
}

/**
 * Parse NextResponse JSON body
 */
export async function parseResponse(response: Response) {
  const body = await response.json();
  return { status: response.status, body };
}

/**
 * Setup JWT_SECRET env for auth module
 */
export function setupEnv() {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
}

/**
 * Get the mock prisma instance from the mocked module
 */
export function getMockPrisma() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/prisma');
  return prisma;
}

/**
 * Create context params for dynamic routes
 */
export function createRouteContext(params: Record<string, string>) {
  return { params };
}

/**
 * UUID helper
 */
export function uuid(n = 1): string {
  return `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;
}
