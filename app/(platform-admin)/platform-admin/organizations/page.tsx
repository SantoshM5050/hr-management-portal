'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Search, Plus, ExternalLink, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  organizationType: {
    code: string;
    name: string;
  };
  domains: Array<{ domain: string; isPrimary: boolean }>;
  memberships: Array<{
    user: { fullName: string; email: string };
  }>;
}

export default function PlatformOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/v1/platform-admin/organizations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.data.organizations);
        setTotalPages(data.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch organizations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">Organizations & Tenants</h1>
          <p className="text-xs text-surface-500 mt-1">Platform Multi-Tenant Organization Management</p>
        </div>
        <Link href="/platform-admin/organizations/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Provision New Tenant
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-grow max-w-md">
            <Input
              placeholder="Search by organization name or subdomain slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex gap-2">
            {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-surface-500">Loading tenant organizations...</div>
          ) : organizations.length === 0 ? (
            <div className="p-8 text-center text-sm text-surface-500">No organizations found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Subdomain / Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provisioned Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const owner = org.memberships?.[0]?.user;
                  const primaryDomain = org.domains?.find((d) => d.isPrimary)?.domain || `${org.slug}.localhost`;
                  return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          {org.name}
                        </div>
                        <div className="text-xs text-surface-500">Slug: {org.slug}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-brand-600 dark:text-brand-400">
                        {primaryDomain}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{org.organizationType?.code || 'COMPANY'}</Badge>
                      </TableCell>
                      <TableCell>
                        {owner ? (
                          <div>
                            <div className="font-medium text-xs text-surface-900 dark:text-surface-100">{owner.fullName}</div>
                            <div className="text-[11px] text-surface-500">{owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-surface-400">No owner assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'ACTIVE' ? 'success' : org.status === 'PENDING' ? 'warning' : 'danger'}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-surface-500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`http://${primaryDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Visit Tenant <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
            <div>Page {page} of {totalPages}</div>
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
