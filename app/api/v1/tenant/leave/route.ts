import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { requireModule } from '@/lib/module-gating';
import { calculateLeaveDays } from '@/lib/date-calculator';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    await requireModule(tenantContext.tenantId, 'LEAVE');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  const [requests, leaveTypes, balances] = await Promise.all([
    db.leaveRequest.findMany({
      where: { organizationId: tenantContext.tenantId },
      include: { person: true, leaveType: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.leaveType.findMany({
      where: { organizationId: tenantContext.tenantId },
    }),
    db.leaveBalance.findMany({
      where: { organizationId: tenantContext.tenantId },
      include: { person: true, leaveType: true },
    }),
  ]);

  return apiSuccess({ requests, leaveTypes, balances });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  if (!tenantContext.tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    await requireModule(tenantContext.tenantId, 'LEAVE');
  } catch (err: any) {
    return apiError(err.message, 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const { personId, leaveTypeId, startDate, endDate, reason } = body;

    if (!personId || !leaveTypeId || !startDate || !endDate) {
      return apiError('personId, leaveTypeId, startDate, and endDate are required', 'VALIDATION_ERROR', 422);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return apiError('startDate cannot be after endDate', 'VALIDATION_ERROR', 422);
    }

    // Date Calculation Service (Timezone & Holidays)
    const calc = await calculateLeaveDays(tenantContext.tenantId, start, end);

    if (calc.workingDays <= 0) {
      return apiError('Requested leave period contains 0 working days', 'VALIDATION_ERROR', 422);
    }

    // Overlap validation
    const existingOverlap = await db.leaveRequest.findFirst({
      where: {
        organizationId: tenantContext.tenantId,
        personId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (existingOverlap) {
      return apiError('A leave request already exists for the selected date range', 'CONFLICT', 409);
    }

    // Balance check
    const balanceRecord = await db.leaveBalance.findUnique({
      where: {
        organizationId_personId_leaveTypeId: {
          organizationId: tenantContext.tenantId,
          personId,
          leaveTypeId,
        },
      },
    });

    const currentBalance = balanceRecord ? balanceRecord.allocatedDays - balanceRecord.usedDays : 10;

    if (currentBalance < calc.workingDays) {
      return apiError(`Insufficient leave balance. Available: ${currentBalance} days, Requested: ${calc.workingDays} days`, 'UNPROCESSABLE_ENTITY', 422);
    }

    const leaveReq = await db.leaveRequest.create({
      data: {
        organizationId: tenantContext.tenantId,
        personId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        daysCount: calc.workingDays,
        reason: reason || null,
        status: 'PENDING',
      },
      include: { leaveType: true, person: true },
    });

    return apiSuccess({ leaveRequest: leaveReq }, 201);
  } catch (err) {
    console.error('POST /tenant/leave error:', err);
    return apiError('Failed to submit leave request', 'INTERNAL_ERROR', 500);
  }
}
