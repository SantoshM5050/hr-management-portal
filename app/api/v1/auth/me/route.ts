import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { SESSION_COOKIE_NAME, verifyJwt } from '@/lib/auth';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const session = verifyJwt(token);
  if (!session || !session.userId) {
    return apiError('Invalid or expired authentication session', 'UNAUTHORIZED', 401);
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPlatformStaff: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return apiError('User account is inactive or suspended', 'FORBIDDEN', 403);
    }

    const reqHeaders = headers();
    const host = reqHeaders.get('host') || request.headers.get('host') || 'localhost:3000';
    const tenantContext = await resolveTenantFromHost(host);

    return apiSuccess({
      user,
      session,
      tenantContext,
    });
  } catch (err) {
    console.error('GET /auth/me error:', err);
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
