'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/notifications');
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/tenant/notifications', { method: 'PATCH' });
      if (res.ok) await fetchNotifications();
    } catch (err) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" /> In-App Workflow Notifications
          </h1>
          <p className="text-xs text-surface-500">Real-time workflow state transition alerts and system activity logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex items-center gap-1">
          <CheckCheck className="w-4 h-4" /> Mark All as Read
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="text-center p-6 text-xs text-surface-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-6 text-xs text-surface-500">No notifications found.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between text-xs transition-colors ${
                  !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800' : 'border-surface-200 dark:border-surface-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-surface-900 dark:text-surface-100">{n.title}</span>
                    <Badge variant="info" size="sm">{n.type}</Badge>
                  </div>
                  <p className="text-surface-600 dark:text-surface-400">{n.message}</p>
                </div>
                <span className="text-[10px] font-mono text-surface-400 shrink-0">{new Date(n.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
