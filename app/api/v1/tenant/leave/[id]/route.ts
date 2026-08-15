import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { requireModule } from '@/lib/module-gating';
import { executeWorkflowTransition } from '@/lib/workflow-engine';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

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

  try {
    await requireModule(tenantId, 'LEAVE');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  const leaveReq = await db.leaveRequest.findFirst({
    where: { id: params.id, organizationId: tenantId },
    include: { person: true, leaveType: true },
  });

  if (!leaveReq) return apiError('Leave request not found', 'NOT_FOUND', 404);

  return apiSuccess({ leaveRequest: leaveReq });
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

  try {
    await requireModule(tenantId, 'LEAVE');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED', 'MANAGER_REVIEW', 'HR_REVIEW'].includes(status)) {
      return apiError('valid status is required', 'VALIDATION_ERROR', 422);
    }

    const leaveReq = await db.leaveRequest.findFirst({
      where: { id: params.id, organizationId: tenantId },
      include: { leaveType: true },
    });

    if (!leaveReq) return apiError('Leave request not found', 'NOT_FOUND', 404);

    // Duplicate approval / Idempotency protection
    if (leaveReq.status === 'APPROVED' && status === 'APPROVED') {
      return apiError('Leave request is already approved', 'CONFLICT', 409);
    }

    const currentState = leaveReq.status;

    // Execute state transition transaction
    await executeWorkflowTransition(
      {
        organizationId: tenantId,
        userId: session.userId,
        userRoleCodes: session.roleCodes || [],
        entityName: 'LEAVE',
        entityId: leaveReq.id,
        currentState,
        targetState: status,
        actionReason: rejectionReason || undefined,
      },
      async (tx) => {
        // 1. APPROVAL: Update status, record ledger debit, update used balance
        if (status === 'APPROVED') {
          await tx.leaveRequest.update({
            where: { id: leaveReq.id },
            data: {
              status: 'APPROVED',
              approvedByUserId: session.userId,
            },
          });

          await tx.leaveLedger.create({
            data: {
              organizationId: tenantId,
              personId: leaveReq.personId,
              transactionType: 'DEDUCTION',
              amount: leaveReq.daysCount,
              description: `Leave Request Approved (Ref: ${leaveReq.id.slice(0, 8)})`,
            },
          });

          await tx.leaveBalance.upsert({
            where: {
              organizationId_personId_leaveTypeId: {
                organizationId: tenantId,
                personId: leaveReq.personId,
                leaveTypeId: leaveReq.leaveTypeId,
              },
            },
            update: { usedDays: { increment: leaveReq.daysCount } },
            create: {
              organizationId: tenantId,
              personId: leaveReq.personId,
              leaveTypeId: leaveReq.leaveTypeId,
              allocatedDays: 20,
              usedDays: leaveReq.daysCount,
            },
          });
        }

        // 2. CANCELLATION of previously approved leave: Credit balance back
        if (status === 'CANCELLED') {
          await tx.leaveRequest.update({
            where: { id: leaveReq.id },
            data: { status: 'CANCELLED' },
          });

          if (currentState === 'APPROVED') {
            await tx.leaveLedger.create({
              data: {
                organizationId: tenantId,
                personId: leaveReq.personId,
                transactionType: 'ALLOCATION',
                amount: leaveReq.daysCount,
                description: `Leave Request Cancelled Reversal (Ref: ${leaveReq.id.slice(0, 8)})`,
              },
            });

            await tx.leaveBalance.update({
              where: {
                organizationId_personId_leaveTypeId: {
                  organizationId: tenantId,
                  personId: leaveReq.personId,
                  leaveTypeId: leaveReq.leaveTypeId,
                },
              },
              data: { usedDays: { decrement: leaveReq.daysCount } },
            });
          }
        }

        // 3. REJECTION: Update status
        if (status === 'REJECTED') {
          await tx.leaveRequest.update({
            where: { id: leaveReq.id },
            data: {
              status: 'REJECTED',
              rejectionReason: rejectionReason || 'Request Rejected',
            },
          });
        }

        // 4. INTERMEDIATE REVIEWS (MANAGER_REVIEW, HR_REVIEW)
        if (status === 'MANAGER_REVIEW' || status === 'HR_REVIEW') {
          await tx.leaveRequest.update({
            where: { id: leaveReq.id },
            data: { status: 'PENDING' },
          });
        }

        return leaveReq;
      }
    );

    return apiSuccess({ message: `Leave request status updated to ${status}` });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update leave request status', 'INTERNAL_ERROR', 500);
  }
}
