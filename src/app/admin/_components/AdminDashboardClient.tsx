'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MetricsCards } from './MetricsCards';
import { ActivityFeed } from './ActivityFeed';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { Eye, MessageSquare, Trash2, Download } from 'lucide-react';
import type { ActivityEvent } from '../_actions/activities';

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    newUsersThisWeek: number;
    totalQuotes: number;
    pendingQuotes: number;
    totalNewsletterSubscribers: number;
    totalFormSubmissions: number;
    totalCheckouts: number;
  };
  activities: ActivityEvent[];
  quotes: any[];
  newUsers: any[];
  newsletterSubscribers: any[];
  formSubmissions: any[];
}

export default function AdminDashboardClient({
  stats,
  activities,
  quotes,
  newUsers,
  newsletterSubscribers,
  formSubmissions,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('activity');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      negotiating: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-800',
      responded: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Metrics Cards */}
      <MetricsCards stats={stats} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="users">New Users</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Real-time overview of all platform activities and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={activities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUOTES TAB */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quote Requests</CardTitle>
                  <CardDescription>
                    Manage and track all customer quote requests
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{stats.totalQuotes} Total</Badge>
                  <Badge variant="destructive">{stats.pendingQuotes} Pending</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.length > 0 ? (
                    quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono text-sm">{quote.reference}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quote.user?.firstName} {quote.user?.lastName}</p>
                            <p className="text-sm text-muted-foreground">{quote.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{quote.lines.length}</TableCell>
                        <TableCell className="font-semibold">
                          {quote.total ? `₦${quote.total.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Message">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No quotes yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW USERS TAB */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>New Users</CardTitle>
                  <CardDescription>
                    Monitor user signups and onboarding status
                  </CardDescription>
                </div>
                <Badge>{stats.newUsersThisWeek} this week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newUsers.length > 0 ? (
                    newUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.companyName || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.emailVerified ? 'verified' : 'pending_verification')}>
                            {user.emailVerified ? '✓ Verified' : '◯ Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin
                            ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No new users
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEWSLETTER TAB */}
        <TabsContent value="newsletter" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Newsletter Subscribers</CardTitle>
                  <CardDescription>
                    Manage your email subscribers
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Unsubscribed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletterSubscribers.length > 0 ? (
                    newsletterSubscribers.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sub.status)}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(sub.subscribedAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.unsubscribedAt ? format(new Date(sub.unsubscribedAt), 'MMM dd, yyyy HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No subscribers yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMS TAB */}
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>
                Track all form submissions from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formSubmissions.length > 0 ? (
                    formSubmissions.map((submission) => {
                      const data = submission.data as any;
                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.formType}</TableCell>
                          <TableCell>{data?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-sm">{data?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No form submissions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
              <CardDescription>
                System-wide event tracking and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Analytics charts coming soon</p>
                <p className="text-sm">Event visualization dashboard will be available shortly</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
