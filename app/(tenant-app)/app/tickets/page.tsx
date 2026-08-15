'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';
import { Ticket, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [personId, setPersonId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/tickets');
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(data.data.tickets || []);
        setCategories(data.data.categories || []);
      } else {
        setError(data?.error?.message || 'Ticketing module unavailable');
      }
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tenant/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          personId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message || 'Failed to submit ticket');
      } else {
        setShowModal(false);
        setTitle('');
        setDescription('');
        await fetchTickets();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (ticketId: string, targetState: string) => {
    try {
      const res = await fetch(`/api/v1/tenant/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });
      if (res.ok) await fetchTickets();
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-500" /> Helpdesk Ticketing & SLA Engine
          </h1>
          <p className="text-xs text-surface-500">
            Lifecycle: OPEN → ASSIGNED → IN_PROGRESS → WAITING → RESOLVED → CLOSED
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Open Support Ticket
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
            <div className="text-center p-8 text-xs text-surface-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No Support Tickets</p>
              <p className="text-xs text-surface-500">Open a ticket to trigger SLA tracking and helpdesk assignment.</p>
            </div>
          ) : (
            <Table
              columns={[
                {
                  header: 'Ticket Title',
                  accessorKey: 'title',
                  cell: (row) => (
                    <div>
                      <div className="font-semibold text-surface-900 dark:text-surface-100">{row.title}</div>
                      <div className="text-[11px] text-surface-500">{row.description}</div>
                    </div>
                  ),
                },
                {
                  header: 'Priority',
                  accessorKey: 'priority',
                  cell: (row) => (
                    <Badge variant={row.priority === 'HIGH' ? 'danger' : row.priority === 'MEDIUM' ? 'warning' : 'info'} size="sm">
                      {row.priority}
                    </Badge>
                  ),
                },
                {
                  header: 'Status',
                  accessorKey: 'status',
                  cell: (row) => (
                    <Badge variant={row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'success' : 'warning'} size="sm">
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  header: 'Actions',
                  cell: (row) => (
                    <div className="flex gap-1">
                      {row.status === 'OPEN' && (
                        <Button variant="outline" size="sm" onClick={() => handleTransition(row.id, 'IN_PROGRESS')}>
                          Start Progress
                        </Button>
                      )}
                      {row.status === 'IN_PROGRESS' && (
                        <Button variant="outline" size="sm" onClick={() => handleTransition(row.id, 'RESOLVED')}>
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={tickets}
            />
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-surface-200 dark:border-surface-800">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Open Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <Input
                label="Person ID *"
                placeholder="Paste Person ID"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
              />

              <Input
                label="Ticket Title *"
                placeholder="Laptop Biometric Sensor Issue / Payroll Query"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Input
                label="Description *"
                placeholder="Detailed issue description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wider">
                  Priority Level *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent SLA Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
