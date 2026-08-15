import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Rocket,
  School,
  GraduationCap,
  Stethoscope,
  Factory,
  HeartHandshake,
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Universal HRMS SaaS — One Configurable Platform for Every Organization',
  description: 'Manage people, structure, attendance, leave, documents, and workflows from one configurable HRMS platform for Companies, Schools, Colleges, Hospitals, Factories, and NGOs.',
  openGraph: {
    title: 'Universal HRMS SaaS — One Configurable Platform for Every Organization',
    description: 'Universal configurable HRMS & organization management SaaS.',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch pricing plans from PostgreSQL (Data-driven)
  let plans: any[] = [];
  try {
    plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  } catch (err) {
    console.error('Failed to fetch plans from database:', err);
  }

  const orgSolutions = [
    { type: 'company', name: 'Companies & Corporations', icon: Building2, desc: 'Corporate hierarchies, departments, designations, manager approvals, and global employee directories.' },
    { type: 'startup', name: 'Tech Startups & Teams', icon: Rocket, desc: 'Agile squad structures, team roles, custom fields, and fast self-service onboarding.' },
    { type: 'school', name: 'K-12 Schools & Academies', icon: School, desc: 'Manage teachers, staff, classes, sections, grades, and guardian linkages.' },
    { type: 'college', name: 'Colleges & Universities', icon: GraduationCap, desc: 'Faculties, academic departments, courses, semesters, professors, and students.' },
    { type: 'hospital', name: 'Hospitals & Healthcare', icon: Stethoscope, desc: 'Medical departments, specializations, shift attendance, and doctor/staff management.' },
    { type: 'factory', name: 'Factories & Manufacturing', icon: Factory, desc: 'Plant lines, shifts, operator attendance, worker categories, and safety audits.' },
    { type: 'ngo', name: 'NGOs & Non-Profits', icon: HeartHandshake, desc: 'Project teams, field offices, volunteer tracking, and donor report exports.' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-surface-50 dark:from-surface-900 dark:via-surface-950 dark:to-surface-900 py-20 lg:py-28 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge variant="info" className="px-4 py-1 text-xs uppercase tracking-wider font-semibold">
            Universal HRMS SaaS Platform
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight max-w-4xl mx-auto leading-tight">
            One Configurable HRMS Platform for <span className="text-brand-600 dark:text-brand-400">Every Organization</span>
          </h1>
          <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Stop managing separate systems. Whether you operate a tech startup, corporate enterprise, school, college, hospital, factory, or NGO — Universal HRMS adapts to your terminology and workflows seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/demo">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-3.5 shadow-lg shadow-brand-500/20">
                Book a Free Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
                View Pricing & Plans
              </Button>
            </Link>
          </div>

          {/* Value Props Pills */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { title: 'Strict Tenant Isolation', desc: 'Hostname & DB level security' },
              { title: 'Universal Person Core', desc: 'Employee, Teacher, Doctor, Student' },
              { title: 'Configurable Structure', desc: 'Units, Departments, Classes' },
              { title: 'Custom Fields & Forms', desc: 'No developer needed' },
            ].map((prop, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-2" />
                <div className="text-sm font-semibold text-surface-900 dark:text-surface-100">{prop.title}</div>
                <div className="text-xs text-surface-500 mt-0.5">{prop.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS BY ORGANIZATION TYPE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="default">Tailored Solutions</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
            Designed for Your Specific Organization Type
          </h2>
          <p className="text-surface-600 dark:text-surface-400 text-base">
            No rigid assumptions. The platform automatically adjusts its default terminology, modules, and role templates based on your profile selection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgSolutions.map((sol) => {
            const Icon = sol.icon;
            return (
              <Card key={sol.type} className="hover:border-brand-500/50 hover:shadow-md transition-all group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{sol.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-surface-600 dark:text-surface-400">{sol.desc}</p>
                  <Link href={`/solutions/${sol.type}`} className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    Explore {sol.name} Solution <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FEATURE OVERVIEW */}
      <section className="bg-surface-900 text-white py-20 border-y border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge variant="info">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Comprehensive Modules Under One System
            </h2>
            <p className="text-surface-400 text-base">
              Enable only the modules your organization needs today. Add new modules as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Universal People Directory', desc: 'Centralized directory for employees, teachers, students, doctors, and volunteers with full profile history.' },
              { icon: Clock, title: 'Attendance & Time Tracking', desc: 'Digital check-in/out, shift schedules, duration calculations, and manager correction approvals.' },
              { icon: Calendar, title: 'Leave & Absence Management', desc: 'Custom leave types, holiday calendars, automated balance ledgers, and multi-level approval chains.' },
              { icon: Layers, title: 'Visual Org Structure', desc: 'Nested business units, departments, positions, campuses, faculties, classes, and sections.' },
              { icon: Zap, title: 'Custom Fields & Form Builder', desc: 'Add entity custom attributes and create drag-and-drop dynamic forms without writing code.' },
              { icon: ShieldCheck, title: 'Enterprise Security & Isolation', desc: 'Strict subdomain tenant resolution, RBAC permissions, HttpOnly session cookies, and audit trails.' },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-surface-800/60 border border-surface-700/60 space-y-3">
                  <Icon className="w-8 h-8 text-brand-400" />
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DATA-DRIVEN PRICING TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="default">Transparent Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
            Plans Built for Scale
          </h2>
          <p className="text-surface-600 dark:text-surface-400 text-base">
            Choose a plan based on your active capacity and required feature modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const featuresList = (plan.features as string[]) || [];
            return (
              <Card key={plan.id} className="relative flex flex-col justify-between hover:border-brand-500 transition-all">
                <CardHeader>
                  <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-surface-900 dark:text-surface-50">${plan.monthlyPrice}</span>
                    <span className="text-sm text-surface-500">/ month</span>
                  </div>
                  <p className="text-xs text-surface-500 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                  <ul className="space-y-2.5 text-sm">
                    {featuresList.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/demo" className="block pt-4">
                    <Button variant={plan.code === 'PROFESSIONAL' ? 'primary' : 'outline'} className="w-full">
                      Book a Demo for {plan.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-10 sm:p-14 rounded-3xl bg-brand-600 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Transform Your Organization’s HR & Operations?
          </h2>
          <p className="text-brand-100 text-base sm:text-lg max-w-2xl mx-auto">
            Book a personalized product demonstration with our SaaS consultants today.
          </p>
          <div className="pt-2">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="px-8 py-3.5 text-base">
                Book Your Free Demo Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
