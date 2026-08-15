'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  Calendar,
  GraduationCap,
  Briefcase,
  Ticket,
  CircleDollarSign,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/dashboard');
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        setError(result?.error?.message || 'Failed to load dashboard statistics');
      }
    } catch (err) {
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const isEducation = data?.tenant?.type === 'SCHOOL' || data?.tenant?.type === 'COLLEGE' || data?.tenant?.type === 'UNIVERSITY';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${data?.tenant?.name || 'Tenant'} Dashboard`}
        description={`Organization Type: ${data?.tenant?.type || 'COMPANY'} • Real-time operational overview`}
        icon={<LayoutDashboard className="w-5 h-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="flex items-center gap-1">
            Refresh Metrics
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-brand-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-surface-500 block">Total Directory People</span>
              <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.totalPeople || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-surface-500 block">Active Employees</span>
              <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.totalEmployees || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {isEducation ? (
          <Card className="hover:border-brand-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-surface-500 block">Enrolled Students</span>
                <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.totalStudents || 0}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:border-brand-300 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-surface-500 block">Open Job Positions</span>
                <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.activeJobs || 0}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="hover:border-brand-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-surface-500 block">Pending Leave Requests</span>
              <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.pendingLeaves || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Operational Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Attendance & Clocking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-500">Check-in Events Today</span>
              <Badge variant="success" size="sm">{stats.presentToday || 0}</Badge>
            </div>
            <Link href="/app/attendance">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-between">
                <span>View Attendance Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand-500" /> Support Tickets & SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-500">Active Open Tickets</span>
              <Badge variant="warning" size="sm">{stats.openTickets || 0}</Badge>
            </div>
            <Link href="/app/tickets">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-between">
                <span>Manage Support Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-brand-500" /> Payroll Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-500">Executed Payroll Runs</span>
              <Badge variant="info" size="sm">{stats.payrollRunsCount || 0}</Badge>
            </div>
            <Link href="/app/payroll">
              <Button variant="outline" size="sm" className="w-full flex items-center justify-between">
                <span>View Payroll Runs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
