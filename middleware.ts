import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtEdge } from '@/lib/edge-jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_TO_A_RANDOM_32_PLUS_CHARACTER_SECRET';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'hrms_session';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const hostname = host.split(':')[0].toLowerCase().trim();
  const rootDomain = (process.env.ROOT_DOMAIN || 'localhost:3000').split(':')[0].toLowerCase().trim();
  const path = request.nextUrl.pathname;

  // 1. Strip any client-supplied X-Tenant-Id header or query parameter override
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-tenant-id');

  // 2. Determine Scope from Hostname
  let scope = 'PUBLIC_SAAS';
  let tenantSlug = '';

  if (hostname === rootDomain || hostname === 'localhost' || hostname === '127.0.0.1') {
    scope = 'PUBLIC_SAAS';
  } else if (hostname === `admin.${rootDomain}` || hostname === 'admin.localhost') {
    scope = 'PLATFORM_ADMIN';
  } else if (hostname.endsWith(`.${rootDomain}`) || hostname.endsWith('.localhost')) {
    scope = 'TENANT_APP';
    tenantSlug = hostname.split('.')[0];
  } else {
    scope = 'TENANT_APP';
    tenantSlug = hostname;
  }

  requestHeaders.set('x-resolved-scope', scope);
  requestHeaders.set('x-resolved-hostname', hostname);
  if (tenantSlug) {
    requestHeaders.set('x-resolved-tenant-slug', tenantSlug);
  }

  // 3. Read and Verify Session Cookie using Web Crypto API in Edge Runtime
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyJwtEdge(token, JWT_SECRET) : null;

  // 4. Server-Side Route Authorization Protection
  const isApiRoute = path.startsWith('/api/');
  const isPlatformAdminPath = path.startsWith('/platform-admin') || scope === 'PLATFORM_ADMIN';
  const isTenantAppPath = path.startsWith('/app') || scope === 'TENANT_APP';

  const isPublicPath =
    path === '/' ||
    path.startsWith('/solutions') ||
    path === '/features' ||
    path === '/pricing' ||
    path === '/demo' ||
    path === '/contact' ||
    path === '/about' ||
    path === '/faq' ||
    path === '/resources' ||
    path === '/blog' ||
    path === '/login' ||
    path === '/signup' ||
    path.startsWith('/api/v1/public') ||
    path.startsWith('/api/v1/auth');

  // A. Protect Platform Admin Routes
  if (isPlatformAdminPath && !isPublicPath) {
    if (!session || !session.isPlatformStaff) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required for platform admin' } },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // B. Protect Tenant Application Routes
  if (isTenantAppPath && !isPublicPath && scope === 'TENANT_APP') {
    if (!session) {
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required for organization app' } },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Construct Response with Security Headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self';"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
