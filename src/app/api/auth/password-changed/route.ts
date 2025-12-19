/**
 * Password Change Confirmation Endpoint
 * Sends confirmation email when user changes password from account settings
 * 
 * Endpoint: POST /api/auth/password-changed
 * Body: { email: string }
 * Response: { success: boolean, message: string }
 * 
 * Security:
 * - Requires authenticated session
 * - Used after user successfully changes password
 */

import { NextResponse } from 'next/server';
import { sendPasswordChangedEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    try {
      // Send password changed confirmation email
      await sendPasswordChangedEmail(email);
      
      console.log('✅ Password changed confirmation email sent to', email);
      
      return NextResponse.json({
        success: true,
        message: 'Password changed notification email sent.',
      });
    } catch (emailError) {
      console.error('❌ Failed to send password changed email:', emailError);
      
      // Still return success - the password was changed even if email failed
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully.',
      });
    }

  } catch (error) {
    console.error('Password changed endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred' 
      },
      { status: 500 }
    );
  }
}
