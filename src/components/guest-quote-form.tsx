'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Building2, Send } from 'lucide-react';

const guestQuoteSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(1, { message: 'Phone number is required.' }),
  company: z.string().optional(),
  productSku: z.string().min(1, { message: 'Product SKU or name is required.' }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
  message: z.string().optional(),
});

type GuestQuoteFormValues = z.infer<typeof guestQuoteSchema>;

export function GuestQuoteForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<GuestQuoteFormValues>({
    resolver: zodResolver(guestQuoteSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      productSku: '',
      quantity: 1,
      message: '',
    },
  });

  const onSubmit = async (data: GuestQuoteFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          company: data.company,
          message: `Product: ${data.productSku}, Quantity: ${data.quantity}${data.message ? `, Notes: ${data.message}` : ''}`,
          items: [
            {
              id: data.productSku,
              name: data.productSku,
              quantity: data.quantity,
            },
          ],
        }),
      });

      if (response.ok) {
        toast({
          title: 'Quote Request Submitted!',
          description: 'We will contact you within 24 hours with pricing details.',
        });
        setSubmitted(true);
        form.reset();
        // Reset submitted state after 3 seconds
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit quote request. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-bold text-green-900 mb-2">Quote Request Sent!</h3>
          <p className="text-sm text-green-700">Thank you for your interest. Our sales team will reach out shortly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b-2 border-primary/10">
        <CardTitle className="text-xl font-bold">Request a Quote (Guest)</CardTitle>
        <p className="text-sm text-slate-600 mt-2">Quick quote request for a specific product</p>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          className="rounded-lg border-2 border-slate-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="rounded-lg border-2 border-slate-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@company.com"
                        className="rounded-lg border-2 border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+234 (0) 123 456 7890"
                        className="rounded-lg border-2 border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      Company <span className="text-slate-500 font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Company Ltd."
                        className="rounded-lg border-2 border-slate-300"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Information */}
            <div className="space-y-4 border-t-2 border-slate-200 pt-6">
              <h3 className="font-bold text-slate-900">Product Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productSku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Product SKU or Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., SKU-12345 or Product Name"
                          className="rounded-lg border-2 border-slate-300"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          className="rounded-lg border-2 border-slate-300"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Additional Notes <span className="text-slate-500 font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Any specific requirements or special requests..."
                        className="w-full rounded-lg border-2 border-slate-300 p-3 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/90 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : '📧 Submit Quote Request'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
