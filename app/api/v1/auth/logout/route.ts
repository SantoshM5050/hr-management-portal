import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifyJwt } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const session = verifyJwt(token);
    if (session) {
      await logAuditEvent({
        userId: session.userId,
        organizationId: session.tenantId,
        action: 'AUTH_LOGOUT',
        entity: 'USER',
      });
    }
  }

  const response = NextResponse.json({
    success: true,
    data: { message: 'Successfully logged out' },
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
