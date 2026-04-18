import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  siteId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  siteId?: string;
}

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: '15m' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET()) as JwtPayload;
}

export function extractBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function getAuthUser(request: NextRequest): AuthUser {
  const token = extractBearerToken(request);
  if (!token) throw new AuthError('Missing authorization token', 401);

  try {
    const payload = verifyToken(token);
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      siteId: payload.siteId,
    };
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }
}

export function requirePermissions(user: AuthUser, ...permissions: string[]): void {
  if (user.roles.includes('admin')) return; // Admin bypass
  const missing = permissions.filter((p) => !user.permissions.includes(p));
  if (missing.length > 0) {
    throw new AuthError(`Missing permissions: ${missing.join(', ')}`, 403);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
