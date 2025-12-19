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
  // Fetch all data in parallel
  const [activities, stats, quotes, newUsers, newsletterSubscribers, formSubmissions] = await Promise.all([
    getRecentActivities(50),
    getActivityStats(),
    getQuotes(undefined, 20),
    getNewUsers(20),
    getNewsletterSubscribers(20),
    getFormSubmissions(20),
  ]);

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
