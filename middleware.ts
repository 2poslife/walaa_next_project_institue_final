/**
 * Next.js Middleware for Authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { API_ROUTES, HTTP_STATUS } from '@/lib/constants';
import { config as appConfig } from '@/lib/config';
import { JWTPayload } from '@/lib/auth';

// Routes that require authentication
const protectedRoutes = [
  '/api/teachers',
  '/api/students',
  '/api/lessons',
  '/api/payments',
  '/api/pricing',
  '/api/statistics',
  '/api/reports',
  '/api/education-levels',
  '/api/profile',
  '/api/group-pricing-tiers',
];

// Routes that require admin role
const adminRoutes = [
  '/api/teachers',
  '/api/payments',
  '/api/pricing',
  '/api/statistics',
  '/api/reports',
  '/api/group-pricing-tiers',
];

// Public routes (no authentication required)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/refresh',
];

async function verifyTokenInMiddleware(token: string): Promise<JWTPayload> {
  if (!appConfig.jwt.secret) {
    throw new Error('JWT secret is not configured');
  }

  const secret = new TextEncoder().encode(appConfig.jwt.secret);
  const { payload } = await jwtVerify(token, secret);

  const userId = payload.userId;
  const username = payload.username;
  const role = payload.role;

  if (
    typeof userId !== 'number' ||
    typeof username !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    userId,
    username,
    role: role as JWTPayload['role'],
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    try {
      const payload = await verifyTokenInMiddleware(token);

      // Check if route requires admin role
      const isAdminRoute = adminRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isAdminRoute && payload.role !== 'admin' && payload.role !== 'subAdmin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Admin access required' },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId.toString());
      requestHeaders.set('x-username', payload.username);
      requestHeaders.set('x-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token verification failed - return 401 to allow client to refresh
      // Don't log the error message as it might contain sensitive info
      console.log('[Middleware] Token verification failed for', pathname);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or expired token' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
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

