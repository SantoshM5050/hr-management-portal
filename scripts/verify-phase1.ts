import { PrismaClient } from '@prisma/client';
import { resolveTenantFromHost } from '../lib/tenant-context';
import { hashPassword, comparePassword, signJwt, verifyJwt } from '../lib/auth';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('====================================================');
  console.log('      RUNNING PHASE 1 VERIFICATION TESTS            ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Root Hostname Resolution
  const rootContext = await resolveTenantFromHost('localhost:3000');
  assert(rootContext.scope === 'PUBLIC_SAAS', 'localhost:3000 resolves to PUBLIC_SAAS scope');

  // 2. Admin Hostname Resolution
  const adminContext = await resolveTenantFromHost('admin.localhost:3000');
  assert(adminContext.scope === 'PLATFORM_ADMIN', 'admin.localhost:3000 resolves to PLATFORM_ADMIN scope');

  // 3. Unknown Subdomain Resolution
  const unknownContext = await resolveTenantFromHost('nonexistent-org.localhost:3000');
  assert(unknownContext.scope === 'TENANT_APP' && unknownContext.status === 'NOT_FOUND', 'Unknown subdomain resolves to NOT_FOUND');

  // 4. Create Test Tenant "Acme Corp" & Test Subdomain Resolution
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  assert(!!companyOrgType, 'Database contains COMPANY OrganizationType from seed');

  if (companyOrgType) {
    // Upsert Acme Corp Organization
    const acmeOrg = await prisma.organization.upsert({
      where: { slug: 'acme' },
      update: {},
      create: {
        name: 'Acme Corporation',
        slug: 'acme',
        organizationTypeId: companyOrgType.id,
        status: 'ACTIVE',
        domains: {
          create: {
            domain: 'acme.localhost',
            type: 'SUBDOMAIN',
            isPrimary: true,
          },
        },
        settings: {
          create: {
            terminology: { department: 'Department', designation: 'Role' },
          },
        },
      },
    });

    assert(!!acmeOrg, 'Created/Found Acme Corp test organization');

    // Test Tenant Hostname Resolution for acme.localhost:3000
    const acmeContext = await resolveTenantFromHost('acme.localhost:3000');
    assert(
      acmeContext.scope === 'TENANT_APP' && acmeContext.tenantId === acmeOrg.id && acmeContext.status === 'ACTIVE',
      'acme.localhost:3000 resolves to active Acme Corp tenant context'
    );

    // 5. Test Suspended Tenant Handling
    const suspendedOrg = await prisma.organization.upsert({
      where: { slug: 'suspended-co' },
      update: { status: 'SUSPENDED' },
      create: {
        name: 'Suspended Co',
        slug: 'suspended-co',
        organizationTypeId: companyOrgType.id,
        status: 'SUSPENDED',
        domains: {
          create: {
            domain: 'suspended-co.localhost',
            type: 'SUBDOMAIN',
          },
        },
      },
    });

    const suspendedContext = await resolveTenantFromHost('suspended-co.localhost:3000');
    assert(
      suspendedContext.status === 'SUSPENDED',
      'suspended-co.localhost:3000 resolves to SUSPENDED status'
    );
  }

  // 6. Test Password Hashing & HS256 Auth JWT
  const rawPassword = 'SuperSecurePassword123!';
  const hash = await hashPassword(rawPassword);
  const isMatch = await comparePassword(rawPassword, hash);
  assert(isMatch, 'bcryptjs password hashing and verification works correctly');

  const token = signJwt({ userId: 'usr-123', email: 'test@acme.com', fullName: 'Test User', isPlatformStaff: false });
  const decoded = verifyJwt(token);
  assert(decoded?.userId === 'usr-123' && decoded?.email === 'test@acme.com', 'HS256 JWT signing and verification works correctly');

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
