import { NextRequest } from 'next/server';
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

interface WholesaleSession {
  userId: string;
  companyId: string;
  roleId: number;
  iat: number;
  exp: number;
  [key: string]: any; // Index signature for JWT compatibility
}

export class WholesaleAuth {
  // Create session token (simplified version without database storage)
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

    return token;
  }

  // Verify session token (simplified version)
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

  // Get user from request
  static async getUserFromRequest(req: NextRequest): Promise<WholesaleUser | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    
    return this.verifySession(token);
  }

  // Check if user has permission
  static hasPermission(user: WholesaleUser, permission: string): boolean {
    return user.role.permissions[permission] === true;
  }

  // Check if user belongs to company
  static belongsToCompany(user: WholesaleUser, companyId: string): boolean {
    return user.companyId === companyId;
  }

  // Validate company access for resource
  static validateCompanyAccess(user: WholesaleUser, resourceCompanyId: string): boolean {
    return user.companyId === resourceCompanyId;
  }
}

// Auth middleware for API routes
export function withWholesaleAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const user = await WholesaleAuth.getUserFromRequest(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user to request object
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
