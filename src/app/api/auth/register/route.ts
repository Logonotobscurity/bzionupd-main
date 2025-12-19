
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { sendEmailVerificationEmail, sendWelcomeEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, companyName } = await req.json();

    // Allow firstName to be empty if sent without lastName (full name handling)
    const finalFirstName = firstName?.trim() || '';
    const finalLastName = lastName?.trim() || '';

    if (!finalFirstName && !finalLastName) {
      return NextResponse.json({ message: 'First name or last name is required' }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName: finalFirstName || null,
        lastName: finalLastName || null,
        email,
        hashedPassword,
        companyName: companyName?.trim() || null,
      },
    });

    // Send verification email (async - non-blocking)
    try {
      await sendEmailVerificationEmail(email, 'verify-token');
      console.log('✅ Verification email sent to', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Send welcome email (async - non-blocking)
    try {
      await sendWelcomeEmail(email, finalFirstName);
      console.log('✅ Welcome email sent to', email);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({ 
      message: 'User created successfully. Check your email for verification.', 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
