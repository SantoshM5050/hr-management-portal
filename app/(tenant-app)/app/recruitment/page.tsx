'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Briefcase, Plus, AlertCircle, UserCheck } from 'lucide-react';

export default function RecruitmentPage() {
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecruitment();
  }, []);

  const fetchRecruitment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/recruitment');
      const data = await res.json();
      if (res.ok && data.success) {
        setJobOpenings(data.data.jobOpenings || []);
        setCandidates(data.data.candidates || []);
        setApplications(data.data.applications || []);
      } else {
        setError(data?.error?.message || 'Recruitment module unavailable');
      }
    } catch (err) {
      setError('Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_JOB', title }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create job opening');
      } else {
        setShowModal(false);
        setTitle('');
        await fetchRecruitment();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHireConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'HIRE_CONVERT',
          candidateId: selectedCandidate.id,
          employeeCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to convert candidate to employee');
      } else {
        setShowHireModal(false);
        setEmployeeCode('');
        setSelectedCandidate(null);
        await fetchRecruitment();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-500" /> Recruitment & Hiring Pipeline
          </h1>
          <p className="text-xs text-surface-500">
            Pipeline: APPLIED → SCREENING → SHORTLISTED → INTERVIEW → SELECTED → OFFERED → HIRED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Job Opening
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Openings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Job Openings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading jobs...</div>
            ) : jobOpenings.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No active job openings.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Job Title',
                    accessorKey: 'title',
                    cell: (row) => <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">{row.title}</span>,
                  },
                  {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: (row) => <Badge variant="success" size="sm">{row.status}</Badge>,
                  },
                ]}
                data={jobOpenings}
              />
            )}
          </CardContent>
        </Card>

        {/* Candidates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Candidates Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center p-6 text-xs text-surface-500">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="text-center p-6 text-xs text-surface-500">No candidates in pipeline.</div>
            ) : (
              <Table
                columns={[
                  {
                    header: 'Candidate Name',
                    cell: (row) => (
                      <span className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                        {row.firstName} {row.lastName}
                      </span>
                    ),
                  },
                  {
                    header: 'Email',
                    cell: (row) => <span className="text-xs text-surface-500">{row.email}</span>,
                  },
                  {
                    header: 'Action',
                    cell: (row) => (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(row);
                          setShowHireModal(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-brand-600" /> Hire to Employee
                      </Button>
                    ),
                  },
                ]}
                data={candidates}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Create Job Opening</h3>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <Input
                label="Job Title *"
                placeholder="Senior Full Stack Engineer / Academic Dean"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Post Job Opening
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHireModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Hire Candidate: {selectedCandidate.firstName} {selectedCandidate.lastName}
            </h3>
            <form onSubmit={handleHireConvert} className="space-y-4">
              <Input
                label="Assign Employee Code *"
                placeholder="EMP-2001"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowHireModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Execute Hire Conversion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
