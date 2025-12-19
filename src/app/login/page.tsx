'use client';

import { Suspense } from 'react';
import LoginPageContent from './login-content';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
