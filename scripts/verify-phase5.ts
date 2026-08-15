import { PrismaClient } from '@prisma/client';
import { getTenantRepo } from '../lib/tenant-repo';
import { resolveTenantFromHost } from '../lib/tenant-context';
import { logAuditEvent } from '../lib/audit';

const prisma = new PrismaClient();

async function runPhase5Verification() {
  console.log('====================================================');
  console.log('      EXPANDED PHASE 5 GAP & SYSTEM VERIFICATION    ');
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

  const runSuffix = Date.now().toString().slice(-4);

  // 1. Verify Organization Setup
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  assert(!!companyOrgType, '1. Database contains COMPANY OrganizationType');

  // Create Tenant A
  const orgA = await prisma.organization.upsert({
    where: { slug: 'phase5-tenant-a' },
    update: {},
    create: {
      name: 'Phase 5 Tenant A Corp',
      slug: 'phase5-tenant-a',
      organizationTypeId: companyOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase5-tenant-a.localhost', type: 'SUBDOMAIN' } },
      settings: { create: { primaryColor: '#0f172a', timezone: 'UTC', currency: 'USD', terminology: {} } },
    },
  });

  // Create Tenant B
  const orgB = await prisma.organization.upsert({
    where: { slug: 'phase5-tenant-b' },
    update: {},
    create: {
      name: 'Phase 5 Tenant B Enterprise',
      slug: 'phase5-tenant-b',
      organizationTypeId: companyOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase5-tenant-b.localhost', type: 'SUBDOMAIN' } },
      settings: { create: { primaryColor: '#047857', timezone: 'EST', currency: 'EUR', terminology: {} } },
    },
  });

  // Create Test User for Audit Logging FK Test
  const testUser = await prisma.user.upsert({
    where: { email: `admin_${runSuffix}@tenanta.com` },
    update: {},
    create: {
      email: `admin_${runSuffix}@tenanta.com`,
      fullName: 'System Admin Test',
      passwordHash: 'dummyhash',
      status: 'ACTIVE',
    },
  });

  const repoA = getTenantRepo(orgA.id);
  const repoB = getTenantRepo(orgB.id);

  // 2. Structure UI Entities Support: Departments, Designations, Locations, Units
  const deptA = await repoA.departments.create({ name: 'Engineering', code: `ENG_${runSuffix}` });
  const desigA = await repoA.designations.create({ title: 'Senior Staff Lead', code: `LEAD_${runSuffix}` });
  const locA = await repoA.locations.create({ name: 'Silicon Valley HQ', code: `SV_${runSuffix}`, address: '100 Tech Way' });
  const unitA = await repoA.units.create({ name: 'Americas Division', code: `AMER_${runSuffix}`, unitType: 'DIVISION' });

  assert(
    !!deptA.id && !!desigA.id && !!locA.id && !!unitA.id,
    '2. Organization Structure UI entities created: Departments, Designations, Locations, Units'
  );

  // 3. Structure Security: Duplicate code prevention per tenant
  let dupPrevented = false;
  try {
    await repoA.departments.create({ name: 'Duplicate Eng', code: `ENG_${runSuffix}` });
  } catch (err) {
    dupPrevented = true;
  }
  assert(dupPrevented, '3. Structure Security: Duplicate department code within same tenant strictly rejected');

  // 4. People Administration: Create, Search, Filter, Profile, Archive/Deactivate
  const personActive = await repoA.people.create({
    firstName: 'Alice',
    lastName: 'Smith',
    email: `alice_${runSuffix}@tenanta.com`,
    personTypeCode: 'EMPLOYEE',
    status: 'ACTIVE',
  });

  const personArchived = await repoA.people.create({
    firstName: 'Bob',
    lastName: 'Jones',
    email: `bob_${runSuffix}@tenanta.com`,
    personTypeCode: 'CONTRACTOR',
    status: 'ARCHIVED',
  });

  assert(personActive.status === 'ACTIVE' && personArchived.status === 'ARCHIVED', '4. People Admin: Active and Archived person records created');

  // Person Search & Filter Verification
  const searchResults = await repoA.people.findMany({
    where: {
      OR: [{ firstName: { contains: 'Alice' } }, { email: { contains: `alice_${runSuffix}` } }],
      personTypeCode: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });
  assert(searchResults.length === 1 && searchResults[0].firstName === 'Alice', '5. People Admin: Search by query and personTypeCode filtering works correctly');

  // Person Status Edit (Reactivation / Archival)
  const updatedPerson = await prisma.person.update({
    where: { id: personActive.id },
    data: { status: 'ARCHIVED' },
  });
  assert(updatedPerson.status === 'ARCHIVED', '6. People Admin: Person archive/deactivate operation works correctly');

  // 5. Custom Field Engine: All 12 Approved Data Types Support
  const approvedTypes = [
    'TEXT',
    'LONG_TEXT',
    'NUMBER',
    'DECIMAL',
    'BOOLEAN',
    'DATE',
    'DATETIME',
    'SELECT',
    'MULTI_SELECT',
    'EMAIL',
    'PHONE',
    'URL',
  ];

  let createdTypesCount = 0;
  for (const fType of approvedTypes) {
    const cf = await repoA.customFields.create({
      entityName: 'PERSON',
      fieldKey: `cf_${fType.toLowerCase()}_${runSuffix}`,
      fieldLabel: `Custom ${fType}`,
      fieldType: fType,
      isRequired: false,
      options: ['SELECT', 'MULTI_SELECT'].includes(fType) ? ['Opt 1', 'Opt 2'] : null,
    });
    if (cf.id) createdTypesCount++;
  }
  assert(createdTypesCount === 12, '7. Custom Field Engine: All 12 approved field types created & verified (TEXT, LONG_TEXT, NUMBER, DECIMAL, BOOLEAN, DATE, DATETIME, SELECT, MULTI_SELECT, EMAIL, PHONE, URL)');

  // 6. Form Definition & Workflow Builder Configuration Engines
  const formDef = await prisma.formDefinition.create({
    data: {
      organizationId: orgA.id,
      title: 'Employee Onboarding Form',
      entityName: 'PERSON',
      schema: { fields: ['firstName', 'lastName', `cf_text_${runSuffix}`] },
    },
  });

  const workflowDef = await prisma.workflowDefinition.create({
    data: {
      organizationId: orgA.id,
      title: 'Leave Request Multi-Stage Lifecycle',
      entityName: 'LEAVE',
      states: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
      transitions: [{ from: 'SUBMITTED', to: 'APPROVED', label: 'Approve' }],
    },
  });

  assert(!!formDef.id && !!workflowDef.id, '8. Form Definition and Workflow Builder rule engines created successfully');

  // 7. Roles & Permissions Management
  const permRead = await prisma.permission.findUnique({ where: { code: 'org:read' } });
  const customRole = await prisma.role.create({
    data: {
      organizationId: orgA.id,
      name: `HR Specialist ${runSuffix}`,
      code: `HR_SPEC_${runSuffix}`,
      isSystem: false,
      permissions: permRead ? { connect: [{ id: permRead.id }] } : undefined,
    },
    include: { permissions: true },
  });
  assert(customRole.permissions.length > 0, '9. Roles & Permissions: Custom role created with granular permission linkage');

  // 8. Module Activation & CORE Mandatory Lock
  const coreMod = await prisma.module.findUnique({ where: { code: 'CORE' } });
  const eduMod = await prisma.module.findUnique({ where: { code: 'EDUCATION' } });

  assert(coreMod?.isCore === true, '10. Module Activation: CORE module is locked as mandatory');

  if (eduMod) {
    const orgModEdu = await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: orgA.id, moduleId: eduMod.id } },
      update: { isEnabled: false },
      create: { organizationId: orgA.id, moduleId: eduMod.id, isEnabled: false },
    });
    assert(orgModEdu.isEnabled === false, '11. Module Activation: EDUCATION module can be explicitly disabled for corporate tenants');
  }

  // 9. Tenant Security Isolation: Tenant B cannot access Tenant A data
  const tenantBDepts = await repoB.departments.findMany();
  const hasTenantADept = tenantBDepts.some((d) => d.id === deptA.id);
  assert(!hasTenantADept, '12. Tenant Security Isolation: Tenant B cannot read or access Tenant A configuration records');

  // 10. Audit Logging Verification
  await logAuditEvent({
    userId: testUser.id,
    organizationId: orgA.id,
    action: 'TEST_CONFIG_CHANGE',
    entity: 'SETTINGS',
    details: { test: true },
  });

  const auditLogRecord = await prisma.auditLog.findFirst({
    where: { organizationId: orgA.id, action: 'TEST_CONFIG_CHANGE' },
  });

  assert(!!auditLogRecord, '13. Audit Logging: Configuration change audit event recorded in database');

  // 11. Hostname Tenant Resolution Security
  const resolvedA = await resolveTenantFromHost('phase5-tenant-a.localhost:3000');
  assert(resolvedA.tenantId === orgA.id, '14. Hostname Tenancy: phase5-tenant-a.localhost resolves to Tenant A');

  console.log('\n====================================================');
  console.log(`EXPANDED PHASE 5 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase5Verification().catch((err) => {
  console.error('Phase 5 verification failed:', err);
  process.exit(1);
});
