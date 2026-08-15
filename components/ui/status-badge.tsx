import React from 'react';
import { Badge } from './badge';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const upper = (status || '').toUpperCase();

  let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';

  if (['ACTIVE', 'CONFIRMED', 'APPROVED', 'RESOLVED', 'ENROLLED', 'HIRED', 'COMPLETED', 'PRESENT', 'VERIFIED'].includes(upper)) {
    variant = 'success';
  } else if (['DRAFT', 'PENDING', 'SUBMITTED', 'MANAGER_REVIEW', 'HR_REVIEW', 'SELF_REVIEW', 'REQUESTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ONBOARDING', 'PROBATION', 'NOTICE', 'WAITING', 'IN_PROGRESS'].includes(upper)) {
    variant = 'warning';
  } else if (['REJECTED', 'CANCELLED', 'EXITED', 'CLOSED', 'ARCHIVED', 'SUSPENDED', 'BREACHED'].includes(upper)) {
    variant = 'danger';
  } else if (['INVITED', 'OPEN', 'FINALIZE', 'OVERTIME', 'INFO'].includes(upper)) {
    variant = 'info';
  }

  return (
    <Badge variant={variant} size={size}>
      {upper}
    </Badge>
  );
}
