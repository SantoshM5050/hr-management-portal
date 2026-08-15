import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto p-8 space-y-8">
      <header className="border-b border-surface-200 dark:border-surface-800 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-surface-900 dark:text-surface-100">
              Universal HRMS SaaS
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Phase 1 Baseline Architecture & Design System
            </p>
          </div>
          <Badge variant="success">Phase 1 Complete</Badge>
        </div>
      </header>

      {/* Component Showcase Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Buttons & Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Pending</Badge>
              <Badge variant="danger">Suspended</Badge>
              <Badge variant="info">Subdomain</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inputs & Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Subdomain Hostname" placeholder="acme.localhost:3000" helperText="Resolved strictly from HTTP request host header" />
            <Input label="Organization Name" placeholder="Acme Corporation" error="Organization name is required" />
          </CardContent>
        </Card>
      </section>

      {/* Foundational Schema Status */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Database Foundational Schema (11 Entities)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Entity Model</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, name: 'Organization', desc: 'Core tenant entity' },
                { id: 2, name: 'OrganizationType', desc: 'Company, School, College, Hospital, NGO' },
                { id: 3, name: 'Domain', desc: 'Subdomains and custom domains' },
                { id: 4, name: 'User', desc: 'Global authentication user identity' },
                { id: 5, name: 'Person', desc: 'Universal base identity (Employee, Teacher, Student)' },
                { id: 6, name: 'Membership', desc: 'Tenant-user association & roles' },
                { id: 7, name: 'Role', desc: 'Tenant RBAC roles' },
                { id: 8, name: 'Permission', desc: 'Granular system permission codes' },
                { id: 9, name: 'Module', desc: 'System feature modules (Core, Attendance, Leave)' },
                { id: 10, name: 'OrganizationModule', desc: 'Tenant module enablement' },
                { id: 11, name: 'OrganizationSettings', desc: 'Branding & configurable terminology' },
              ].map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-surface-400">{item.id}</TableCell>
                  <TableCell className="font-semibold text-brand-600 dark:text-brand-400">{item.name}</TableCell>
                  <TableCell className="text-surface-600 dark:text-surface-400">{item.desc}</TableCell>
                  <TableCell><Badge variant="success">Schema Ready</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
