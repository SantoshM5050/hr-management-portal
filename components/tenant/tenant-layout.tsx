'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { GlobalSearchModal } from './global-search-modal';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  Calendar,
  GraduationCap,
  Briefcase,
  Award,
  Ticket,
  CircleDollarSign,
  FileText,
  Bell,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  LogOut,
  Shield,
} from 'lucide-react';

export interface ModuleInfo {
  code: string;
  name: string;
  isEnabled: boolean;
}

export interface TenantLayoutProps {
  children: React.ReactNode;
  orgName?: string;
  orgType?: string;
  orgSlug?: string;
  enabledModules?: string[];
  user?: {
    name: string;
    email: string;
    roleCodes: string[];
  };
}

export default function TenantLayout({
  children,
  orgName = 'Universal HRMS Tenant',
  orgType = 'COMPANY',
  orgSlug = 'tenant',
  enabledModules = ['CORE', 'ATTENDANCE', 'LEAVE', 'RECRUITMENT', 'PERFORMANCE', 'TICKETING', 'PAYROLL', 'DOCUMENTS'],
  user = { name: 'Tenant Administrator', email: 'admin@organization.com', roleCodes: ['ADMIN'] },
}: TenantLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Keyboard shortcut for Global Search (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, module: 'CORE' },
    { label: 'People', href: '/app/people', icon: Users, module: 'CORE' },
    { label: 'Employees', href: '/app/employees', icon: UserCheck, module: 'CORE' },
    { label: 'Attendance', href: '/app/attendance', icon: Clock, module: 'ATTENDANCE' },
    { label: 'Leave', href: '/app/leave', icon: Calendar, module: 'LEAVE' },
    { label: 'Education', href: '/app/education', icon: GraduationCap, module: 'EDUCATION' },
    { label: 'Recruitment', href: '/app/recruitment', icon: Briefcase, module: 'RECRUITMENT' },
    { label: 'Performance', href: '/app/performance', icon: Award, module: 'PERFORMANCE' },
    { label: 'Tickets', href: '/app/tickets', icon: Ticket, module: 'TICKETING' },
    { label: 'Payroll', href: '/app/payroll', icon: CircleDollarSign, module: 'PAYROLL' },
    { label: 'Documents', href: '/app/documents', icon: FileText, module: 'DOCUMENTS' },
    { label: 'Notifications', href: '/app/notifications', icon: Bell, module: 'CORE' },
    { label: 'Organization', href: '/app/organization/departments', icon: Building2, module: 'CORE' },
    { label: 'Settings', href: '/app/settings', icon: Settings, module: 'CORE' },
  ];

  // Filter Nav Items based on Module Activation
  const visibleNav = navItems.filter((item) => {
    if (item.module === 'CORE') return true;
    return enabledModules.includes(item.module);
  });

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col md:flex-row">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-surface-200 dark:border-surface-800 shrink-0">
          <Link href="/app/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {orgName[0]}
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="font-bold text-xs text-surface-900 dark:text-surface-100 truncate">{orgName}</div>
                <div className="text-[10px] text-surface-500 uppercase tracking-wider font-mono">{orgType}</div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar name={user.name} size="sm" />
            {!collapsed && (
              <div className="truncate">
                <div className="font-bold text-xs text-surface-900 dark:text-surface-100 truncate">{user.name}</div>
                <div className="text-[10px] text-surface-500 font-mono truncate">{user.roleCodes.join(', ')}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-surface-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-xl text-xs hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search tenant records...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-surface-900 rounded border border-surface-300 dark:border-surface-600">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/notifications"
              className="p-2 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 relative"
            >
              <Bell className="w-4 h-4" />
            </Link>

            <div className="h-4 w-px bg-surface-200 dark:bg-surface-800" />

            <div className="flex items-center gap-2">
              <Avatar name={user.name} size="sm" />
              <span className="hidden sm:inline text-xs font-semibold text-surface-900 dark:text-surface-100">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">{children}</main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
