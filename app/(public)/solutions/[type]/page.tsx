import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Building2, School, GraduationCap, Stethoscope, Factory, HeartHandshake, Rocket } from 'lucide-react';

interface SolutionDetail {
  title: string;
  tagline: string;
  icon: React.ElementType;
  terminology: { unit: string; dept: string; post: string; person: string };
  modules: string[];
  keyFeatures: string[];
}

const solutionData: Record<string, SolutionDetail> = {
  company: {
    title: 'Corporate Companies & Enterprises',
    tagline: 'Streamline corporate hierarchies, departments, designations, and global employee operations.',
    icon: Building2,
    terminology: { unit: 'Business Unit', dept: 'Department', post: 'Designation / Post', person: 'Employee' },
    modules: ['Universal Core HR', 'Time & Attendance', 'Leave Management', 'Optional Payroll Engine', 'Performance Reviews', 'Helpdesk Ticketing'],
    keyFeatures: [
      'Multi-level department & business unit hierarchy',
      'Designation grade levels & salary bands',
      'Manager approval workflows for leave & corrections',
      'Secure document storage & employee self-service portal',
    ],
  },
  startup: {
    title: 'Startups & Tech Teams',
    tagline: 'Agile squad structures, team roles, custom fields, and frictionless member onboarding.',
    icon: Rocket,
    terminology: { unit: 'Squad / Chapter', dept: 'Team', post: 'Role / Level', person: 'Team Member' },
    modules: ['Universal Core HR', 'Time Tracking', 'Flexible Leave Balances', 'Recruitment Pipeline', 'Custom Field Engine'],
    keyFeatures: [
      'Flexible team & squad mapping without corporate bloat',
      'Drag-and-drop custom fields & form builder',
      'Fast invitation & self-service profile completion',
      'Slack/Email notification integration hooks',
    ],
  },
  school: {
    title: 'K-12 Schools & Academies',
    tagline: 'Manage teachers, staff, classes, sections, student rosters, and guardian linkages.',
    icon: School,
    terminology: { unit: 'Grade / Class', dept: 'Faculty / Subject Dept', post: 'Teacher / Staff Position', person: 'Teacher / Student / Guardian' },
    modules: ['Universal Core HR', 'Teacher & Staff Attendance', 'Leave Management', 'Academic & Class Management', 'Guardian Directory'],
    keyFeatures: [
      'Class & section assignment for teachers and students',
      'Guardian profile linkage and contact records',
      'Academic year calendar & holiday schedules',
      'Staff leave substitute teacher workflows',
    ],
  },
  college: {
    title: 'Colleges & Universities',
    tagline: 'Academic faculties, degree courses, semesters, professors, and student management.',
    icon: GraduationCap,
    terminology: { unit: 'School / College', dept: 'Academic Department', post: 'Professor / Lecturer / Staff', person: 'Faculty / Student' },
    modules: ['Universal Core HR', 'Faculty Attendance', 'Academic & Course Management', 'Performance Reviews', 'Helpdesk Ticketing'],
    keyFeatures: [
      'Multi-school & academic department structure',
      'Course, batch, semester, and section enrollment',
      'Professor academic rank tracking (Dean, HOD, Professor, Lecturer)',
      'Student academic history and enrollment status',
    ],
  },
  hospital: {
    title: 'Hospitals & Healthcare Clinics',
    tagline: 'Medical departments, doctor specializations, shift rosters, and ward staff management.',
    icon: Stethoscope,
    terminology: { unit: 'Ward / Unit', dept: 'Medical Department', post: 'Specialization / Role', person: 'Doctor / Nurse / Staff' },
    modules: ['Universal Core HR', 'Shift Attendance Tracking', 'Leave Management', 'Document Verification', 'Helpdesk Support'],
    keyFeatures: [
      'Shift-based attendance and overtime calculation',
      'Medical credential and license document verification',
      'Doctor & nursing staff shift roster management',
      'Emergency leave replacement approvals',
    ],
  },
  factory: {
    title: 'Factories & Manufacturing',
    tagline: 'Plant lines, shift teams, operator attendance, worker categories, and safety compliance.',
    icon: Factory,
    terminology: { unit: 'Plant / Line', dept: 'Shift / Department', post: 'Operator / Supervisor', person: 'Worker / Staff' },
    modules: ['Universal Core HR', 'Shift Attendance & Overtime', 'Leave Management', 'Optional Payroll Engine', 'Safety Audit Center'],
    keyFeatures: [
      'Plant line and shift team assignments',
      'Biometric / kiosk shift check-in/out integration',
      'Operator skill & compliance tracking',
      'Worker category salary structure calculations',
    ],
  },
  ngo: {
    title: 'NGOs & Non-Profits',
    tagline: 'Program field offices, project coordinators, volunteer tracking, and donor report exports.',
    icon: HeartHandshake,
    terminology: { unit: 'Field Office', dept: 'Program / Project', post: 'Coordinator / Designation', person: 'Staff / Volunteer' },
    modules: ['Universal Core HR', 'Time & Project Tracking', 'Leave Management', 'Expense & Document Center'],
    keyFeatures: [
      'Field office and project team allocation',
      'Staff and volunteer directory management',
      'Project activity audit timeline',
      'Exportable staffing reports for grant donors',
    ],
  },
};

export default function SolutionDetailPage({ params }: { params: { type: string } }) {
  const detail = solutionData[params.type.toLowerCase()];
  if (!detail) {
    notFound();
  }

  const Icon = detail.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="space-y-4">
        <Link href="/solutions" className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider hover:underline">
          ← All Organization Solutions
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">{detail.title}</h1>
            <p className="text-base text-surface-600 dark:text-surface-400 mt-1">{detail.tagline}</p>
          </div>
        </div>
      </div>

      {/* Configurable Terminology Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Terminology Mapping Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div className="text-xs text-surface-500 uppercase tracking-wider">Unit Concept</div>
              <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-1">{detail.terminology.unit}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div className="text-xs text-surface-500 uppercase tracking-wider">Dept Concept</div>
              <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-1">{detail.terminology.dept}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div className="text-xs text-surface-500 uppercase tracking-wider">Post Concept</div>
              <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-1">{detail.terminology.post}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
              <div className="text-xs text-surface-500 uppercase tracking-wider">Person Base</div>
              <div className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-1">{detail.terminology.person}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Solution Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Feature Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {detail.modules.map((m, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Workflows & Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {detail.keyFeatures.map((kf, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-surface-700 dark:text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{kf}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-2xl bg-brand-600 text-white text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to see {detail.title} in action?</h2>
        <p className="text-sm text-brand-100 max-w-xl mx-auto">
          Book a 1-on-1 personalized demo tailored to your organization setup.
        </p>
        <Link href="/demo">
          <Button variant="secondary" size="lg" className="mt-2">Book Your Customized Demo</Button>
        </Link>
      </div>
    </div>
  );
}
