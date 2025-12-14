import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/ratelimit';
import {
  VALID_FORM_TYPES,
  LEAD_SCORE_MAP,
  getLeadTypeForFormType,
  getNotificationPriority,
} from '@/lib/constants/form-types';

const formSubmissionSchema = z.object({
  formType: z.enum(VALID_FORM_TYPES, {
    errorMap: () => ({
      message: `formType must be one of: ${VALID_FORM_TYPES.join(', ')}`,
    }),
  }),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  // Allow additional fields
  metadata: z.record(z.any()).optional(),
});

type FormSubmissionData = z.infer<typeof formSubmissionSchema>;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success: rateLimitSuccess, headers: rateLimitHeaders } = await checkRateLimit(ip, 'api');

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many form submissions. Please try again later.' },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = formSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors.map(e => e.message).join(', '),
        },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const { formType, email, name, companyName, phone, message, metadata } = validation.data;

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.log('Form submission (no DB):', { formType, email });
      return NextResponse.json(
        {
          success: true,
          message: 'Form submitted successfully',
        },
        { status: 200, headers: rateLimitHeaders }
      );
    }

    // Extract IP and user agent
    const userAgent = request.headers.get('user-agent') || '';

    // Prepare form submission data
    const formSubmissionData = {
      formType,
      data: {
        email,
        name,
        companyName,
        phone,
        message,
        ...metadata,
      },
      ipAddress: ip,
      userAgent,
      status: 'NEW' as const,
    };

    // Calculate lead score based on form type
    const leadScore = LEAD_SCORE_MAP[formType] || 50;
    const notificationPriority = getNotificationPriority(leadScore);

    // Create all records in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create form submission record
      const formSubmission = await tx.formSubmission.create({
        data: formSubmissionData,
      });

      // 2. Create lead record for CRM
      const lead = await tx.lead.create({
        data: {
          email,
          name,
          companyName,
          phone,
          type: getLeadTypeForFormType(formType),
          source: 'web_form',
          status: 'NEW',
          leadScore,
          metadata: {
            formSubmissionId: formSubmission.id,
            formType,
            ...metadata,
          },
        },
      });

      // 3. Create CRM notification for BZION_HUB
      const notification = await tx.crmNotification.create({
        data: {
          type: 'NEW_FORM_SUBMISSION',
          targetSystem: 'BZION_HUB',
          priority: notificationPriority,
          data: {
            formSubmissionId: formSubmission.id,
            leadId: lead.id,
            formType,
            email,
            name,
            companyName,
            phone,
            leadScore,
            submittedAt: new Date().toISOString(),
            ipAddress: ip,
          },
        },
      });

      return { formSubmission, lead, notification };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Form submitted successfully',
      },
      { status: 201, headers: rateLimitHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Form submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
