import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '../../../../lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (sessionToken) {
      // Delete session from database
      try {
        await AuthService.deleteSession(sessionToken);
      } catch (error) {
        // Session might not exist in database, which is fine
        console.log('Session not found in database:', error);
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
