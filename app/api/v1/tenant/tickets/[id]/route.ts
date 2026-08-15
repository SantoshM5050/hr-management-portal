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
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    await requireModule(tenantContext.tenantId, 'TICKETING');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  const ticket = await db.ticket.findFirst({
    where: { id: params.id, organizationId: tenantContext.tenantId },
    include: { person: true, category: true, assignedUser: true },
  });

  if (!ticket) return apiError('Ticket not found', 'NOT_FOUND', 404);

  return apiSuccess({ ticket });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    await requireModule(tenantContext.tenantId, 'TICKETING');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { targetState, assignedToUserId } = body;

    const ticket = await db.ticket.findFirst({
      where: { id: params.id, organizationId: tenantContext.tenantId },
    });

    if (!ticket) return apiError('Ticket not found', 'NOT_FOUND', 404);

    const currentState = ticket.status;

    if (targetState) {
      await executeWorkflowTransition(
        {
          organizationId: tenantContext.tenantId,
          userId: session.userId,
          userRoleCodes: session.roleCodes || [],
          entityName: 'TICKET',
          entityId: ticket.id,
          currentState,
          targetState,
        },
        async (tx) => {
          const updated = await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              status: targetState,
              assignedToUserId: assignedToUserId || undefined,
            },
          });

          return updated;
        }
      );
    }

    return apiSuccess({ message: 'Ticket updated successfully' });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update ticket', 'INTERNAL_ERROR', 500);
  }
}
