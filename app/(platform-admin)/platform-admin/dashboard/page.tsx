import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Building2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Converted Tenants</div>
              <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">{convertedLeads}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Conversion Rate</div>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{conversionRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Activity Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-surface-100 dark:border-surface-800">
          <div>
            <CardTitle className="text-lg font-bold">Recent Inbound Lead Requests</CardTitle>
            <p className="text-xs text-surface-500">Latest demo and sales requests submitted via marketing site</p>
          </div>
          <Link href="/platform-admin/leads">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-surface-500">No lead requests submitted yet.</div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{lead.fullName}</span>
                      <Badge variant={lead.status === 'NEW' ? 'success' : lead.status === 'CONVERTED' ? 'info' : 'default'}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-surface-500">
                      {lead.orgName} ({lead.orgTypeCode}) • {lead.email}
                    </div>
                  </div>
                  <Link href={`/platform-admin/leads/${lead.id}`}>
                    <Button variant="ghost" size="sm">Details</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
