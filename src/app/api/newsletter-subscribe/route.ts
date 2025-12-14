import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/ratelimit';

const subscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('web'),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success: rateLimitSuccess, headers: rateLimitHeaders } = await checkRateLimit(ip, 'newsletter');
    
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many subscription requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const body = await request.json();
    const validation = subscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors.map(e => e.message).join(', ')
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { email, source, metadata } = validation.data;

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.log('Newsletter subscription (no DB):', { email, source });
      return NextResponse.json(
        { 
          success: true, 
          message: 'Successfully subscribed to newsletter',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // Check if already subscribed
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'You are already subscribed to our newsletter',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // Create newsletter subscriber record
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        source,
        status: 'ACTIVE',
        metadata,
      },
    });

    // Create associated lead record for CRM
    await prisma.lead.create({
      data: {
        email,
        type: 'NEWSLETTER',
        source,
        status: 'NEW',
        leadScore: 20,
        metadata,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to newsletter',
      },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
