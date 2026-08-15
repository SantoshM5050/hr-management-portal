import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const faqContent = await db.cmsContent.findUnique({
    where: { key: 'faq_items' },
  });

  const faqs = (faqContent?.payload as { question: string; answer: string }[]) || [
    { question: 'What is Universal HRMS?', answer: 'A multi-tenant SaaS platform that adapts to company, school, college, hospital, factory, and NGO organization types.' },
    { question: 'Is tenant data isolated securely?', answer: 'Yes. Tenant context is derived strictly from validated hostnames and enforced at the database repository layer.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="info">Frequently Asked Questions</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Everything You Need to Know
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400">
          Find quick answers to common questions about tenancy, configuration, security, and modules.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-surface-900 dark:text-surface-100">{f.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{f.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
