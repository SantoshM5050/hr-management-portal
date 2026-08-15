'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sliders, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ModuleAdminPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/modules');
      const data = await res.json();
      if (res.ok && data.success) {
        setModules(data.data.modules || []);
      }
    } catch (err) {
      setError('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (code: string, currentStatus: boolean) => {
    if (code === 'CORE') return;

    setToggling(code);
    setError(null);

    try {
      const res = await fetch('/api/v1/tenant/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleCode: code,
          isEnabled: !currentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to toggle module');
      } else {
        await fetchModules();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-500" /> Organization Module Management
        </h1>
        <p className="text-xs text-surface-500">Enable or disable domain modules for your organization</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center p-8 text-xs text-surface-500">Loading module configuration...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Card key={mod.code} className={mod.isEnabled ? 'border-brand-500/40' : 'opacity-75'}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100">{mod.name}</h3>
                    {mod.isCore ? (
                      <Badge variant="info" size="sm" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Core Mandatory
                      </Badge>
                    ) : (
                      <Badge variant={mod.isEnabled ? 'success' : 'neutral'} size="sm">
                        {mod.isEnabled ? 'Active' : 'Disabled'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-surface-500">{mod.description || 'System feature module'}</p>
                </div>

                {!mod.isCore && (
                  <button
                    onClick={() => handleToggle(mod.code, mod.isEnabled)}
                    disabled={toggling === mod.code}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      mod.isEnabled ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        mod.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
