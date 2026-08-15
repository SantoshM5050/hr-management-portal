import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Calendar, Layers, ShieldCheck, Zap, FileText, Ticket, Award, BookOpen } from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    { icon: Users, title: 'Universal Person Core', desc: 'Manage employees, faculty, doctors, workers, students, and volunteers in a unified base model with custom fields and attributes.' },
    { icon: Layers, title: 'Visual Org Structure', desc: 'Nested organization units (business units, departments, campuses, faculties, classes, sections) with manager assignments.' },
    { icon: Clock, title: 'Time & Attendance Tracking', desc: 'Digital check-in/out, shift roster assignments, duration calculations, overtime, and manager correction approvals.' },
    { icon: Calendar, title: 'Leave & Absence Ledger', desc: 'Custom leave types, holiday calendars, automated balance ledgers, and multi-level approval state machines.' },
    { icon: Zap, title: 'Custom Fields & Form Builder', desc: 'Add entity custom attributes and create drag-and-drop dynamic forms without writing code.' },
    { icon: ShieldCheck, title: 'Enterprise Isolation & RBAC', desc: 'Strict subdomain tenant resolution, HttpOnly session cookies, role builders, granular permission codes, and audit logs.' },
    { icon: FileText, title: 'Document Storage & Verification', desc: 'Private secure object storage, document verification workflows, expiration reminders, and access permissions.' },
    { icon: Ticket, title: 'Helpdesk & Ticket Routing', desc: 'Internal ticketing system with priority routing, SLA tracking, and status timeline notifications.' },
    { icon: BookOpen, title: 'Academic & Education Module', desc: 'Optional school/college class management, courses, semesters, sections, and guardian contact linkages.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="info">Platform Capabilities</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Powerful Modules Engineered for Configurability
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400">
          Everything your organization needs to manage people, structure, attendance, documents, and workflows from one system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featureList.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="hover:border-brand-500 transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <Link href="/demo">
          <Button size="lg" variant="primary">Book a Demo to See All Features</Button>
        </Link>
      </div>
    </div>
  );
}
