'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdmissionsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/education');
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.data.students || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Admissions Portal"
        description="Manage incoming student admissions, registration roll numbers, and parent relationships"
        icon={<GraduationCap className="w-5 h-5" />}
        actions={
          <Link href="/app/education">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Education Overview
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={[
              {
                header: 'Roll Number',
                accessorKey: 'studentRollNo',
                cell: (row: any) => <span className="font-mono font-bold text-xs">{row.studentRollNo}</span>,
              },
              {
                header: 'Student Name',
                cell: (row: any) => (
                  <span className="font-semibold text-surface-900 dark:text-surface-100">
                    {row.person ? `${row.person.firstName} ${row.person.lastName}` : 'N/A'}
                  </span>
                ),
              },
              {
                header: 'Admission Date',
                cell: (row: any) => new Date(row.admissionDate).toLocaleDateString(),
              },
              {
                header: 'Status',
                cell: (row: any) => <Badge variant="success" size="sm">ACTIVE ADMISSION</Badge>,
              },
            ]}
            data={students}
            loading={loading}
            searchPlaceholder="Search admissions..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
