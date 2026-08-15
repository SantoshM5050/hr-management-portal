import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt, SESSION_COOKIE_NAME, hashPassword } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? verifyJwt(token) : null;

    if (!session || !session.isPlatformStaff) {
      return apiError('Forbidden: Platform Staff authorization required for lead conversion', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const { subdomainSlug, organizationName, organizationTypeCode, ownerFullName, ownerEmail, ownerPassword } = body;

    const lead = await db.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return apiError('Lead not found', 'NOT_FOUND', 404);
    }

    if (!subdomainSlug || typeof subdomainSlug !== 'string' || subdomainSlug.trim().length === 0) {
      return apiError('Subdomain slug is required for tenant conversion', 'VALIDATION_ERROR', 422);
    }

    const slug = subdomainSlug.toLowerCase().trim();

    // Check if subdomain is already taken
    const existingOrg = await db.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return apiError(`Subdomain '${slug}' is already reserved or in use by another tenant.`, 'CONFLICT', 409);
    }

    const targetEmail = (ownerEmail || lead.email).toLowerCase().trim();
    const targetName = (ownerFullName || lead.fullName).trim();
    const targetPassword = ownerPassword || 'Admin@123456';

    // Verify or Auto-create OrganizationType
    let orgType = await db.organizationType.findUnique({
      where: { code: organizationTypeCode || lead.orgTypeCode || 'COMPANY' },
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

      const selectedCode = organizationTypeCode || lead.orgTypeCode || 'COMPANY';
      orgType = await db.organizationType.create({
        data: {
          code: selectedCode,
          name: organizationName || lead.orgName,
          defaultTerminology: defaultTermsMap[selectedCode] || defaultTermsMap['COMPANY'],
        },
      });
    }

    const passwordHash = await hashPassword(targetPassword);
    const permissions = await db.permission.findMany();

    const rawRootDomain = (process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000').trim();
    const rootDomain = rawRootDomain.split(':')[0].toLowerCase().trim();
    const tenantDomainName = `${slug}.${rootDomain}`;
    const tenantHostname = rawRootDomain.includes(':') ? `${slug}.${rawRootDomain}` : `${slug}.${rootDomain}`;

    // Full Transactional Provisioning Engine
    const result = await db.$transaction(async (tx) => {
      // 1. Create or Find User
      let user = await tx.user.findUnique({ where: { email: targetEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: targetEmail,
            passwordHash,
            fullName: targetName,
            isPlatformStaff: false,
            status: 'ACTIVE',
          },
        });
      }

      // 2. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organizationName || lead.orgName,
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

      // 3. Create Person Record
      const nameParts = targetName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await tx.person.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          personTypeCode: (orgType.defaultTerminology as any)?.personType || 'Employee',
          firstName,
          lastName,
          email: targetEmail,
          status: 'ACTIVE',
        },
      });

      // 4. Create Owner Role
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

      // 6. Enable Core Modules
      const defaultModules = ['CORE', 'ATTENDANCE', 'LEAVE'];
      const modules = await tx.module.findMany({ where: { code: { in: defaultModules } } });

      for (const mod of modules) {
        await tx.organizationModule.create({
          data: {
            organizationId: org.id,
            moduleId: mod.id,
            isEnabled: true,
          },
        });
      }

      // 7. Mark Lead as CONVERTED
      const updatedLead = await tx.lead.update({
        where: { id: params.id },
        data: {
          status: 'CONVERTED',
          convertedOrgId: org.id,
          activities: {
            create: {
              type: 'CONVERTED',
              description: `Lead converted to active Organization '${org.name}' (Subdomain: ${tenantHostname}). Owner: ${targetEmail}`,
            },
          },
        },
      });

      return { user, org, membership, ownerRole, updatedLead };
    });

    await logAuditEvent({
      userId: session.userId,
      organizationId: result.org.id,
      action: 'LEAD_CONVERTED_TO_TENANT',
      entity: 'ORGANIZATION',
      entityId: result.org.id,
      details: { leadId: params.id, slug, name: result.org.name, ownerEmail: targetEmail },
    });

    return apiSuccess({
      leadId: result.updatedLead.id,
      organizationId: result.org.id,
      subdomain: tenantHostname,
      url: `http://${tenantHostname}/login`,
      ownerEmail: targetEmail,
      status: 'CONVERTED',
    });
  } catch (err: any) {
    console.error('Lead conversion error:', err);
    return apiError(err?.message ? `Conversion error: ${err.message}` : 'Failed to convert lead to tenant', 'INTERNAL_ERROR', 500);
  }
}
