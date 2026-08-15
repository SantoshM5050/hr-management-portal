import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt, SESSION_COOKIE_NAME, hashPassword } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'admin', 'platform', 'api', 'app', 'mail', 'smtp', 'support', 'billing', 'auth', 'status'
]);

/**
 * GET /api/v1/platform-admin/organizations
 * List all provisioned organizations with search, pagination, and status filters.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifyJwt(token) : null;

    if (!session || !session.isPlatformStaff) {
      return apiError('Forbidden: Platform Staff authorization required', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      db.organization.count({ where }),
      db.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organizationType: true,
          domains: true,
          modules: { include: { module: true } },
          memberships: {
            where: { roles: { some: { code: 'OWNER' } } },
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
        },
      }),
    ]);

    return apiSuccess({
      organizations: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('GET /platform-admin/organizations error:', err);
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/v1/platform-admin/organizations
 * Full transactional organization provisioning engine for Platform Admins.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifyJwt(token) : null;

    if (!session || !session.isPlatformStaff) {
      return apiError('Forbidden: Platform Staff authorization required to provision organizations', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const {
      email,
      password,
      fullName,
      orgName,
      orgTypeCode,
      subdomainSlug,
      leadId,
      enabledModuleCodes = ['CORE', 'ATTENDANCE', 'LEAVE'],
    } = body;

    // Server-side Validation
    if (!email || !email.includes('@')) {
      return apiError('Valid work email address is required', 'VALIDATION_ERROR', 422);
    }
    if (!password || password.length < 8) {
      return apiError('Password must be at least 8 characters long', 'VALIDATION_ERROR', 422);
    }
    if (!fullName || fullName.trim().length === 0) {
      return apiError('Owner Full Name is required', 'VALIDATION_ERROR', 422);
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

    const tenantDomainName = `${slug}.${rootDomain}`;
    const tenantHostname = rawRootDomain.includes(':') 
      ? `${slug}.${rawRootDomain}` 
      : `${slug}.${rootDomain}`;

    const protocol = request.headers.get('x-forwarded-proto') || (isLocalhost ? 'http' : 'https');
    const redirectUrl = `${protocol}://${tenantHostname}/login`;

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return apiError('An account with this email address already exists.', 'CONFLICT', 409);
    }

    // Check if subdomain is already taken
    const existingOrg = await db.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return apiError(`Subdomain '${slug}' is already reserved by another tenant.`, 'CONFLICT', 409);
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

    const passwordHash = await hashPassword(password);
    const permissions = await db.permission.findMany();

    // Execute Transactional Tenant Provisioning
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

      // 6. Enable Core & Selected Modules
      const requestedCodes = Array.from(new Set(['CORE', ...enabledModuleCodes]));
      const modules = await tx.module.findMany({
        where: { code: { in: requestedCodes } },
      });

      for (const mod of modules) {
        await tx.organizationModule.create({
          data: {
            organizationId: org.id,
            moduleId: mod.id,
            isEnabled: true,
          },
        });
      }

      // 7. Update Lead if converting from lead
      if (leadId) {
        await tx.lead.update({
          where: { id: leadId },
          data: {
            status: 'CONVERTED',
            convertedOrgId: org.id,
            activities: {
              create: {
                type: 'CONVERTED',
                description: `Lead converted to Organization '${org.name}' (Subdomain: ${tenantHostname}). Owner user: ${user.email}`,
              },
            },
          },
        });
      }

      return { user, org, membership, ownerRole };
    });

    // Audit Event
    await logAuditEvent({
      userId: session.userId,
      organizationId: result.org.id,
      action: 'ORGANIZATION_PROVISIONED_BY_ADMIN',
      entity: 'ORGANIZATION',
      entityId: result.org.id,
      details: { slug, name: result.org.name, orgType: orgType.code, ownerEmail: result.user.email, leadId: leadId || null },
    });

    return apiSuccess({
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        subdomain: tenantHostname,
        domain: tenantDomainName,
        url: redirectUrl,
        ownerEmail: result.user.email,
        ownerFullName: result.user.fullName,
      },
    }, 201);
  } catch (err: any) {
    console.error('Platform Admin Provisioning Failure:', err);

    if (err?.code === 'P2002') {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes('email')) {
        return apiError('An account with this email address already exists.', 'CONFLICT', 409);
      }
      return apiError('Subdomain is already reserved by another organization.', 'CONFLICT', 409);
    }

    return apiError(err?.message ? `Provisioning error: ${err.message}` : 'Failed to provision tenant organization', 'INTERNAL_ERROR', 500);
  }
}
