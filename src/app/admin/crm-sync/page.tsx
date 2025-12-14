'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  name?: string;
  type: string;
  status: string;
  leadScore: number;
  createdAt: string;
}

interface FormSubmission {
  id: string;
  formType: string;
  email: string;
  data: Record<string, any>;
  status: string;
  submittedAt: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  subscribedAt: string;
}

interface Notification {
  id: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalLeads: number;
  totalForms: number;
  totalSubscribers: number;
  unreadNotifications: number;
  conversionRate: number;
}

export default function CRMSyncDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/crm-sync');
        
        if (!response.ok) {
          throw new Error('Failed to fetch CRM data');
        }

        const data = await response.json();
        setStats(data.stats);
        setLeads(data.leads);
        setForms(data.forms);
        setSubscribers(data.subscribers);
        setNotifications(data.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold">CRM Sync Dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor form submissions, leads, and notifications</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Form Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalForms}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Newsletter Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSubscribers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.unreadNotifications}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Last 50 leads from forms and submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">No leads yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Name</th>
                        <th className="text-left py-2 px-4">Type</th>
                        <th className="text-left py-2 px-4">Score</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-4">{lead.email}</td>
                          <td className="py-2 px-4">{lead.name || '-'}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{lead.type}</Badge>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant={lead.leadScore > 70 ? 'default' : 'secondary'}>
                              {lead.leadScore}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant={lead.status === 'NEW' ? 'destructive' : 'default'}>
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-slate-600">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>Last 50 form submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">No form submissions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Form Type</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((form) => (
                        <tr key={form.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-4">{form.email}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{form.formType}</Badge>
                          </td>
                          <td className="py-2 px-4">
                            <Badge variant={form.status === 'NEW' ? 'destructive' : 'default'}>
                              {form.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-slate-600">
                            {new Date(form.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Subscribers</CardTitle>
              <CardDescription>Last 50 newsletter subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              {subscribers.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">No subscribers yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Source</th>
                        <th className="text-left py-2 px-4">Subscribed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-4">{sub.email}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline">{sub.source}</Badge>
                          </td>
                          <td className="py-2 px-4 text-slate-600">
                            {new Date(sub.subscribedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>CRM notifications from BZION_HUB</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-slate-500 py-8 text-center">No unread notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notif.type}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={notif.priority === 'HIGH' ? 'destructive' : 'secondary'}
                          >
                            {notif.priority}
                          </Badge>
                          {!notif.read && <Badge>Unread</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
