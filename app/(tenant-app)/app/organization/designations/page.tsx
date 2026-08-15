'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Briefcase, Plus, AlertCircle } from 'lucide-react';

export default function DesignationsAdminPage() {
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/structure');
      const data = await res.json();
      if (res.ok && data.success) {
        setDesignations(data.data.designations || []);
      }
    } catch (err) {
      setError('Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DESIGNATION',
          name: title,
          code: code.toUpperCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create designation');
      } else {
        setShowModal(false);
        setTitle('');
        setCode('');
        await fetchDesignations();
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
            <Briefcase className="w-5 h-5 text-brand-500" /> Designation Management
          </h1>
          <p className="text-xs text-surface-500">Configure job titles, roles, and position grades</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Designation
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
            <div className="text-center p-8 text-xs text-surface-500">Loading designations...</div>
          ) : designations.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Designations Configured</p>
              <p className="text-xs text-surface-500">Add designations to define titles across your organization.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Designation Title',
                  accessorKey: 'title',
                  cell: (row) => <span className="font-semibold text-surface-900 dark:text-surface-100">{row.title}</span>,
                },
                {
                  header: 'Designation Code',
                  accessorKey: 'code',
                  cell: (row) => <Badge variant="neutral" size="sm">{row.code}</Badge>,
                },
              ]}
              data={designations}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Designation</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Designation Title *"
                placeholder="Senior Engineer / Professor / Medical Consultant"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                }}
                required
              />

              <Input
                label="Designation Code *"
                placeholder="SR_ENG"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'))}
                required
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Designation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
