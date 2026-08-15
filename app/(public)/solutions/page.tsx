import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Rocket, School, GraduationCap, Stethoscope, Factory, HeartHandshake, ArrowRight } from 'lucide-react';

export default function SolutionsOverviewPage() {
  const solutions = [
    { type: 'company', title: 'Corporate Companies', icon: Building2, desc: 'Hierarchical organization units, corporate departments, designations, manager approvals, and global directories.' },
    { type: 'startup', title: 'Tech Startups', icon: Rocket, desc: 'Agile team squads, flexible roles, custom onboarding forms, and fast member invites.' },
    { type: 'school', title: 'K-12 Schools & Academies', icon: School, desc: 'Teacher and staff profiles, classes, sections, grades, student profiles, and guardian linkages.' },
    { type: 'college', title: 'Colleges & Universities', icon: GraduationCap, desc: 'Academic faculties, departments, degree courses, semesters, professors, and students.' },
    { type: 'hospital', title: 'Hospitals & Healthcare', icon: Stethoscope, desc: 'Medical departments, doctor specializations, shift attendance, wards, and staff rosters.' },
    { type: 'factory', title: 'Factories & Manufacturing', icon: Factory, desc: 'Production lines, shift teams, operator attendance, worker categories, and safety audits.' },
    { type: 'ngo', title: 'NGOs & Non-Profits', icon: HeartHandshake, desc: 'Project field offices, program coordinators, volunteer tracking, and donor reporting.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="info">Organization Solutions</Badge>
        <h1 className="text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
          Tailored HRMS Solutions for Every Industry
        </h1>
        <p className="text-base text-surface-600 dark:text-surface-400">
          Learn how Universal HRMS adapts its default terminology, modules, and structure presets for your organization type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.type} className="hover:border-brand-500 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-surface-600 dark:text-surface-400">{s.desc}</p>
                <Link href={`/solutions/${s.type}`} className="block pt-2">
                  <Button variant="outline" className="w-full">
                    View {s.title} Solution <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
