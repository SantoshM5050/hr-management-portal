'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, AlertCircle, Building2, User, Layers, ShieldCheck } from 'lucide-react';

function NewOrganizationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams?.get('leadId');

  const [loadingLead, setLoadingLead] = useState(false);
  const [leadInfo, setLeadInfo] = useState<any>(null);

  // Form State
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [orgType, setOrgType] = useState('COMPANY');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('Admin@123456');

  // Selected Modules State
  const [selectedModules, setSelectedModules] = useState<string[]>(['CORE', 'ATTENDANCE', 'LEAVE']);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionedData, setProvisionedData] = useState<any>(null);

  // Pre-fill from Lead if leadId is passed in URL
  useEffect(() => {
    if (!leadId) return;

    const fetchLeadInfo = async () => {
      setLoadingLead(true);
      try {
        const res = await fetch(`/api/v1/platform-admin/leads/${leadId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const l = data.data;
          setLeadInfo(l);
          setOrgName(l.orgName || '');
          setOwnerFullName(l.fullName || '');
          setOwnerEmail(l.email || '');
          if (l.orgTypeCode) setOrgType(l.orgTypeCode);
          if (l.orgName) {
            setSubdomain(l.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
          }
        }
      } catch (err) {
        console.error('Failed to pre-fill lead:', err);
      } finally {
        setLoadingLead(false);
      }
    };

    fetchLeadInfo();
  }, [leadId]);

  const handleSubdomainChange = (val: string) => {
    const slugified = val.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setSubdomain(slugified);
  };

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!leadId) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    }
  };

  const toggleModule = (code: string) => {
    if (code === 'CORE') return; // Core module mandatory
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName || !subdomain || !ownerFullName || !ownerEmail || !ownerPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/platform-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName,
          subdomainSlug: subdomain,
          orgTypeCode: orgType,
          fullName: ownerFullName,
          email: ownerEmail,
          password: ownerPassword,
          enabledModuleCodes: selectedModules,
          leadId: leadId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Provisioning failed');
      } else {
        setProvisionedData(data.data.organization);
      }
    } catch (err) {
      setError('Network error during provisioning. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableModules = [
    { code: 'CORE', name: 'Universal Core HR & Structure', required: true, desc: 'People, departments, designations, permissions' },
    { code: 'ATTENDANCE', name: 'Time & Attendance', required: false, desc: 'Clock in/out, shift rules, summary reports' },
    { code: 'LEAVE', name: 'Leave & Absence Management', required: false, desc: 'Leave types, balances, approval workflows' },
    { code: 'PAYROLL', name: 'Payroll & Compensation', required: false, desc: 'Salary structures, payslips, payroll runs' },
    { code: 'RECRUITMENT', name: 'Recruitment & Hiring', required: false, desc: 'Job postings, candidate pipelines' },
    { code: 'EDUCATION', name: 'Academic & Education', required: false, desc: 'Faculties, courses, batches, student profiles' },
    { code: 'PERFORMANCE', name: 'Performance Reviews', required: false, desc: 'Review cycles, goals, appraisals' },
    { code: 'TICKETING', name: 'Internal Helpdesk', required: false, desc: 'Support categories, SLAs, ticketing' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/platform-admin/organizations" className="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Link>
        <Badge variant="info">Platform Staff Super Admin Scope</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
          Organization Tenant Provisioning Wizard
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Configure organization settings, reserve custom subdomain, and create initial Tenant Owner account.
        </p>
      </div>

      {leadInfo && (
        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-brand-900 dark:text-brand-100 block">Pre-filled from Qualified Lead:</span>
            <span className="text-brand-700 dark:text-brand-300">
              {leadInfo.fullName} ({leadInfo.email}) — {leadInfo.orgName} ({leadInfo.orgTypeCode})
            </span>
          </div>
          <Badge variant="success">Lead Linked</Badge>
        </div>
      )}

      {provisionedData ? (
        <Card className="border-emerald-500/40 shadow-xl">
          <CardContent className="p-8 space-y-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
                Tenant Provisioned & Activated Successfully!
              </h2>
              <p className="text-xs text-surface-500 mt-1">
                Organization <strong>{provisionedData.name}</strong> is now live on the platform.
              </p>
            </div>

            <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl space-y-3 text-left max-w-lg mx-auto text-xs">
              <div className="flex justify-between border-b border-surface-200 dark:border-surface-700 pb-2">
                <span className="text-surface-500">Tenant Subdomain URL:</span>
                <strong className="text-brand-600 dark:text-brand-400 font-mono">{provisionedData.subdomain}</strong>
              </div>
              <div className="flex justify-between border-b border-surface-200 dark:border-surface-700 pb-2">
                <span className="text-surface-500">Owner Account:</span>
                <span className="font-semibold text-surface-900 dark:text-surface-100">{provisionedData.ownerFullName} ({provisionedData.ownerEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Tenant Status:</span>
                <Badge variant="success">ACTIVE</Badge>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-4">
              <a href={provisionedData.url || `http://${provisionedData.subdomain}/login`} target="_blank" rel="noopener noreferrer">
                <Button variant="primary">
                  Open Tenant Login Page <ShieldCheck className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
              <Button variant="outline" onClick={() => router.push('/platform-admin/organizations')}>
                Return to Organizations List
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                1. Organization Identity & Subdomain Reservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Organization Legal / Display Name *"
                  placeholder="Acme Enterprise Inc."
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                    Organization Type *
                  </label>
                  <select
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                  >
                    <option value="COMPANY">Company / Business Enterprise</option>
                    <option value="STARTUP">Tech Startup</option>
                    <option value="SCHOOL">School / K-12 Academy</option>
                    <option value="COLLEGE">College / University</option>
                    <option value="HOSPITAL">Hospital / Healthcare</option>
                    <option value="FACTORY">Factory / Manufacturing</option>
                    <option value="NGO">NGO / Non-Profit</option>
                  </select>
                </div>
              </div>

              <Input
                label="Reserved Subdomain Slug *"
                placeholder="acme"
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                helperText={subdomain ? `Subdomain: ${subdomain}.yourdomain.com` : 'Unique tenant subdomain identifier'}
                required
              />
            </CardContent>
          </Card>

          {/* Section 2: Owner Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                2. Tenant Owner / Super Admin Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Owner Full Name *"
                  placeholder="Sarah Jenkins"
                  value={ownerFullName}
                  onChange={(e) => setOwnerFullName(e.target.value)}
                  required
                />
                <Input
                  label="Owner Work Email Address *"
                  type="email"
                  placeholder="sarah@acme.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Initial Password *"
                type="text"
                placeholder="••••••••"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                helperText="Temporary password assigned to the tenant owner"
                required
              />
            </CardContent>
          </Card>

          {/* Section 3: Enabled Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                3. Enable Organization Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableModules.map((mod) => {
                  const isChecked = selectedModules.includes(mod.code);
                  return (
                    <div
                      key={mod.code}
                      onClick={() => toggleModule(mod.code)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-500'
                          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={mod.required}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                          {mod.name}
                          {mod.required && <Badge variant="info" className="text-[9px] px-1 py-0">CORE</Badge>}
                        </div>
                        <div className="text-[11px] text-surface-500 mt-0.5">{mod.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" variant="primary" isLoading={submitting} size="lg" className="w-full">
            Execute Provisioning & Activate Tenant <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        </form>
      )}
    </div>
  );
}

export default function NewOrganizationWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-surface-500">Loading provisioning wizard...</div>}>
      <NewOrganizationWizardContent />
    </Suspense>
  );
}
