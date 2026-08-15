import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, icon, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-200 dark:border-surface-800 ${className}`}>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          {icon && <span className="text-brand-500">{icon}</span>}
          {title}
        </h1>
        {description && <p className="text-xs text-surface-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
