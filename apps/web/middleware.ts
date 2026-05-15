import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect user app routes
  if (pathname.startsWith('/app/')) {
    const hasSession = request.cookies.has('user_session');
    if (!hasSession) {
      return NextResponse.redirect(new URL('/user/verify-code', request.url));
    }
  }

  // Protect admin routes (except the login page itself)
  if (pathname.startsWith('/admin/') && pathname !== '/admin/login') {
    const hasAdminSession = request.cookies.has('admin_session');
    if (!hasAdminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
