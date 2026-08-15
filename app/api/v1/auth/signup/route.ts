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

    // Resolve environment ROOT_DOMAIN
    const rawRootDomain = (process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').trim();
    const rootDomain = rawRootDomain.split(':')[0].toLowerCase().trim();
    const isLocalhost = rootDomain === 'localhost' || rootDomain === '127.0.0.1';

    // Domain name stored in DB (without port)
    const tenantDomainName = `${slug}.${rootDomain}`;

    // Full tenant hostname for client display & redirects (includes port if present in rawRootDomain)
    const tenantHostname = rawRootDomain.includes(':') 
      ? `${slug}.${rawRootDomain}` 
      : `${slug}.${rootDomain}`;

    const protocol = request.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');
    const redirectUrl = `${protocol}://${tenantHostname}/app/dashboard`;

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return apiError('An account with this email address already exists.', 'CONFLICT', 409);
    }

    // Check if subdomain is already taken in Organization
    const existingOrg = await db.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return apiError(`Subdomain '${slug}' is already reserved by another organization.`, 'CONFLICT', 409);
    }

    // Check if domain is already taken in Domain
    const existingDomain = await db.domain.findUnique({ where: { domain: tenantDomainName } });
    if (existingDomain) {
      return apiError(`Subdomain '${slug}' is already reserved by another organization.`, 'CONFLICT', 409);
    }

    // Verify or Auto-create OrganizationType fallback
    let orgType = await db.organizationType.findUnique({
      where: { code: orgTypeCode || 'COMPANY' },
    });

    if (!orgType) {
      const defaultTermsMap: Record<string, any> = {
        COMPANY: { department: 'Department', designation: 'Designation', personType: 'Employee', unit: 'Business Unit' },
        STARTUP: { department: 'Team', designation: 'Role', personType: 'Team Member', unit: 'Squad' },
        SCHOOL: { department: 'Faculty / Department', designation: 'Post / Position', personType: 'Teacher / Staff / Student', unit: 'Grade / Class' },
        COLLEGE: { department: 'Academic Department', designation: 'Professor / Lecturer / Staff', personType: 'Faculty / Student', unit: 'School / College' },
        HOSPITAL: { department: 'Medical Department', designation: 'Specialization / Role', personType: 'Doctor / Nurse / Staff', unit: 'Ward / Unit' },
        FACTORY: { department: 'Shift / Department', designation: 'Operator / Supervisor', personType: 'Worker / Staff', unit: 'Plant / Line' },
        NGO: { department: 'Program / Project', designation: 'Designation', personType: 'Staff / Volunteer', unit: 'Field Office' },
      };

      const selectedCode = orgTypeCode || 'COMPANY';
      orgType = await db.organizationType.create({
        data: {
          code: selectedCode,
          name: orgName.trim(),
          defaultTerminology: defaultTermsMap[selectedCode] || defaultTermsMap['COMPANY'],
        },
      });
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
              domain: tenantDomainName,
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
      let coreModule = await tx.module.findUnique({ where: { code: 'CORE' } });
      if (!coreModule) {
        coreModule = await tx.module.create({
          data: {
            code: 'CORE',
            name: 'Universal Core HR & Org Structure',
            description: 'Core people, units, roles, and settings',
            isCore: true,
          },
        });
      }

      await tx.organizationModule.create({
        data: {
          organizationId: org.id,
          moduleId: coreModule.id,
          isEnabled: true,
        },
      });

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
          subdomain: tenantHostname,
          domain: tenantDomainName,
          url: redirectUrl,
        },
      },
    });

    response.cookies.set(cookieOpts.name, sessionToken, cookieOpts);

    return response;
  } catch (err: any) {
    console.error('Signup API Failure:', {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
    });

    if (err?.code === 'P2002') {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes('email')) {
        return apiError('An account with this email address already exists.', 'CONFLICT', 409);
      }
      return apiError('Subdomain is already reserved by another organization.', 'CONFLICT', 409);
    }

    const detailMsg = err?.message
      ? `Signup error: ${err.message}`
      : 'An unexpected error occurred during signup';

    return apiError(detailMsg, 'INTERNAL_ERROR', 500);
  }
}
