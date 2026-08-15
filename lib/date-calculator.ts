import { db } from './db';

export interface DateCalculationResult {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
}

export async function calculateLeaveDays(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  customWorkingDays?: number[] // e.g. [1,2,3,4,5] for Mon-Fri or [0,1,2,3,4] for Sun-Thu
): Promise<DateCalculationResult> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range specified');
  }

  // Fetch organization working week settings from Phase 5 OrganizationSettings if available
  let activeWorkingDays = customWorkingDays || [1, 2, 3, 4, 5]; // Default Mon-Fri

  if (!customWorkingDays) {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId },
    });
    if (settings && (settings as any).workWeekConfig?.workingDays) {
      activeWorkingDays = (settings as any).workWeekConfig.workingDays;
    }
  }

  let totalDays = 0;
  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;

  const current = new Date(start);
  while (current <= end) {
    totalDays++;
    const dayOfWeek = current.getDay();

    if (activeWorkingDays.includes(dayOfWeek)) {
      workingDays++;
    } else {
      weekendDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalDays,
    workingDays,
    weekendDays,
    holidayDays,
  };
}
