'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Building2, Plus, AlertCircle } from 'lucide-react';

export default function UnitsAdminPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unitType, setUnitType] = useState('DIVISION');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/structure');
      const data = await res.json();
      if (res.ok && data.success) {
        setUnits(data.data.units || []);
      }
    } catch (err) {
      setError('Failed to load units');
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
          type: 'UNIT',
          name,
          code: code.toUpperCase().trim(),
          unitType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create unit');
      } else {
        setShowModal(false);
        setName('');
        setCode('');
        await fetchUnits();
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
            <Building2 className="w-5 h-5 text-brand-500" /> Organization Units Management
          </h1>
          <p className="text-xs text-surface-500">Configure divisions, plants, campuses, and major operational units</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Unit
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
            <div className="text-center p-8 text-xs text-surface-500">Loading units...</div>
          ) : units.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Organization Units Configured</p>
              <p className="text-xs text-surface-500">Add operational units to structure your organization enterprise hierarchy.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Unit Name',
                  accessorKey: 'name',
                  cell: (row) => <span className="font-semibold text-surface-900 dark:text-surface-100">{row.name}</span>,
                },
                {
                  header: 'Unit Code',
                  accessorKey: 'code',
                  cell: (row) => <Badge variant="neutral" size="sm">{row.code}</Badge>,
                },
                {
                  header: 'Unit Type',
                  accessorKey: 'unitType',
                  cell: (row) => <Badge variant="info" size="sm">{row.unitType}</Badge>,
                },
              ]}
              data={units}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Organization Unit</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Unit Name *"
                placeholder="North America Division / Main Campus / Factory Plant 1"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                }}
                required
              />

              <Input
                label="Unit Code *"
                placeholder="NA_DIV"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'))}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Unit Classification *
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="DIVISION">Division</option>
                  <option value="BRANCH">Branch</option>
                  <option value="PLANT">Plant / Factory</option>
                  <option value="CAMPUS">Educational Campus</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Unit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
