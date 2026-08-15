'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Users, Briefcase, Ticket, Building2, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/tenant/people?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setResults(data.data.people || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-surface-900 rounded-2xl max-w-xl w-full p-4 space-y-4 shadow-2xl border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-800 pb-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search people, employees, students, tickets... (Type at least 2 chars)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              icon={<Search className="w-4 h-4 text-surface-400" />}
            />
          </div>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center p-6 text-xs text-surface-500">Searching tenant records...</div>
          ) : results.length === 0 ? (
            <div className="text-center p-6 text-xs text-surface-500">
              {query ? 'No matching tenant entities found.' : 'Search directory records by name, email, or identity code.'}
            </div>
          ) : (
            results.map((person) => (
              <Link
                key={person.id}
                href={person.personTypeCode === 'EMPLOYEE' ? `/app/employees/${person.id}` : `/app/people`}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-transparent hover:border-surface-200 dark:hover:border-surface-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold text-xs">
                    {person.firstName[0]}
                    {person.lastName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-[11px] text-surface-500">{person.email || 'No email registered'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {person.personTypeCode}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
