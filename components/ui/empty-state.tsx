import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center p-8 space-y-3 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl ${className}`}>
      {icon && <div className="mx-auto w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center">{icon}</div>}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">{title}</h3>
        {description && <p className="text-xs text-surface-500 max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
