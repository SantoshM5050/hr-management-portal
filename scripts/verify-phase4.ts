import { PrismaClient } from '@prisma/client';
import { getTenantRepo } from '../lib/tenant-repo';
import { resolveTenantFromHost } from '../lib/tenant-context';

const prisma = new PrismaClient();

async function runPhase4Verification() {
  console.log('====================================================');
  console.log('      RUNNING PHASE 4 VERIFICATION TESTS            ');
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

  // 1. Verify Database Schema Entities Existence
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  const schoolOrgType = await prisma.organizationType.findUnique({ where: { code: 'SCHOOL' } });
  assert(!!companyOrgType && !!schoolOrgType, 'PostgreSQL database contains core OrganizationTypes');

  // 2. Create Test Tenant Alpha & Test Tenant Beta
  const orgAlpha = await prisma.organization.upsert({
    where: { slug: 'phase4-alpha' },
    update: {},
    create: {
      name: 'Alpha Corp Tenant',
      slug: 'phase4-alpha',
      organizationTypeId: companyOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase4-alpha.localhost', type: 'SUBDOMAIN' } },
    },
  });

  const orgBeta = await prisma.organization.upsert({
    where: { slug: 'phase4-beta' },
    update: {},
    create: {
      name: 'Beta School Tenant',
      slug: 'phase4-beta',
      organizationTypeId: schoolOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase4-beta.localhost', type: 'SUBDOMAIN' } },
    },
  });

  // 3. Test Universal Person Base Identity Architecture
  const repoAlpha = getTenantRepo(orgAlpha.id);
  const repoBeta = getTenantRepo(orgBeta.id);

  // Create Person A in Alpha
  const personA = await repoAlpha.people.create({
    firstName: 'Universal',
    lastName: 'Identity A',
    email: `person.a.${runSuffix}@alpha.com`,
    personTypeCode: 'EMPLOYEE',
  });

  // Attach EmployeeProfile to Person A
  const deptAlpha = await repoAlpha.departments.create({ name: 'Engineering', code: `ENG-${runSuffix}` });
  const desigAlpha = await repoAlpha.designations.create({ title: 'Senior Software Engineer', code: `SWE-${runSuffix}` });

  const empProfile = await prisma.employeeProfile.create({
    data: {
      personId: personA.id,
      departmentId: deptAlpha.id,
      designationId: desigAlpha.id,
      employeeCode: `EMP-${runSuffix}`,
      employmentType: 'FULL_TIME',
    },
  });
  assert(empProfile.personId === personA.id, 'EmployeeProfile successfully attached to universal Person A base identity');

  // Create Person B in Beta and attach StudentProfile + GuardianProfile
  const personStudent = await repoBeta.people.create({
    firstName: 'Alex',
    lastName: 'Student',
    email: `alex.${runSuffix}@beta.edu`,
    personTypeCode: 'STUDENT',
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      personId: personStudent.id,
      studentRollNo: `ROLL-${runSuffix}`,
    },
  });
  assert(studentProfile.personId === personStudent.id, 'StudentProfile successfully attached to universal Person B base identity');

  // 4. Test Repository Tenant Isolation Boundary
  const alphaDepts = await repoAlpha.departments.findMany();
  const betaDepts = await repoBeta.departments.findMany();

  assert(
    alphaDepts.some((d: any) => d.code === `ENG-${runSuffix}`) && !betaDepts.some((d: any) => d.code === `ENG-${runSuffix}`),
    'Tenant Isolation Boundary: Tenant Alpha departments isolated from Tenant Beta'
  );

  // 5. Test Attendance & Leave Domain Foundation
  const leaveTypeAlpha = await prisma.leaveType.create({
    data: {
      organizationId: orgAlpha.id,
      code: `ANNUAL_LEAVE_${runSuffix}`,
      name: 'Annual Paid Leave',
      defaultDaysPerYear: 15,
    },
  });

  const leaveReq = await repoAlpha.leave.createRequest({
    personId: personA.id,
    leaveTypeId: leaveTypeAlpha.id,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-05'),
    daysCount: 5,
    reason: 'Vacation',
  });
  assert(leaveReq.organizationId === orgAlpha.id, 'Leave Request created with explicit tenant scoping');

  // 6. Test Document & Ticketing Domain Foundation
  const docType = await prisma.documentType.create({
    data: { organizationId: orgAlpha.id, code: `PASSPORT_${runSuffix}`, name: 'Passport Identity Copy' },
  });

  const docRecord = await repoAlpha.documents.create({
    personId: personA.id,
    documentTypeId: docType.id,
    title: 'Passport Verification',
    fileUrl: '/storage/docs/passport_01.pdf',
  });
  assert(docRecord.organizationId === orgAlpha.id, 'Document metadata created with storage URL abstraction');

  const ticketCategory = await prisma.ticketCategory.create({
    data: { organizationId: orgAlpha.id, code: `IT_SUPPORT_${runSuffix}`, name: 'IT Infrastructure' },
  });

  const ticketRecord = await repoAlpha.tickets.create({
    personId: personA.id,
    categoryId: ticketCategory.id,
    title: 'Laptop Keyboard Replacement',
    description: 'Keys not responding',
    priority: 'HIGH',
  });
  assert(ticketRecord.organizationId === orgAlpha.id, 'Ticket created under tenant IT_SUPPORT category');

  // 7. Test Optional Modular Payroll & Custom Fields Foundation
  const salaryStruct = await prisma.salaryStructure.create({
    data: { organizationId: orgAlpha.id, name: `Standard Salary ${runSuffix}`, baseMonthlyAmount: 5000 },
  });
  assert(salaryStruct.organizationId === orgAlpha.id, 'Salary Structure created in optional modular payroll domain');

  const customField = await repoAlpha.customFields.create({
    entityName: 'PERSON',
    fieldKey: `tshirt_size_${runSuffix}`,
    fieldLabel: 'T-Shirt Size',
    fieldType: 'SELECT',
    options: ['S', 'M', 'L', 'XL'],
  });
  assert(customField.organizationId === orgAlpha.id, 'Custom Field definition created in configuration domain');

  // 8. Test Hostname Context Security Regression
  const alphaContext = await resolveTenantFromHost('phase4-alpha.localhost:3000');
  assert(alphaContext.tenantId === orgAlpha.id && alphaContext.scope === 'TENANT_APP', 'Hostname resolution correctly identifies phase4-alpha tenant');

  console.log('\n====================================================');
  console.log(`PHASE 4 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase4Verification().catch((err) => {
  console.error('Phase 4 verification failed:', err);
  process.exit(1);
});
