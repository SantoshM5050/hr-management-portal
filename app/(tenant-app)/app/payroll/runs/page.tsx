'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { CircleDollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/payroll');
      const data = await res.json();
      if (res.ok && data.success) {
        setRuns(data.data.payrollRuns || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executed Payroll Runs History"
        description="Historical payroll execution runs, processed employee counts, and immutable snapshots"
        icon={<CircleDollarSign className="w-5 h-5" />}
        actions={
          <Link href="/app/payroll">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Payroll Dashboard
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={[
              {
                header: 'Period Name',
                accessorKey: 'periodName',
                cell: (row: any) => <span className="font-bold text-xs text-surface-900 dark:text-surface-100">{row.periodName}</span>,
              },
              {
                header: 'Status',
                accessorKey: 'status',
                cell: (row: any) => <StatusBadge status={row.status} size="sm" />,
              },
              {
                header: 'Processed Count',
                accessorKey: 'processedCount',
                cell: (row: any) => <span className="font-mono text-xs">{row.processedCount} employees</span>,
              },
              {
                header: 'Execution Date',
                cell: (row: any) => new Date(row.createdAt).toLocaleDateString(),
              },
            ]}
            data={runs}
            loading={loading}
            searchPlaceholder="Search period names..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
