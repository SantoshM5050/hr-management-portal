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

  const forms = await db.formDefinition.findMany({
    where: { organizationId: tenantContext.tenantId },
  });

  return apiSuccess({ forms });
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
    return apiError('Forbidden: Admin role required to create form definitions', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { title, entityName, schema } = body;

    if (!title || !entityName || !schema) {
      return apiError('title, entityName, and schema are required', 'VALIDATION_ERROR', 422);
    }

    const form = await db.formDefinition.create({
      data: {
        organizationId: tenantContext.tenantId,
        title,
        entityName,
        schema,
        isPublished: true,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'FORM_DEFINITION_CREATED',
      entity: 'FORM_DEFINITION',
      entityId: form.id,
      details: { title, entityName },
    });

    return apiSuccess({ form }, 201);
  } catch (err) {
    return apiError('Failed to create form definition', 'INTERNAL_ERROR', 500);
  }
}
