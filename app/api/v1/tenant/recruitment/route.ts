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

  const enabled = await isModuleEnabled(tenantId, 'RECRUITMENT');
  if (!enabled) return apiError('RECRUITMENT module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const jobOpenings = await db.jobOpening.findMany({
    where: { organizationId: tenantId },
    include: { candidates: true },
    orderBy: { createdAt: 'desc' },
  });

  const candidates = await db.candidate.findMany({
    where: { organizationId: tenantId },
    include: { jobOpening: true },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess({ jobOpenings, candidates });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);
  const tenantId = tenantContext.tenantId;
  if (!tenantId) return apiError('Tenant organization not found', 'NOT_FOUND', 404);

  const enabled = await isModuleEnabled(tenantId, 'RECRUITMENT');
  if (!enabled) return apiError('RECRUITMENT module is disabled for this organization', 'FORBIDDEN', 403);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;
  if (!session || (session.tenantId !== tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { action, title, description, candidateId, employeeCode } = body;

    if (action === 'CREATE_JOB') {
      if (!title) return apiError('title is required', 'VALIDATION_ERROR', 422);

      const job = await db.jobOpening.create({
        data: {
          organizationId: tenantId,
          title,
          code: `JOB-${Date.now().toString().slice(-4)}`,
          description: description || title,
          status: 'OPEN',
        },
      });

      return apiSuccess({ job }, 201);
    }

    if (action === 'HIRE_CONVERT') {
      if (!candidateId || !employeeCode) {
        return apiError('candidateId and employeeCode are required', 'VALIDATION_ERROR', 422);
      }

      const candidate = await db.candidate.findFirst({
        where: { id: candidateId, organizationId: tenantId },
      });

      if (!candidate) return apiError('Candidate not found', 'NOT_FOUND', 404);

      const names = candidate.fullName.split(' ');
      const firstName = names[0] || 'Candidate';
      const lastName = names.slice(1).join(' ') || 'Hired';

      const hireResult = await db.$transaction(async (tx) => {
        const person = await tx.person.create({
          data: {
            organizationId: tenantId,
            firstName,
            lastName,
            email: candidate.email,
            phone: candidate.phone,
            personTypeCode: 'EMPLOYEE',
            status: 'ACTIVE',
          },
        });

        const profile = await tx.employeeProfile.create({
          data: {
            personId: person.id,
            employeeCode: employeeCode.toUpperCase().trim(),
          },
        });

        await tx.candidate.update({
          where: { id: candidate.id },
          data: { stage: 'HIRED' },
        });

        return { person, profile };
      });

      await logAuditEvent({
        userId: session.userId,
        organizationId: tenantId,
        action: 'CANDIDATE_HIRED_CONVERTED',
        entity: 'EMPLOYEE_PROFILE',
        entityId: hireResult.profile.id,
        details: { candidateId, employeeCode },
      });

      return apiSuccess({ result: hireResult });
    }

    return apiError('Invalid action', 'VALIDATION_ERROR', 400);
  } catch (err) {
    console.error('POST /tenant/recruitment error:', err);
    return apiError('Failed to execute recruitment action', 'INTERNAL_ERROR', 500);
  }
}
