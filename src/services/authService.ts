/**
 * Authentication Service
 * Centralizes auth business logic for register, login, password reset, etc.
 * Wraps Prisma, password hashing, token generation, and email sending
 */

import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { createVerificationToken, verifyEmail } from '@/lib/email-verification';
import { sendEmailVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email-service';

type UpdateUserInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export const createUser = async (email: string, password: string, firstName?: string, lastName?: string): Promise<User> => {
  const passwordHash = await bcryptjs.hash(password, 10);
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: 'customer',
    },
  });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

export const verifyPassword = async (passwordHash: string, password: string): Promise<boolean> => {
  return bcryptjs.compare(password, passwordHash);
};

export const updateUser = async (id: number, data: UpdateUserInput): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

/**
 * Register user with email and password
 */
export async function registerUserWithEmail(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  companyName?: string
): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        companyName,
        role: 'customer',
      },
    });

    // Create verification token and send email (non-blocking)
    try {
      const verificationToken = await createVerificationToken(user.id, user.email);
      if (verificationToken) {
        await sendEmailVerificationEmail(user.email, verificationToken);
        await sendWelcomeEmail(user.email, user.firstName || undefined);
      }
    } catch (emailError) {
      console.warn('Failed to send verification email:', emailError);
    }

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error('[registerUserWithEmail] error:', error);
    return {
      success: false,
      error: 'Registration failed',
    };
  }
}

/**
 * Initiate password reset
 */
/*
export async function initiatePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    const resetToken = await createPasswordResetToken(email);
    if (!resetToken) {
      console.error('Failed to create reset token for:', email);
      return { success: true };
    }

    const emailSent = await sendPasswordResetEmail(email, resetToken);
    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('[initiatePasswordReset] error:', error);
    return {
      success: false,
      error: 'Failed to process password reset',
    };
  }
}
*/

/**
 * Complete password reset
 */
/*
export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await resetPasswordWithToken(token, newPassword);

    if (!success) {
      return {
        success: false,
        error: 'Invalid or expired reset token',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[completePasswordReset] error:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}
*/

/**
 * Verify email with token
 */
export async function verifyUserEmail(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const success = await verifyEmail(token);

    if (!success) {
      return {
        success: false,
        error: 'Invalid or expired verification token',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[verifyUserEmail] error:', error);
    return {
      success: false,
      error: 'Failed to verify email',
    };
  }
}
