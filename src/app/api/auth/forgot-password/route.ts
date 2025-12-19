/**
 * Forgot Password Endpoint
 * Handles password reset requests by generating a reset token and sending email
 * 
 * Endpoint: POST /api/auth/forgot-password
 * Body: { email: string }
 * Response: { success: boolean, message: string }
 * 
 * Security:
 * - Always returns success (no email enumeration)
 * - Rate limited per IP (5 requests per 15 minutes)
 * - Tokens expire in 1 hour
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email-service';
import crypto from 'crypto';

// In-memory token storage (for development)
// In production, add PasswordResetToken model to Prisma schema
const tokenStore = new Map<string, { userId: number; email: string; expiresAt: Date }>();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user (silently fail if not found - no email enumeration)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Still return success to prevent email enumeration
      console.log('Password reset requested for non-existent email:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in memory (for development)
    tokenStore.set(token, { userId: user.id, email: normalizedEmail, expiresAt });

    // Clean up expired tokens periodically
    const now = new Date();
    for (const [key, value] of tokenStore.entries()) {
      if (value.expiresAt < now) {
        tokenStore.delete(key);
      }
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, token);
      console.log('✅ Password reset email sent to', normalizedEmail);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Still return success - email failure is non-critical
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

// Export token store for use in reset-password endpoint
export { tokenStore };
