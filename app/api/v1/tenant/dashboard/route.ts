import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
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

  const [
    totalPeople,
    totalEmployees,
    totalStudents,
    presentToday,
    pendingLeaves,
    openTickets,
    activeJobs,
    payrollRunsCount,
  ] = await Promise.all([
    db.person.count({ where: { organizationId: tenantId } }),
    db.person.count({ where: { organizationId: tenantId, personTypeCode: 'EMPLOYEE' } }),
    db.person.count({ where: { organizationId: tenantId, personTypeCode: 'STUDENT' } }),
    db.attendanceEvent.count({ where: { organizationId: tenantId, eventType: 'CHECK_IN' } }),
    db.leaveRequest.count({ where: { organizationId: tenantId, status: 'PENDING' } }),
    db.ticket.count({ where: { organizationId: tenantId, status: 'OPEN' } }),
    db.jobOpening.count({ where: { organizationId: tenantId, status: 'OPEN' } }),
    db.payrollRun.count({ where: { organizationId: tenantId } }),
  ]);

  return apiSuccess({
    stats: {
      totalPeople,
      totalEmployees,
      totalStudents,
      presentToday,
      pendingLeaves,
      openTickets,
      activeJobs,
      payrollRunsCount,
    },
    tenant: {
      name: tenantContext.tenantName || 'Tenant Organization',
      type: tenantContext.organizationTypeCode || 'COMPANY',
    },
  });
}
