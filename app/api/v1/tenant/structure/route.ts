import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

  const [departments, designations, locations, units] = await Promise.all([
    repo.departments.findMany({ orderBy: { name: 'asc' } }),
    repo.designations.findMany({ orderBy: { title: 'asc' } }),
    repo.locations.findMany({ orderBy: { name: 'asc' } }),
    repo.units.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return apiSuccess({
    departments,
    designations,
    locations,
    units,
  });
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

  if (!session.isPlatformStaff && !session.roleCodes?.some((r) => ['OWNER', 'ADMIN', 'HR'].includes(r))) {
    return apiError('Forbidden: Admin, Owner, or HR role required to modify organization structure', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { type, name, code, address, unitType } = body;

    if (!type || !name || !code) {
      return apiError('Structure type, name, and code are required', 'VALIDATION_ERROR', 422);
    }

    const codeUpper = code.toUpperCase().trim();
    const repo = getTenantRepo(tenantContext.tenantId);
    let record;

    if (type === 'DEPARTMENT') {
      const existing = await db.department.findFirst({ where: { organizationId: tenantContext.tenantId, code: codeUpper } });
      if (existing) return apiError(`Department code '${codeUpper}' already exists`, 'CONFLICT', 409);
      record = await repo.departments.create({ name: name.trim(), code: codeUpper });
    } else if (type === 'DESIGNATION') {
      const existing = await db.designation.findFirst({ where: { organizationId: tenantContext.tenantId, code: codeUpper } });
      if (existing) return apiError(`Designation code '${codeUpper}' already exists`, 'CONFLICT', 409);
      record = await repo.designations.create({ title: name.trim(), code: codeUpper });
    } else if (type === 'LOCATION') {
      const existing = await db.location.findFirst({ where: { organizationId: tenantContext.tenantId, code: codeUpper } });
      if (existing) return apiError(`Location code '${codeUpper}' already exists`, 'CONFLICT', 409);
      record = await repo.locations.create({ name: name.trim(), code: codeUpper, address: address || null });
    } else if (type === 'UNIT') {
      const existing = await db.organizationUnit.findFirst({ where: { organizationId: tenantContext.tenantId, code: codeUpper } });
      if (existing) return apiError(`Unit code '${codeUpper}' already exists`, 'CONFLICT', 409);
      record = await repo.units.create({ name: name.trim(), code: codeUpper, unitType: unitType || 'DIVISION' });
    } else {
      return apiError('Invalid structure type', 'VALIDATION_ERROR', 422);
    }

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: `${type}_CREATED`,
      entity: type,
      entityId: record.id,
      details: { name, code: codeUpper },
    });

    return apiSuccess({ record }, 201);
  } catch (err) {
    return apiError('Failed to create structure item', 'INTERNAL_ERROR', 500);
  }
}
