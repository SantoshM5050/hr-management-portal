import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { comparePassword, signJwt, getSessionCookieOptions } from '@/lib/auth';
import { resolveTenantFromHost } from '@/lib/tenant-context';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const reqHeaders = headers();
  const host = reqHeaders.get('host') || request.headers.get('host') || 'localhost:3000';
  const clientIp = reqHeaders.get('x-forwarded-for') || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. Rate Limiting Protection (Max 5 login attempts per minute per IP)
  const rateCheck = checkRateLimit(`login:${clientIp}`, 5, 60);
  if (!rateCheck.allowed) {
    return apiError(
      `Too many failed login attempts. Please try again in ${rateCheck.resetSeconds} seconds.`,
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // 2. Server-side Input Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiError('Valid email address is required', 'VALIDATION_ERROR', 422);
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return apiError('Password is required', 'VALIDATION_ERROR', 422);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. User Lookup
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      await logAuditEvent({
        action: 'AUTH_LOGIN_FAILED',
        entity: 'USER',
        details: { email: normalizedEmail, reason: 'User not found' },
        ipAddress: clientIp,
      });
      return apiError('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    if (user.status !== 'ACTIVE') {
      await logAuditEvent({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        entity: 'USER',
        details: { email: normalizedEmail, reason: 'User account inactive/suspended' },
        ipAddress: clientIp,
      });
      return apiError('User account is inactive or suspended', 'FORBIDDEN', 403);
    }

    // 4. Verify Password (bcrypt)
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        entity: 'USER',
        details: { email: normalizedEmail, reason: 'Password mismatch' },
        ipAddress: clientIp,
      });
      return apiError('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    // 5. Tenant Resolution & Scope Verification
    const tenantContext = await resolveTenantFromHost(host);
    let activeMembershipId: string | undefined;
    let activeTenantId: string | undefined;
    let roleCodes: string[] = [];

    if (tenantContext.scope === 'PLATFORM_ADMIN') {
      if (!user.isPlatformStaff) {
        await logAuditEvent({
          userId: user.id,
          action: 'AUTH_LOGIN_DENIED',
          entity: 'PLATFORM_ADMIN',
          details: { email: normalizedEmail, reason: 'Non-platform staff user attempted platform admin access' },
          ipAddress: clientIp,
        });
        return apiError('Access denied: Platform admin scope required', 'FORBIDDEN', 403);
      }
      roleCodes = ['PLATFORM_SUPER_ADMIN'];
    } else if (tenantContext.scope === 'TENANT_APP') {
      if (!tenantContext.tenantId) {
        return apiError('Tenant organization not found or inactive', 'NOT_FOUND', 404);
      }

      if (tenantContext.status === 'SUSPENDED') {
        return apiError('Organization account is suspended', 'FORBIDDEN', 403);
      }

      // Verify user membership in resolved tenant
      const membership = user.memberships.find(
        (m) => m.organizationId === tenantContext.tenantId && m.status === 'ACTIVE'
      );

      if (!membership) {
        await logAuditEvent({
          userId: user.id,
          organizationId: tenantContext.tenantId,
          action: 'AUTH_LOGIN_DENIED',
          entity: 'MEMBERSHIP',
          details: { email: normalizedEmail, reason: 'User has no active membership in this tenant' },
          ipAddress: clientIp,
        });
        return apiError('Access denied: You do not have an active membership in this organization', 'FORBIDDEN', 403);
      }

      activeMembershipId = membership.id;
      activeTenantId = tenantContext.tenantId;
      roleCodes = membership.roles.map((r) => r.code);
    } else {
      // Root SaaS Public domain login fallback
      if (user.memberships.length > 0) {
        activeTenantId = user.memberships[0].organizationId;
        activeMembershipId = user.memberships[0].id;
        roleCodes = user.memberships[0].roles.map((r) => r.code);
      }
    }

    // 6. Sign HS256 JWT Token
    const sessionToken = signJwt({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      isPlatformStaff: user.isPlatformStaff,
      tenantId: activeTenantId,
      membershipId: activeMembershipId,
      roleCodes,
    });

    // 7. Audit Log Login Success
    await logAuditEvent({
      userId: user.id,
      organizationId: activeTenantId,
      action: 'AUTH_LOGIN_SUCCESS',
      entity: 'USER',
      details: { scope: tenantContext.scope, hostname: tenantContext.hostname, roleCodes },
      ipAddress: clientIp,
    });

    // 8. Create Response with HttpOnly hrms_session Cookie
    const cookieOpts = getSessionCookieOptions();
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          isPlatformStaff: user.isPlatformStaff,
        },
        tenantContext: {
          scope: tenantContext.scope,
          tenantId: activeTenantId,
          roleCodes,
        },
      },
    });

    response.cookies.set(cookieOpts.name, sessionToken, cookieOpts);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return apiError('An unexpected authentication error occurred', 'INTERNAL_ERROR', 500);
  }
}
