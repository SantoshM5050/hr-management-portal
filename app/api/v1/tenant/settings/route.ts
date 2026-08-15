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
      settings: true,
      organizationType: true,
      modules: { include: { module: true } },
    },
  });

  return apiSuccess({ settings: org?.settings, organization: org });
}

export async function PATCH(request: NextRequest) {
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

  // Verify Admin / Owner permission for settings
  if (!session.isPlatformStaff && !session.roleCodes?.some((r) => ['OWNER', 'ADMIN'].includes(r))) {
    return apiError('Forbidden: Admin or Owner role required to modify organization settings', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { logoUrl, primaryColor, timezone, currency, orgName } = body;

    if (orgName) {
      await db.organization.update({
        where: { id: tenantContext.tenantId },
        data: { name: orgName.trim() },
      });
    }

    const updatedSettings = await db.organizationSettings.upsert({
      where: { organizationId: tenantContext.tenantId },
      update: {
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        primaryColor: primaryColor || undefined,
        timezone: timezone || undefined,
        currency: currency || undefined,
      },
      create: {
        organizationId: tenantContext.tenantId,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#0f172a',
        timezone: timezone || 'UTC',
        currency: currency || 'USD',
        terminology: {},
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entity: 'ORGANIZATION_SETTINGS',
      details: { primaryColor, timezone, currency },
    });

    return apiSuccess({ settings: updatedSettings });
  } catch (err) {
    console.error('PATCH /tenant/settings error:', err);
    return apiError('Failed to update organization settings', 'INTERNAL_ERROR', 500);
  }
}
