'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Alert } from '@/components/ui/alert';
import { FileText, Plus, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [personId, setPersonId] = useState('');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/documents');
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.data.documents || []);
      } else {
        setError(data?.error?.message || 'Documents module unavailable');
      }
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId,
          title,
          fileUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to record document');
      } else {
        setShowModal(false);
        setTitle('');
        setFileUrl('');
        await fetchDocuments();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management & Verification"
        description="Compliance document storage metadata, verification status, and audit records"
        icon={<FileText className="w-5 h-5" />}
        actions={
          <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Record Document Metadata
          </Button>
        }
      />

      <Alert type="info" title="Cloud Storage Abstraction Notice">
        File uploads store secure cloud storage URLs. Production storage backends (GCS / S3) must be configured in environment settings before direct binary uploads can be processed.
      </Alert>

      {error && (
        <Alert type="danger" title="Error">
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={[
              {
                header: 'Document Title',
                accessorKey: 'title',
                cell: (row: any) => (
                  <div>
                    <div className="font-semibold text-surface-900 dark:text-surface-100">{row.title}</div>
                    <div className="text-[11px] font-mono text-surface-500 truncate max-w-xs">{row.fileUrl}</div>
                  </div>
                ),
              },
              {
                header: 'Person Identity',
                cell: (row: any) => (
                  <span className="text-xs font-medium">
                    {row.person ? `${row.person.firstName} ${row.person.lastName}` : 'Person'}
                  </span>
                ),
              },
              {
                header: 'Document Type',
                cell: (row: any) => <Badge variant="neutral" size="sm">{row.documentType?.name || 'General'}</Badge>,
              },
              {
                header: 'Verification Status',
                accessorKey: 'verificationStatus',
                cell: (row: any) => (
                  <Badge variant={row.verificationStatus === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                    {row.verificationStatus}
                  </Badge>
                ),
              },
            ]}
            data={documents}
            loading={loading}
            searchPlaceholder="Search document title or URL..."
          />
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Record Document Metadata</h3>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <Input
                label="Person ID *"
                placeholder="Paste Person ID"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
              />

              <Input
                label="Document Title *"
                placeholder="National Identity Card / Passport / Academic Degree"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Input
                label="Storage URL *"
                placeholder="https://storage.provider.com/bucket/doc-100.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Document Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
