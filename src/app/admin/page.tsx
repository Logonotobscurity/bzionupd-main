import {
  getRecentActivities,
  getActivityStats,
  getQuotes,
  getNewUsers,
  getNewsletterSubscribers,
  getFormSubmissions,
} from './_actions/activities';
import AdminDashboardClient from './_components/AdminDashboardClient';

export default async function AdminPage() {
  // Fetch all data in parallel with individual error handling
  // Use Promise.allSettled so one slow query doesn't block all others
  const results = await Promise.allSettled([
    getRecentActivities(50),
    getActivityStats(),
    getQuotes(undefined, 20),
    getNewUsers(20),
    getNewsletterSubscribers(20),
    getFormSubmissions(20),
  ]);

  // Extract results with fallbacks
  const activities = results[0].status === 'fulfilled' ? results[0].value : [];
  const stats = results[1].status === 'fulfilled' ? results[1].value : {
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    totalNewsletterSubscribers: 0,
    totalFormSubmissions: 0,
    totalCheckouts: 0,
  };
  const quotes = results[2].status === 'fulfilled' ? results[2].value : [];
  const newUsers = results[3].status === 'fulfilled' ? results[3].value : [];
  const newsletterSubscribers = results[4].status === 'fulfilled' ? results[4].value : [];
  const formSubmissions = results[5].status === 'fulfilled' ? results[5].value : [];

  return (
    <AdminDashboardClient
      stats={stats}
      activities={activities}
      quotes={quotes}
      newUsers={newUsers}
      newsletterSubscribers={newsletterSubscribers}
      formSubmissions={formSubmissions}
    />
  );
}
