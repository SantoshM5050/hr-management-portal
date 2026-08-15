import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type = 'info', title, children, className = '' }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    danger: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  }[type];

  const icons = {
    info: <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />,
    danger: <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />,
  }[type];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${styles} ${className}`}>
      {icons}
      <div className="space-y-1">
        {title && <h4 className="font-bold">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
}
