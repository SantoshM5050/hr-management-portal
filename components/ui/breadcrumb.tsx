import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-surface-500 space-x-1.5 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-surface-900 dark:hover:text-surface-100 transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-surface-900 dark:text-surface-100' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
