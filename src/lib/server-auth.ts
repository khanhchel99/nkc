import { cookies } from 'next/headers';
import { AuthService, type SessionUser } from './auth-service';

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    const sessionWithUser = await AuthService.getSessionByToken(sessionToken) as any;
    
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
