import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/ratelimit';
import { signIn } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
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

    const { name, email, company } = validation.data;

    let exists;
    try {
      exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database service is temporarily unavailable. Please try again later.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
    if (exists) {
        // If the user already exists, we don't want to give away that information.
        // Instead, we'll just send a magic link to the existing user.
        await signIn('email', { email, redirect: false });
        return NextResponse.json(
            {
              success: true,
              message: 'If an account with this email exists, a magic link has been sent.',
            },
            { status: 200, headers }
          );
    }


    const user = await prisma.user.create({
      data: {
        firstName: name,
        email: email.toLowerCase(),
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

    await signIn('email', { email: user.email, redirect: false });

    return NextResponse.json(
      { 
        success: true, 
        userId: user.id,
        message: 'Registration successful! Please check your email for a magic link to log in.',
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
        return NextResponse.json(
          { 
            error: 'Database service is temporarily unavailable. Please try again later.',
            code: 'DB_CONNECTION_ERROR'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Registration failed due to a server error' }, 
      { status: 500 }
    );
  }
}
