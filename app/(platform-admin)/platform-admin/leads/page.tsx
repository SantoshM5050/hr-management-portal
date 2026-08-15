'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeadItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  orgName: string;
  orgTypeCode: string;
  peopleCount: string | null;
  status: string;
  createdAt: string;
}

export default function PlatformLeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusTabs = [
    { code: 'ALL', label: 'All Leads' },
    { code: 'NEW', label: 'New' },
    { code: 'CONTACTED', label: 'Contacted' },
    { code: 'QUALIFIED', label: 'Qualified' },
    { code: 'DEMO_SCHEDULED', label: 'Demo Scheduled' },
    { code: 'DEMO_COMPLETED', label: 'Demo Completed' },
    { code: 'TRIAL_STARTED', label: 'Trial Started' },
    { code: 'CONVERTED', label: 'Converted' },
    { code: 'LOST', label: 'Lost' },
  ];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/v1/platform-admin/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">Lead CRM & Demo Requests</h1>
          <p className="text-xs text-surface-500 mt-1">Platform acquisition pipeline management</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-200 dark:border-surface-800 pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.code}
            onClick={() => {
              setStatusFilter(tab.code);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === tab.code
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Action Bar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-grow max-w-md">
            <Input
              placeholder="Search by name, email, or org..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lead List Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-surface-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-sm text-surface-500">No leads match the current filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Org Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-semibold text-surface-900 dark:text-surface-100">{lead.fullName}</div>
                      <div className="text-xs text-surface-500">{lead.email}</div>
                    </TableCell>
                    <TableCell className="font-medium text-surface-800 dark:text-surface-200">{lead.orgName}</TableCell>
                    <TableCell>
                      <Badge variant="default">{lead.orgTypeCode}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-surface-500">{lead.peopleCount || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === 'NEW'
                            ? 'warning'
                            : lead.status === 'CONVERTED'
                            ? 'success'
                            : lead.status === 'LOST'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-surface-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/platform-admin/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          <div className="p-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
