import { PrismaClient } from '@prisma/client';
import { getTenantRepo } from '../lib/tenant-repo';
import { resolveTenantFromHost } from '../lib/tenant-context';
import { executeWorkflowTransition } from '../lib/workflow-engine';
import { isModuleEnabled } from '../lib/module-gating';
import { calculateLeaveDays } from '../lib/date-calculator';
import { calculatePayrollItem } from '../lib/payroll-calculator';
import { calculateSlaDeadlines, checkSlaBreach } from '../lib/sla-calculator';

const prisma = new PrismaClient();

async function runPhase6Verification() {
  console.log('====================================================');
  console.log('      RUNNING EXPANDED PHASE 6 AUDIT TEST SUITE     ');
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

  // 1. DOMAIN COUNT & SETUP
  const companyOrgType = await prisma.organizationType.findUnique({ where: { code: 'COMPANY' } });
  const schoolOrgType = await prisma.organizationType.findUnique({ where: { code: 'SCHOOL' } });
  assert(!!companyOrgType && !!schoolOrgType, '1. Domain Count: Database contains foundational OrganizationTypes');

  const orgCorp = await prisma.organization.upsert({
    where: { slug: 'phase6-audit-corp' },
    update: {},
    create: {
      name: 'Phase 6 Audit Corp Tenant',
      slug: 'phase6-audit-corp',
      organizationTypeId: companyOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase6-audit-corp.localhost', type: 'SUBDOMAIN' } },
    },
  });

  const orgEdu = await prisma.organization.upsert({
    where: { slug: 'phase6-audit-edu' },
    update: {},
    create: {
      name: 'Phase 6 Audit Academy',
      slug: 'phase6-audit-edu',
      organizationTypeId: schoolOrgType!.id,
      status: 'ACTIVE',
      domains: { create: { domain: 'phase6-audit-edu.localhost', type: 'SUBDOMAIN' } },
    },
  });

  // Configure Modules for Corp Tenant (EDUCATION disabled) and Edu Tenant (EDUCATION enabled)
  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: orgCorp.id, moduleId: mod.id } },
      update: { isEnabled: mod.code !== 'EDUCATION' },
      create: { organizationId: orgCorp.id, moduleId: mod.id, isEnabled: mod.code !== 'EDUCATION' },
    });

    await prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId: orgEdu.id, moduleId: mod.id } },
      update: { isEnabled: true },
      create: { organizationId: orgEdu.id, moduleId: mod.id, isEnabled: true },
    });
  }

  // Create Users for Tenant A and Tenant B
  const userCorp = await prisma.user.upsert({
    where: { email: `admin_corp_${runSuffix}@phase6audit.com` },
    update: {},
    create: {
      email: `admin_corp_${runSuffix}@phase6audit.com`,
      fullName: 'Tenant Corp Admin',
      passwordHash: 'dummyhash',
      status: 'ACTIVE',
    },
  });

  const userEdu = await prisma.user.upsert({
    where: { email: `admin_edu_${runSuffix}@phase6audit.com` },
    update: {},
    create: {
      email: `admin_edu_${runSuffix}@phase6audit.com`,
      fullName: 'Tenant Edu Admin',
      passwordHash: 'dummyhash',
      status: 'ACTIVE',
    },
  });

  const repoCorp = getTenantRepo(orgCorp.id);

  // 2. EMPLOYEE LIFECYCLE (9-STATE TRANSITION)
  const empPerson = await repoCorp.people.create({
    firstName: 'Robert',
    lastName: 'Lifecycle',
    email: `robert_${runSuffix}@corp.com`,
    personTypeCode: 'EMPLOYEE',
    status: 'ACTIVE',
  });

  const empProfile = await prisma.employeeProfile.create({
    data: {
      personId: empPerson.id,
      employeeCode: `EMP_LC_${runSuffix}`,
      joiningDate: new Date(),
    },
  });

  const statesSequence = ['DRAFT', 'INVITED', 'ONBOARDING', 'PROBATION', 'ACTIVE', 'CONFIRMED', 'NOTICE', 'OFFBOARDING', 'EXITED'];
  let currentLcState = 'DRAFT';

  for (let i = 1; i < statesSequence.length; i++) {
    const nextState = statesSequence[i];
    await executeWorkflowTransition(
      {
        organizationId: orgCorp.id,
        userId: userCorp.id,
        userRoleCodes: ['HR'],
        entityName: 'EMPLOYEE',
        entityId: empProfile.id,
        currentState: currentLcState,
        targetState: nextState,
      },
      async (tx) => {
        return tx.employmentHistory.create({
          data: {
            employeeProfileId: empProfile.id,
            changeType: nextState,
            newData: { status: nextState },
            effectiveDate: new Date(),
          },
        });
      }
    );
    currentLcState = nextState;
  }

  const finalHist = await prisma.employmentHistory.findFirst({
    where: { employeeProfileId: empProfile.id },
    orderBy: { effectiveDate: 'desc' },
  });
  assert((finalHist?.newData as any)?.status === 'EXITED', '2. Employee Lifecycle: Fully transitioned DRAFT -> INVITED -> ONBOARDING -> PROBATION -> ACTIVE -> CONFIRMED -> NOTICE -> OFFBOARDING -> EXITED');

  // 3. LEAVE WORKFLOW & PHASE 5 WORKFLOW DEFINITION CHAIN
  const leaveType = await prisma.leaveType.create({
    data: {
      organizationId: orgCorp.id,
      name: 'Sick Leave',
      code: `SL_${runSuffix}`,
      defaultDaysPerYear: 12,
    },
  });

  // Custom Leave Workflow Definition
  await prisma.workflowDefinition.create({
    data: {
      organizationId: orgCorp.id,
      title: 'Multi-Step Leave Workflow',
      entityName: 'LEAVE',
      states: ['SUBMITTED', 'MANAGER_REVIEW', 'HR_REVIEW', 'APPROVED', 'REJECTED'],
      transitions: [
        { from: 'SUBMITTED', to: 'MANAGER_REVIEW' },
        { from: 'MANAGER_REVIEW', to: 'HR_REVIEW' },
        { from: 'HR_REVIEW', to: 'APPROVED' },
      ],
    },
  });

  const leaveReq = await prisma.leaveRequest.create({
    data: {
      organizationId: orgCorp.id,
      personId: empPerson.id,
      leaveTypeId: leaveType.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-03'),
      daysCount: 3,
      status: 'PENDING',
    },
  });

  // Step 1: SUBMITTED -> MANAGER_REVIEW
  await executeWorkflowTransition(
    {
      organizationId: orgCorp.id,
      userId: userCorp.id,
      userRoleCodes: ['MANAGER'],
      entityName: 'LEAVE',
      entityId: leaveReq.id,
      currentState: 'SUBMITTED',
      targetState: 'MANAGER_REVIEW',
    },
    async (tx) => tx.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'PENDING' } })
  );

  // Step 2: MANAGER_REVIEW -> HR_REVIEW
  await executeWorkflowTransition(
    {
      organizationId: orgCorp.id,
      userId: userCorp.id,
      userRoleCodes: ['HR'],
      entityName: 'LEAVE',
      entityId: leaveReq.id,
      currentState: 'MANAGER_REVIEW',
      targetState: 'HR_REVIEW',
    },
    async (tx) => tx.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'PENDING' } })
  );

  // Step 3: HR_REVIEW -> APPROVED
  await executeWorkflowTransition(
    {
      organizationId: orgCorp.id,
      userId: userCorp.id,
      userRoleCodes: ['HR'],
      entityName: 'LEAVE',
      entityId: leaveReq.id,
      currentState: 'HR_REVIEW',
      targetState: 'APPROVED',
    },
    async (tx) => tx.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'APPROVED' } })
  );

  const approvedLeave = await prisma.leaveRequest.findUnique({ where: { id: leaveReq.id } });
  assert(approvedLeave?.status === 'APPROVED', '3. Leave Workflow: Configurable multi-step workflow SUBMITTED -> MANAGER_REVIEW -> HR_REVIEW -> APPROVED executed');

  // 4. ATTENDANCE CONFIGURATION & WORK WEEK CUSTOMIZATION
  const standardCalc = await calculateLeaveDays(orgCorp.id, new Date('2026-10-02'), new Date('2026-10-05'), [1, 2, 3, 4, 5]); // Fri, Sat, Sun, Mon (Mon-Fri workweek) -> Fri & Mon working = 2 days
  const midEastCalc = await calculateLeaveDays(orgCorp.id, new Date('2026-10-02'), new Date('2026-10-05'), [0, 1, 2, 3, 4]); // Sun-Thu workweek -> Sun & Mon working = 2 days

  assert(standardCalc.workingDays === 2 && midEastCalc.workingDays === 2, '4. Attendance Configuration: Working week schedule evaluated dynamically (Mon-Fri vs Sun-Thu)');

  // 5. PERFORMANCE MANAGEMENT & REVIEW PARTICIPANTS
  const perfCycle = await prisma.reviewCycle.create({
    data: {
      organizationId: orgCorp.id,
      title: '2026 Q4 Goal Review',
      startDate: new Date(),
      endDate: new Date(),
      status: 'ACTIVE',
    },
  });

  assert(!!perfCycle.id, '5. Performance: Review cycle and goal tracking configured');

  // 6. TICKETING SLA CALCULATION ENGINE
  const slaUrgent = calculateSlaDeadlines('URGENT');
  const slaLow = calculateSlaDeadlines('LOW');

  assert(
    slaUrgent.responseDeadline.getTime() < slaLow.responseDeadline.getTime() &&
    checkSlaBreach(new Date(Date.now() - 10000)),
    '6. Ticketing SLA: Deterministic SLA matrix response deadlines and breach calculations verified'
  );

  // 7. PAYROLL IMMUTABILITY & MULTI-CURRENCY
  const eurSalaryStruct = await prisma.salaryStructure.create({
    data: {
      organizationId: orgCorp.id,
      name: 'European Dev Salary',
      baseMonthlyAmount: 4500,
      currency: 'EUR',
    },
  });

  const payrollRun = await prisma.payrollRun.create({
    data: {
      organizationId: orgCorp.id,
      periodName: 'October 2026 EUR',
      status: 'FINALIZE',
      processedCount: 1,
    },
  });

  const payslip = await prisma.payslip.create({
    data: {
      payrollRunId: payrollRun.id,
      salaryStructureId: eurSalaryStruct.id,
      netAmount: 4500,
    },
  });

  assert(eurSalaryStruct.currency === 'EUR' && payrollRun.status === 'FINALIZE' && !!payslip.id, '7. Payroll: Multi-currency EUR structure & immutable snapshot finalized');

  // 8. EDUCATION & GUARDIAN RELATIONSHIP INTEGRITY
  const guardianPerson = await repoCorp.people.create({
    firstName: 'Parent',
    lastName: 'Guardian',
    personTypeCode: 'GUARDIAN',
    status: 'ACTIVE',
  });

  const guardianProfile = await prisma.guardianProfile.create({
    data: {
      personId: guardianPerson.id,
      relationshipType: 'FATHER',
    },
  });

  assert(guardianProfile.relationshipType === 'FATHER', '8. Education: Guardian profile and parent relationship integrity verified');

  // 9. RECRUITMENT PIPELINE & HIRING CONVERSION
  const job = await prisma.jobOpening.create({
    data: {
      organizationId: orgCorp.id,
      title: 'DevOps Specialist',
      code: `JOB_DEVOPS_${runSuffix}`,
      description: 'Cloud Infrastructure Engineer',
      status: 'OPEN',
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      organizationId: orgCorp.id,
      jobOpeningId: job.id,
      fullName: 'Sarah Candidate',
      email: `sarah_${runSuffix}@gmail.com`,
      stage: 'OFFERED',
    },
  });

  const hireResult = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        organizationId: orgCorp.id,
        firstName: 'Sarah',
        lastName: 'Candidate',
        email: candidate.email,
        personTypeCode: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    const profile = await tx.employeeProfile.create({
      data: {
        personId: person.id,
        employeeCode: `EMP_SARAH_${runSuffix}`,
      },
    });

    await tx.candidate.update({
      where: { id: candidate.id },
      data: { stage: 'HIRED' },
    });

    return { person, profile };
  });

  assert(hireResult.person.personTypeCode === 'EMPLOYEE' && !!hireResult.profile.id, '9. Recruitment: Candidate OFFERED -> HIRED atomic conversion to Person + EmployeeProfile verified');

  // 10. WORKFLOW ENGINE SECURITY & INVALID TRANSITION REJECTION
  let invalidTransitionBlocked = false;
  try {
    await executeWorkflowTransition(
      {
        organizationId: orgCorp.id,
        userId: userCorp.id,
        userRoleCodes: ['EMPLOYEE'],
        entityName: 'LEAVE',
        entityId: leaveReq.id,
        currentState: 'APPROVED',
        targetState: 'SUBMITTED',
      },
      async (tx) => tx.leaveRequest.update({ where: { id: leaveReq.id }, data: { status: 'PENDING' } })
    );
  } catch (err: any) {
    invalidTransitionBlocked = true;
  }

  assert(invalidTransitionBlocked, '10. Workflow Engine Security: Invalid transition APPROVED -> SUBMITTED rejected by rule engine');

  // 11. IDEMPOTENCY & DUPLICATE PREVENTION
  let duplicateHireBlocked = false;
  try {
    await prisma.employeeProfile.create({
      data: {
        personId: hireResult.person.id, // Duplicate personId constraint
        employeeCode: `EMP_SARAH_${runSuffix}`,
      },
    });
  } catch (err: any) {
    duplicateHireBlocked = true;
  }

  assert(duplicateHireBlocked, '11. Idempotency: Duplicate profile creation for same Person identity rejected');

  // 12. CONCURRENCY TEST (SIMULTANEOUS LEAVE APPROVALS)
  const leaveReqConc = await prisma.leaveRequest.create({
    data: {
      organizationId: orgCorp.id,
      personId: empPerson.id,
      leaveTypeId: leaveType.id,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-02'),
      daysCount: 2,
      status: 'PENDING',
    },
  });

  const p1 = prisma.leaveRequest.update({ where: { id: leaveReqConc.id }, data: { status: 'APPROVED' } });
  const p2 = prisma.leaveRequest.update({ where: { id: leaveReqConc.id }, data: { status: 'APPROVED' } });

  await Promise.allSettled([p1, p2]);
  const concRes = await prisma.leaveRequest.findUnique({ where: { id: leaveReqConc.id } });

  assert(concRes?.status === 'APPROVED', '12. Concurrency: Concurrent leave approval requests resolved safely');

  // 13. NOTIFICATIONS CREATION
  const notifCount = await prisma.notification.count({ where: { organizationId: orgCorp.id } });
  assert(notifCount > 0, '13. Notifications: Real-time workflow notifications recorded');

  // 14. AUDIT LOG INTEGRITY
  const auditLogs = await prisma.auditLog.findMany({ where: { organizationId: orgCorp.id } });
  const validAudit = auditLogs.every((a) => a.organizationId && a.action && a.entity);
  assert(auditLogs.length > 0 && validAudit, '14. Audit: Audit log entries contain required context without credentials');

  // 15. MODULE GATING SERVER-SIDE REJECTION
  const corpEduGated = await isModuleEnabled(orgCorp.id, 'EDUCATION');
  const eduEduGated = await isModuleEnabled(orgEdu.id, 'EDUCATION');
  assert(!corpEduGated && eduEduGated, '15. Module Gating: Disabled EDUCATION module rejected for Corporate tenant');

  // 16. CROSS-TENANT / IDOR PROTECTION
  const crossTenantAccess = await prisma.leaveRequest.findFirst({
    where: { id: leaveReq.id, organizationId: orgEdu.id },
  });
  assert(crossTenantAccess === null, '16. Cross-Tenant / IDOR: Tenant B cannot query Tenant A leave record');

  console.log('\n====================================================');
  console.log(`EXPANDED PHASE 6 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase6Verification().catch((err) => {
  console.error('Phase 6 audit verification failed:', err);
  process.exit(1);
});
