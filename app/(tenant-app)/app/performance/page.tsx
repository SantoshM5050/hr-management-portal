'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Award, Plus, AlertCircle } from 'lucide-react';

export default function PerformancePage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/performance');
      const data = await res.json();
      if (res.ok && data.success) {
        setCycles(data.data.cycles || []);
        setReviews(data.data.reviews || []);
      } else {
        setError(data?.error?.message || 'Performance module unavailable');
      }
    } catch (err) {
      setError('Failed to load performance records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_CYCLE', name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create review cycle');
      } else {
        setShowModal(false);
        setName('');
        await fetchPerformance();
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
            <Award className="w-5 h-5 text-brand-500" /> Performance Review Management
          </h1>
          <p className="text-xs text-surface-500">
            Review Lifecycle: DRAFT → SELF_REVIEW → MANAGER_REVIEW → HR_REVIEW → COMPLETED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Review Cycle
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Active Review Cycles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8 text-xs text-surface-500">Loading performance data...</div>
          ) : cycles.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Review Cycles Configured</p>
              <p className="text-xs text-surface-500">Create review cycles to evaluate employee performance.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Review Cycle Title',
                  accessorKey: 'title',
                  cell: (row) => <span className="font-semibold text-surface-900 dark:text-surface-100">{row.title}</span>,
                },
                {
                  header: 'Status',
                  accessorKey: 'status',
                  cell: (row) => <Badge variant="success" size="sm">{row.status}</Badge>,
                },
                {
                  header: 'Start Date',
                  cell: (row) => <span className="text-xs font-mono">{new Date(row.startDate).toLocaleDateString()}</span>,
                },
              ]}
              data={cycles}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Create Performance Review Cycle</h3>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <Input
                label="Cycle Title *"
                placeholder="2026 Annual Performance & Goals Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Review Cycle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
