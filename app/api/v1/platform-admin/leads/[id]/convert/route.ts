import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { subdomainSlug, organizationName, organizationTypeCode, planCode, ownerEmail } = body;

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

    const orgType = await db.organizationType.findUnique({
      where: { code: organizationTypeCode || lead.orgTypeCode || 'COMPANY' },
    });

    if (!orgType) {
      return apiError('Invalid organization type code', 'VALIDATION_ERROR', 422);
    }

    // Lead-to-Tenant Conversion Engine Execution (Phase 2 Conversion Interface)
    // 1. Create Organization in PENDING status
    const newOrg = await db.organization.create({
      data: {
        name: organizationName || lead.orgName,
        slug,
        organizationTypeId: orgType.id,
        status: 'PENDING',
        domains: {
          create: {
            domain: `${slug}.localhost`,
            type: 'SUBDOMAIN',
          },
        },
        settings: {
          create: {
            terminology: orgType.defaultTerminology || {},
          },
        },
      },
    });

    // 2. Update Lead status to CONVERTED and link convertedOrgId
    const updatedLead = await db.lead.update({
      where: { id: params.id },
      data: {
        status: 'CONVERTED',
        convertedOrgId: newOrg.id,
        activities: {
          create: {
            type: 'CONVERTED',
            description: `Lead converted to Organization '${newOrg.name}' (Subdomain: ${slug}.localhost, OrgType: ${orgType.code}). Owner invite pending Phase 3 auth.`,
          },
        },
      },
    });

    return apiSuccess({
      leadId: updatedLead.id,
      organizationId: newOrg.id,
      subdomain: `${slug}.localhost`,
      status: 'CONVERTED',
      phase3DependencyNote: 'Organization record and subdomain reserved. Authenticated tenant owner invitation email and password setup will execute upon Phase 3 authentication activation.',
    });
  } catch (err) {
    console.error('Lead conversion error:', err);
    return apiError('Failed to convert lead to tenant', 'INTERNAL_ERROR', 500);
  }
}
