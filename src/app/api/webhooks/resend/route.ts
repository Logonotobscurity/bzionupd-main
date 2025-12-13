
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { type, data } = json;

    console.log(`[RESEND_WEBHOOK] Received event: ${type}`, data);

    // Here you can add logic to handle different event types
    // For example, update the status of an email in your database
    
    // Example:
    // if (type === 'email.delivered') {
    //   const { email_id } = data;
    //   await prisma.email.update({
    //     where: { resendId: email_id },
    //     data: { status: 'delivered' },
    //   });
    // }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('[RESEND_WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
