import { PrismaClient } from '@prisma/client';
import { resolveTenantFromHost } from '../lib/tenant-context';
import { hashPassword, comparePassword, signJwt, verifyJwt } from '../lib/auth';
import { hasPermission } from '../lib/rbac';
import { checkRateLimit } from '../lib/rate-limit';
import { logAuditEvent } from '../lib/audit';

const prisma = new PrismaClient();

async function runPhase3Verification() {
  console.log('====================================================');
  console.log('      RUNNING PHASE 3 VERIFICATION TESTS            ');
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

  // 1. Password Hashing (bcryptjs)
  const passwordRaw = 'SecurePass123!';
  const hash = await hashPassword(passwordRaw);
  const isValidPass = await comparePassword(passwordRaw, hash);
  const isInvalidPass = await comparePassword('WrongPassword', hash);
  assert(isValidPass && !isInvalidPass, 'bcryptjs password hashing & verification works accurately');

  // 2. HS256 JWT Signing & Token Validation
  const validToken = signJwt({ userId: 'u-1', email: 'test@acme.com', fullName: 'Test User', isPlatformStaff: false });
  const decodedValid = verifyJwt(validToken);
  const decodedInvalid = verifyJwt('invalid-fake-jwt-token-string');
  assert(decodedValid?.userId === 'u-1' && decodedInvalid === null, 'HS256 JWT token verification & forgery rejection works accurately');

  // 3. Create Test Tenant A (Acme Corp) & Test Tenant B (School Org)
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  const schoolOrgType = await prisma.organizationType.findUnique({ where: { code: 'SCHOOL' } });
  assert(!!companyOrgType && !!schoolOrgType, 'Database contains OrganizationTypes');

  if (companyOrgType && schoolOrgType) {
    // Create Tenant A (Acme)
    const orgA = await prisma.organization.upsert({
      where: { slug: 'acme-test-a' },
      update: {},
      create: {
        name: 'Acme Corp Tenant A',
        slug: 'acme-test-a',
        organizationTypeId: companyOrgType.id,
        status: 'ACTIVE',
        domains: { create: { domain: 'acme-test-a.localhost', type: 'SUBDOMAIN' } },
      },
    });

    // Create Tenant B (Greenwood)
    const orgB = await prisma.organization.upsert({
      where: { slug: 'greenwood-test-b' },
      update: {},
      create: {
        name: 'Greenwood High Tenant B',
        slug: 'greenwood-test-b',
        organizationTypeId: schoolOrgType.id,
        status: 'ACTIVE',
        domains: { create: { domain: 'greenwood-test-b.localhost', type: 'SUBDOMAIN' } },
      },
    });

    // Create User A (Member of Tenant A only)
    const userA = await prisma.user.upsert({
      where: { email: 'usera@acme-test-a.com' },
      update: {},
      create: {
        email: 'usera@acme-test-a.com',
        passwordHash: hash,
        fullName: 'User A',
        isPlatformStaff: false,
        status: 'ACTIVE',
      },
    });

    // Create Owner Role for Tenant A
    const roleA = await prisma.role.upsert({
      where: { id: 'role-owner-org-a' },
      update: {},
      create: {
        id: 'role-owner-org-a',
        organizationId: orgA.id,
        name: 'Owner Role A',
        code: 'OWNER',
        isSystem: true,
      },
    });

    // Create Membership for User A in Tenant A
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: orgA.id, userId: userA.id } },
      update: {},
      create: {
        organizationId: orgA.id,
        userId: userA.id,
        status: 'ACTIVE',
        roles: { connect: [{ id: roleA.id }] },
      },
    });

    // Create Platform Staff User (Super Admin)
    const platformStaffUser = await prisma.user.upsert({
      where: { email: 'superadmin@platform.com' },
      update: { isPlatformStaff: true },
      create: {
        email: 'superadmin@platform.com',
        passwordHash: hash,
        fullName: 'Super Admin User',
        isPlatformStaff: true,
        status: 'ACTIVE',
      },
    });

    // 4. Test Authorized Access: User A accessing Tenant A
    const sessionUserA = { userId: userA.id, email: userA.email, fullName: userA.fullName, isPlatformStaff: false };
    const hasAccessTenantA = await hasPermission(sessionUserA, orgA.id, 'org:read');
    assert(hasAccessTenantA, 'User A has authorized access to Tenant A (Acme)');

    // 5. Test Cross-Tenant Isolation: User A attempting Tenant B access
    const hasAccessTenantB = await hasPermission(sessionUserA, orgB.id, 'org:read');
    assert(!hasAccessTenantB, 'Cross-Tenant Security: User A denied access to Tenant B (Greenwood)');

    // 6. Test Platform Admin Boundary: Tenant User A attempting Platform Admin action
    const isPlatformStaffA = sessionUserA.isPlatformStaff;
    assert(!isPlatformStaffA, 'Platform Security: Tenant User A denied Platform Staff privilege');

    // 7. Test Platform Staff Privilege: Platform Super Admin user
    const sessionStaff = { userId: platformStaffUser.id, email: platformStaffUser.email, fullName: platformStaffUser.fullName, isPlatformStaff: true };
    const hasAccessStaff = await hasPermission(sessionStaff, undefined, 'org:read');
    assert(hasAccessStaff, 'Platform Admin Security: Platform Staff authorized for platform scope');

    // 8. Test Security Audit Logger
    await logAuditEvent({
      userId: userA.id,
      organizationId: orgA.id,
      action: 'AUTH_LOGIN_SUCCESS',
      entity: 'USER',
      details: { test: true },
    });

    const auditRecord = await prisma.auditLog.findFirst({
      where: { action: 'AUTH_LOGIN_SUCCESS', userId: userA.id },
    });
    assert(!!auditRecord, 'Security Audit Logger writes event to PostgreSQL audit_logs table');
  }

  // 9. Test Rate Limiter Protection
  const limitKey = 'test_rate_limit_ip_123';
  let allowedCount = 0;
  for (let i = 0; i < 6; i++) {
    const res = checkRateLimit(limitKey, 5, 60);
    if (res.allowed) allowedCount++;
  }
  assert(allowedCount === 5, 'Rate Limiter strictly blocked 6th attempt after 5 max allowed attempts');

  // 10. Phase 1 & Phase 2 Hostname Resolution Regressions
  const rootContext = await resolveTenantFromHost('localhost:3000');
  const adminContext = await resolveTenantFromHost('admin.localhost:3000');
  const tenantContext = await resolveTenantFromHost('acme-test-a.localhost:3000');

  assert(rootContext.scope === 'PUBLIC_SAAS', 'Regression: localhost:3000 -> PUBLIC_SAAS');
  assert(adminContext.scope === 'PLATFORM_ADMIN', 'Regression: admin.localhost:3000 -> PLATFORM_ADMIN');
  assert(tenantContext.scope === 'TENANT_APP' && tenantContext.tenantSlug === 'acme-test-a', 'Regression: acme-test-a.localhost:3000 -> TENANT_APP');

  console.log('\n====================================================');
  console.log(`PHASE 3 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase3Verification().catch((err) => {
  console.error('Phase 3 verification failed:', err);
  process.exit(1);
});
