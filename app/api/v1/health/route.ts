import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { apiSuccess } from '@/lib/api-response';
import { resolveTenantFromHost } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const reqHeaders = headers();
  const host = reqHeaders.get('host') || request.headers.get('host') || 'localhost:3000';
  const tenantContext = await resolveTenantFromHost(host);

  return apiSuccess({
    status: 'healthy',
    phase: 'Phase 8 - Production Readiness, Security & Operations',
    timestamp: new Date().toISOString(),
    tenantContext,
  });
}
