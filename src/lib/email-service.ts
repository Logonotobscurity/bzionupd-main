/**
 * Email Service
 * Handles sending emails for authentication flows using Resend SMTP
 * Documentation: https://resend.com/docs/send-with-smtp
 */

import nodemailer from 'nodemailer';

const emailFrom = process.env.EMAIL_FROM || 'noreply@bzion.com';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'BZION B2B Platform';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bzion.com';

/**
 * Resend SMTP Configuration
 * Uses Resend's SMTP server with your API key as password
 * 
 * Benefits:
 * - Works with existing SMTP tooling
 * - Supports SMTP clients and libraries
 * - Same reliability as REST API
 * - Full Resend features (analytics, webhooks, etc.)
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true, // TLS
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend SMTP
 * 
 * Resend SMTP provides:
 * - 100 emails/day free tier
 * - Production-ready infrastructure
 * - Built-in authentication & security
 * - Email analytics
 * - Webhooks for delivery tracking
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Skip sending in development if API key not configured
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      console.log('📧 Email (development mode - Resend SMTP):', {
        to: options.to,
        subject: options.subject,
        from: emailFrom,
      });
      return true;
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured in environment variables');
      return false;
    }

    const result = await transporter.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('✅ Email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .warning { color: #d97706; font-size: 14px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Password Reset Request</p>
          </div>

          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">
              ${resetLink}
            </p>

            <div class="warning">
              ⚠️ This link will expire in 1 hour for security reasons.
            </div>

            <p>If you didn't request a password reset, please ignore this email or <a href="mailto:support@bzion.com">contact support</a> immediately.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>
              <a href="${appUrl}">Visit Website</a> | 
              <a href="mailto:support@bzion.com">Support</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Password Reset Request

    Hello,

    We received a request to reset the password for your account associated with ${email}.

    To reset your password, visit this link:
    ${resetLink}

    This link will expire in 1 hour.

    If you didn't request a password reset, please ignore this email.

    © ${new Date().getFullYear()} ${appName}
  `;

  return sendEmail({
    to: email,
    subject: `Password Reset Request - ${appName}`,
    html,
    text,
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  const verifyLink = `${appUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .warning { color: #d97706; font-size: 14px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Welcome! Verify Your Email</p>
          </div>

          <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up for ${appName}! To complete your account setup, please verify your email address.</p>
            
            <p>Click the button below to verify your email:</p>
            
            <a href="${verifyLink}" class="button">Verify Email Address</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">
              ${verifyLink}
            </p>

            <div class="warning">
              ⏰ This link will expire in 24 hours.
            </div>

            <p>If you didn't create this account, please ignore this email or <a href="mailto:support@bzion.com">contact support</a>.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>
              <a href="${appUrl}">Visit Website</a> | 
              <a href="mailto:support@bzion.com">Support</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome! Verify Your Email

    Hello,

    Thank you for signing up for ${appName}! To complete your account setup, please verify your email address.

    Visit this link to verify your email:
    ${verifyLink}

    This link will expire in 24 hours.

    If you didn't create this account, please ignore this email.

    © ${new Date().getFullYear()} ${appName}
  `;

  return sendEmail({
    to: email,
    subject: `Verify Your Email - ${appName}`,
    html,
    text,
  });
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<boolean> {
  const name = firstName ? ` ${firstName}` : '';
  const loginLink = `${appUrl}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          ul { line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Welcome to ${appName}!</p>
          </div>

          <div class="content">
            <p>Hello${name},</p>
            <p>Your account has been successfully created. We're excited to have you on board!</p>
            
            <h3>Getting Started:</h3>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Request quotes from suppliers</li>
              <li>Manage your orders and payments</li>
              <li>Track shipments in real-time</li>
            </ul>

            <p>
              <a href="${loginLink}" class="button">Login to Your Account</a>
            </p>

            <h3>Need Help?</h3>
            <p>Our support team is here to assist you. Don't hesitate to reach out:</p>
            <ul>
              <li>Email: <a href="mailto:support@bzion.com">support@bzion.com</a></li>
              <li>Phone: +1 (234) 567-8900</li>
              <li>Chat: Available on our website</li>
            </ul>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>
              <a href="${appUrl}">Visit Website</a> | 
              <a href="mailto:support@bzion.com">Support</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to ${appName}!

    Hello${name},

    Your account has been successfully created. We're excited to have you on board!

    Getting Started:
    - Browse our extensive product catalog
    - Request quotes from suppliers
    - Manage your orders and payments
    - Track shipments in real-time

    Login to your account: ${loginLink}

    Need Help?
    Our support team is here to assist you:
    - Email: support@bzion.com
    - Phone: +1 (234) 567-8900

    © ${new Date().getFullYear()} ${appName}
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${appName}!`,
    html,
    text,
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(email: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .success { color: #10b981; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p class="success">✓ Password Changed Successfully</p>
          </div>

          <div class="content">
            <p>Hello,</p>
            <p>Your password has been successfully changed. You can now log in with your new password.</p>
            
            <p>If you didn't make this change or suspect any unauthorized activity, please <a href="mailto:support@bzion.com">contact support</a> immediately.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Password Changed Successfully

    Hello,

    Your password has been successfully changed. You can now log in with your new password.

    If you didn't make this change, please contact support immediately.

    © ${new Date().getFullYear()} ${appName}
  `;

  return sendEmail({
    to: email,
    subject: `Password Changed - ${appName}`,
    html,
    text,
  });
}
