'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 space-y-6 text-center">
      <div className="space-y-3">
        <Badge variant="info" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold">
          Sales-Assisted Enterprise Onboarding
        </Badge>
        <h1 className="text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
          Get Started with Universal HRMS
        </h1>
        <p className="text-sm text-surface-600 dark:text-surface-400 max-w-md mx-auto leading-relaxed">
          Universal HRMS is a fully managed enterprise SaaS. Tenant organizations are provisioned through our sales engineering team to ensure exact configuration for your structure, terminology, and modules.
        </p>
      </div>

      <Card className="border-brand-500/20 shadow-lg">
        <CardContent className="p-8 space-y-6 text-left">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              How Organization Onboarding Works:
            </h3>

            <div className="space-y-3 text-xs text-surface-600 dark:text-surface-300">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-surface-900 dark:text-surface-100 block">Book a Demo & Request Access</strong>
                  Fill out our brief demo form with your organization details and module requirements.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-surface-900 dark:text-surface-100 block">Consultation & Custom Subdomain Reservation</strong>
                  Our platform team assists in setting up your unique subdomain, organizational units, and role templates.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <strong className="text-surface-900 dark:text-surface-100 block">Instant Tenant Activation</strong>
                  Your Organization Owner receives an invitation link to log in, configure settings, and invite employees.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/demo" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                Book a Free Demo <Calendar className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Sign In to Existing Tenant
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
