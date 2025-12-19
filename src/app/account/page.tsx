'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeAlert } from '@/components/auth/WelcomeAlert';

import { useAuthStore } from '@/stores/authStore';
import { useActivityStore } from '@/stores/activity';
import { Section } from '@/components/ui/section';
import {
  LogOut,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShoppingCart,
  Eye,
  Search,
  Edit2,
  Settings,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const LoadingSkeleton = () => (
    <>
      <div className="bg-gradient-to-b from-primary via-primary/95 to-primary/90 pt-20 pb-32 sm:pt-32 sm:pb-40">
        <Section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/20" />
              <div>
                <Skeleton className="h-9 w-48 mb-3 bg-primary/20" />
                <Skeleton className="h-5 w-32 bg-primary/20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full sm:w-32 bg-primary/20" />
          </div>
        </Section>
      </div>

      <Section className="py-8 sm:py-12 -mt-16 sm:-mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <Skeleton className="h-[400px] rounded-2xl" />
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
      </Section>
    </>
);

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { activities: storeActivities } = useActivityStore();
  const [isClient, setIsClient] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [dbActivities, setDbActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch database activities when session is ready
  useEffect(() => {
    if (session?.user?.id) {
      const fetchActivities = async () => {
        try {
          setLoadingActivities(true);
          const response = await fetch('/api/user/activities?limit=20');
          if (response.ok) {
            const data = await response.json();
            setDbActivities(data);
          }
        } catch (error) {
          console.error('Failed to fetch activities:', error);
        } finally {
          setLoadingActivities(false);
        }
      };

      fetchActivities();
    }
  }, [session?.user?.id]);

  // NOTE: Middleware (proxy.ts) handles authentication redirect to /login
  // This component is only reachable by authenticated users
  // No need for client-side auth checks - trust the proxy

  // Wait for session to load
  if (!isClient || status === 'loading') {
    return <LoadingSkeleton />;
  }

  // If no session, middleware should have redirected already
  if (!session?.user) {
    return <LoadingSkeleton />;
  }

  const user = session.user;

  const handleLogout = async () => {
    // Use NextAuth signOut instead of legacy logout
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // Transform database activities to match the Activity interface
  const transformedDbActivities = dbActivities.map((activity) => ({
    id: activity.id,
    type: activity.eventType === 'quote_request' ? 'quote' : 
          activity.eventType === 'login' ? 'view' :
          activity.eventType as any,
    title: activity.eventType === 'quote_request' ? 'Quote Request Submitted' :
           activity.eventType === 'login' ? 'Logged In' :
           activity.eventType === 'checkout' ? 'Checkout Completed' :
           activity.eventType === 'profile_update' ? 'Profile Updated' :
           activity.eventType === 'password_reset' ? 'Password Reset' :
           activity.eventType === 'email_verified' ? 'Email Verified' :
           activity.eventType === 'account_created' ? 'Account Created' :
           activity.eventType,
    description: activity.eventType === 'quote_request' ? 
      `Submitted quote request with ${activity.data?.itemCount || 0} items` :
      activity.eventType === 'login' ? 'Logged in to account' :
      activity.eventType === 'checkout' ? 'Completed checkout' :
      `Activity: ${activity.eventType}`,
    timestamp: new Date(activity.timestamp),
    metadata: activity.data,
    details: activity.data,
  }));

  // Merge store and database activities, sorted by timestamp
  const userActivities = [
    ...transformedDbActivities,
    ...storeActivities.map(a => ({ ...a, timestamp: new Date(a.timestamp) }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

  // Calculate stats from database activities
  const quoteRequestCount = dbActivities.filter((a) => a.eventType === 'quote_request').length;
  const loginCount = dbActivities.filter((a) => a.eventType === 'login').length;
  const checkoutCount = dbActivities.filter((a) => a.eventType === 'checkout').length;

  return (
    <>
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-primary/90 pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 opacity-60 blur-3xl"></div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>

        <Section className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-primary rounded-2xl opacity-0 group-hover:opacity-40 blur-lg transition-opacity"></div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-primary font-bold shadow-xl text-3xl sm:text-4xl">
                  {user.firstName?.[0]}{user.lastName?.[0] || user.name?.split(' ')[1]?.[0] || ''}
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.name || 'User'}
                </h1>
                <p className="text-primary-foreground/90 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-secondary"></span>
                  <span className="text-sm">Active Now</span>
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </Section>
      </div>

      {/* Main Content */}
      <Section className="py-8 sm:py-12 -mt-16 sm:-mt-20 relative z-20">
        {/* Welcome Alert */}
        {showWelcome && session?.user && (
          <WelcomeAlert
            firstName={session.user.firstName || session.user.name?.split(' ')[0] || 'User'}
            isNewUser={session.user.isNewUser}
            lastLogin={session.user.lastLogin}
            onDismiss={() => setShowWelcome(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
          {/* Stats Cards - Premium Style with Brand Colors */}
          <div className="group relative flex flex-col rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02] border border-secondary/20 hover:border-secondary/40">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary via-secondary/50 to-transparent opacity-0 group-hover:opacity-10 blur-lg transition-opacity"></div>
            <div className="absolute inset-px rounded-[15px] bg-white"></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-secondary/80">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-primary">Quote Requests</h3>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                  Live
                </span>
              </div>

              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs font-medium text-primary/60 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-primary">{quoteRequestCount}</p>
                <span className="text-xs font-medium text-secondary mt-2 block">+{Math.max(2, Math.floor(quoteRequestCount * 0.15))} this month</span>
              </div>
            </div>
          </div>

          <div className="group relative flex flex-col rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 hover:shadow-secondary/20 hover:scale-[1.02] border border-primary/20 hover:border-primary/40">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-0 group-hover:opacity-10 blur-lg transition-opacity"></div>
            <div className="absolute inset-px rounded-[15px] bg-white"></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-primary">Checkouts</h3>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  Active
                </span>
              </div>

              <div className="rounded-lg bg-secondary/5 p-4 border border-secondary/10">
                <p className="text-xs font-medium text-secondary/60 mb-1">Total Checkouts</p>
                <p className="text-3xl font-bold text-primary">{checkoutCount}</p>
                <span className="text-xs font-medium text-primary mt-2 block">+{Math.max(0, checkoutCount > 0 ? 1 : 0)} this month</span>
              </div>
            </div>
          </div>

          <div className="group relative flex flex-col rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 hover:shadow-accent/20 hover:scale-[1.02] border border-accent/20 hover:border-accent/40">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent via-secondary/50 to-transparent opacity-0 group-hover:opacity-10 blur-lg transition-opacity"></div>
            <div className="absolute inset-px rounded-[15px] bg-white"></div>
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-secondary/80">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-primary">Total Activity</h3>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  Track
                </span>
              </div>

              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs font-medium text-primary/60 mb-1">Actions Logged</p>
                <p className="text-3xl font-bold text-primary">{userActivities.length}</p>
                <span className="text-xs font-medium text-secondary mt-2 block">+{Math.max(1, Math.floor(userActivities.length * 0.1))} new today</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Activities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* User Details Sidebar */}
          <div className="group relative flex flex-col rounded-2xl bg-white shadow-2xl border border-primary/10 hover:border-primary/30 transition-all overflow-hidden">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary via-primary/50 to-transparent opacity-0 group-hover:opacity-5 blur-lg transition-opacity"></div>

            <div className="relative bg-gradient-to-r from-primary to-primary/95 border-b border-primary/20 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Account Details</h2>
            </div>

            <div className="relative p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                  <Mail className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-primary/60 font-medium">Email</p>
                    <p className="text-sm text-primary break-all font-medium mt-1">{user.email}</p>
                  </div>
                </div>

                {user.companyName && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-primary/60 font-medium">Company</p>
                      <p className="text-sm text-primary font-medium mt-1">{user.companyName}</p>
                    </div>
                  </div>
                )}

                {user.role && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/20">
                    <Building2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-secondary/60 font-medium">Role</p>
                      <p className="text-sm text-primary font-medium mt-1 capitalize">{user.role}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-primary/60 font-medium">Last Login</p>
                    <p className="text-sm text-primary font-medium mt-1">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-primary/10">
                <Button variant="outline" size="lg" className="w-full justify-center" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Activities Feed */}
          <div className="lg:col-span-2 group relative flex flex-col rounded-2xl bg-white shadow-2xl border border-primary/10 overflow-hidden transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary/50 to-transparent opacity-0 group-hover:opacity-5 blur-lg transition-opacity"></div>

            <div className="relative bg-gradient-to-r from-primary to-primary/95 border-b border-primary/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-secondary" />
                    Recent Activity
                  </h2>
                  <p className="text-xs text-primary-foreground/70 mt-1">Your latest platform interactions</p>
                </div>
                <span className="text-xs font-medium text-primary-foreground/80 px-3 py-1 rounded-full bg-primary/30 border border-primary-foreground/10">
                  {userActivities.length} activities
                </span>
              </div>
            </div>

            <div className="relative p-6 overflow-y-auto max-h-[500px]">
              {userActivities.length > 0 ? (
                <div className="space-y-3">
                  {userActivities.map((activity) => {
                    const details = activity.details || activity.metadata as Record<string, unknown> | undefined;
                    return (
                      <div
                        key={activity.id}
                        className="group/item p-4 rounded-lg bg-primary/5 border border-primary/10 hover:border-secondary/30 hover:bg-secondary/5 transition-all duration-200"
                      >
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-primary/80 group-hover/item:text-primary transition-colors">
                            {activity.type === 'quote' && <FileText className="w-5 h-5" />}
                            {activity.type === 'view' && <Eye className="w-5 h-5" />}
                            {activity.type === 'search' && <Search className="w-5 h-5" />}
                            {activity.type === 'purchase' && <ShoppingCart className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                              <h4 className="font-semibold text-sm text-primary">
                                {activity.title || activity.description}
                              </h4>
                              <span className="text-xs text-primary/50 whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.timestamp), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-primary/60">
                              {activity.description}
                            </p>
                            {details && (
                              <div className="mt-2 pt-2 border-t border-primary/10 text-xs text-primary/50 space-x-3 flex flex-wrap">
                                {details.items !== undefined && (
                                  <span>
                                    Items: <span className="text-primary/80 font-medium">{String(details.items)}</span>
                                  </span>
                                )}
                                {details.value !== undefined && (
                                  <span>
                                    Value: <span className="text-primary/80 font-medium">{String(details.value)}</span>
                                  </span>
                                )}
                                {details.results !== undefined && (
                                  <span>
                                    Results: <span className="text-primary/80 font-medium">{String(details.results)}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                  <p className="text-primary/60 font-medium">No activities yet</p>
                  <p className="text-xs text-primary/40 mt-1">
                    Your activities will appear here as you interact with the platform
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
