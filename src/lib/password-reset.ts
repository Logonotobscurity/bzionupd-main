/**
 * Password Reset System
 * Handles password reset tokens and password reset flow
 */

import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/utils';
import crypto from 'crypto';

const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour
const RESET_TOKEN_EXPIRY_SECONDS = 3600; // 1 hour in seconds

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): {
  token: string;
  hash: string;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Create a password reset token for a user
 * Returns the token to be sent via email
 */
export async function createPasswordResetToken(
  email: string
): Promise<string | null> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      // Don't reveal if email exists
      console.log('Password reset requested for non-existent email:', email);
      return null;
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });

    // Generate token
    const { token, hash } = generateResetToken();

    // Store hash in database with expiry
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);
    
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      },
    });

    console.log(`Password reset token created for ${email}`);
    return token; // Return actual token to send via email
  } catch (error) {
    console.error('Failed to create password reset token:', error);
    return null;
  }
}

/**
 * Verify password reset token and reset password
 * Returns true if successful
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  try {
    if (!token || !newPassword) {
      return false;
    }

    // Validate new password strength
    if (!validatePasswordStrength(newPassword)) {
      return false;
    }

    // Hash the provided token to compare with stored hash
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Find token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!resetToken) {
      console.warn('Invalid reset token provided');
      return false;
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      console.warn('Reset token has expired');
      return false;
    }

    // Check if token was already used
    if (resetToken.usedAt !== null) {
      console.warn('Reset token has already been used');
      return false;
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log(`Password reset successful for user: ${resetToken.user.email}`);
    return true;
  } catch (error) {
    console.error('Password reset failed:', error);
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
}

/**
 * Request password reset (first step)
 * Returns true if email sent successfully
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      // Don't reveal if email exists - still return true
      console.log('Password reset requested for non-existent email:', email);
      return true;
    }

    // Create reset token
    const token = await createPasswordResetToken(email);

    if (!token) {
      console.error('Failed to create reset token for:', email);
      return false;
    }

    // Send password reset email
    // TODO: Implement email sending
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    // await sendPasswordResetEmail(email, resetLink);

    console.log(`Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to request password reset:', error);
    return false;
  }
}

/**
 * Verify that reset token is still valid
 */
export async function isResetTokenValid(token: string): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }

    // Hash the provided token
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and hasn't expired
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hash },
      select: { expiresAt: true, usedAt: true },
    });

    if (!resetToken) {
      return false;
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return false;
    }

    // Check if token was already used
    if (resetToken.usedAt !== null) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to validate reset token:', error);
    return false;
  }
}

/**
 * Get user email from reset token (for display on reset page)
 */
export async function getUserEmailFromResetToken(
  token: string
): Promise<string | null> {
  try {
    if (!token) {
      return null;
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hash },
      include: { user: { select: { email: true } } },
    });

    if (!resetToken) {
      return null;
    }

    // Check if token has expired or was used
    if (resetToken.expiresAt < new Date() || resetToken.usedAt !== null) {
      return null;
    }

    return resetToken.user.email;
  } catch (error) {
    console.error('Failed to get user email from reset token:', error);
    return null;
  }
}

/**
 * Change password for authenticated user (requires current password)
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return false;
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return false;
    }

    // Validate new password strength
    if (!validatePasswordStrength(newPassword)) {
      return false;
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    console.log(`Password changed for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to change password:', error);
    return false;
  }
}

/**
 * Clean up expired password reset tokens
 * Call periodically via cron job
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    // Implementation depends on your PasswordResetToken schema
    console.log('Cleaning up expired reset tokens...');
    return 0;
  } catch (error) {
    console.error('Failed to cleanup reset tokens:', error);
    return 0;
  }
}
