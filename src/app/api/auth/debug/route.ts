import { auth } from '~/auth';
import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check auth configuration
 * This helps verify that NextAuth is properly configured on Netlify
 */
export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      status: 'ok',
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      },
      session: session ? 'authenticated' : 'not authenticated',
      message: 'Auth is configured and responding',
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error',
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      },
    }, { status: 500 });
  }
}
