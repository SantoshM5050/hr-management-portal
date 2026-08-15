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
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantContext.tenantId, 'TICKETING');
  if (!enabled) return apiError('TICKETING module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const tickets = await db.ticket.findMany({
    where: { organizationId: tenantContext.tenantId },
    include: { category: true, person: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await db.ticketCategory.findMany({
    where: { organizationId: tenantContext.tenantId },
  });

  return apiSuccess({ tickets, categories });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantContext.tenantId, 'TICKETING');
  if (!enabled) return apiError('TICKETING module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { personId, title, description, priority, categoryCode } = body;

    if (!personId || !title || !description) {
      return apiError('personId, title, and description are required', 'VALIDATION_ERROR', 422);
    }

    const category = await db.ticketCategory.upsert({
      where: {
        organizationId_code: {
          organizationId: tenantContext.tenantId,
          code: categoryCode || 'GENERAL',
        },
      },
      update: {},
      create: {
        organizationId: tenantContext.tenantId,
        code: categoryCode || 'GENERAL',
        name: categoryCode || 'General Support',
      },
    });

    const ticket = await db.ticket.create({
      data: {
        organizationId: tenantContext.tenantId,
        personId,
        categoryId: category.id,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: tenantContext.tenantId,
      action: 'TICKET_CREATED',
      entity: 'TICKET',
      entityId: ticket.id,
      details: { title, priority: ticket.priority },
    });

    return apiSuccess({ ticket }, 201);
  } catch (err) {
    console.error('POST /tenant/tickets error:', err);
    return apiError('Failed to create support ticket', 'INTERNAL_ERROR', 500);
  }
}
