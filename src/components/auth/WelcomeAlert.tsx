'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeAlertProps {
  firstName?: string;
  isNewUser: boolean;
  lastLogin?: Date | null;
  onDismiss?: () => void;
}

export function WelcomeAlert({
  firstName = 'User',
  isNewUser,
  lastLogin,
  onDismiss,
}: WelcomeAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const formatLastLogin = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours === 0) return 'Less than an hour ago';
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isNewUser) {
    return (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
              <span className="text-2xl">🎉</span>
              Welcome to BZION Hub, {firstName}!
            </h2>
            <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
              We're excited to have you on board. Start exploring our platform and discover amazing products for your business.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  // Navigate to complete profile
                  window.location.href = '/account/profile';
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Complete Your Profile
              </button>
              <button
                onClick={() => {
                  // Navigate to browse products
                  window.location.href = '/products';
                }}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
              >
                Start Browsing
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="mt-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Returning user welcome
  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-green-900 dark:text-green-100">
            <span className="text-2xl">👋</span>
            Welcome back, {firstName}!
          </h2>
          <p className="mt-2 text-sm text-green-800 dark:text-green-200">
            {lastLogin
              ? `Last login: ${formatLastLogin(lastLogin as Date)}`
              : 'Ready to continue where you left off?'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="mt-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
