import React from 'react';
import { PublicNavbar } from '@/components/public/navbar';
import { PublicFooter } from '@/components/public/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <div className="flex-grow">{children}</div>
      <PublicFooter />
    </div>
  );
}
