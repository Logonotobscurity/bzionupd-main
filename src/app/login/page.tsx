'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn('email', { email, redirect: false });

      toast({
        title: 'Magic Link Sent',
        description: 'Check your email for a link to log in.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900'>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Login</h1>
          <p className='text-gray-500 dark:text-gray-400'>Enter your email to receive a magic link.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='m@example.com'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>

        <p className='text-sm text-center text-gray-500 dark:text-gray-400'>
          Don't have an account?{' '}
          <Link href='/register'>
            <span className='font-medium text-blue-600 hover:underline dark:text-blue-500'>
              Register
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
