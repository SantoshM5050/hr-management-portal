import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';

export default async function PlatformDashboardPage() {
  const [totalLeads, newLeads, convertedLeads, totalTenants] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { status: 'NEW' } }),
    db.lead.count({ where: { status: 'CONVERTED' } }),
    db.organization.count(),
  ]);

  const recentLeads = await db.lead.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">Platform Super Admin Dashboard</h1>
          <p className="text-xs text-surface-500 mt-1">Overview of SaaS acquisition pipeline, demo requests, and tenant organizations</p>
        </div>
        <Link href="/platform-admin/leads">
          <Button variant="primary" size="sm">Manage All Leads ({totalLeads})</Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Total Leads</div>
              <div className="text-3xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{totalLeads}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">New Requests</div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{newLeads}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Conversion Rate</div>
              <div className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{conversionRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Active Tenants</div>
              <div className="text-3xl font-extrabold text-surface-900 dark:text-surface-50 mt-1">{totalTenants}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Demo Requests & Leads</CardTitle>
          <Link href="/platform-admin/leads" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
            View Lead CRM <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-surface-500 py-4 text-center">No demo requests received yet.</p>
          ) : (
            <div className="divide-y divide-surface-200 dark:divide-surface-800">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-surface-900 dark:text-surface-100">{lead.fullName}</div>
                    <div className="text-xs text-surface-500">{lead.orgName} ({lead.orgTypeCode}) — {lead.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={lead.status === 'NEW' ? 'warning' : lead.status === 'CONVERTED' ? 'success' : 'info'}>
                      {lead.status}
                    </Badge>
                    <Link href={`/platform-admin/leads/${lead.id}`}>
                      <Button variant="outline" size="sm">View Detail</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
