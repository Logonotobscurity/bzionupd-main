import { NextResponse } from 'next/server';
import {
  getRecentActivities,
  getActivityStats,
  getQuotes,
  getNewUsers,
  getNewsletterSubscribers,
  getFormSubmissions,
} from '@/app/admin/_actions/activities';

/**
 * GET /api/admin/dashboard-data
 * Fetch fresh dashboard data for real-time updates
 */
export async function GET(request: Request) {
  try {
    // Check authorization (you should add proper auth here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, allow requests from localhost
      const url = new URL(request.url);
      if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Fetch all data in parallel
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

    return NextResponse.json(
      {
        stats,
        activities,
        quotes,
        newUsers,
        newsletterSubscribers,
        formSubmissions,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
