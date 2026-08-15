import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3 pointer-events-none">{icon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border rounded-lg transition-colors',
                'text-surface-900 dark:text-surface-100 placeholder-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                icon ? 'pl-9' : '',
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-surface-300 dark:border-surface-700 hover:border-surface-400 dark:hover:border-surface-600',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-surface-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
