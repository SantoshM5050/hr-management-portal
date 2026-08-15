import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { executeWorkflowTransition } from '@/lib/workflow-engine';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const VALID_EMPLOYEE_STATES = [
  'DRAFT',
  'INVITED',
  'ONBOARDING',
  'PROBATION',
  'ACTIVE',
  'CONFIRMED',
  'NOTICE',
  'OFFBOARDING',
  'EXITED',
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const person = await db.person.findFirst({
    where: { id: params.id, organizationId: tenantId },
    include: {
      employeeProfile: {
        include: {
          department: true,
          designation: true,
          location: true,
          history: { orderBy: { effectiveDate: 'desc' } },
        },
      },
    },
  });

  if (!person || !person.employeeProfile) {
    return apiError('Employee record not found', 'NOT_FOUND', 404);
  }

  return apiSuccess({ employee: person });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    return apiError('Forbidden: Admin role required to execute employee lifecycle transitions', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { targetState, actionReason, departmentId, designationId, locationId } = body;

    if (!targetState || !VALID_EMPLOYEE_STATES.includes(targetState)) {
      return apiError(`Invalid targetState. Allowed states: ${VALID_EMPLOYEE_STATES.join(', ')}`, 'VALIDATION_ERROR', 422);
    }

    const person = await db.person.findFirst({
      where: { id: params.id, organizationId: tenantId },
      include: { employeeProfile: { include: { history: { orderBy: { effectiveDate: 'desc' }, take: 1 } } } },
    });

    if (!person || !person.employeeProfile) {
      return apiError('Employee record not found', 'NOT_FOUND', 404);
    }

    const latestHistory = person.employeeProfile.history[0];
    const currentState = latestHistory ? (latestHistory.newData as any)?.status || 'DRAFT' : 'DRAFT';

    // Prevent direct status override if state is unchanged (idempotency check)
    if (currentState === targetState) {
      return apiError(`Employee is already in '${targetState}' state`, 'CONFLICT', 409);
    }

    await executeWorkflowTransition(
      {
        organizationId: tenantId,
        userId: session.userId,
        userRoleCodes: session.roleCodes || [],
        entityName: 'EMPLOYEE',
        entityId: person.employeeProfile.id,
        currentState,
        targetState,
        actionReason,
      },
      async (tx) => {
        const profile = await tx.employeeProfile.update({
          where: { id: person.employeeProfile!.id },
          data: {
            departmentId: departmentId || undefined,
            designationId: designationId || undefined,
            locationId: locationId || undefined,
          },
        });

        await tx.employmentHistory.create({
          data: {
            employeeProfileId: profile.id,
            changeType: targetState,
            newData: { status: targetState, reason: actionReason || null },
            effectiveDate: new Date(),
          },
        });

        if (targetState === 'EXITED') {
          await tx.person.update({
            where: { id: person.id },
            data: { status: 'ARCHIVED' },
          });
        }

        return profile;
      }
    );

    return apiSuccess({ message: `Employee status transitioned from ${currentState} to ${targetState}` });
  } catch (err: any) {
    return apiError(err.message || 'Failed to transition employee status', 'INTERNAL_ERROR', 500);
  }
}
