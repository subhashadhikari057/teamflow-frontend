import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes anyone can access without a token
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/blog',
  '/changelog',
];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('access_token');

  // Let static assets, api routes, and Next internals through always
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Not logged in and trying to access a protected route
  if (!isPublic(pathname) && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in and visiting auth pages
  if (hasToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/nomor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
