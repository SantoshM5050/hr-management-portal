'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

export interface CustomFieldDef {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string; // TEXT, LONG_TEXT, NUMBER, DECIMAL, BOOLEAN, DATE, DATETIME, SELECT, MULTI_SELECT, EMAIL, PHONE, URL
  options?: any;
  isRequired?: boolean;
}

interface CustomFieldRendererProps {
  fields: CustomFieldDef[];
  values: Record<string, any>;
  onChange: (fieldKey: string, value: any) => void;
  errors?: Record<string, string>;
}

export function CustomFieldRenderer({ fields, values, onChange, errors = {} }: CustomFieldRendererProps) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-surface-200 dark:border-surface-800">
      <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">
        Organization Custom Attributes
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const val = values[field.fieldKey] !== undefined ? values[field.fieldKey] : '';
          const err = errors[field.fieldKey];

          // 1. SELECT
          if (field.fieldType === 'SELECT' && Array.isArray(field.options)) {
            return (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={val}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="">Select option...</option>
                  {field.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
              </div>
            );
          }

          // 2. MULTI_SELECT
          if (field.fieldType === 'MULTI_SELECT' && Array.isArray(field.options)) {
            const selectedArr: string[] = Array.isArray(val) ? val : [];
            return (
              <div key={field.id} className="md:col-span-2">
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-surface-300 dark:border-surface-700 rounded-lg">
                  {field.options.map((opt: string) => {
                    const isChecked = selectedArr.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-surface-700 dark:text-surface-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChange(field.fieldKey, [...selectedArr, opt]);
                            } else {
                              onChange(field.fieldKey, selectedArr.filter((item) => item !== opt));
                            }
                          }}
                          className="rounded text-brand-600"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
                {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
              </div>
            );
          }

          // 3. BOOLEAN
          if (field.fieldType === 'BOOLEAN') {
            return (
              <div key={field.id} className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id={`cf_${field.fieldKey}`}
                  checked={!!val}
                  onChange={(e) => onChange(field.fieldKey, e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-surface-300 dark:border-surface-700"
                />
                <label htmlFor={`cf_${field.fieldKey}`} className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                  {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
              </div>
            );
          }

          // 4. LONG_TEXT
          if (field.fieldType === 'LONG_TEXT') {
            return (
              <div key={field.id} className="md:col-span-2">
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={val}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                />
                {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
              </div>
            );
          }

          // 5. Standard inputs (TEXT, NUMBER, DECIMAL, DATE, DATETIME, EMAIL, PHONE, URL)
          let inputType = 'text';
          if (field.fieldType === 'NUMBER' || field.fieldType === 'DECIMAL') inputType = 'number';
          if (field.fieldType === 'DATE') inputType = 'date';
          if (field.fieldType === 'DATETIME') inputType = 'datetime-local';
          if (field.fieldType === 'EMAIL') inputType = 'email';
          if (field.fieldType === 'PHONE') inputType = 'tel';
          if (field.fieldType === 'URL') inputType = 'url';

          return (
            <Input
              key={field.id}
              label={`${field.fieldLabel} ${field.isRequired ? '*' : ''}`}
              type={inputType}
              value={val}
              onChange={(e) => onChange(field.fieldKey, e.target.value)}
              error={err}
              required={field.isRequired}
            />
          );
        })}
      </div>
    </div>
  );
}
