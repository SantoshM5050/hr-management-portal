import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

  const person = await db.person.findFirst({
    where: { id: params.id, organizationId: tenantContext.tenantId },
    include: {
      employeeProfile: { include: { department: true, designation: true, location: true } },
      studentProfile: true,
      guardianProfile: true,
    },
  });

  if (!person) {
    return apiError('Person not found', 'NOT_FOUND', 404);
  }

  return apiSuccess({ person });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    return apiError('Forbidden: Admin role required to update person record', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, status, personTypeCode } = body;

    const person = await db.person.findFirst({
      where: { id: params.id, organizationId: tenantContext.tenantId },
    });

    if (!person) {
      return apiError('Person not found', 'NOT_FOUND', 404);
    }

    const updated = await db.person.update({
      where: { id: person.id },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : undefined,
        lastName: lastName !== undefined ? lastName.trim() : undefined,
        email: email !== undefined ? (email ? email.toLowerCase().trim() : null) : undefined,
        phone: phone !== undefined ? phone : undefined,
        status: status !== undefined ? status : undefined,
        personTypeCode: personTypeCode !== undefined ? personTypeCode : undefined,
      },
    });

    return apiSuccess({ person: updated });
  } catch (err) {
    return apiError('Failed to update person record', 'INTERNAL_ERROR', 500);
  }
}
