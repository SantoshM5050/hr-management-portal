'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { CircleDollarSign, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/payroll');
      const data = await res.json();
      if (res.ok && data.success) {
        setPayslips(data.data.payslips || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Payslips Archive"
        description="Immutable finalized payslip records and net compensation breakdowns"
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
                header: 'Payslip ID',
                accessorKey: 'id',
                cell: (row: any) => <span className="font-mono text-xs text-surface-500">{row.id.substring(0, 12)}...</span>,
              },
              {
                header: 'Payroll Period',
                cell: (row: any) => <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">{row.payrollRun?.periodName || 'Period'}</span>,
              },
              {
                header: 'Net Monthly Pay',
                accessorKey: 'netAmount',
                cell: (row: any) => (
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {row.salaryStructure?.currency || 'USD'} ${row.netAmount}
                  </span>
                ),
              },
              {
                header: 'Status',
                cell: (row: any) => <Badge variant="success" size="sm">FINALIZED</Badge>,
              },
            ]}
            data={payslips}
            loading={loading}
            searchPlaceholder="Search payslip records..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
