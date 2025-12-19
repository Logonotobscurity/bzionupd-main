import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserActivities } from '@/lib/activity-service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id, 10) : session.user.id;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const activities = await getUserActivities(userId, limit);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('[USER_ACTIVITIES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
