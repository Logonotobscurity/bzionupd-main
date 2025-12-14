/**
 * Validate Reset Token Endpoint
 * POST /api/auth/validate-reset-token
 * 
 * Validates password reset token without consuming it
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserEmailFromResetToken } from '@/lib/password-reset';
import { checkRateLimit } from '@/lib/ratelimit';

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success: rateLimitSuccess, headers: rateLimitHeaders } = await checkRateLimit(ip, 'auth');

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { token } = validation.data;

    // Get user email from token (validates token without consuming it)
    const email = await getUserEmailFromResetToken(token);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        email,
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

    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
