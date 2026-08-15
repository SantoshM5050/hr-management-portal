'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function AttendancePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const [targetDate, setTargetDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/attendance');
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.data.events || []);
        setCorrections(data.data.corrections || []);
      } else {
        setError(data?.error?.message || 'Attendance module unavailable');
      }
    } catch (err) {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CORRECTION_REQUEST',
          personId: events[0]?.personId || 'self',
          targetDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to submit correction');
      } else {
        setShowCorrectionModal(false);
        setReason('');
        await fetchAttendance();
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
            <Clock className="w-5 h-5 text-brand-500" /> Attendance Management & Clocking
          </h1>
          <p className="text-xs text-surface-500">Configurable work schedules, timestamp events, and correction request reviews</p>
        </div>
        <Button variant="primary" onClick={() => setShowCorrectionModal(true)} className="flex items-center gap-1">
          <Calendar className="w-4 h-4" /> Request Attendance Correction
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
            <CardTitle className="text-sm font-semibold">Recent Attendance Clocking Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No clocking events recorded today.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Person',
                    cell: (row) => (
                      <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                        {row.person ? `${row.person.firstName} ${row.person.lastName}` : 'Person'}
                      </span>
                    ),
                  },
                  {
                    header: 'Event Type',
                    accessorKey: 'eventType',
                    cell: (row) => <Badge variant={row.eventType === 'CHECK_IN' ? 'success' : 'info'} size="sm">{row.eventType}</Badge>,
                  },
                  {
                    header: 'Timestamp',
                    cell: (row) => <span className="text-xs font-mono">{new Date(row.timestamp).toLocaleTimeString()}</span>,
                  },
                ]}
                data={events}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Attendance Correction Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading corrections...</div>
            ) : corrections.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No pending correction requests.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Target Date',
                    cell: (row) => <span className="font-mono text-xs">{new Date(row.date).toLocaleDateString()}</span>,
                  },
                  {
                    header: 'Reason',
                    accessorKey: 'reason',
                    cell: (row) => <span className="text-xs text-surface-600 dark:text-surface-400">{row.reason}</span>,
                  },
                  {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: (row) => <Badge variant={row.status === 'APPROVED' ? 'success' : 'warning'} size="sm">{row.status}</Badge>,
                  },
                ]}
                data={corrections}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Submit Attendance Correction</h3>
            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <Input
                label="Target Date *"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />

              <Input
                label="Correction Reason *"
                placeholder="Biometric scanner glitch / Official out-of-office meeting"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCorrectionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Submit Correction Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
