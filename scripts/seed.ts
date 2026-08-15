import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 & Phase 2 baseline data...');

  // 1. Seed Organization Types
  const orgTypes = [
    {
      code: 'COMPANY',
      name: 'Company / Business Enterprise',
      defaultTerminology: { department: 'Department', designation: 'Designation', personType: 'Employee', unit: 'Business Unit' },
    },
    {
      code: 'STARTUP',
      name: 'Startup',
      defaultTerminology: { department: 'Team', designation: 'Role', personType: 'Team Member', unit: 'Squad' },
    },
    {
      code: 'SCHOOL',
      name: 'School / K-12 Academy',
      defaultTerminology: { department: 'Faculty / Department', designation: 'Post / Position', personType: 'Teacher / Staff / Student', unit: 'Grade / Class' },
    },
    {
      code: 'COLLEGE',
      name: 'College / University / Higher Ed Institute',
      defaultTerminology: { department: 'Academic Department', designation: 'Professor / Lecturer / Staff', personType: 'Faculty / Student', unit: 'School / College' },
    },
    {
      code: 'HOSPITAL',
      name: 'Hospital / Healthcare Clinic',
      defaultTerminology: { department: 'Medical Department', designation: 'Specialization / Role', personType: 'Doctor / Nurse / Staff', unit: 'Ward / Unit' },
    },
    {
      code: 'FACTORY',
      name: 'Factory / Manufacturing Facility',
      defaultTerminology: { department: 'Shift / Department', designation: 'Operator / Supervisor', personType: 'Worker / Staff', unit: 'Plant / Line' },
    },
    {
      code: 'NGO',
      name: 'Non-Profit / NGO',
      defaultTerminology: { department: 'Program / Project', designation: 'Designation', personType: 'Staff / Volunteer', unit: 'Field Office' },
    },
  ];

  for (const ot of orgTypes) {
    await prisma.organizationType.upsert({
      where: { code: ot.code },
      update: { name: ot.name, defaultTerminology: ot.defaultTerminology },
      create: { code: ot.code, name: ot.name, defaultTerminology: ot.defaultTerminology },
    });
  }
  console.log(`Seeded ${orgTypes.length} OrganizationTypes.`);

  // 2. Seed Modules
  const modules = [
    { code: 'CORE', name: 'Universal Core HR & Org Structure', description: 'Core people, units, roles, and settings', isCore: true },
    { code: 'ATTENDANCE', name: 'Time & Attendance', description: 'Clock-in, check-out, time tracking, corrections', isCore: false },
    { code: 'LEAVE', name: 'Leave & Absence Management', description: 'Leave balances, requests, calendars, approvals', isCore: false },
    { code: 'PAYROLL', name: 'Payroll & Compensation', description: 'Optional payroll calculation, payslips, structures', isCore: false },
    { code: 'RECRUITMENT', name: 'Recruitment & Hiring', description: 'Job openings, candidate pipelines, interview workflows', isCore: false },
    { code: 'EDUCATION', name: 'Academic & Education', description: 'Optional classes, semesters, courses, faculties', isCore: false },
    { code: 'PERFORMANCE', name: 'Performance & Reviews', description: 'Reviews, appraisals, goal tracking', isCore: false },
    { code: 'TICKETING', name: 'Helpdesk & Support Tickets', description: 'Internal ticket tracking and SLAs', isCore: false },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, isCore: mod.isCore },
      create: { code: mod.code, name: mod.name, description: mod.description, isCore: mod.isCore },
    });
  }
  console.log(`Seeded ${modules.length} Modules.`);

  // 3. Seed Permissions
  const permissions = [
    { code: 'org:read', moduleCode: 'CORE', description: 'View organization details and structure' },
    { code: 'org:write', moduleCode: 'CORE', description: 'Manage organization settings and configuration' },
    { code: 'people:read', moduleCode: 'CORE', description: 'View people directory and profiles' },
    { code: 'people:write', moduleCode: 'CORE', description: 'Create and update people profiles' },
    { code: 'attendance:read', moduleCode: 'ATTENDANCE', description: 'View attendance records' },
    { code: 'attendance:write', moduleCode: 'ATTENDANCE', description: 'Clock in/out and manage attendance' },
    { code: 'leave:read', moduleCode: 'LEAVE', description: 'View leave requests and balances' },
    { code: 'leave:approve', moduleCode: 'LEAVE', description: 'Approve or reject leave requests' },
    { code: 'payroll:read', moduleCode: 'PAYROLL', description: 'View payroll details and payslips' },
    { code: 'payroll:run', moduleCode: 'PAYROLL', description: 'Execute payroll runs' },
    { code: 'education:read', moduleCode: 'EDUCATION', description: 'View academic structures' },
    { code: 'education:write', moduleCode: 'EDUCATION', description: 'Manage academic structures' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { moduleCode: perm.moduleCode, description: perm.description },
      create: { code: perm.code, moduleCode: perm.moduleCode, description: perm.description },
    });
  }
  console.log(`Seeded ${permissions.length} System Permissions.`);

  // 4. Seed Data-driven Pricing Plans (Phase 2)
  const plans = [
    {
      code: 'STARTER',
      name: 'Starter Plan',
      description: 'Ideal for growing startups, small businesses, and single-campus schools.',
      monthlyPrice: 49,
      annualPrice: 39,
      currency: 'USD',
      features: [
        'Up to 50 Active Members / Staff',
        'Universal Core HR & Org Structure',
        'Time & Attendance Tracking',
        'Leave & Absence Management',
        'Custom Fields & Dynamic Forms',
        'Standard Email & In-App Support',
      ],
      limits: { maxMembers: 50, maxStorageMb: 5000, enabledModules: ['CORE', 'ATTENDANCE', 'LEAVE'] },
      displayOrder: 1,
      isActive: true,
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional Plan',
      description: 'Comprehensive solution for medium organizations, schools, and colleges.',
      monthlyPrice: 149,
      annualPrice: 119,
      currency: 'USD',
      features: [
        'Up to 250 Active Members / Staff',
        'All Starter Features Included',
        'Academic & Education Module',
        'Performance & Appraisal Reviews',
        'Helpdesk Ticketing System',
        'CSV Import/Export Center',
        'Priority Technical Support',
      ],
      limits: { maxMembers: 250, maxStorageMb: 25000, enabledModules: ['CORE', 'ATTENDANCE', 'LEAVE', 'EDUCATION', 'PERFORMANCE', 'TICKETING'] },
      displayOrder: 2,
      isActive: true,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise Plan',
      description: 'Advanced platform for large enterprises, multi-campus universities, and factories.',
      monthlyPrice: 399,
      annualPrice: 319,
      currency: 'USD',
      features: [
        'Unlimited Members & Custom Capacity',
        'All Professional Features Included',
        'Optional Payroll Calculation Engine',
        'Recruitment & Hiring Pipeline',
        'Custom Domain Connectivity',
        'Dedicated Account Manager & SLA',
        'Audit Log Analytics',
      ],
      limits: { maxMembers: -1, maxStorageMb: 100000, enabledModules: ['CORE', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'RECRUITMENT', 'EDUCATION', 'PERFORMANCE', 'TICKETING'] },
      displayOrder: 3,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: plan.features,
        limits: plan.limits,
        displayOrder: plan.displayOrder,
      },
      create: plan,
    });
  }
  console.log(`Seeded ${plans.length} Data-driven Pricing Plans.`);

  // 5. Seed CMS Content (Phase 2)
  const cmsItems = [
    {
      key: 'hero_section',
      section: 'HOMEPAGE',
      title: 'One Configurable HRMS Platform for Every Organization',
      payload: {
        headline: 'One Configurable HRMS Platform for Every Organization',
        subheadline: 'Whether you run a tech startup, corporate company, K-12 school, multi-campus university, hospital, factory, or NGO — Universal HRMS adapts to your structure, terminology, and workflows from a single unified system.',
        primaryCtaText: 'Book a Free Demo',
        secondaryCtaText: 'Start Free Trial',
      },
    },
    {
      key: 'faq_items',
      section: 'FAQ',
      title: 'Frequently Asked Questions',
      payload: [
        {
          question: 'How does Universal HRMS adapt to different organization types?',
          answer: 'Universal HRMS uses a configurable architecture where terminology (e.g. Employee vs Teacher vs Doctor), organization units (Department vs Faculty vs Ward), and modules are controlled by tenant configuration without code changes.',
        },
        {
          question: 'Can we manage multiple campuses or business units?',
          answer: 'Yes! The visual organization structure builder lets you define nested departments, campuses, faculties, grades, and lines with full RBAC access control.',
        },
        {
          question: 'Is multi-tenant data isolated securely?',
          answer: 'Absolute tenant isolation is strictly enforced at the database repository and middleware layer. Tenant context is derived exclusively from validated hostnames.',
        },
      ],
    },
  ];

  for (const cms of cmsItems) {
    await prisma.cmsContent.upsert({
      where: { key: cms.key },
      update: { title: cms.title, payload: cms.payload },
      create: cms,
    });
  }
  console.log(`Seeded ${cmsItems.length} CMS Content records.`);

  console.log('Phase 2 seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
