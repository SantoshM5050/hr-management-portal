import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-surface-900 text-surface-300 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base">U</div>
            <span className="font-extrabold text-lg text-white tracking-tight">Universal HRMS</span>
          </div>
          <p className="text-sm text-surface-400 max-w-sm">
            One universal, highly configurable HRMS & organization management SaaS platform engineered for companies, startups, schools, colleges, universities, hospitals, factories, and NGOs.
          </p>
          <div className="text-xs text-surface-500 pt-2">
            © {new Date().getFullYear()} Universal HRMS SaaS Inc. All rights reserved.
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-surface-100 uppercase tracking-wider mb-4">Solutions</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/solutions/company" className="hover:text-white transition-colors">Companies</Link></li>
            <li><Link href="/solutions/startup" className="hover:text-white transition-colors">Startups</Link></li>
            <li><Link href="/solutions/school" className="hover:text-white transition-colors">Schools & K-12</Link></li>
            <li><Link href="/solutions/college" className="hover:text-white transition-colors">Colleges & Universities</Link></li>
            <li><Link href="/solutions/hospital" className="hover:text-white transition-colors">Hospitals & Healthcare</Link></li>
            <li><Link href="/solutions/factory" className="hover:text-white transition-colors">Factories & Manufacturing</Link></li>
            <li><Link href="/solutions/ngo" className="hover:text-white transition-colors">NGOs & Non-Profits</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-surface-100 uppercase tracking-wider mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/demo" className="hover:text-white transition-colors">Book a Demo</Link></li>
            <li><Link href="/resources" className="hover:text-white transition-colors">Resources & Guides</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-surface-100 uppercase tracking-wider mb-4">Company & Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
