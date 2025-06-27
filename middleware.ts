import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected route
  const protectedRoutes = ['/profile', '/admin', '/wholesale'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      // Redirect to login if no session
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // TODO: Add role-based route protection here
    // For now, just check if session exists
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/wholesale/:path*'],
};