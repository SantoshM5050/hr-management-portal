'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Building2, Calendar, Clock, Sparkles } from 'lucide-react';

export default function DemoBookingPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    orgName: '',
    orgTypeCode: 'COMPANY',
    peopleCount: '1-50',
    country: 'United States',
    preferredDate: '',
    preferredTime: '10:00 AM',
    modulesOfInterest: ['CORE', 'ATTENDANCE', 'LEAVE'],
    message: '',
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ leadId: string; message: string; isDuplicate?: boolean } | null>(null);

  const orgTypeOptions = [
    { code: 'COMPANY', label: 'Company / Business Enterprise' },
    { code: 'STARTUP', label: 'Tech Startup' },
    { code: 'SCHOOL', label: 'K-12 School / Academy' },
    { code: 'COLLEGE', label: 'College / University' },
    { code: 'HOSPITAL', label: 'Hospital / Healthcare' },
    { code: 'FACTORY', label: 'Factory / Manufacturing' },
    { code: 'NGO', label: 'Non-Profit / NGO' },
  ];

  const moduleOptions = [
    { code: 'CORE', label: 'Universal Core HR & Org Structure' },
    { code: 'ATTENDANCE', label: 'Time & Attendance Tracking' },
    { code: 'LEAVE', label: 'Leave & Absence Management' },
    { code: 'PAYROLL', label: 'Optional Payroll Engine' },
    { code: 'RECRUITMENT', label: 'Recruitment & Hiring' },
    { code: 'EDUCATION', label: 'Academic & Class Management' },
    { code: 'PERFORMANCE', label: 'Performance Reviews' },
    { code: 'TICKETING', label: 'Helpdesk Support Tickets' },
  ];

  const handleModuleToggle = (code: string) => {
    setFormData((prev) => {
      const exists = prev.modulesOfInterest.includes(code);
      if (exists) {
        return { ...prev, modulesOfInterest: prev.modulesOfInterest.filter((m) => m !== code) };
      } else {
        return { ...prev, modulesOfInterest: [...prev.modulesOfInterest, code] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (!formData.orgName.trim()) {
      setError('Please enter your organization name.');
      return;
    }
    if (!formData.consent) {
      setError('You must agree to the privacy consent to request a demo.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/public/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to submit demo request. Please try again.');
      } else {
        setSuccessResult({
          leadId: data.data.leadId,
          message: data.data.message,
          isDuplicate: data.data.isDuplicate,
        });
      }
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="info">Book a Free Product Demonstration</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          See Universal HRMS in Action
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400">
          Fill out the form below and one of our solution consultants will schedule a tailored 1-on-1 walkthrough for your organization.
        </p>
      </div>

      <Card className="shadow-lg border-surface-200 dark:border-surface-800">
        {successResult ? (
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {successResult.isDuplicate ? 'Demo Request Already Received' : 'Demo Request Submitted Successfully!'}
            </h2>
            <p className="text-sm text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
              {successResult.message}
            </p>
            <div className="pt-4">
              <Button onClick={() => setSuccessResult(null)} variant="outline">
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
                <Input
                  label="Work Email *"
                  type="email"
                  placeholder="s.jenkins@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Contact & Org */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Organization Name *"
                  placeholder="Acme Inc. / Greenwood High"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  required
                />
              </div>

              {/* Org Type & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                    Organization Type *
                  </label>
                  <select
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-brand-500"
                    value={formData.orgTypeCode}
                    onChange={(e) => setFormData({ ...formData, orgTypeCode: e.target.value })}
                  >
                    {orgTypeOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                    Approximate People Count
                  </label>
                  <select
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-brand-500"
                    value={formData.peopleCount}
                    onChange={(e) => setFormData({ ...formData, peopleCount: e.target.value })}
                  >
                    <option value="1-50">1 - 50 People</option>
                    <option value="51-200">51 - 200 People</option>
                    <option value="201-1000">201 - 1,000 People</option>
                    <option value="1000+">1,000+ People</option>
                  </select>
                </div>
              </div>

              {/* Schedule Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Preferred Date"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                    Preferred Time
                  </label>
                  <select
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-brand-500"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  >
                    <option value="09:00 AM">09:00 AM EST</option>
                    <option value="10:00 AM">10:00 AM EST</option>
                    <option value="01:00 PM">01:00 PM EST</option>
                    <option value="03:00 PM">03:00 PM EST</option>
                  </select>
                </div>
              </div>

              {/* Modules Checklist */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2 uppercase tracking-wider">
                  Modules / Requirements of Interest
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-50 dark:bg-surface-800/40 p-4 rounded-xl border border-surface-200 dark:border-surface-800">
                  {moduleOptions.map((m) => {
                    const checked = formData.modulesOfInterest.includes(m.code);
                    return (
                      <label key={m.code} className="flex items-center gap-2.5 text-xs text-surface-800 dark:text-surface-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleModuleToggle(m.code)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Additional Notes or Specific Requirements
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-brand-500"
                  placeholder="Describe your current HR pain points or goals..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              {/* Consent */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  required
                />
                <label htmlFor="consent" className="text-xs text-surface-600 dark:text-surface-400">
                  I agree to receive product demo communication and accept the Privacy Policy.
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full text-base py-3">
                  Submit Demo Request
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
