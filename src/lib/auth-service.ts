import { db } from '../server/db';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  userType: 'retail' | 'wholesale'; // Add user type to distinguish between User and WholesaleUser
  companyId?: string; // For wholesale users
}

export class AuthService {
  static async getUserById(id: string) {
    return await db.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  static async getUserByEmail(email: string) {
    return await db.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  static async createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    phone?: string;
    roleId?: number;
  }) {
    return await db.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: userData.passwordHash,
        phone: userData.phone,
        roleId: userData.roleId || 1, // Default to retail customer
        emailVerified: new Date(), // Auto-verify for now
      },
    });
  }

  static async createSession(userId: string, sessionToken: string, expires: Date) {
    return await db.session.create({
      data: {
        userId,
        sessionToken,
        expires,
      },
    });
  }

  static async getSessionByToken(sessionToken: string) {
    return await db.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async deleteSession(sessionToken: string) {
    return await db.session.delete({
      where: { sessionToken },
    });
  }

  static async deleteExpiredSessions() {
    return await db.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
  }

  static transformUserToSessionUser(user: any): SessionUser {
    return {
      id: user.id,
      email: user.email!,
      name: user.name!,
      role: user.role.name,
      permissions: user.role.rolePermissions?.map((rp: any) => rp.permission.name) || [],
      userType: user.userType || 'retail',
      companyId: user.companyId,
    };
  }

  static hasPermission(user: SessionUser, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  static hasRole(user: SessionUser, role: string): boolean {
    return user.role === role;
  }

  static isAdmin(user: SessionUser): boolean {
    return user.role === 'admin';
  }

  static isWholesale(user: SessionUser): boolean {
    return user.role === 'wholesale';
  }

  static isRetail(user: SessionUser): boolean {
    return user.role === 'retail';
  }
}
