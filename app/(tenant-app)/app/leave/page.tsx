'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Alert } from '@/components/ui/alert';
import { Calendar, Plus, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function LeaveManagementPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [personId, setPersonId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeave();
  }, []);

  const fetchLeave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/leave');
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data.requests || []);
        setLeaveTypes(data.data.leaveTypes || []);
        setBalances(data.data.balances || []);
      } else {
        setError(data?.error?.message || 'Leave module unavailable');
      }
    } catch (err) {
      setError('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId,
          leaveTypeId,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to submit leave request');
      } else {
        setShowModal(false);
        setReason('');
        await fetchLeave();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (requestId: string, targetStatus: string) => {
    try {
      const res = await fetch(`/api/v1/tenant/leave/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) await fetchLeave();
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-200 dark:border-surface-800">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" /> Leave Management Engine
          </h1>
          <p className="text-xs text-surface-500">
            Multi-step Approval Chain: SUBMITTED → MANAGER_REVIEW → HR_REVIEW → APPROVED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Submit Leave Request
        </Button>
      </div>

      {error && (
        <Alert type="danger" title="Error">
          {error}
        </Alert>
      )}

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Leave Requests & Workflow Chain</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            columns={[
              {
                header: 'Person',
                cell: (row: any) => (
                  <div>
                    <div className="font-semibold text-surface-900 dark:text-surface-100">
                      {row.person ? `${row.person.firstName} ${row.person.lastName}` : 'Person'}
                    </div>
                    <div className="text-[11px] text-surface-500">{row.leaveType?.name || 'Leave'}</div>
                  </div>
                ),
              },
              {
                header: 'Date Range & Working Days',
                cell: (row: any) => (
                  <span className="text-xs font-mono">
                    {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()} ({row.daysCount} days)
                  </span>
                ),
              },
              {
                header: 'Workflow Stage',
                accessorKey: 'status',
                cell: (row: any) => <StatusBadge status={row.status} size="sm" />,
              },
              {
                header: 'Approval Controls',
                cell: (row: any) => (
                  <div className="flex items-center gap-1.5">
                    {row.status === 'SUBMITTED' && (
                      <Button variant="outline" size="sm" onClick={() => handleAction(row.id, 'MANAGER_REVIEW')}>
                        Manager Review
                      </Button>
                    )}
                    {row.status === 'MANAGER_REVIEW' && (
                      <Button variant="outline" size="sm" onClick={() => handleAction(row.id, 'HR_REVIEW')}>
                        HR Review
                      </Button>
                    )}
                    {row.status === 'HR_REVIEW' && (
                      <Button variant="primary" size="sm" onClick={() => handleAction(row.id, 'APPROVED')}>
                        Final Approve
                      </Button>
                    )}
                    {row.status !== 'APPROVED' && row.status !== 'REJECTED' && row.status !== 'CANCELLED' && (
                      <Button variant="danger" size="sm" onClick={() => handleAction(row.id, 'REJECTED')}>
                        Reject
                      </Button>
                    )}
                    {row.status === 'APPROVED' && (
                      <Button variant="outline" size="sm" onClick={() => handleAction(row.id, 'CANCELLED')}>
                        Cancel & Reverse Balance
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={requests}
            loading={loading}
            searchPlaceholder="Search leave requests..."
          />
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Submit Leave Request</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Person ID *"
                placeholder="Paste Person ID (from Directory)"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
              />

              <Select
                label="Leave Type *"
                placeholder="Select Leave Type..."
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                options={leaveTypes.map((lt) => ({ label: `${lt.name} (${lt.code})`, value: lt.id }))}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date *"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Reason"
                placeholder="Personal leave / Medical appointment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
