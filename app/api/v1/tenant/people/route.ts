import { NextRequest } from 'next/server';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { verifyJwt, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getTenantRepo } from '@/lib/tenant-repo';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);

  if (!tenantContext.tenantId) {
    return apiError('Tenant organization not found', 'NOT_FOUND', 404);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const skip = (page - 1) * limit;

  const searchQuery = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';
  const statusFilter = searchParams.get('status') || '';

  const whereClause: any = {
    organizationId: tenantContext.tenantId,
  };

  if (searchQuery) {
    whereClause.OR = [
      { firstName: { contains: searchQuery, mode: 'insensitive' } },
      { lastName: { contains: searchQuery, mode: 'insensitive' } },
      { email: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (typeFilter) {
    whereClause.personTypeCode = typeFilter;
  }

  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  const repo = getTenantRepo(tenantContext.tenantId);

  const [total, items] = await Promise.all([
    repo.people.count({ where: whereClause }),
    repo.people.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        employeeProfile: { include: { department: true, designation: true, location: true } },
        studentProfile: true,
        guardianProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return apiSuccess({
    people: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);

  if (!tenantContext.tenantId) {
    return apiError('Tenant organization not found', 'NOT_FOUND', 404);
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (!session || (session.tenantId !== tenantContext.tenantId && !session.isPlatformStaff)) {
    return apiError('Unauthorized tenant access', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, personTypeCode } = body;

    if (!firstName || !lastName || !personTypeCode) {
      return apiError('First Name, Last Name, and Person Type Code are required', 'VALIDATION_ERROR', 422);
    }

    const repo = getTenantRepo(tenantContext.tenantId);
    const person = await repo.people.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phone || null,
      personTypeCode,
      status: 'ACTIVE',
    });

    return apiSuccess({ person }, 201);
  } catch (err) {
    console.error('POST /tenant/people error:', err);
    return apiError('Failed to create person record', 'INTERNAL_ERROR', 500);
  }
}
