'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Authentication failed');
      } else {
        setSuccessUser(data.data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="info">Authenticated Sign In</Badge>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Sign In to Your Organization</h1>
        <p className="text-xs text-surface-500">Access your organization subdomain or platform admin dashboard</p>
      </div>

      <Card>
        {successUser ? (
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Authenticated Successfully!</h3>
            <p className="text-xs text-surface-600 dark:text-surface-400">
              Welcome back, <strong>{successUser.user.fullName}</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              {successUser.user.isPlatformStaff && (
                <a href="http://admin.localhost:3000/platform-admin/dashboard" className="block">
                  <Button variant="primary" className="w-full">Go to Platform Admin Dashboard</Button>
                </a>
              )}
              {successUser.tenantContext.tenantId && (
                <a href={`http://${successUser.tenantContext.tenantId}.localhost:3000/app/dashboard`} className="block">
                  <Button variant="secondary" className="w-full">Go to Tenant App Dashboard</Button>
                </a>
              )}
              <Button variant="outline" onClick={() => setSuccessUser(null)} className="w-full">Sign Out / Back</Button>
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
                label="Work Email Address *"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password *"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                Sign In <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
