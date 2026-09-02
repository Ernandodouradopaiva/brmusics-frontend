import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/recuperar-senha', '/sem-acesso'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hasAccessToken = request.cookies.has('BRMUSICS_ACCESS_TOKEN');

  if (!isPublic && !hasAccessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|sw\\.js|manifest\\.webmanifest|offline\\.html|assets|brmusics-api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|webmanifest)$).*)',
  ],
};
