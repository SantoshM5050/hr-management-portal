'use client';

import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border rounded-xl text-surface-900 dark:text-surface-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-surface-300 dark:border-surface-700'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
