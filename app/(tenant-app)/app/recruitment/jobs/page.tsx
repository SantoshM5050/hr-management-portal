'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/recruitment');
      const data = await res.json();
      if (res.ok && data.success) {
        setJobs(data.data.jobOpenings || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Openings Directory"
        description="Active job openings, department requisitions, and applicant counts"
        icon={<Briefcase className="w-5 h-5" />}
        actions={
          <Link href="/app/recruitment">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Recruitment Board
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={[
              {
                header: 'Job Title',
                accessorKey: 'title',
                cell: (row: any) => <span className="font-bold text-xs text-surface-900 dark:text-surface-100">{row.title}</span>,
              },
              {
                header: 'Requisition Code',
                accessorKey: 'code',
                cell: (row: any) => <span className="font-mono text-xs text-surface-500">{row.code}</span>,
              },
              {
                header: 'Status',
                accessorKey: 'status',
                cell: (row: any) => <Badge variant={row.status === 'OPEN' ? 'success' : 'neutral'} size="sm">{row.status}</Badge>,
              },
              {
                header: 'Candidates',
                cell: (row: any) => <span className="font-semibold text-xs">{row.candidates?.length || 0}</span>,
              },
            ]}
            data={jobs}
            loading={loading}
            searchPlaceholder="Search job titles..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
