import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge-compatible Middleware to protect Admin Routes.
 * Screens for '/builder', '/orders', '/pos', '/dashboard', and '/settings' sub-directories
 * and verifies authentication credentials transparently.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match admin functional routes defined in architecture
  const isAdminRoute =
    pathname.includes('/builder') ||
    pathname.includes('/orders') ||
    pathname.includes('/pos') ||
    pathname.includes('/dashboard') ||
    pathname.includes('/settings');

  if (isAdminRoute) {
    // Collect all cookies and detect Supabase standard session tokens
    const allCookies = request.cookies.getAll();
    const hasSupabaseSession = allCookies.some((cookie) =>
      cookie.name.startsWith('sb-')
    );

    if (!hasSupabaseSession) {
      // Redirect to login page and preserve original target path
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Configure middleware path matching.
 * Excludes static files, Next.js internal variables, api endpoints, and media folders.
 */
export const config = {
  matcher: [
    // Matches all routes except api, static assets, and dev files
    '/((?!_next/static|_next/image|favicon.ico|api/sync|api/webhooks|.*\\.).*)',
  ],
};
