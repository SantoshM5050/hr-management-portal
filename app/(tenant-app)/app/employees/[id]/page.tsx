'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Users, AlertCircle, ArrowLeft, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transition Modal State
  const [targetStateModal, setTargetStateModal] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tenant/employees/${params.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.data.employee);
      } else {
        setError(data?.error?.message || 'Employee not found');
      }
    } catch (err) {
      setError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransition = async () => {
    if (!targetStateModal) return;

    setError(null);
    setTransitioning(true);
    try {
      const res = await fetch(`/api/v1/tenant/employees/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState: targetStateModal, actionReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'State transition failed');
      } else {
        setTargetStateModal(null);
        setActionReason('');
        await fetchEmployee();
      }
    } catch (err) {
      setError('Network error during lifecycle transition');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-xs text-surface-500">Loading employee profile...</div>;

  if (error || !employee) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/app/employees" className="text-xs text-brand-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Employee Directory
        </Link>
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> <span>{error || 'Employee profile not found'}</span>
        </div>
      </div>
    );
  }

  const profile = employee.employeeProfile;
  const historyList = profile?.history || [];
  const latestHistory = historyList[0];
  const currentStatus = latestHistory ? (latestHistory.newData as any)?.status || 'DRAFT' : 'DRAFT';

  // Allowed 9-state sequential lifecycle transitions
  const allowedNextStates: Record<string, string[]> = {
    DRAFT: ['INVITED', 'ONBOARDING'],
    INVITED: ['ONBOARDING'],
    ONBOARDING: ['PROBATION', 'ACTIVE'],
    PROBATION: ['ACTIVE', 'CONFIRMED'],
    ACTIVE: ['CONFIRMED', 'NOTICE'],
    CONFIRMED: ['NOTICE', 'OFFBOARDING'],
    NOTICE: ['OFFBOARDING', 'EXITED'],
    OFFBOARDING: ['EXITED'],
    EXITED: [],
  };

  const possibleTransitions = allowedNextStates[currentStatus] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/employees" className="text-xs text-brand-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Employee Directory
        </Link>
        <StatusBadge status={currentStatus} size="md" />
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>
              {employee.firstName} {employee.lastName}
            </span>
            <span className="font-mono text-xs text-surface-500">{profile?.employeeCode || employee.id.substring(0, 8)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-surface-500 block">Email Address</span>
            <span className="font-semibold">{employee.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-surface-500 block">Department</span>
            <span className="font-semibold">{profile?.department?.name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-surface-500 block">Designation</span>
            <span className="font-semibold">{profile?.designation?.title || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-surface-500 block">Joining Date</span>
            <span className="font-semibold">
              {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Workflow State Machine Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">9-Stage Employee Lifecycle Transitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-100">
            {['DRAFT', 'INVITED', 'ONBOARDING', 'PROBATION', 'ACTIVE', 'CONFIRMED', 'NOTICE', 'OFFBOARDING', 'EXITED'].map((state) => {
              const isCurrent = state === currentStatus;
              return (
                <span
                  key={state}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap ${
                    isCurrent
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                  }`}
                >
                  {state}
                </span>
              );
            })}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-700">Available Lifecycle Actions:</h4>
            {possibleTransitions.length === 0 ? (
              <p className="text-xs text-surface-500">Employee is in final '{currentStatus}' state. No further lifecycle transitions available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {possibleTransitions.map((target) => (
                  <Button
                    key={target}
                    variant={target === 'EXITED' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => setTargetStateModal(target)}
                  >
                    Transition to {target}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employment History Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Lifecycle Transition History & Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {historyList.length === 0 ? (
              <p className="text-xs text-surface-500">No lifecycle transition history logged yet.</p>
            ) : (
              historyList.map((hist: any) => (
                <div key={hist.id} className="flex items-center justify-between text-xs border-b border-surface-100 dark:border-surface-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold">{hist.changeType}</span>
                    <span className="text-surface-500">
                      - Status: {(hist.newData as any)?.status || hist.changeType}
                      {(hist.newData as any)?.reason ? ` (Reason: ${(hist.newData as any).reason})` : ''}
                    </span>
                  </div>
                  <span className="text-surface-400 font-mono text-[11px]">{new Date(hist.effectiveDate).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog Modal */}
      {targetStateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold">Confirm Lifecycle Transition</h3>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-300">
              Are you sure you want to transition <strong>{employee.firstName} {employee.lastName}</strong> from{' '}
              <strong className="text-brand-600">{currentStatus}</strong> to{' '}
              <strong className="text-emerald-600">{targetStateModal}</strong>?
            </p>
            <Input
              label="Transition Reason / Notes (Optional)"
              placeholder="e.g. Completed 90-day probation review successfully"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTargetStateModal(null)}>
                Cancel
              </Button>
              <Button
                variant={targetStateModal === 'EXITED' ? 'danger' : 'primary'}
                size="sm"
                isLoading={transitioning}
                onClick={handleExecuteTransition}
              >
                Execute Transition
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
