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
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantId, 'EDUCATION');
  if (!enabled) return apiError('EDUCATION module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const students = await db.person.findMany({
    where: { organizationId: tenantId, personTypeCode: 'STUDENT' },
    include: { studentProfile: { include: { enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess({ students });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantId, 'EDUCATION');
  if (!enabled) return apiError('EDUCATION module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, studentRollNo } = body;

    if (!firstName || !lastName || !studentRollNo) {
      return apiError('firstName, lastName, and studentRollNo are required', 'VALIDATION_ERROR', 422);
    }

    const result = await db.$transaction(async (tx) => {
      const studentPerson = await tx.person.create({
        data: {
          organizationId: tenantId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email ? email.toLowerCase().trim() : null,
          personTypeCode: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const studentProfile = await tx.studentProfile.create({
        data: {
          personId: studentPerson.id,
          studentRollNo: studentRollNo.toUpperCase().trim(),
        },
      });

      return { studentPerson, studentProfile };
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantId,
      action: 'STUDENT_ADMITTED',
      entity: 'STUDENT_PROFILE',
      entityId: result.studentProfile.id,
      details: { studentRollNo },
    });

    return apiSuccess({ student: result }, 201);
  } catch (err) {
    console.error('POST /tenant/education error:', err);
    return apiError('Failed to process student admission', 'INTERNAL_ERROR', 500);
  }
}
