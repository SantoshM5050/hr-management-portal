'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Users, Plus, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmployeesListPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/employees');
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.data.employees || []);
      }
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          employeeCode: employeeCode.toUpperCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create employee profile');
      } else {
        setShowModal(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setEmployeeCode('');
        await fetchEmployees();
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
            <Users className="w-5 h-5 text-brand-500" /> Employee Lifecycle Management
          </h1>
          <p className="text-xs text-surface-500">
            Lifecycle workflow: DRAFT → ONBOARDING → PROBATION → ACTIVE → CONFIRMED → NOTICE → EXITED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Employee Draft
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8 text-xs text-surface-500">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Employees Found</p>
              <p className="text-xs text-surface-500">Create employee records to initiate onboarding workflows.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Employee Name',
                  accessorKey: 'firstName',
                  cell: (row) => (
                    <div>
                      <div className="font-semibold text-surface-900 dark:text-surface-100">
                        {row.firstName} {row.lastName}
                      </div>
                      <div className="text-[11px] text-surface-500">{row.email || 'N/A'}</div>
                    </div>
                  ),
                },
                {
                  header: 'Employee Code',
                  cell: (row) => (
                    <Badge variant="neutral" size="sm">
                      {row.employeeProfile?.employeeCode || 'N/A'}
                    </Badge>
                  ),
                },
                {
                  header: 'Lifecycle Status',
                  cell: (row) => (
                    <Badge
                      variant={
                        row.employeeProfile?.employmentStatus === 'ACTIVE' || row.employeeProfile?.employmentStatus === 'CONFIRMED'
                          ? 'success'
                          : row.employeeProfile?.employmentStatus === 'DRAFT'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {row.employeeProfile?.employmentStatus || 'DRAFT'}
                    </Badge>
                  ),
                },
                {
                  header: 'Actions',
                  cell: (row) => (
                    <Link href={`/app/employees/${row.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View Lifecycle <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ),
                },
              ]}
              data={employees}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Employee Profile Draft</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Employee Code *"
                placeholder="EMP-1001"
                value={employeeCode}
                onChange={(e) => {
                  setEmployeeCode(e.target.value);
                }}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="employee@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Employee Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
