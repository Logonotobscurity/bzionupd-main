/**
 * Reset Password Endpoint
 * Completes the password reset process using a reset token
 * 
 * Endpoint: POST /api/auth/reset-password
 * Body: { token: string, password: string, confirmPassword: string }
 * Response: { success: boolean, message: string }
 * 
 * Validation:
 * - Token must be valid and not expired
 * - Passwords must match
 * - Password must meet strength requirements
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '@/lib/email-service';

// In-memory token storage (must match forgot-password endpoint)
const tokenStore = new Map<string, { userId: number; email: string; expiresAt: Date }>();

// Password validation rules
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      valid: false, 
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` 
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      message: 'Password must contain uppercase, lowercase, number, and special character' 
    };
  }

  return { valid: true };
}

export async function POST(req: Request) {
  try {
    const { token, password, confirmPassword } = await req.json();

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid reset token' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Find and validate reset token
    const tokenData = tokenStore.get(token);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (tokenData.expiresAt < new Date()) {
      tokenStore.delete(token);
      return NextResponse.json(
        { success: false, message: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      );
    }

    const userId = tokenData.userId;

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    // Delete the reset token (one-time use)
    tokenStore.delete(token);

    // Send password changed confirmation email
    try {
      await sendPasswordChangedEmail(user.email);
      console.log('✅ Password changed email sent to', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password changed email:', emailError);
      // Don't fail the reset if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while resetting your password' 
      },
      { status: 500 }
    );
  }
}
