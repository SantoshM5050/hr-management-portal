import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';
import { resolveTenantFromHost } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  let tenantContext: any = { scope: 'PUBLIC_SAAS', status: 'ACTIVE' };

  try {
    tenantContext = await resolveTenantFromHost(host);
  } catch (err) {
    console.error('Health check tenant resolution warning:', err);
  }

  return apiSuccess({
    status: 'healthy',
    phase: 'Phase 8 - Production Readiness, Security & Operations',
    timestamp: new Date().toISOString(),
    tenantContext,
  });
}
