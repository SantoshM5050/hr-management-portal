export interface SlaTarget {
  responseHours: number;
  resolutionHours: number;
}

export const DEFAULT_SLA_MATRIX: Record<string, SlaTarget> = {
  URGENT: { responseHours: 2, resolutionHours: 8 },
  HIGH: { responseHours: 4, resolutionHours: 24 },
  MEDIUM: { responseHours: 8, resolutionHours: 48 },
  LOW: { responseHours: 24, resolutionHours: 72 },
};

export function calculateSlaDeadlines(priority: string, createdAt: Date = new Date()) {
  const target = DEFAULT_SLA_MATRIX[priority] || DEFAULT_SLA_MATRIX.MEDIUM;
  const createdMs = createdAt.getTime();

  const responseDeadline = new Date(createdMs + target.responseHours * 3600 * 1000);
  const resolutionDeadline = new Date(createdMs + target.resolutionHours * 3600 * 1000);

  return {
    responseDeadline,
    resolutionDeadline,
  };
}

export function checkSlaBreach(resolutionDeadline: Date, now: Date = new Date()): boolean {
  return now.getTime() > resolutionDeadline.getTime();
}
