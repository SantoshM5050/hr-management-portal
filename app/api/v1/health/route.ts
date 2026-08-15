import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { resolveTenantFromHost } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);

  return apiSuccess({
    status: 'healthy',
    phase: 'Phase 2 - Public SaaS Website & Demo Acquisition',
    timestamp: new Date().toISOString(),
    tenantContext,
  });
}
