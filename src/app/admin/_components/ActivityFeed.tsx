'use client';

import { Mail, Package, ShoppingCart, Users, FileText, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityEvent } from '../_actions/activities';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'quote_request':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'checkout':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case 'newsletter_signup':
        return <Mail className="h-5 w-5 text-orange-500" />;
      case 'form_submission':
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'user_registration':
        return 'New User Registration';
      case 'quote_request':
        return 'Quote Request';
      case 'checkout':
        return 'Checkout Completed';
      case 'newsletter_signup':
        return 'Newsletter Signup';
      case 'form_submission':
        return 'Form Submission';
      default:
        return 'Activity';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending_verification: { variant: 'outline', label: 'Pending' },
      verified: { variant: 'default', label: 'Verified' },
      draft: { variant: 'secondary', label: 'Draft' },
      pending: { variant: 'outline', label: 'Pending Review' },
      negotiating: { variant: 'secondary', label: 'Negotiating' },
      accepted: { variant: 'default', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      completed: { variant: 'default', label: 'Completed' },
      active: { variant: 'default', label: 'Active' },
      new: { variant: 'outline', label: 'New' },
      read: { variant: 'secondary', label: 'Read' },
      responded: { variant: 'default', label: 'Responded' },
    };

    const config = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-muted p-2">{getIcon(activity.type)}</div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-12 bg-muted my-2" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 pb-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{getTypeLabel(activity.type)}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.actor.name || activity.actor.email}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </div>
              </div>

              {/* Activity details */}
              <div className="text-sm text-muted-foreground space-y-1">
                {activity.data.message && <p>{activity.data.message}</p>}
                
                <div className="flex flex-wrap gap-2 items-center">
                  {activity.data.reference && (
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {activity.data.reference}
                    </span>
                  )}
                  
                  {activity.data.formType && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      Form: {activity.data.formType}
                    </span>
                  )}
                  
                  {activity.data.items && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {activity.data.items} items
                    </span>
                  )}
                  
                  {activity.data.amount && (
                    <span className="text-xs font-semibold bg-muted px-2 py-1 rounded">
                      ₦{activity.data.amount?.toLocaleString()}
                    </span>
                  )}

                  {getStatusBadge(activity.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
