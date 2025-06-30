import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { AuthService } from '../../../../lib/auth-service';
import { verifyPassword, generateSessionId } from '../../../../lib/auth-utils';
import { db } from '../../../../server/db';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // First, try to find user in regular User table
    let user = await AuthService.getUserByEmail(validatedData.email);
    let userType: 'retail' | 'wholesale' = 'retail';

    // If not found in User table, try WholesaleUser table
    if (!user) {
      try {
        const wholesaleUser = await (db as any).wholesaleUser.findUnique({
          where: { email: validatedData.email },
          include: {
            role: true,
            company: true,
          },
        });

        if (wholesaleUser) {
          user = {
            id: wholesaleUser.id,
            email: wholesaleUser.email,
            name: wholesaleUser.name,
            passwordHash: wholesaleUser.passwordHash,
            role: {
              id: wholesaleUser.role.id,
              name: 'wholesale',
              description: wholesaleUser.role.description,
              rolePermissions: []
            },
            userType: 'wholesale' as const,
            companyId: wholesaleUser.companyId
          };
          userType = 'wholesale';
        }
      } catch (error) {
        console.log('Error checking wholesale users:', error);
      }
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session in the appropriate table
    const sessionToken = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (userType === 'wholesale') {
      // For wholesale users, create session in WholesaleSession table
      await (db as any).wholesaleSession.create({
        data: {
          userId: user.id,
          sessionToken,
          companyId: (user as any).companyId,
          expires: expiresAt,
        },
      });
    } else {
      await AuthService.createSession(user.id, sessionToken, expiresAt);
    }

    // Transform user for session
    const sessionUser = {
      id: user.id,
      email: user.email!,
      name: user.name!,
      role: user.role.name,
      permissions: user.role.rolePermissions?.map((rp: any) => rp.permission.name) || [],
      userType,
      companyId: (user as any).companyId,
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      user: sessionUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
