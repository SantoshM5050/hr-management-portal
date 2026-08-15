import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, HeartHandshake, Zap, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="info">About Universal HRMS</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Engineered to Unify People & Organization Management
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400 leading-relaxed">
          We built Universal HRMS because traditional software forces organizations into rigid, industry-locked silos. Companies get one system, schools get another, and hospitals another — forcing organizations to rewrite their workflows around software limitations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-3">
            <Target className="w-8 h-8 text-brand-600" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Our Mission</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              To provide a single, universal, multi-tenant B2B SaaS platform that adapts to any organization type without requiring custom code deployments or separate codebases.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Enterprise Isolation</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              We guarantee strict tenant data isolation at the hostname and database level, ensuring every organization retains total privacy, security, and governance over their data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
