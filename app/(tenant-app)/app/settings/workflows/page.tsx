'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GitMerge, Plus, AlertCircle, ArrowRight } from 'lucide-react';

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [entityName, setEntityName] = useState('LEAVE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/workflows');
      const data = await res.json();
      if (res.ok && data.success) {
        setWorkflows(data.data.workflows || []);
      }
    } catch (err) {
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const defaultStates = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
      const defaultTransitions = [
        { from: 'DRAFT', to: 'SUBMITTED', label: 'Submit Request' },
        { from: 'SUBMITTED', to: 'APPROVED', label: 'Approve' },
        { from: 'SUBMITTED', to: 'REJECTED', label: 'Reject' },
      ];

      const res = await fetch('/api/v1/tenant/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          entityName,
          states: defaultStates,
          transitions: defaultTransitions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create workflow');
      } else {
        setShowModal(false);
        setTitle('');
        await fetchWorkflows();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-brand-500" /> Workflow Builder Foundation
          </h1>
          <p className="text-xs text-surface-500">Configure entity states, transitions, and lifecycle rules</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Workflow Rule
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-xs text-surface-500">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Custom Workflows Configured</p>
            <p className="text-xs text-surface-500">Standard system workflow rules active by default.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{wf.title}</CardTitle>
                  <Badge variant="info" size="sm">{wf.entityName}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-surface-500 uppercase">Configured States:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.isArray(wf.states) &&
                      wf.states.map((s: string) => (
                        <Badge key={s} variant="neutral" size="sm">
                          {s}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Configure New Workflow</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Workflow Name *"
                placeholder="Leave Request Approval / Student Admission Lifecycle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Target Domain Entity *
                </label>
                <select
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="LEAVE">Leave / Absence Request</option>
                  <option value="EMPLOYEE">Employee Lifecycle</option>
                  <option value="STUDENT">Student Admission</option>
                  <option value="RECRUITMENT">Job Candidate Pipeline</option>
                  <option value="TICKET">Ticket SLA Workflow</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Workflow Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
