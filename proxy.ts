import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes anyone can access without a token
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/invite',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/blog',
  '/changelog',
];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthRoute(pathname: string) {
  return pathname === '/login' || pathname === '/signup';
}

function normalizeRedirectPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
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
    const loginUrl = new URL('/login', request.url);
    const redirectTo = normalizeRedirectPath(`${pathname}${search}`);

    if (redirectTo && !isAuthRoute(pathname)) {
      loginUrl.searchParams.set('redirectTo', redirectTo);
    }

    return NextResponse.redirect(loginUrl);
  }

  // Already logged in and visiting auth pages
  if (hasToken && isAuthRoute(pathname)) {
    const redirectTo = normalizeRedirectPath(request.nextUrl.searchParams.get('redirectTo'));
    const nextPath = redirectTo && !isAuthRoute(redirectTo.split('?')[0] ?? '') ? redirectTo : '/workspace';

    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
