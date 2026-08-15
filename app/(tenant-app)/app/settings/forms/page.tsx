'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, AlertCircle } from 'lucide-react';

export default function FormDefinitionsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [entityName, setEntityName] = useState('PERSON');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/forms');
      const data = await res.json();
      if (res.ok && data.success) {
        setForms(data.data.forms || []);
      }
    } catch (err) {
      setError('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          entityName,
          schema: { sections: [{ name: 'General Details', fields: ['firstName', 'lastName', 'email'] }] },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create form definition');
      } else {
        setShowModal(false);
        setTitle('');
        await fetchForms();
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
            <FileText className="w-5 h-5 text-brand-500" /> Form Definitions Builder
          </h1>
          <p className="text-xs text-surface-500">Configure structured data entry layout forms for your organization</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Form Definition
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-xs text-surface-500">Loading form definitions...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Custom Form Definitions</p>
            <p className="text-xs text-surface-500">Standard system forms active by default.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100">{f.title}</h3>
                    <Badge variant="info" size="sm">{f.entityName}</Badge>
                    <Badge variant="success" size="sm">Published</Badge>
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
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Create Form Definition</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Form Title *"
                placeholder="Employee Onboarding Form"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Target Entity *
                </label>
                <select
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="PERSON">Person / Employee</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="TICKET">Ticket</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Create Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
