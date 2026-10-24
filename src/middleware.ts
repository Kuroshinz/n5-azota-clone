import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth routes, static files, and internal Next.js assets
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/exam/') || // allow public exam room access via QR code / link
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|webp|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // 1b. Allow public APIs for exam room & student submissions:
  // - GET /api/exams/:id (getting exam details to take test)
  // - POST /api/submissions (submitting exam answers)
  if (
    (pathname.match(/^\/api\/exams\/[^/]+$/) && request.method === 'GET') ||
    (pathname === '/api/submissions' && request.method === 'POST')
  ) {
    return NextResponse.next();
  }

  // 2. Check authentication token in cookies and headers
  let token = request.cookies.get('azota_token')?.value;

  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader && cookieHeader.includes('azota_token=')) {
      const match = cookieHeader.match(/azota_token=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    // If API route: return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thực hiện thao tác này' },
        { status: 401 }
      );
    }

    // If web page: redirect to /login with redirect return parameter
    const loginUrl = new URL('/login', request.url);
    const redirectTarget = pathname + request.nextUrl.search;
    if (redirectTarget !== '/') {
      loginUrl.searchParams.set('redirect', redirectTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
