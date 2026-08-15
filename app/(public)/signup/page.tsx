'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [orgType, setOrgType] = useState('COMPANY');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !orgName || !subdomain) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          orgName,
          orgTypeCode: orgType,
          subdomainSlug: subdomain,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Signup failed');
      } else {
        setSuccessData(data.data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRootDomain = () => {
    if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
      return process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    }
    if (typeof window !== 'undefined' && window.location.host) {
      return window.location.host;
    }
    return 'localhost:3000';
  };

  const rootDomainDisplay = getRootDomain();

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="info">Self-Service Organization Provisioning</Badge>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Create Your Organization Account</h1>
        <p className="text-xs text-surface-500">Provision your organization tenant & custom subdomain instant instance</p>
      </div>

      <Card>
        {successData ? (
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Organization Created Successfully!</h3>
            <p className="text-xs text-surface-600 dark:text-surface-400">
              Your tenant instance is ready at: <strong className="text-brand-600">{successData.organization.subdomain}</strong>
            </p>
            <div className="pt-2">
              <a href={successData.organization.url || `http://${successData.organization.subdomain}/app/dashboard`} className="block">
                <Button variant="primary" className="w-full">Open Organization App</Button>
              </a>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Your Full Name *"
                placeholder="Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Work Email Address *"
                type="email"
                placeholder="sarah@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password (8+ characters) *"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Organization Name *"
                placeholder="Acme Corporation"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                }}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Organization Type *
                </label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
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

              <Input
                label="Subdomain Reservation *"
                placeholder="acme"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                helperText={subdomain ? `URL: ${subdomain}.${rootDomainDisplay}` : 'Unique subdomain slug'}
                required
              />

              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                Provision Organization & Sign In <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
