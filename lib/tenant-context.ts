import { db } from './db';

export type TenantScope = 'PUBLIC_SAAS' | 'PLATFORM_ADMIN' | 'TENANT_APP';

export interface TenantContext {
  scope: TenantScope;
  hostname: string;
  tenantSlug?: string;
  tenantId?: string;
  tenantName?: string;
  organizationTypeId?: string;
  organizationTypeCode?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'ARCHIVED' | 'NOT_FOUND';
  error?: string;
}

/**
 * Normalizes host header to extract domain and port.
 */
export function normalizeHostHeader(hostHeader: string | null): string {
  if (!hostHeader) return 'localhost:3000';
  return hostHeader.split(':')[0].toLowerCase().trim();
}

/**
 * Hostname Tenant Resolver.
 * Strict Tenant Security Rule: Hostname / Custom Domain is the ONLY source of tenant identity.
 * Rejects and ignores X-Tenant-Id headers and tenant_id query parameters.
 */
export async function resolveTenantFromHost(hostHeader: string | null): Promise<TenantContext> {
  const hostname = normalizeHostHeader(hostHeader);
  const rootDomain = (process.env.ROOT_DOMAIN || 'localhost:3000').split(':')[0].toLowerCase().trim();

  // 1. Public SaaS Marketing Website (e.g. localhost:3000, yourdomain.com, www.yourdomain.com)
  if (
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return {
      scope: 'PUBLIC_SAAS',
      hostname,
    };
  }

  // 2. Platform Admin Dashboard (e.g. admin.localhost:3000, admin.yourdomain.com)
  if (hostname === `admin.${rootDomain}` || hostname === 'admin.localhost') {
    return {
      scope: 'PLATFORM_ADMIN',
      hostname,
    };
  }

  // 3. Subdomain Tenant Apps (e.g. acme.localhost:3000, school.yourdomain.com)
  if (hostname.endsWith(`.${rootDomain}`) || hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    const tenantSlug = parts[0];

    if (tenantSlug === 'www' || tenantSlug === 'admin') {
      return {
        scope: tenantSlug === 'admin' ? 'PLATFORM_ADMIN' : 'PUBLIC_SAAS',
        hostname,
      };
    }

    try {
      // Lookup Domain or Organization by slug
      const domainRecord = await db.domain.findUnique({
        where: { domain: hostname },
        include: {
          organization: {
            include: { organizationType: true },
          },
        },
      });

      if (domainRecord && domainRecord.organization) {
        return {
          scope: 'TENANT_APP',
          hostname,
          tenantSlug: domainRecord.organization.slug,
          tenantId: domainRecord.organization.id,
          tenantName: domainRecord.organization.name,
          organizationTypeId: domainRecord.organization.organizationTypeId,
          organizationTypeCode: domainRecord.organization.organizationType?.code,
          status: domainRecord.organization.status as any,
        };
      }

      // Fallback lookup by Organization slug directly
      const orgRecord = await db.organization.findUnique({
        where: { slug: tenantSlug },
        include: { organizationType: true },
      });

      if (orgRecord) {
        return {
          scope: 'TENANT_APP',
          hostname,
          tenantSlug: orgRecord.slug,
          tenantId: orgRecord.id,
          tenantName: orgRecord.name,
          organizationTypeId: orgRecord.organizationTypeId,
          organizationTypeCode: orgRecord.organizationType?.code,
          status: orgRecord.status as any,
        };
      }

      return {
        scope: 'TENANT_APP',
        hostname,
        tenantSlug,
        status: 'NOT_FOUND',
        error: `Tenant subdomain '${tenantSlug}' is not registered.`,
      };
    } catch (err) {
      console.error(`Error resolving tenant subdomain '${tenantSlug}':`, err);
      return {
        scope: 'TENANT_APP',
        hostname,
        tenantSlug,
        status: 'NOT_FOUND',
        error: 'Database query failed during tenant resolution.',
      };
    }
  }

  // 4. Custom Domain Resolution (e.g. hrms.acmecorp.com)
  try {
    const customDomainRecord = await db.domain.findUnique({
      where: { domain: hostname },
      include: {
        organization: {
          include: { organizationType: true },
        },
      },
    });

    if (customDomainRecord && customDomainRecord.organization) {
      return {
        scope: 'TENANT_APP',
        hostname,
        tenantSlug: customDomainRecord.organization.slug,
        tenantId: customDomainRecord.organization.id,
        tenantName: customDomainRecord.organization.name,
        organizationTypeId: customDomainRecord.organization.organizationTypeId,
        organizationTypeCode: customDomainRecord.organization.organizationType?.code,
        status: customDomainRecord.organization.status as any,
      };
    }
  } catch (err) {
    console.error(`Error resolving custom domain '${hostname}':`, err);
  }

  return {
    scope: 'PUBLIC_SAAS',
    hostname,
  };
}
