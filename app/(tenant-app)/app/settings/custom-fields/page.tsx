'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, AlertCircle } from 'lucide-react';

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [entityName, setEntityName] = useState('PERSON');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/custom-fields');
      const data = await res.json();
      if (res.ok && data.success) {
        setFields(data.data.customFields || []);
      }
    } catch (err) {
      setError('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const optionsArr = optionsStr
        ? optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
        : null;

      const res = await fetch('/api/v1/tenant/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName,
          fieldKey,
          fieldLabel,
          fieldType,
          isRequired,
          options: optionsArr,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create custom field');
      } else {
        setShowModal(false);
        setFieldKey('');
        setFieldLabel('');
        setOptionsStr('');
        await fetchFields();
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
            <FileText className="w-5 h-5 text-brand-500" /> Custom Field Engine
          </h1>
          <p className="text-xs text-surface-500">Define dynamic custom attributes for your organization entities</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Custom Field
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-xs text-surface-500">Loading custom fields...</div>
      ) : fields.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Custom Fields Defined</p>
            <p className="text-xs text-surface-500">Create custom fields to collect organization-specific attributes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100">{f.fieldLabel}</h3>
                    <Badge variant="info" size="sm">{f.entityName}</Badge>
                    <Badge variant="neutral" size="sm">{f.fieldType}</Badge>
                    {f.isRequired && <Badge variant="warning" size="sm">Required</Badge>}
                  </div>
                  <p className="text-xs text-surface-500 font-mono mt-0.5">Key: {f.fieldKey}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Custom Field</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Target Entity *
                </label>
                <select
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="PERSON">Person / Employee / Student</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="TICKET">Ticket</option>
                </select>
              </div>

              <Input
                label="Field Label *"
                placeholder="T-Shirt Size / Emergency Contact"
                value={fieldLabel}
                onChange={(e) => {
                  setFieldLabel(e.target.value);
                  setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                }}
                required
              />

              <Input
                label="Field Key *"
                placeholder="tshirt_size"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Field Data Type *
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="TEXT">TEXT (Single Line String)</option>
                  <option value="LONG_TEXT">LONG_TEXT (Multi Line Textarea)</option>
                  <option value="NUMBER">NUMBER (Integer)</option>
                  <option value="DECIMAL">DECIMAL (Float Currency/Rating)</option>
                  <option value="BOOLEAN">BOOLEAN (Yes/No Checkbox)</option>
                  <option value="DATE">DATE (Calendar Date)</option>
                  <option value="DATETIME">DATETIME (Date & Time)</option>
                  <option value="SELECT">SELECT (Single Dropdown Option)</option>
                  <option value="MULTI_SELECT">MULTI_SELECT (Checkboxes)</option>
                  <option value="EMAIL">EMAIL (Valid Email Format)</option>
                  <option value="PHONE">PHONE (Telephone Number)</option>
                  <option value="URL">URL (Web Link)</option>
                </select>
              </div>

              {(fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') && (
                <Input
                  label="Options (Comma Separated) *"
                  placeholder="Option 1, Option 2, Option 3"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  required
                />
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="req_check"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-surface-300 dark:border-surface-700"
                />
                <label htmlFor="req_check" className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                  Required Input Field
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Create Field
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
