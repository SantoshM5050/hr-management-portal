import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const events = await db.attendanceEvent.findMany({
    where: { organizationId: tenantContext.tenantId },
    include: { person: true },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  const summaries = await db.attendanceSummary.findMany({
    where: { organizationId: tenantContext.tenantId },
    include: { person: true },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return apiSuccess({ events, summaries });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { personId, eventType, source } = body;

    if (!personId || !eventType) {
      return apiError('personId and eventType are required', 'VALIDATION_ERROR', 422);
    }

    const event = await db.attendanceEvent.create({
      data: {
        organizationId: tenantContext.tenantId,
        personId,
        eventType,
        source: source || 'WEB',
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: `ATTENDANCE_${eventType}`,
      entity: 'ATTENDANCE_EVENT',
      entityId: event.id,
      details: { personId, eventType },
    });

    return apiSuccess({ event }, 201);
  } catch (err) {
    console.error('POST /tenant/attendance error:', err);
    return apiError('Failed to record attendance event', 'INTERNAL_ERROR', 500);
  }
}
