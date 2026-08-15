'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { GraduationCap, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EducationAdmissionsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/education');
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.data.students || []);
        setEnrollments(data.data.enrollments || []);
      } else {
        setError(data?.error?.message || 'Education module unavailable');
      }
    } catch (err) {
      setError('Failed to load education records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          studentIdNumber: studentIdNumber.toUpperCase().trim(),
          guardianName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to process student admission');
      } else {
        setShowModal(false);
        setFirstName('');
        setLastName('');
        setStudentIdNumber('');
        setGuardianName('');
        await fetchEducation();
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
            <GraduationCap className="w-5 h-5 text-brand-500" /> Student Admissions & Enrollment
          </h1>
          <p className="text-xs text-surface-500">
            Lifecycle: APPLICATION → UNDER_REVIEW → APPROVED → ENROLLED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Process Student Admission
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8 text-xs text-surface-500">Loading student directory...</div>
          ) : students.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Enrolled Students</p>
              <p className="text-xs text-surface-500">Process student admissions to manage institutional enrollments.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Student Name',
                  accessorKey: 'firstName',
                  cell: (row) => (
                    <div className="font-semibold text-surface-900 dark:text-surface-100">
                      {row.firstName} {row.lastName}
                    </div>
                  ),
                },
                {
                  header: 'Student ID Number',
                  cell: (row) => <Badge variant="neutral" size="sm">{row.studentProfile?.studentIdNumber || 'N/A'}</Badge>,
                },
                {
                  header: 'Admission Status',
                  cell: (row) => <Badge variant="success" size="sm">{row.studentProfile?.admissionStatus || 'ENROLLED'}</Badge>,
                },
                {
                  header: 'Admission Date',
                  cell: (row) => (
                    <span className="text-xs font-mono">
                      {row.studentProfile?.admissionDate ? new Date(row.studentProfile.admissionDate).toLocaleDateString() : 'N/A'}
                    </span>
                  ),
                },
              ]}
              data={students}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Process Student Admission</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Student ID / Roll Number *"
                placeholder="STU-2026-001"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                required
              />

              <Input
                label="Student Email"
                type="email"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Guardian / Parent Name"
                placeholder="Jane Doe"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Enroll Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
