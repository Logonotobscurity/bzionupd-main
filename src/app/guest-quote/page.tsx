import { Metadata } from 'next';
import { GuestQuoteForm } from '@/components/guest-quote-form';
import { Section } from '@/components/ui/section';
import { MessageSquare, CheckCircle, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Request a Quote - BZION',
  description: 'Request a quick quote for products without creating an account',
};

export default function GuestQuotePage() {
  return (
    <main className="flex-grow bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      <Section className="py-12 md:py-20">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Quick Quote Request
          </h1>
          <p className="text-base md:text-lg text-slate-600">
            Get a quote for any product quickly—no account needed. Our sales team will respond within 24 hours.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border-2 border-secondary/20 shadow-md hover:shadow-lg hover:border-secondary/40 transition-all">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Quick & Easy</h3>
            <p className="text-sm text-slate-600">Fill out a simple form and submit your quote request in seconds.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border-2 border-primary/20 shadow-md hover:shadow-lg hover:border-primary/40 transition-all">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No Account Needed</h3>
            <p className="text-sm text-slate-600">Guest checkout is supported—just provide your contact details.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border-2 border-green-500/20 shadow-md hover:shadow-lg hover:border-green-500/40 transition-all">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Fast Response</h3>
            <p className="text-sm text-slate-600">Our team will reach out within 24 hours with pricing and availability.</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <GuestQuoteForm />
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20">
          <h3 className="text-xl font-bold text-slate-900 mb-3">Need help?</h3>
          <p className="text-slate-600 mb-4">
            If you have questions or prefer to speak with someone directly, visit our{' '}
            <a href="/contact" className="text-primary hover:underline font-semibold">
              contact page
            </a>{' '}
            or call our sales team.
          </p>
        </div>
      </Section>
    </main>
  );
}
