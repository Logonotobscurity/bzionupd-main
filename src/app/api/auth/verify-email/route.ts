/**
 * Email Verification Endpoint
 * POST /api/auth/verify-email
 * 
 * Verifies user email using verification token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmail, getUserFromVerificationToken } from '@/lib/email-verification';
import { checkRateLimit } from '@/lib/ratelimit';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (prevent brute force)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success: rateLimitSuccess, headers: rateLimitHeaders } = await checkRateLimit(ip, 'auth');

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = verifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification token',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { token } = validation.data;

    // Get user from token first (validates without consuming)
    const user = await getUserFromVerificationToken(token);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification token',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // Verify the email token
    const verified = await verifyEmail(token);

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify email. Token may have already been used.',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        email: user.email,
        message: 'Email verified successfully. You can now log in.',
      },
      { status: 200, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
        },
        { status: 400 }
      );
    }

    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
