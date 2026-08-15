import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ColumnDef<T = Record<string, any>> {
  header: string;
  accessorKey?: string;
  cell?: (row: T) => React.ReactNode;
}

export type Column<T = Record<string, any>> = ColumnDef<T>;

export interface TableProps<T = Record<string, any>> extends React.TableHTMLAttributes<HTMLTableElement> {
  columns?: ColumnDef<T>[];
  data?: T[];
}

export function Table<T extends Record<string, any> = Record<string, any>>({ className, columns, data, children, ...props }: TableProps<T>) {
  if (columns && data) {
    return (
      <div className="w-full overflow-x-auto border border-surface-200 dark:border-surface-800 rounded-xl">
        <table className={twMerge(clsx('w-full text-left text-sm border-collapse', className))} {...props}>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow key={row.id || rowIdx}>
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx}>
                    {col.cell ? col.cell(row) : col.accessorKey ? row[col.accessorKey] : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-surface-200 dark:border-surface-800 rounded-xl">
      <table className={twMerge(clsx('w-full text-left text-sm border-collapse', className))} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={twMerge(clsx('bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800', className))} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={twMerge(clsx('divide-y divide-surface-200 dark:divide-surface-800', className))} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={twMerge(clsx('hover:bg-surface-50/50 dark:hover:bg-surface-800/50 transition-colors', className))} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={twMerge(clsx('px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider', className))} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={twMerge(clsx('px-4 py-3 text-surface-700 dark:text-surface-300 align-middle', className))} {...props}>
      {children}
    </td>
  );
}
