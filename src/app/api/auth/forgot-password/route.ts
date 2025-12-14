/**
 * Forgot Password Endpoint
 * POST /api/auth/forgot-password
 * 
 * Initiates password reset flow
 * Sends reset link via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPasswordResetToken } from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { checkRateLimit } from '@/lib/ratelimit';
import { prisma } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (prevent email spam)
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
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map(e => e.message).join(', '),
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { email } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    // (don't reveal if email exists or not)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // Create password reset token
    const resetToken = await createPasswordResetToken(email);

    if (!resetToken) {
      console.error('Failed to create reset token for:', email);
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      },
      { status: 200, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
        },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

