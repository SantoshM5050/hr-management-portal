'use client';

import React, { useState } from 'react';
import { Table, Column } from './table';
import { Input } from './input';
import { Pagination } from './pagination';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { Search, Inbox } from 'lucide-react';

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchField?: keyof T | ((row: T) => string);
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchField,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no records matching the current criteria.',
  emptyAction,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Data
  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    if (typeof searchField === 'function') {
      return searchField(row).toLowerCase().includes(term);
    }

    if (searchField && row[searchField]) {
      return String(row[searchField]).toLowerCase().includes(term);
    }

    // Default search across string values
    return Object.values(row).some(
      (val) => typeof val === 'string' && val.toLowerCase().includes(term)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="max-w-xs">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search className="w-4 h-4 text-surface-400" />}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : paginatedData.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-5 h-5" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <Table columns={columns} data={paginatedData} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}
    </div>
  );
}
