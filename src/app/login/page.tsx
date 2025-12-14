'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findImage } from '@/lib/placeholder-images';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { initializeMockActivities } from '@/stores/activity';

const loginImage = findImage('login-bg');

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoCredentials = [
    { email: 'demo@bzion.com', password: 'demo123', name: 'John Doe' },
    { email: 'test@bzion.com', password: 'test123', name: 'Jane Smith' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      initializeMockActivities();

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${email}!`,
      });
      router.push('/account');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-10rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 bg-gradient-to-br from-white via-white to-primary/5">
        <div className="mx-auto grid w-[450px] gap-6 p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/90 text-white shadow-2xl shadow-primary/30">
          <div className="grid gap-2 text-center">
            <div className="mx-auto mb-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-white/80">Sign in to your BZION account</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-12 text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 text-muted-foreground hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary" size="lg" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,0.903,12.545,0.903 c-6.256,0-11.321,5.064-11.321,11.322c0,6.258,5.065,11.322,11.321,11.322c6.256,0,11.322-5.064,11.322-11.322 c0-0.755-0.084-1.491-0.239-2.220H12.545z" fill="currentColor" />
                </svg>
              Continue with Google
            </Button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-primary px-2 text-white/80 rounded-md">Demo Accounts</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {demoCredentials.map((cred) => (
                <Button
                    key={cred.email}
                    type="button"
                    variant="secondary"
                    className="w-full bg-secondary/80 hover:bg-secondary/90 text-white font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                >
                    {cred.name}
                </Button>
            ))}
           </div>

          <div className="mt-4 text-center text-sm text-white/80">
            By signing in, you agree to our{" "}
            <Link href="#" className="underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
              Terms and Privacy
            </Link>
             <p className="text-center text-large">
              Don't have an account? <Link href="/register" className="font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90"></div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse pulse-element"></div>

        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description || ''}
            data-ai-hint={loginImage.imageHint}
            fill
            className="object-cover opacity-20"
          />
        )}

        <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 border border-secondary/30 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold text-white">Secure B2B Marketplace</span>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Trusted by<br />Procurement Leaders
              </h2>
              <p className="text-lg sm:text-xl text-white/90 max-w-md">
                Streamline your supply chain with confidence. Connect with verified suppliers and secure competitive quotes instantly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">500+</p>
                <p className="text-xs sm:text-sm text-white/80 mt-1">Active Suppliers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-2xl sm:text-3xl font-bold text-white">50K+</p>
                <p className="text-xs sm:text-sm text-white/80 mt-1">Products</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-md">
              <p className="text-sm sm:text-base text-white/90 mb-4">
                "BZION Hub transformed how we source. Response times dropped by 70% and we discovered amazing new suppliers."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Jane Doe</p>
                  <p className="text-xs text-white/70">Procurement Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
