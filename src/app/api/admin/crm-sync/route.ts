import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/config';

/**
 * GET /api/admin/crm-sync
 * Returns CRM sync data for the admin dashboard
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data in parallel for performance
    const [
      leads,
      forms,
      subscribers,
      unreadNotifications,
      totalLeads,
      totalForms,
      totalSubscribers,
    ] = await Promise.all([
      // Last 50 leads
      prisma.lead.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          status: true,
          leadScore: true,
          createdAt: true,
        },
      }),
      // Last 50 form submissions
      prisma.formSubmission.findMany({
        take: 50,
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          formType: true,
          data: true,
          status: true,
          submittedAt: true,
        },
      }),
      // Last 50 newsletter subscribers
      prisma.newsletterSubscriber.findMany({
        take: 50,
        orderBy: { subscribedAt: 'desc' },
        select: {
          id: true,
          email: true,
          source: true,
          subscribedAt: true,
        },
      }),
      // Unread notifications for BZION_HUB
      prisma.crmNotification.findMany({
        where: {
          read: false,
          targetSystem: 'BZION_HUB',
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          priority: true,
          read: true,
          createdAt: true,
        },
      }),
      // Count total leads
      prisma.lead.count(),
      // Count total form submissions
      prisma.formSubmission.count(),
      // Count total newsletter subscribers
      prisma.newsletterSubscriber.count(),
    ]);

    // Extract email from form submission data
    const formsWithEmail = forms.map((form) => {
      // Safely cast JSON data to access email property
      const formData = (form.data as Record<string, unknown>) || {};
      return {
        ...form,
        email: (formData.email as string) || (formData.mail as string) || 'N/A',
      };
    });

    // Calculate conversion rate (converted leads / total leads)
    const convertedLeads = leads.filter((l) => l.status !== 'NEW').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const stats = {
      totalLeads,
      totalForms,
      totalSubscribers,
      unreadNotifications: unreadNotifications.length,
      conversionRate,
    };

    return NextResponse.json({
      stats,
      leads,
      forms: formsWithEmail,
      subscribers,
      notifications: unreadNotifications,
    });
  } catch (error) {
    console.error('CRM sync dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM sync data' },
      { status: 500 }
    );
  }
}
