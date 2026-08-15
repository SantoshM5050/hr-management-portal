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
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const repo = getTenantRepo(tenantId);

  const peopleWithProfiles = await repo.people.findMany({
    where: { personTypeCode: 'EMPLOYEE' },
    include: {
      employeeProfile: {
        include: { department: true, designation: true, location: true, history: { orderBy: { effectiveDate: 'desc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess({ employees: peopleWithProfiles });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  if (!session.isPlatformStaff && !session.roleCodes?.some((r) => ['OWNER', 'ADMIN', 'HR'].includes(r))) {
    return apiError('Forbidden: Admin or HR role required to create employees', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, employeeCode, departmentId, designationId, locationId, joiningDate } = body;

    if (!firstName || !lastName || !employeeCode) {
      return apiError('firstName, lastName, and employeeCode are required', 'VALIDATION_ERROR', 422);
    }

    const codeUpper = employeeCode.toUpperCase().trim();

    // Check duplicate code
    const existingCode = await db.employeeProfile.findFirst({
      where: { person: { organizationId: tenantId }, employeeCode: codeUpper },
    });

    if (existingCode) {
      return apiError(`Employee code '${codeUpper}' already exists`, 'CONFLICT', 409);
    }

    const result = await db.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          organizationId: tenantId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email ? email.toLowerCase().trim() : null,
          phone: phone || null,
          personTypeCode: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });

      const profile = await tx.employeeProfile.create({
        data: {
          personId: person.id,
          employeeCode: codeUpper,
          departmentId: departmentId || null,
          designationId: designationId || null,
          locationId: locationId || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        },
      });

      await tx.employmentHistory.create({
        data: {
          employeeProfileId: profile.id,
          changeType: 'JOINING',
          newData: { status: 'DRAFT', employeeCode: codeUpper },
          effectiveDate: new Date(),
        },
      });

      return { person, profile };
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantId,
      action: 'EMPLOYEE_CREATED',
      entity: 'EMPLOYEE_PROFILE',
      entityId: result.profile.id,
      details: { employeeCode: codeUpper, personId: result.person.id },
    });

    return apiSuccess({ employee: result }, 201);
  } catch (err) {
    console.error('POST /tenant/employees error:', err);
    return apiError('Failed to create employee', 'INTERNAL_ERROR', 500);
  }
}
