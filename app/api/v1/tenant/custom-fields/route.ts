import { NextRequest } from 'next/server';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getTenantRepo } from '@/lib/tenant-repo';
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

  const repo = getTenantRepo(tenantContext.tenantId);
  const customFields = await repo.customFields.findMany();

  return apiSuccess({ customFields });
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
    return apiError('Forbidden: Admin role required to create custom field definitions', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { entityName, fieldKey, fieldLabel, fieldType, isRequired, options } = body;

    if (!entityName || !fieldKey || !fieldLabel || !fieldType) {
      return apiError('entityName, fieldKey, fieldLabel, and fieldType are required', 'VALIDATION_ERROR', 422);
    }

    const repo = getTenantRepo(tenantContext.tenantId);
    const customField = await repo.customFields.create({
      entityName,
      fieldKey,
      fieldLabel,
      fieldType,
      isRequired: !!isRequired,
      options: options || null,
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'CUSTOM_FIELD_CREATED',
      entity: 'CUSTOM_FIELD',
      entityId: customField.id,
      details: { entityName, fieldKey, fieldType },
    });

    return apiSuccess({ customField }, 201);
  } catch (err) {
    return apiError('Failed to create custom field definition', 'INTERNAL_ERROR', 500);
  }
}
