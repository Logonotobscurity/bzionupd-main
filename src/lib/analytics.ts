/**
 * Analytics Tracking Utility
 * Provides fire-and-forget analytics event tracking
 * Errors are silently logged and don't break user experience
 */

import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export type EventType =
  | 'PRODUCT_VIEW'
  | 'SEARCH'
  | 'CART_ABANDONED'
  | 'CART_CHECKOUT'
  | 'PURCHASE'
  | 'PAGE_VIEW'
  | 'FORM_SUBMIT'
  | 'CUSTOM';

interface TrackEventOptions {
  eventType: EventType;
  userId?: number | null;
  sessionId?: string;
  data: Record<string, any>;
  source?: string;
}

/**
 * Track a custom analytics event
 * Non-blocking, errors are silently caught
 */
export async function trackEvent(
  eventType: EventType,
  userId: number | null | undefined,
  data: Record<string, any>,
  sessionId?: string
): Promise<void> {
  try {
    const finalSessionId = sessionId || generateSessionId();

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: userId || null,
        sessionId: finalSessionId,
        timestamp: new Date(),
        data,
        source: 'B2B_PLATFORM',
      },
    });
  } catch (error) {
    // Silently log errors - analytics should never break user experience
    console.error(`Failed to track event ${eventType}:`, error);
  }
}

/**
 * Track product view event
 * Convenience wrapper for PRODUCT_VIEW events
 */
export async function trackProductView(
  productId: string,
  userId: number | null | undefined,
  metadata?: Record<string, any>,
  sessionId?: string
): Promise<void> {
  return trackEvent(
    'PRODUCT_VIEW',
    userId,
    {
      productId,
      ...metadata,
      viewedAt: new Date().toISOString(),
    },
    sessionId
  );
}

/**
 * Track search event
 * Convenience wrapper for SEARCH events
 */
export async function trackSearch(
  query: string,
  userId: number | null | undefined,
  resultsCount: number = 0,
  sessionId?: string
): Promise<void> {
  return trackEvent(
    'SEARCH',
    userId,
    {
      query,
      resultsCount,
      searchedAt: new Date().toISOString(),
    },
    sessionId
  );
}

/**
 * Track cart abandonment event
 * Convenience wrapper for CART_ABANDONED events
 */
export async function trackCartAbandonment(
  userId: number | null | undefined,
  cartItems: Array<{ id: string; quantity: number; price?: number }>,
  totalValue?: number,
  sessionId?: string
): Promise<void> {
  return trackEvent(
    'CART_ABANDONED',
    userId,
    {
      itemCount: cartItems.length,
      items: cartItems,
      totalValue,
      abandonedAt: new Date().toISOString(),
    },
    sessionId
  );
}

/**
 * Track page view event
 * Convenience wrapper for PAGE_VIEW events
 */
export async function trackPageView(
  pageUrl: string,
  userId: number | null | undefined,
  pageTitle?: string,
  sessionId?: string
): Promise<void> {
  return trackEvent(
    'PAGE_VIEW',
    userId,
    {
      pageUrl,
      pageTitle,
      viewedAt: new Date().toISOString(),
    },
    sessionId
  );
}

/**
 * Track form submission event
 * Convenience wrapper for FORM_SUBMIT events
 */
export async function trackFormSubmit(
  formType: string,
  userId: number | null | undefined,
  metadata?: Record<string, any>,
  sessionId?: string
): Promise<void> {
  return trackEvent(
    'FORM_SUBMIT',
    userId,
    {
      formType,
      ...metadata,
      submittedAt: new Date().toISOString(),
    },
    sessionId
  );
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return randomUUID();
}

/**
 * Get or generate session ID from various sources
 * Utility function for extracting session info from requests/contexts
 */
export function getOrGenerateSessionId(providedSessionId?: string): string {
  return providedSessionId || generateSessionId();
}
