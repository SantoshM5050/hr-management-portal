import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { isModuleEnabled } from '@/lib/module-gating';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantContext.tenantId, 'PERFORMANCE');
  if (!enabled) return apiError('PERFORMANCE module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const cycles = await db.reviewCycle.findMany({
    where: { organizationId: tenantContext.tenantId },
    orderBy: { startDate: 'desc' },
  });

  return apiSuccess({ cycles });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantContext.tenantId, 'PERFORMANCE');
  if (!enabled) return apiError('PERFORMANCE module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { name, startDate, endDate } = body;

    if (!name) return apiError('name is required', 'VALIDATION_ERROR', 422);

    const cycle = await db.reviewCycle.create({
      data: {
        organizationId: tenantContext.tenantId,
        title: name,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000),
        status: 'ACTIVE',
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'REVIEW_CYCLE_CREATED',
      entity: 'REVIEW_CYCLE',
      entityId: cycle.id,
      details: { title: name },
    });

    return apiSuccess({ cycle }, 201);
  } catch (err) {
    console.error('POST /tenant/performance error:', err);
    return apiError('Failed to create review cycle', 'INTERNAL_ERROR', 500);
  }
}
