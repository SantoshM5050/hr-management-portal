import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Users, Building2, CreditCard, ShieldAlert } from 'lucide-react';

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-100 dark:bg-surface-950">
      {/* Platform Admin Sidebar */}
      <aside className="w-64 bg-surface-900 text-surface-200 border-r border-surface-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base">
              PA
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">Platform Admin</span>
              <span className="text-[10px] text-brand-400 uppercase tracking-widest block -mt-0.5">Super Admin Scope</span>
            </div>
          </div>
          <Badge variant="danger" className="text-[10px] px-1.5 py-0">ADMIN</Badge>
        </div>

        <nav className="p-4 space-y-1 text-sm font-medium flex-grow">
          <Link
            href="/platform-admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/platform-admin/leads"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Leads & Demo Requests</span>
          </Link>
          <Link
            href="/platform-admin/tenants"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>Tenants & Orgs</span>
          </Link>
          <Link
            href="/platform-admin/subscriptions"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Subscriptions & Plans</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-surface-800 text-xs text-surface-500">
          Super Admin Scope Protected
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-300">
            SaaS Platform Super Admin CRM
          </div>
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>Scope: PLATFORM_ADMIN</span>
          </div>
        </header>

        <main className="p-8 flex-grow">{children}</main>
      </div>
    </div>
  );
}
