import { db } from './db';

/**
 * Centralized Repository helper enforcing tenant isolation on database operations.
 * Requires explicit tenantId parameter.
 */
export function getTenantRepo(tenantId: string) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('Tenant ID is required for tenant repository operations');
  }

  return {
    // People
    people: {
      findMany: (args: any = {}) =>
        db.person.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findFirst: (args: any = {}) =>
        db.person.findFirst({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      count: (args: any = {}) =>
        db.person.count({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.person.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Organization Structure
    units: {
      findMany: (args: any = {}) =>
        db.organizationUnit.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.organizationUnit.create({
          data: { ...data, organizationId: tenantId },
        }),
    },
    departments: {
      findMany: (args: any = {}) =>
        db.department.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.department.create({
          data: { ...data, organizationId: tenantId },
        }),
    },
    designations: {
      findMany: (args: any = {}) =>
        db.designation.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.designation.create({
          data: { ...data, organizationId: tenantId },
        }),
    },
    locations: {
      findMany: (args: any = {}) =>
        db.location.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.location.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Attendance
    attendance: {
      findManyEvents: (args: any = {}) =>
        db.attendanceEvent.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findManySummaries: (args: any = {}) =>
        db.attendanceSummary.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      createEvent: (data: any) =>
        db.attendanceEvent.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Leave
    leave: {
      findTypes: (args: any = {}) =>
        db.leaveType.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findRequests: (args: any = {}) =>
        db.leaveRequest.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findBalances: (args: any = {}) =>
        db.leaveBalance.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      createRequest: (data: any) =>
        db.leaveRequest.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Documents
    documents: {
      findTypes: (args: any = {}) =>
        db.documentType.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findMany: (args: any = {}) =>
        db.document.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.document.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Tickets
    tickets: {
      findCategories: (args: any = {}) =>
        db.ticketCategory.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findMany: (args: any = {}) =>
        db.ticket.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.ticket.create({
          data: { ...data, organizationId: tenantId },
        }),
    },

    // Education
    education: {
      findAcademicYears: (args: any = {}) =>
        db.academicYear.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findCourses: (args: any = {}) =>
        db.programCourse.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findEnrollments: (args: any = {}) =>
        db.studentEnrollment.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
    },

    // Recruitment
    recruitment: {
      findJobOpenings: (args: any = {}) =>
        db.jobOpening.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findCandidates: (args: any = {}) =>
        db.candidate.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
    },

    // Performance
    performance: {
      findReviewCycles: (args: any = {}) =>
        db.reviewCycle.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
    },

    // Payroll
    payroll: {
      findSalaryStructures: (args: any = {}) =>
        db.salaryStructure.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      findPayrollRuns: (args: any = {}) =>
        db.payrollRun.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
    },

    // Configuration
    customFields: {
      findMany: (args: any = {}) =>
        db.customFieldDefinition.findMany({
          ...args,
          where: { ...(args.where || {}), organizationId: tenantId },
        }),
      create: (data: any) =>
        db.customFieldDefinition.create({
          data: { ...data, organizationId: tenantId },
        }),
    },
  };
}
