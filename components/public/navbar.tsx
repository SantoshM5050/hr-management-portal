'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Building2, School, GraduationCap, Stethoscope, Factory, HeartHandshake, Rocket } from 'lucide-react';

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const solutions = [
    { href: '/solutions/company', title: 'Companies & Corporations', icon: Building2, desc: 'Corporate HR, departments & designations' },
    { href: '/solutions/startup', title: 'Startups & Tech Teams', icon: Rocket, desc: 'Agile teams, squads & roles' },
    { href: '/solutions/school', title: 'K-12 Schools & Academies', icon: School, desc: 'Teachers, staff, classes & grades' },
    { href: '/solutions/college', title: 'Colleges & Universities', icon: GraduationCap, desc: 'Professors, faculties & courses' },
    { href: '/solutions/hospital', title: 'Hospitals & Healthcare', icon: Stethoscope, desc: 'Doctors, nurses, shifts & wards' },
    { href: '/solutions/factory', title: 'Factories & Manufacturing', icon: Factory, desc: 'Plant lines, shifts & operators' },
    { href: '/solutions/ngo', title: 'NGOs & Non-Profits', icon: HeartHandshake, desc: 'Programs, projects & volunteers' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-brand-700 transition-colors">
            U
          </div>
          <div>
            <span className="font-extrabold text-lg text-surface-900 dark:text-surface-50 tracking-tight">Universal</span>
            <span className="font-semibold text-xs text-brand-600 dark:text-brand-400 block -mt-1 uppercase tracking-wider">HRMS SaaS</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Solutions Dropdown */}
          <div className="relative" onMouseEnter={() => setSolutionsOpen(true)} onMouseLeave={() => setSolutionsOpen(false)}>
            <button className="flex items-center gap-1.5 text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 py-2">
              Solutions <ChevronDown className="w-4 h-4" />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 w-80 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 p-2 grid gap-1 animate-fade-in">
                {solutions.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-surface-900 dark:text-surface-100">{s.title}</div>
                        <div className="text-xs text-surface-500">{s.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/features" className="text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Pricing
          </Link>
          <Link href="/resources" className="text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Resources
          </Link>
          <Link href="/about" className="text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            About
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="sm">Book Demo</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">Sign Up</Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-2 py-1">Solutions</div>
            {solutions.map((s) => (
              <Link key={s.href} href={s.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 rounded-lg">
                {s.title}
              </Link>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800 pt-3 space-y-2">
            <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">Features</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">Pricing</Link>
            <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">Resources</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300">About</Link>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800 pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">Sign Up</Button>
            </Link>
            <Link href="/demo" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full">Book Demo</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
