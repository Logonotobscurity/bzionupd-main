'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface PasswordStrength {
  hasLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token provided');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email || '');
          setIsTokenValid(true);
        } else {
          setError('Invalid or expired reset link');
        }
      } catch (err) {
        console.error('Failed to validate token:', err);
        setError('Failed to validate reset link');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const checkPasswordStrength = (pwd: string) => {
    setPasswordStrength({
      hasLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
    });
  };

  const isPasswordValid = Object.values(passwordStrength).every(v => v);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = isPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('No reset token provided');
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: 'Error',
        description: 'Password does not meet all requirements',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Error',
        description: "Passwords don't match",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsReset(true);
        toast({
          title: 'Success',
          description: 'Your password has been reset successfully!',
        });
        // Redirect to login after 3 seconds
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const errorMessage = data.error || 'Failed to reset password';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900">Validating reset link...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
              <p className="text-gray-600 mb-2">
                {error || 'The password reset link is invalid or has expired.'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Reset links expire after 1 hour for security reasons.
              </p>
              <Button
                onClick={() => router.push('/forgot-password')}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
              >
                Request New Reset Link
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isReset) {
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
                Password Reset Successfully!
              </h1>
              <p className="text-gray-600 mb-2">
                Your password has been updated and you can now log in.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Redirecting to login page in a moment...
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Login Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your new password below. Make sure it's secure and meets all requirements.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email display */}
            <div>
              <p className="text-sm text-gray-600">Resetting password for:</p>
              <p className="text-sm font-medium text-gray-900">{userEmail}</p>
            </div>

            {/* Password field */}
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Password Requirements:</p>
                <div className="space-y-1">
                  {[
                    { met: passwordStrength.hasLength, label: 'At least 8 characters' },
                    { met: passwordStrength.hasUppercase, label: 'At least 1 uppercase letter (A-Z)' },
                    { met: passwordStrength.hasLowercase, label: 'At least 1 lowercase letter (a-z)' },
                    { met: passwordStrength.hasNumber, label: 'At least 1 number (0-9)' },
                  ].map((req, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                      <div
                        className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${
                          req.met
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {req.met && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm password field */}
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-2 ${
                  passwordsMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">🔒 Security Tip:</span>
              {' '}Use a unique, strong password that you don't use on other websites.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            <a href="mailto:support@bzion.com" className="hover:text-gray-300">
              Need help? Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
