import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    { title: 'Why One Universal HRMS Beats Buying 5 Niche Software Tools', date: 'August 10, 2026', author: 'SaaS Product Team', snippet: 'Exploring how configurable terminology and tenant presets eliminate software fragmentation across enterprises and institutions.' },
    { title: 'Designing Strict Tenant Isolation in Modern Next.js & PostgreSQL Apps', date: 'August 02, 2026', author: 'Engineering Lead', snippet: 'How pure hostname resolution and database-level query filters prevent IDOR vulnerabilities in multi-tenant B2B SaaS.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="info">Platform Blog</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Latest Insights & Updates
        </h1>
      </div>

      <div className="space-y-6">
        {posts.map((p, idx) => (
          <Card key={idx} className="hover:border-brand-500 transition-all">
            <CardHeader>
              <div className="flex items-center gap-4 text-xs text-surface-500 mb-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {p.date}</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {p.author}</span>
              </div>
              <CardTitle className="text-xl hover:text-brand-600 cursor-pointer">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{p.snippet}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
