'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft, Clock, Building2, Mail, Phone, Calendar, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface LeadDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  orgName: string;
  orgTypeCode: string;
  peopleCount: string | null;
  country: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  modulesOfInterest: string[] | null;
  message: string | null;
  status: string;
  notes: string | null;
  convertedOrgId: string | null;
  createdAt: string;
  activities: ActivityItem[];
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [statusSelect, setStatusSelect] = useState('NEW');

  // Conversion Modal State
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertSubdomain, setConvertSubdomain] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertResult, setConvertResult] = useState<any>(null);

  const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'TRIAL_STARTED', 'CONVERTED', 'LOST'];

  const fetchLeadDetail = async () => {
    try {
      const res = await fetch(`/api/v1/platform-admin/leads/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
        setStatusSelect(data.data.status);
        setNotesInput(data.data.notes || '');
        setConvertSubdomain(data.data.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
      }
    } catch (err) {
      console.error('Fetch lead detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetail();
  }, [params.id]);

  const handleUpdateStatusAndNotes = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/platform-admin/leads/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusSelect,
          notes: notesInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (err) {
      console.error('Update lead error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleExecuteConversion = async () => {
    if (!convertSubdomain.trim()) return;
    setConvertLoading(true);
    setConvertResult(null);

    try {
      const res = await fetch(`/api/v1/platform-admin/leads/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomainSlug: convertSubdomain.trim(),
          organizationName: lead?.orgName,
          organizationTypeCode: lead?.orgTypeCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConvertResult(data.data);
        fetchLeadDetail();
      } else {
        alert(data?.error?.message || 'Conversion failed');
      }
    } catch (err) {
      alert('Network error during lead conversion.');
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-surface-500">Loading lead detail...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-sm text-surface-500">Lead record not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/platform-admin/leads" className="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to All Leads
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant={lead.status === 'CONVERTED' ? 'success' : lead.status === 'NEW' ? 'warning' : 'info'}>
            Status: {lead.status}
          </Badge>
          {lead.status !== 'CONVERTED' && (
            <Button variant="primary" size="sm" onClick={() => setConvertModalOpen(true)}>
              <UserCheck className="w-4 h-4 mr-1.5" /> Convert to Tenant
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Org Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{lead.fullName}</CardTitle>
              <p className="text-xs text-surface-500">{lead.orgName} ({lead.orgTypeCode})</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-surface-400" />
                  <span className="font-medium text-surface-900 dark:text-surface-100">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-surface-400" />
                  <span>{lead.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-surface-400" />
                  <span>Org Type: {lead.orgTypeCode} ({lead.peopleCount || 'N/A'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-surface-400" />
                  <span>Preferred: {lead.preferredDate || 'N/A'} {lead.preferredTime || ''}</span>
                </div>
              </div>

              {lead.modulesOfInterest && (
                <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
                  <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">Modules of Interest</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(lead.modulesOfInterest as string[]).map((m) => (
                      <Badge key={m} variant="default">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {lead.message && (
                <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
                  <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Lead Notes / Requirements</div>
                  <p className="text-xs text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                    {lead.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CRM Status & Notes Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Management & Status State Machine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 uppercase tracking-wider">
                    Pipeline Status Transition
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg"
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value)}
                  >
                    {statusOptions.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 uppercase tracking-wider">
                  Internal Sales Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg"
                  placeholder="Add call notes, demo feedback..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>

              <Button onClick={handleUpdateStatusAndNotes} isLoading={updating} variant="primary" size="sm">
                Save CRM Updates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" /> Activity Audit Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-surface-200 dark:before:bg-surface-800">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative pl-6 text-xs space-y-0.5">
                    <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-brand-600 border-2 border-white dark:border-surface-900" />
                    <div className="font-semibold text-surface-900 dark:text-surface-100">{act.type}</div>
                    <div className="text-surface-600 dark:text-surface-400">{act.description}</div>
                    <div className="text-[10px] text-surface-400">{new Date(act.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead-to-Tenant Conversion Modal */}
      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Lead-to-Tenant Conversion Engine">
        {convertResult ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Tenant Reserved Successfully!</h3>
            <p className="text-xs text-surface-600 dark:text-surface-400">
              Organization reserved at: <strong className="text-brand-600">{convertResult.subdomain}</strong>
            </p>
            <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs text-surface-600 dark:text-surface-400 text-left">
              <strong>Phase 3 Security Boundary Note:</strong> {convertResult.phase3DependencyNote}
            </div>
            <Button onClick={() => setConvertModalOpen(false)} variant="outline" className="w-full">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-surface-600 dark:text-surface-400">
              Convert qualified lead <strong>{lead.fullName}</strong> ({lead.orgName}) into a provisioned tenant organization.
            </p>
            <Input
              label="Tenant Subdomain Slug *"
              placeholder="e.g. acme"
              value={convertSubdomain}
              onChange={(e) => setConvertSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
              helperText={`Tenant URL will be: ${convertSubdomain || 'slug'}.localhost:3000`}
            />
            <div className="flex gap-2 justify-end pt-4 border-t border-surface-100 dark:border-surface-800">
              <Button variant="outline" onClick={() => setConvertModalOpen(false)}>Cancel</Button>
              <Button variant="primary" isLoading={convertLoading} onClick={handleExecuteConversion}>
                Execute Conversion
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
