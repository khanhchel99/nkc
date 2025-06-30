import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '../../../../lib/auth-service';
import { db } from '../../../../server/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (sessionToken) {
      // Delete session from database (try both regular and wholesale sessions)
      try {
        await AuthService.deleteSession(sessionToken);
      } catch (error) {
        // Try wholesale session table
        try {
          await (db as any).wholesaleSession.delete({
            where: { sessionToken },
          });
        } catch (wholesaleError) {
          console.log('Session not found in either table');
        }
      }
    }

    // Clear session cookie
    cookieStore.delete('session');

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
