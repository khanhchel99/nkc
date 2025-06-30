import { cookies } from 'next/headers';
import { AuthService, type SessionUser } from './auth-service';
import { db } from '../server/db';

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    // First try regular session
    let sessionWithUser = await AuthService.getSessionByToken(sessionToken) as any;
    
    // If not found in regular sessions, try wholesale sessions
    if (!sessionWithUser) {
      try {
        const wholesaleSession = await (db as any).wholesaleSession.findUnique({
          where: { sessionToken },
          include: {
            user: {
              include: {
                role: true,
                company: true,
              },
            },
          },
        });

        if (wholesaleSession) {
          // Transform wholesale session to match expected structure
          sessionWithUser = {
            ...wholesaleSession,
            expires: wholesaleSession.expires, // Field is already named 'expires' in schema
            user: {
              ...wholesaleSession.user,
              userType: 'wholesale' as const,
              role: {
                id: wholesaleSession.user.role.id,
                name: 'wholesale',
                description: wholesaleSession.user.role.description,
                rolePermissions: []
              },
              companyId: wholesaleSession.user.companyId
            }
          };
        }
      } catch (error) {
        console.log('Error checking wholesale sessions:', error);
      }
    }
    
    if (!sessionWithUser || !sessionWithUser.user) {
      return null;
    }

    // Check if session is expired
    if (sessionWithUser.expires < new Date()) {
      return null;
    }

    // Transform the user data to SessionUser format
    return AuthService.transformUserToSessionUser(sessionWithUser.user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export async function requireRole(role: string): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (!AuthService.hasRole(user, role)) {
    throw new Error(`Access denied. Required role: ${role}`);
  }
  
  return user;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (!AuthService.hasPermission(user, permission)) {
    throw new Error(`Access denied. Required permission: ${permission}`);
  }
  
  return user;
}
