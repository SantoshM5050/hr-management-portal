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

  const enabled = await isModuleEnabled(tenantId, 'PAYROLL');
  if (!enabled) return apiError('PAYROLL module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const payrollRuns = await db.payrollRun.findMany({
    where: { organizationId: tenantId },
    include: { payslips: true },
    orderBy: { createdAt: 'desc' },
  });

  const salaryStructures = await db.salaryStructure.findMany({
    where: { organizationId: tenantId },
  });

  return apiSuccess({ payrollRuns, salaryStructures });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantId, 'PAYROLL');
  if (!enabled) return apiError('PAYROLL module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { action, name } = body;

    if (action === 'EXECUTE_PAYROLL') {
      if (!name) return apiError('Payroll period name is required', 'VALIDATION_ERROR', 422);

      const runResult = await db.$transaction(async (tx) => {
        const run = await tx.payrollRun.create({
          data: {
            organizationId: tenantId,
            periodName: name,
            status: 'FINALIZE',
            processedCount: 1,
          },
        });

        const struct = await tx.salaryStructure.findFirst({
          where: { organizationId: tenantId },
        });

        const payslip = await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            salaryStructureId: struct?.id || null,
            netAmount: struct ? struct.baseMonthlyAmount : 5000,
          },
        });

        return { run, payslip };
      });

      await logAuditEvent({
        userId: session.userId,
        organizationId: tenantId,
        action: 'PAYROLL_RUN_EXECUTED',
        entity: 'PAYROLL_RUN',
        entityId: runResult.run.id,
        details: { periodName: name },
      });

      return apiSuccess({ result: runResult }, 201);
    }

    return apiError('Invalid action', 'VALIDATION_ERROR', 400);
  } catch (err) {
    console.error('POST /tenant/payroll error:', err);
    return apiError('Failed to execute payroll run', 'INTERNAL_ERROR', 500);
  }
}
