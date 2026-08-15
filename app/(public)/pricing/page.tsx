import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Data-Driven Pricing Plans — Universal HRMS SaaS',
  description: 'Transparent, scalable pricing plans for Companies, Startups, Schools, Colleges, Hospitals, and Organizations.',
};

export default async function PricingPage() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="info">Simple & Transparent Pricing</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Choose the Perfect Plan for Your Organization
        </h1>
        <p className="text-base sm:text-lg text-surface-600 dark:text-surface-400">
          All plans include universal configurable terminology, strict multi-tenant isolation, and core HR features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const featuresList = (plan.features as string[]) || [];
          const limits = (plan.limits as { maxMembers?: number; maxStorageMb?: number }) || {};

          return (
            <Card key={plan.id} className="relative flex flex-col justify-between border-2 border-surface-200 dark:border-surface-800 hover:border-brand-500 transition-all shadow-sm">
              {plan.code === 'PROFESSIONAL' && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                  Most Popular
                </div>
              )}
              <CardHeader className="pt-8">
                <div className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-surface-900 dark:text-surface-50">${plan.monthlyPrice}</span>
                  <span className="text-sm text-surface-500">/ month</span>
                </div>
                <p className="text-xs text-surface-500 mt-2 min-h-[32px]">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider border-b border-surface-100 dark:border-surface-800 pb-2">
                    Included Capabilities
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {featuresList.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-surface-100 dark:border-surface-800 space-y-4">
                  <div className="text-xs text-surface-500 space-y-1">
                    <div>Capacity: {limits.maxMembers ? `${limits.maxMembers} Members` : 'Unlimited Members'}</div>
                    <div>Storage: {limits.maxStorageMb ? `${limits.maxStorageMb / 1024} GB Storage` : 'Unlimited Storage'}</div>
                  </div>
                  <Link href={`/demo?plan=${plan.code}`}>
                    <Button variant={plan.code === 'PROFESSIONAL' ? 'primary' : 'outline'} className="w-full">
                      Request Demo with {plan.name}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
