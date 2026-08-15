import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Video, ArrowRight } from 'lucide-react';

export default function ResourcesPage() {
  const items = [
    { title: 'Universal HRMS Architecture Whitepaper', type: 'Whitepaper', icon: FileText, desc: 'Technical deep dive into multi-tenancy, custom fields, and RBAC security.' },
    { title: 'School & College HR Setup Guide', type: 'Guide', icon: BookOpen, desc: 'Best practices for managing faculties, grades, courses, and guardians.' },
    { title: 'Corporate HR Workflows Demo', type: 'Video Walkthrough', icon: Video, desc: 'Step-by-step video explaining manager approval chains and leave ledgers.' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="info">Resources & Knowledge Base</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Guides, Whitepapers & Case Studies
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it, idx) => {
          const Icon = it.icon;
          return (
            <Card key={idx} className="hover:border-brand-500 transition-all">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant="default" className="w-fit mb-2">{it.type}</Badge>
                <CardTitle className="text-lg">{it.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-surface-600 dark:text-surface-400">{it.desc}</p>
                <Link href="/demo" className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  Download / View Resource <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
