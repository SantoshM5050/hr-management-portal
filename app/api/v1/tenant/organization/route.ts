import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);

  if (!tenantContext.tenantId) {
    return apiError('Tenant organization not found', 'NOT_FOUND', 404);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const org = await db.organization.findUnique({
    where: { id: tenantContext.tenantId },
    include: {
      organizationType: true,
      settings: true,
      domains: true,
      modules: { include: { module: true } },
    },
  });

  return apiSuccess({ organization: org });
}
