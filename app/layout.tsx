import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Universal HRMS & Organization Management SaaS',
  description: 'Production-ready universal configurable SaaS platform for Companies, Schools, Colleges, and Organizations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 antialiased">
        {children}
      </body>
    </html>
  );
}
