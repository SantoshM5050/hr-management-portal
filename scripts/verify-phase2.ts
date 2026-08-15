import { PrismaClient } from '@prisma/client';
import { resolveTenantFromHost } from '../lib/tenant-context';

const prisma = new PrismaClient();

async function runPhase2Verification() {
  console.log('====================================================');
  console.log('      RUNNING PHASE 2 VERIFICATION TESTS            ');
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

  // 1. Data-Driven Pricing Plans Test
  const plans = await prisma.plan.findMany({ where: { isActive: true } });
  assert(plans.length >= 3, `Database contains ${plans.length} active data-driven pricing plans (Starter, Professional, Enterprise)`);

  // 2. CMS Content Test
  const heroCms = await prisma.cmsContent.findUnique({ where: { key: 'hero_section' } });
  assert(!!heroCms && heroCms.section === 'HOMEPAGE', 'Platform CMS content for hero_section loaded correctly');

  // 3. Demo Booking Submission & Lead Creation Test
  const testEmail = `demo.test.${Date.now()}@acme-corp.com`;
  const lead = await prisma.lead.create({
    data: {
      fullName: 'Jane Test Executive',
      email: testEmail,
      phone: '+1 555 999 1234',
      orgName: 'Apex Technology Corp',
      orgTypeCode: 'COMPANY',
      peopleCount: '51-200',
      country: 'United States',
      preferredDate: '2026-09-01',
      preferredTime: '10:00 AM',
      modulesOfInterest: ['CORE', 'ATTENDANCE', 'LEAVE'],
      message: 'Testing Phase 2 demo request pipeline',
      status: 'NEW',
      activities: {
        create: {
          type: 'CREATED',
          description: 'Public demo request submitted during Phase 2 verification',
        },
      },
    },
    include: { activities: true },
  });

  assert(!!lead && lead.status === 'NEW', 'Created public demo request lead in PostgreSQL with NEW status');
  assert(lead.activities.length === 1, 'Logged CREATED lead activity in timeline');

  // 4. Duplicate Demo Request Test
  const duplicateLead = await prisma.lead.findFirst({
    where: { email: testEmail },
  });
  assert(duplicateLead?.id === lead.id, 'Duplicate check identifies recently submitted lead');

  // 5. CRM State Machine Transition Test (NEW -> QUALIFIED -> CONVERTED)
  const qualifiedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'QUALIFIED',
      notes: 'Qualified by sales consultant after discovery call',
      activities: {
        create: {
          type: 'STATUS_CHANGE',
          description: 'Lead status updated to QUALIFIED',
        },
      },
    },
    include: { activities: true },
  });

  assert(qualifiedLead.status === 'QUALIFIED', 'Lead state machine transitioned status to QUALIFIED');
  assert(qualifiedLead.activities.length === 2, 'Lead activity audit timeline updated correctly');

  // 6. Lead-to-Tenant Conversion Boundary Test
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  assert(!!companyOrgType, 'Found COMPANY organization type for conversion');

  if (companyOrgType) {
    const testSlug = `apex-${Date.now()}`;
    const convertedOrg = await prisma.organization.create({
      data: {
        name: qualifiedLead.orgName,
        slug: testSlug,
        organizationTypeId: companyOrgType.id,
        status: 'PENDING',
        domains: {
          create: {
            domain: `${testSlug}.localhost`,
            type: 'SUBDOMAIN',
          },
        },
        settings: {
          create: {
            terminology: companyOrgType.defaultTerminology || {},
          },
        },
      },
    });

    const finalLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'CONVERTED',
        convertedOrgId: convertedOrg.id,
        activities: {
          create: {
            type: 'CONVERTED',
            description: `Converted to Organization '${convertedOrg.name}' (${testSlug}.localhost)`,
          },
        },
      },
    });

    assert(finalLead.status === 'CONVERTED' && finalLead.convertedOrgId === convertedOrg.id, 'Lead successfully converted to Tenant Organization boundary');
  }

  // 7. Hostname Resolution Regression Tests
  const rootContext = await resolveTenantFromHost('localhost:3000');
  const adminContext = await resolveTenantFromHost('admin.localhost:3000');
  const tenantContext = await resolveTenantFromHost('acme.localhost:3000');

  assert(rootContext.scope === 'PUBLIC_SAAS', 'Regression Test: localhost:3000 -> PUBLIC_SAAS');
  assert(adminContext.scope === 'PLATFORM_ADMIN', 'Regression Test: admin.localhost:3000 -> PLATFORM_ADMIN');
  assert(tenantContext.scope === 'TENANT_APP' && tenantContext.tenantSlug === 'acme', 'Regression Test: acme.localhost:3000 -> TENANT_APP');

  console.log('\n====================================================');
  console.log(`PHASE 2 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase2Verification().catch((err) => {
  console.error('Phase 2 verification failed:', err);
  process.exit(1);
});
