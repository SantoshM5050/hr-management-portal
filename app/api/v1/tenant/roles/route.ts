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

  const roles = await db.role.findMany({
    where: {
      OR: [
        { organizationId: tenantContext.tenantId },
        { isSystem: true },
      ],
    },
    include: { permissions: true },
  });

  const allPermissions = await db.permission.findMany();

  return apiSuccess({ roles, allPermissions });
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
    return apiError('Forbidden: Admin or Owner role required to manage roles', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { name, code, permissionCodes } = body;

    if (!name || !code) {
      return apiError('Role name and code are required', 'VALIDATION_ERROR', 422);
    }

    const codeUpper = code.toUpperCase().trim();

    // Connect specified permissions
    let connectPermissions: { id: string }[] = [];
    if (Array.isArray(permissionCodes) && permissionCodes.length > 0) {
      const perms = await db.permission.findMany({
        where: { code: { in: permissionCodes } },
      });
      connectPermissions = perms.map((p) => ({ id: p.id }));
    }

    const role = await db.role.create({
      data: {
        organizationId: tenantContext.tenantId,
        name: name.trim(),
        code: codeUpper,
        isSystem: false,
        permissions: {
          connect: connectPermissions,
        },
      },
      include: { permissions: true },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'ROLE_CREATED',
      entity: 'ROLE',
      entityId: role.id,
      details: { name: role.name, code: role.code, permissionCodes },
    });

    return apiSuccess({ role }, 201);
  } catch (err) {
    console.error('POST /tenant/roles error:', err);
    return apiError('Failed to create role', 'INTERNAL_ERROR', 500);
  }
}
