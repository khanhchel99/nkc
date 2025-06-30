import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// JWT secret for wholesale sessions
const JWT_SECRET = new TextEncoder().encode(process.env.WHOLESALE_JWT_SECRET || 'your-wholesale-jwt-secret-key');

export interface WholesaleUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    code: string;
  };
  role: {
    id: number;
    name: string;
    displayName: string;
    permissions: Record<string, boolean>;
  };
}

export interface WholesaleSession extends Record<string, any> {
  userId: string;
  companyId: string;
  roleId: number;
  iat: number;
  exp: number;
}

export class WholesaleAuth {
  // Create session token
  static async createSession(user: WholesaleUser): Promise<string> {
    const payload: WholesaleSession = {
      userId: user.id,
      companyId: user.companyId,
      roleId: user.role.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Note: For now, we're not storing sessions in the database
    // This will be implemented when we have real user data
    
    return token;
  }

  // Verify session token
  static async verifySession(token: string): Promise<WholesaleUser | null> {
    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: WholesaleSession };

      // For now, return mock user data from JWT payload
      // In production, this should validate against the database
      return {
        id: payload.userId,
        email: "test@hubsch.com", // Mock data
        name: "Test User",
        companyId: payload.companyId,
        company: {
          id: payload.companyId,
          name: "Hubsch",
          code: "HUBSCH",
        },
        role: {
          id: payload.roleId,
          name: "manager",
          displayName: "Manager",
          permissions: { canViewProducts: true, canCreateOrders: true },
        },
      };
    } catch (error) {
      console.error('Session verification failed:', error);
      return null;
    }
  }

  // Get current user from request
  static async getCurrentUser(request: NextRequest): Promise<WholesaleUser | null> {
    const token = request.cookies.get('wholesale-session')?.value;
    if (!token) return null;

    return this.verifySession(token);
  }

  // Login user
  static async login(email: string, password: string): Promise<{ user: WholesaleUser; token: string } | null> {
    const user = await db.wholesaleUser.findUnique({
      where: { email },
      include: {
        company: true,
        role: true,
      },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await db.wholesaleUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const transformedUser: WholesaleUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      company: {
        id: user.company.id,
        name: user.company.name,
        code: user.company.code,
      },
      role: {
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.displayName,
        permissions: user.role.permissions as Record<string, boolean>,
      },
    };

    const token = await this.createSession(transformedUser);

    return { user: transformedUser, token };
  }

  // Logout user
  static async logout(token: string): Promise<void> {
    await db.wholesaleSession.deleteMany({
      where: { sessionToken: token },
    });
  }

  // Check permission
  static hasPermission(user: WholesaleUser, permission: string): boolean {
    return user.role.permissions[permission] === true;
  }

  // Check if user belongs to company
  static belongsToCompany(user: WholesaleUser, companyId: string): boolean {
    return user.companyId === companyId;
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

// Middleware helper for API routes
export function withWholesaleAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const user = await WholesaleAuth.getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user to request context
    (request as any).user = user;
    return handler(request, context);
  };
}

// Permission middleware
export function withPermission(permission: string) {
  return function(handler: Function) {
    return withWholesaleAuth(async (request: NextRequest, context: any) => {
      const user = (request as any).user as WholesaleUser;
      
      if (!WholesaleAuth.hasPermission(user, permission)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return handler(request, context);
    });
  };
}
