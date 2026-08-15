'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Plus, Lock, AlertCircle } from 'lucide-react';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/roles');
      const data = await res.json();
      if (res.ok && data.success) {
        setRoles(data.data.roles || []);
        setAllPermissions(data.data.allPermissions || []);
      }
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (code: string) => {
    if (selectedPerms.includes(code)) {
      setSelectedPerms(selectedPerms.filter((c) => c !== code));
    } else {
      setSelectedPerms([...selectedPerms, code]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          code: roleCode,
          permissionCodes: selectedPerms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create role');
      } else {
        setShowModal(false);
        setRoleName('');
        setRoleCode('');
        setSelectedPerms([]);
        await fetchRoles();
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
            <ShieldAlert className="w-5 h-5 text-brand-500" /> Roles & Permissions Engine
          </h1>
          <p className="text-xs text-surface-500">Configure tenant access roles and granular permissions</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Custom Role
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-xs text-surface-500">Loading roles and permissions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">{r.name}</CardTitle>
                    {r.isSystem && (
                      <Badge variant="info" size="sm" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> System
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-surface-500">{r.code}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-[11px] font-semibold text-surface-500 uppercase">
                  Assigned Permissions ({r.permissions?.length || 0}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.permissions?.map((p: any) => (
                    <Badge key={p.code} variant="neutral" size="sm">
                      {p.code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Custom Tenant Role</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Role Name *"
                placeholder="Department Lead / Payroll Officer"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
                }}
                required
              />

              <Input
                label="Role Code *"
                placeholder="DEPT_LEAD"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'))}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Assign Granular Permissions
                </label>
                <div className="max-h-48 overflow-y-auto border border-surface-200 dark:border-surface-800 rounded-lg p-2 space-y-1">
                  {allPermissions.map((perm) => (
                    <label key={perm.code} className="flex items-center gap-2 p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(perm.code)}
                        onChange={() => togglePermission(perm.code)}
                        className="rounded text-brand-600"
                      />
                      <span className="font-mono font-medium">{perm.code}</span>
                      <span className="text-surface-500 text-[11px]">- {perm.description || ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Create Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
