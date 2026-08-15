import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between text-xs text-surface-500 py-3 ${className}`}>
      <span>
        Page <strong className="text-surface-900 dark:text-surface-100">{currentPage}</strong> of{' '}
        <strong className="text-surface-900 dark:text-surface-100">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
