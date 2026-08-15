'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { CustomFieldRenderer } from '@/components/tenant/custom-field-renderer';
import { Users, Plus, Search, AlertCircle, ChevronLeft, ChevronRight, Eye, Edit, Archive } from 'lucide-react';

export default function PeopleAdminPage() {
  const [people, setPeople] = useState<any[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [personTypeCode, setPersonTypeCode] = useState('EMPLOYEE');
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPeople(1);
    fetchCustomFields();
  }, [typeFilter, statusFilter]);

  const fetchPeople = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/v1/tenant/people?page=${page}&limit=10`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (typeFilter) url += `&type=${encodeURIComponent(typeFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setPeople(data.data.people || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch (err) {
      setError('Failed to load people directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await fetch('/api/v1/tenant/custom-fields');
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomFieldDefs((data.data.customFields || []).filter((f: any) => f.entityName === 'PERSON'));
      }
    } catch (err) {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPeople(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          personTypeCode,
          customValues,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to create person record');
      } else {
        setShowCreateModal(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setCustomValues({});
        await fetchPeople(1);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (personId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/tenant/people/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchPeople(pagination.page);
      }
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" /> People Directory & Administration
          </h1>
          <p className="text-xs text-surface-500">Universal identity directory supporting configured person types and custom attributes</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Person Record
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Search
            </Button>
          </form>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
            >
              <option value="">All Person Types</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="TEACHER">Teacher / Faculty</option>
              <option value="STUDENT">Student</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="VOLUNTEER">Volunteer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived / Deactivated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8 text-xs text-surface-500">Loading directory...</div>
          ) : people.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Matching Person Records Found</p>
              <p className="text-xs text-surface-500">Adjust search filters or add a new person record.</p>
            </div>
          ) : (
            <div>
              <Table
                columns={[
                  {
                    header: 'Full Name',
                    accessorKey: 'firstName',
                    cell: (row) => (
                      <div>
                        <div className="font-semibold text-surface-900 dark:text-surface-100">
                          {row.firstName} {row.lastName}
                        </div>
                        <div className="text-[11px] text-surface-400 font-mono">ID: {row.id.slice(0, 8)}...</div>
                      </div>
                    ),
                  },
                  {
                    header: 'Person Type',
                    accessorKey: 'personTypeCode',
                    cell: (row) => <Badge variant="info" size="sm">{row.personTypeCode}</Badge>,
                  },
                  {
                    header: 'Email Address',
                    accessorKey: 'email',
                    cell: (row) => <span className="text-xs text-surface-600 dark:text-surface-400">{row.email || 'N/A'}</span>,
                  },
                  {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">{row.status}</Badge>,
                  },
                  {
                    header: 'Actions',
                    cell: (row) => (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPerson(row);
                            setShowDetailModal(true);
                          }}
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(row.id, row.status)}
                          title={row.status === 'ACTIVE' ? 'Archive Person' : 'Reactivate Person'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={people}
              />

              {/* Pagination Footer */}
              <div className="flex items-center justify-between p-4 border-t border-surface-200 dark:border-surface-800 text-xs">
                <span className="text-surface-500">
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchPeople(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchPeople(pagination.page + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Person Detail Profile Modal */}
      {showDetailModal && selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Person Profile: {selectedPerson.firstName} {selectedPerson.lastName}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2 border-surface-200 dark:border-surface-800">
                <span className="text-surface-500">Person Type:</span>
                <Badge variant="info">{selectedPerson.personTypeCode}</Badge>
              </div>
              <div className="flex justify-between border-b pb-2 border-surface-200 dark:border-surface-800">
                <span className="text-surface-500">Email Address:</span>
                <span className="font-semibold">{selectedPerson.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-surface-200 dark:border-surface-800">
                <span className="text-surface-500">Phone:</span>
                <span className="font-semibold">{selectedPerson.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-surface-200 dark:border-surface-800">
                <span className="text-surface-500">Account Status:</span>
                <Badge variant={selectedPerson.status === 'ACTIVE' ? 'success' : 'neutral'}>{selectedPerson.status}</Badge>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Person Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Add Person Record</h3>
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
                label="Email Address"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                placeholder="+1 555-0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Universal Person Type *
                </label>
                <select
                  value={personTypeCode}
                  onChange={(e) => setPersonTypeCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="EMPLOYEE">Employee / Corporate Staff</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="STUDENT">Student / Pupil</option>
                  <option value="GUARDIAN">Guardian / Parent</option>
                  <option value="CONTRACTOR">Contractor / Consultant</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="DOCTOR">Medical Staff / Doctor</option>
                </select>
              </div>

              {/* Dynamic Custom Fields Renderer */}
              {customFieldDefs.length > 0 && (
                <CustomFieldRenderer
                  fields={customFieldDefs}
                  values={customValues}
                  onChange={(key, val) => setCustomValues({ ...customValues, [key]: val })}
                />
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-800">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save Person
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
