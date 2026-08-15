'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/recruitment');
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.data.candidates || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Pool Directory"
        description="All job applicants across recruitment pipeline stages"
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
                header: 'Candidate Name',
                accessorKey: 'fullName',
                cell: (row: any) => <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">{row.fullName}</span>,
              },
              {
                header: 'Email',
                accessorKey: 'email',
                cell: (row: any) => <span className="text-xs text-surface-500">{row.email}</span>,
              },
              {
                header: 'Job Position',
                cell: (row: any) => <span className="text-xs font-medium">{row.jobOpening?.title || 'N/A'}</span>,
              },
              {
                header: 'Pipeline Stage',
                accessorKey: 'stage',
                cell: (row: any) => <StatusBadge status={row.stage} size="sm" />,
              },
            ]}
            data={candidates}
            loading={loading}
            searchPlaceholder="Search candidates by name or email..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
