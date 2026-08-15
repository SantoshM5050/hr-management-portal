import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const scope = request.headers.get('x-resolved-scope');
    
    // Boundary Check: Ensure request is from platform admin domain/scope
    if (scope !== 'PLATFORM_ADMIN' && process.env.NODE_ENV === 'production') {
      return apiError('Forbidden: Platform admin access required', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { orgName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedToUser: { select: { id: true, fullName: true, email: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    return apiSuccess(leads, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Platform admin GET leads error:', err);
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
