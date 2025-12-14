import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/utils';
import { checkRateLimit } from '@/lib/ratelimit';
import { createVerificationToken } from '@/lib/email-verification';
import { sendEmailVerificationEmail, sendWelcomeEmail } from '@/lib/email-service';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  company: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success, headers } = await checkRateLimit(ip, 'auth');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, email, password, company } = validation.data;

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName: name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        companyName: company,
        role: 'customer',
      },
    });

    // Create corresponding Customer record for CRM (non-blocking)
    try {
      await prisma.customer.create({
        data: {
          externalId: String(user.id),
          source: 'B2B_PLATFORM',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          phone: user.phone,
          customerType: 'RETAILER',
          status: 'ACTIVE',
          metadata: {
            registeredVia: 'b2b-website',
            registrationDate: new Date().toISOString(),
          },
        },
      });
    } catch (customerError) {
      console.warn('Failed to create Customer record:', customerError);
      // Don't fail registration - User was already created successfully
    }

    // Create verification token and send email (non-blocking)
    try {
      const verificationToken = await createVerificationToken(user.id, user.email);
      
      if (verificationToken) {
        // Send verification email
        await sendEmailVerificationEmail(user.email, verificationToken);
        
        // Send welcome email
        await sendWelcomeEmail(user.email, user.firstName || undefined);
      } else {
        console.warn('Failed to create verification token for:', user.email);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration - User was already created successfully
    }

    return NextResponse.json(
      { 
        success: true, 
        userId: user.id,
        message: 'Registration successful! Please check your email to verify your account.',
      },
      { status: 201, headers }
    );
  } catch (error) {
    // Catch any other unexpected errors
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed due to a server error' }, { status: 500 });
  }
}

