'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle2, AlertCircle, Palette, Globe, Shield } from 'lucide-react';

export default function TenantSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/settings');
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.data.organization) setOrgName(data.data.organization.name || '');
        if (data.data.settings) {
          setLogoUrl(data.data.settings.logoUrl || '');
          setPrimaryColor(data.data.settings.primaryColor || '#0f172a');
          setTimezone(data.data.settings.timezone || 'UTC');
          setCurrency(data.data.settings.currency || 'USD');
        }
      }
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/tenant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          logoUrl,
          primaryColor,
          timezone,
          currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to save settings');
      } else {
        setSuccess('Organization branding and configuration saved successfully!');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-surface-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500" /> Organization Settings & Branding
          </h1>
          <p className="text-xs text-surface-500">Configure display profile, primary branding color, and localization</p>
        </div>
        <Badge variant="info">Tenant Administrator</Badge>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-500" /> Branding & Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Organization Display Name *"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />

            <Input
              label="Logo Image URL"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                Primary Theme Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-surface-300 dark:border-surface-700"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" /> Localization & Regional Format
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
            <Input
              label="Default Currency (ISO Code)"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={saving}>
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
