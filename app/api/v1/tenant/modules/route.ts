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

  const allModules = await db.module.findMany();
  const enabledOrgModules = await db.organizationModule.findMany({
    where: { organizationId: tenantContext.tenantId },
    include: { module: true },
  });

  const enabledMap = new Map(enabledOrgModules.map((m) => [m.module.code, m.isEnabled]));

  const result = allModules.map((mod) => ({
    id: mod.id,
    code: mod.code,
    name: mod.name,
    description: mod.description,
    isCore: mod.isCore,
    isEnabled: mod.isCore ? true : enabledMap.get(mod.code) ?? false,
  }));

  return apiSuccess({ modules: result });
}

export async function POST(request: NextRequest) {
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

  if (!session.isPlatformStaff && !session.roleCodes?.some((r) => ['OWNER', 'ADMIN'].includes(r))) {
    return apiError('Forbidden: Admin or Owner role required to manage modules', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { moduleCode, isEnabled } = body;

    if (!moduleCode) {
      return apiError('moduleCode is required', 'VALIDATION_ERROR', 422);
    }

    if (moduleCode === 'CORE' && !isEnabled) {
      return apiError('The CORE module is mandatory and cannot be disabled', 'VALIDATION_ERROR', 422);
    }

    const mod = await db.module.findUnique({ where: { code: moduleCode } });
    if (!mod) {
      return apiError(`Module '${moduleCode}' not found`, 'NOT_FOUND', 404);
    }

    const orgModule = await db.organizationModule.upsert({
      where: {
        organizationId_moduleId: {
          organizationId: tenantContext.tenantId,
          moduleId: mod.id,
        },
      },
      update: { isEnabled: !!isEnabled },
      create: {
        organizationId: tenantContext.tenantId,
        moduleId: mod.id,
        isEnabled: !!isEnabled,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: isEnabled ? 'MODULE_ENABLED' : 'MODULE_DISABLED',
      entity: 'MODULE',
      entityId: mod.id,
      details: { moduleCode, isEnabled },
    });

    return apiSuccess({ module: orgModule });
  } catch (err) {
    console.error('POST /tenant/modules error:', err);
    return apiError('Failed to toggle module status', 'INTERNAL_ERROR', 500);
  }
}
