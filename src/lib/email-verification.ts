/**
 * Email Verification System
 * Handles email verification tokens and verification flow
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): {
  token: string;
  hash: string;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Create a verification token for a user
 * Returns the token to be sent via email
 */
export async function createVerificationToken(
  userId: number,
  email: string
): Promise<string | null> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error('User not found for verification:', userId);
      return null;
    }

    // Invalidate previous verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Generate token
    const { token, hash } = generateVerificationToken();

    // Store hash in database with expiry
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        email: email || user.email,
        tokenHash: hash,
        expiresAt,
      },
    });

    console.log(`Verification token created for ${email || user.email}`);
    return token; // Return actual token to send via email
  } catch (error) {
    console.error('Failed to create verification token:', error);
    return null;
  }
}

/**
 * Verify an email using the token
 * Returns true if successful, false if token invalid/expired
 */
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }

    // Hash the provided token to compare with stored hash
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    // Find token in database
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!verificationToken) {
      console.warn('Invalid verification token');
      return false;
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      console.warn('Verification token has expired');
      return false;
    }

    // Check if already verified
    if (verificationToken.verifiedAt !== null) {
      console.warn('Email already verified with this token');
      return false;
    }

    // Mark email as verified
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    console.log(`Email verified for user: ${verificationToken.user.email}`);
    return true;
  } catch (error) {
    console.error('Email verification failed:', error);
    return false;
  }
}

/**
 * Check if user email is verified
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    return user?.emailVerified !== null;
  } catch (error) {
    console.error('Failed to check email verification:', error);
    return false;
  }
}

/**
 * Mark email as verified (without token)
 * Used by admins or internal operations
 */
export async function markEmailAsVerified(userId: number): Promise<boolean> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
      select: { id: true, email: true },
    });

    if (user) {
      console.log(`Email verified for user: ${user.email}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to mark email as verified:', error);
    return false;
  }
}

/**
 * Resend verification email to user
 * Only allow if email not verified and within retry limits
 */
export async function canResendVerification(userId: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, createdAt: true },
    });

    if (!user) {
      return false;
    }

    // Already verified
    if (user.emailVerified !== null) {
      return false;
    }

    // Allow resend after 60 seconds from last request
    const lastToken = await prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (lastToken) {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      if (lastToken.createdAt > sixtySecondsAgo) {
        return false; // Too soon after last request
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to check resend verification eligibility:', error);
    return false;
  }
}

/**
 * Get user from verification token (for display on verify page)
 */
export async function getUserFromVerificationToken(
  token: string
): Promise<{ id: number; email: string } | null> {
  try {
    if (!token) {
      return null;
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hash },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!verificationToken) {
      return null;
    }

    // Check if token has expired or already verified
    if (
      verificationToken.expiresAt < new Date() ||
      verificationToken.verifiedAt !== null
    ) {
      return null;
    }

    return verificationToken.user;
  } catch (error) {
    console.error('Failed to get user from verification token:', error);
    return null;
  }
}

/**
 * Clean up expired verification tokens
 * Call periodically (e.g., via cron job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    // This is simplified - implement based on your VerificationToken schema
    console.log('Cleaning up expired tokens...');
    return 0;
  } catch (error) {
    console.error('Failed to cleanup tokens:', error);
    return 0;
  }
}
