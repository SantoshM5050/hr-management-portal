'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { CircleDollarSign, Plus, AlertCircle, FileText } from 'lucide-react';

export default function PayrollPage() {
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/payroll');
      const data = await res.json();
      if (res.ok && data.success) {
        setPayrollRuns(data.data.payrollRuns || []);
        setPayslips(data.data.payslips || []);
      } else {
        setError(data?.error?.message || 'Payroll module unavailable');
      }
    } catch (err) {
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXECUTE_PAYROLL', name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to process payroll run');
      } else {
        setShowModal(false);
        setName('');
        await fetchPayroll();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-brand-500" /> Modular Payroll & Compensation Engine
          </h1>
          <p className="text-xs text-surface-500">
            Lifecycle: DRAFT → CALCULATING → REVIEW → APPROVED → PROCESSED → COMPLETED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Run Payroll Period
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Completed Payroll Runs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading runs...</div>
            ) : payrollRuns.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No completed payroll runs.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Period Name',
                    cell: (row) => <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">{row.period?.name}</span>,
                  },
                  {
                    header: 'Total Net Payout',
                    cell: (row) => <span className="font-mono text-xs text-emerald-600 font-bold">${row.totalNet?.toLocaleString()}</span>,
                  },
                  {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: (row) => <Badge variant="success" size="sm">{row.status}</Badge>,
                  },
                ]}
                data={payrollRuns}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Generated Employee Payslips</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading payslips...</div>
            ) : payslips.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No generated payslips.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Employee',
                    cell: (row) => (
                      <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                        {row.employeeProfile?.person ? `${row.employeeProfile.person.firstName} ${row.employeeProfile.person.lastName}` : 'Employee'}
                      </span>
                    ),
                  },
                  {
                    header: 'Payslip Number',
                    cell: (row) => <Badge variant="neutral" size="sm">{row.payslipNumber}</Badge>,
                  },
                  {
                    header: 'Net Pay',
                    cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">${row.netPay?.toLocaleString()}</span>,
                  },
                ]}
                data={payslips}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Execute Payroll Run</h3>
            <form onSubmit={handleExecutePayroll} className="space-y-4">
              <Input
                label="Payroll Period Name *"
                placeholder="August 2026 Monthly Payroll"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Run Calculation & Finalize Snapshot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
