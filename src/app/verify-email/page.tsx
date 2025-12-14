'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Auto-verify token on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token provided');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setUserEmail(data.email || '');
          setIsVerified(true);
          toast({
            title: 'Success',
            description: 'Your email has been verified successfully!',
          });
        } else {
          const errorMessage = data.error || 'Failed to verify email';
          setError(errorMessage);
          setCanResend(true);
          
          // Check if error is about already verified or expired
          if (errorMessage.includes('expired')) {
            setCanResend(true);
          } else if (errorMessage.includes('already verified')) {
            setCanResend(false);
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Network error. Please try again.');
        setCanResend(true);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, toast]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResendVerification = async () => {
    if (!token) return;

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Verification email sent! Check your inbox.',
        });
        setResendCountdown(60); // 60 second cooldown
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to resend verification email',
        });
      }
    } catch (err) {
      console.error('Resend error:', err);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            <p className="text-gray-600 mt-2">Please wait a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-600 rounded-full opacity-10 animate-pulse"></div>
                  <CheckCircle className="w-16 h-16 text-green-600 relative" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-2">
                {userEmail && `Your email ${userEmail} has been verified.`}
              </p>
              <p className="text-gray-500 text-sm mb-8">
                You can now access all features of your account.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/account')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>

            {/* Security note */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-gray-700">
                <span className="font-semibold">✓ Email Verified:</span>
                {' '}Your account is now fully activated and ready to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Why did this happen?</span>
                {' '}Verification links expire after 24 hours, or may have already been used.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {canResend && !error.includes('already verified') && (
                <Button
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCountdown > 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {resendLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : 'Resend Verification Email'}
                </Button>
              )}
              <Button
                onClick={() => router.push('/register')}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Create New Account
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>

          {/* Help section */}
          <div className="mt-8 border-t pt-6">
            <p className="text-xs font-medium text-gray-600 mb-2">Need help?</p>
            <p className="text-xs text-gray-500">
              Contact our support team at{' '}
              <a href="mailto:support@bzion.com" className="text-blue-600 hover:underline">
                support@bzion.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
