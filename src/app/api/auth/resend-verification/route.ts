/**
 * Resend Verification Email Endpoint
 * POST /api/auth/resend-verification
 * 
 * Resends verification email to user
 * Includes rate limiting and eligibility checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createVerificationToken, canResendVerification, getUserFromVerificationToken } from '@/lib/email-verification';
import { sendEmailVerificationEmail } from '@/lib/email-service';
import { checkRateLimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/db';

const resendVerificationSchema = z.object({
  token: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
}).refine(
  (data) => data.token || data.email,
  'Either token or email must be provided'
);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting per IP (prevent abuse)
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
    const validation = resendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map(e => e.message).join(', '),
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    let user;
    const { token, email } = validation.data;

    // Get user from token if provided
    if (token) {
      user = await getUserFromVerificationToken(token);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 400, headers: rateLimitHeaders }
        );
      }
    } else if (email) {
      // Get user from email
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, emailVerified: true },
      });

      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json(
          { success: true, message: 'If an account exists, a verification email has been sent.' },
          { status: 200, headers: rateLimitHeaders }
        );
      }

      // Check if already verified
      if (user.emailVerified !== null) {
        return NextResponse.json(
          { success: false, error: 'Email is already verified' },
          { status: 400, headers: rateLimitHeaders }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    // Check if user can resend verification
    const canResend = await canResendVerification(user.id);

    if (!canResend) {
      return NextResponse.json(
        { success: false, error: 'Please wait before requesting another verification email' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Create new verification token
    const verificationToken = await createVerificationToken(user.id, user.email);

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to create verification token' },
        { status: 500, headers: rateLimitHeaders }
      );
    }

    // Send verification email
    const emailSent = await sendEmailVerificationEmail(user.email, verificationToken);

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent. Please check your inbox.',
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

    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
