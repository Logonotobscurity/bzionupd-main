'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, ShoppingCart, Mail, MailOpen, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  stats: {
    totalUsers: number;
    newUsersThisWeek: number;
    totalQuotes: number;
    pendingQuotes: number;
    totalNewsletterSubscribers: number;
    totalFormSubmissions: number;
    totalCheckouts: number;
  };
}

export function MetricsCards({ stats }: MetricsCardsProps) {
  const metrics = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      change: `+${stats.newUsersThisWeek} this week`,
    },
    {
      title: 'Quote Requests',
      value: stats.totalQuotes,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      change: `${stats.pendingQuotes} pending`,
    },
    {
      title: 'Checkouts',
      value: stats.totalCheckouts,
      icon: ShoppingCart,
      color: 'bg-green-100 text-green-600',
      change: 'Recent orders',
    },
    {
      title: 'Newsletter Subscribers',
      value: stats.totalNewsletterSubscribers,
      icon: Mail,
      color: 'bg-orange-100 text-orange-600',
      change: 'Active subscribers',
    },
    {
      title: 'Form Submissions',
      value: stats.totalFormSubmissions,
      icon: MailOpen,
      color: 'bg-red-100 text-red-600',
      change: 'Inquiries & requests',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
