import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { hashPassword, signJwt, getSessionCookieOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'admin', 'platform', 'api', 'app', 'mail', 'smtp', 'support', 'billing', 'auth', 'status'
]);

export async function POST(request: NextRequest) {
  const reqHeaders = headers();
  const clientIp = reqHeaders.get('x-forwarded-for') || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. Rate limiting (Max 3 signup attempts per minute)
  const rateCheck = checkRateLimit(`signup:${clientIp}`, 3, 60);
  if (!rateCheck.allowed) {
    return apiError(`Too many signup attempts. Please wait ${rateCheck.resetSeconds} seconds.`, 'RATE_LIMIT_EXCEEDED', 429);
  }

  try {
    const body = await request.json();
    const { email, password, fullName, orgName, orgTypeCode, subdomainSlug } = body;

    // 2. Server-side Validation
    if (!email || !email.includes('@')) {
      return apiError('Valid email address is required', 'VALIDATION_ERROR', 422);
    }
    if (!password || password.length < 8) {
      return apiError('Password must be at least 8 characters long', 'VALIDATION_ERROR', 422);
    }
    if (!fullName || fullName.trim().length === 0) {
      return apiError('Full Name is required', 'VALIDATION_ERROR', 422);
    }
    if (!orgName || orgName.trim().length === 0) {
      return apiError('Organization Name is required', 'VALIDATION_ERROR', 422);
    }
    if (!subdomainSlug || subdomainSlug.trim().length === 0) {
      return apiError('Subdomain slug is required', 'VALIDATION_ERROR', 422);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const slug = subdomainSlug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim();

    if (RESERVED_SUBDOMAINS.has(slug)) {
      return apiError(`Subdomain '${slug}' is reserved for platform infrastructure.`, 'CONFLICT', 409);
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return apiError('An account with this email address already exists.', 'CONFLICT', 409);
    }

    // Check if subdomain is already taken
    const existingOrg = await db.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return apiError(`Subdomain '${slug}' is already reserved by another organization.`, 'CONFLICT', 409);
    }

    // Verify OrganizationType
    const orgType = await db.organizationType.findUnique({
      where: { code: orgTypeCode || 'COMPANY' },
    });
    if (!orgType) {
      return apiError('Invalid organization type selected', 'VALIDATION_ERROR', 422);
    }

    // Hash Password
    const passwordHash = await hashPassword(password);

    // Get core permissions to assign to Owner role
    const permissions = await db.permission.findMany();

    // Execute Transactional Provisioning
    const result = await db.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: fullName.trim(),
          isPlatformStaff: false,
          status: 'ACTIVE',
        },
      });

      // 2. Create Organization
      const org = await tx.organization.create({
        data: {
          name: orgName.trim(),
          slug,
          organizationTypeId: orgType.id,
          status: 'ACTIVE',
          domains: {
            create: {
              domain: `${slug}.localhost`,
              type: 'SUBDOMAIN',
              isPrimary: true,
              isVerified: true,
            },
          },
          settings: {
            create: {
              terminology: orgType.defaultTerminology || {},
            },
          },
        },
      });

      // 3. Create Base Person Record for Owner
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await tx.person.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          personTypeCode: (orgType.defaultTerminology as any)?.personType || 'Employee',
          firstName,
          lastName,
          email: normalizedEmail,
          status: 'ACTIVE',
        },
      });

      // 4. Create Tenant OWNER Role
      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'Organization Owner',
          code: 'OWNER',
          isSystem: true,
          permissions: {
            connect: permissions.map((p) => ({ id: p.id })),
          },
        },
      });

      // 5. Create Membership
      const membership = await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          status: 'ACTIVE',
          roles: {
            connect: [{ id: ownerRole.id }],
          },
        },
      });

      // 6. Enable Core Module
      const coreModule = await tx.module.findUnique({ where: { code: 'CORE' } });
      if (coreModule) {
        await tx.organizationModule.create({
          data: {
            organizationId: org.id,
            moduleId: coreModule.id,
            isEnabled: true,
          },
        });
      }

      return { user, org, membership, ownerRole };
    });

    // Audit Event
    await logAuditEvent({
      userId: result.user.id,
      organizationId: result.org.id,
      action: 'ORGANIZATION_CREATED',
      entity: 'ORGANIZATION',
      entityId: result.org.id,
      details: { slug, name: result.org.name, orgType: orgType.code },
      ipAddress: clientIp,
    });

    // Issue JWT Session Cookie
    const sessionToken = signJwt({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      isPlatformStaff: false,
      tenantId: result.org.id,
      membershipId: result.membership.id,
      roleCodes: ['OWNER'],
    });

    const cookieOpts = getSessionCookieOptions();
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
        },
        organization: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
          subdomain: `${slug}.localhost`,
        },
      },
    });

    response.cookies.set(cookieOpts.name, sessionToken, cookieOpts);

    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return apiError('An unexpected error occurred during signup', 'INTERNAL_ERROR', 500);
  }
}
