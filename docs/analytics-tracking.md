# Analytics Tracking Documentation

## Overview

The B2B platform includes a comprehensive fire-and-forget analytics system that tracks user behavior, product interactions, searches, and form submissions. Analytics events are stored in the database and integrated with the admin CRM dashboard for business intelligence.

**Key Principle:** Analytics errors never break user experience. All tracking is non-blocking with silent error handling.

---

## 1. Analytics Architecture

### Fire-and-Forget Pattern

```
User Action
  ↓
Call trackEvent()
  ↓
Database write (async, non-blocking)
  ↓
Error? → Log to console (don't break user flow)
  ↓
User experience continues unaffected
```

### Benefits

- ✅ **Non-blocking:** Database failures don't break user experience
- ✅ **Silent failures:** Analytics errors are logged but not thrown
- ✅ **Flexible:** Works with authenticated and anonymous users
- ✅ **Extensible:** Custom event types supported
- ✅ **Contextual:** Tracks user, session, source, and metadata

---

## 2. Event Types

### Core Event Types

```typescript
export type EventType =
  | 'PRODUCT_VIEW'              // Product page view
  | 'SEARCH'                    // Search query
  | 'CART_ABANDONED'            // Cart abandoned
  | 'CART_CHECKOUT'             // Started checkout
  | 'PURCHASE'                  // Completed purchase
  | 'PAGE_VIEW'                 // Page navigation
  | 'FORM_SUBMIT'               // Form submission
  | 'CUSTOM';                   // Custom event type
```

### Event Type Descriptions

| Event Type | Trigger | Use Case | Priority |
|-----------|---------|----------|----------|
| `PRODUCT_VIEW` | User visits product page | Track product interest | Medium |
| `SEARCH` | User performs search | Analyze search patterns | Medium |
| `CART_ABANDONED` | User leaves cart | Recovery email campaigns | High |
| `CART_CHECKOUT` | User starts checkout | Conversion funnel | High |
| `PURCHASE` | Order completed | Revenue tracking | High |
| `PAGE_VIEW` | User visits any page | Traffic analytics | Low |
| `FORM_SUBMIT` | User submits form | Lead qualification | High |
| `CUSTOM` | Custom business event | Custom tracking | Variable |

---

## 3. Core Analytics Utility

### File Location

**File:** `/lib/analytics.ts`

### TrackEvent Function

The base function for all event tracking:

```typescript
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
    // Silently log - never throw
    console.error(`Failed to track event ${eventType}:`, error);
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventType` | EventType | Yes | Type of event (PRODUCT_VIEW, SEARCH, etc.) |
| `userId` | number \| null | No | User ID (null for anonymous) |
| `data` | object | Yes | Event-specific data and metadata |
| `sessionId` | string | No | Session ID (auto-generated if omitted) |

**Return:** Promise<void> (always resolves, never rejects)

---

## 4. Convenience Functions

### trackProductView()

Track when a user views a product page.

```typescript
export async function trackProductView(
  productId: string,
  userId: number | null | undefined,
  metadata?: Record<string, any>,
  sessionId?: string
): Promise<void>
```

**Usage:**

```typescript
// Server Component
import { trackProductView } from '@/lib/analytics';

export async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const session = await getSession();

  // Track view (fire-and-forget)
  await trackProductView(
    product.id,
    session?.user?.id || null,
    {
      category: product.category,
      price: product.price,
      slug: product.slug,
    }
  );

  return <div>{product.name}</div>;
}
```

**Data Stored:**

```json
{
  "eventType": "PRODUCT_VIEW",
  "data": {
    "productId": "123",
    "category": "Electronics",
    "price": 999.99,
    "slug": "iphone-15",
    "viewedAt": "2025-12-14T10:30:00Z"
  }
}
```

---

### trackSearch()

Track search queries and result counts.

```typescript
export async function trackSearch(
  query: string,
  userId: number | null | undefined,
  resultsCount?: number,
  sessionId?: string
): Promise<void>
```

**Usage:**

```typescript
// Search API endpoint
export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get('q');

  const results = await searchProducts(query);
  const session = await getSession();

  // Track search
  await trackSearch(query, session?.user?.id || null, results.length);

  return NextResponse.json(results);
}
```

**Data Stored:**

```json
{
  "eventType": "SEARCH",
  "data": {
    "query": "industrial supplies",
    "resultsCount": 42,
    "searchedAt": "2025-12-14T10:30:00Z"
  }
}
```

---

### trackCartAbandonment()

Track when a user abandons their shopping cart.

```typescript
export async function trackCartAbandonment(
  userId: number | null | undefined,
  cartItems: Array<{ id: string; quantity: number; price?: number }>,
  totalValue?: number,
  sessionId?: string
): Promise<void>
```

**Usage:**

```typescript
// Detect cart abandonment
export async function detectCartAbandonment(userId: number) {
  const cart = await getCart(userId);

  if (cart.items.length > 0) {
    await trackCartAbandonment(
      userId,
      cart.items.map(item => ({
        id: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      cart.totalValue
    );
  }
}
```

**Data Stored:**

```json
{
  "eventType": "CART_ABANDONED",
  "data": {
    "itemCount": 3,
    "items": [
      { "id": "prod-1", "quantity": 2, "price": 50 },
      { "id": "prod-2", "quantity": 1, "price": 100 }
    ],
    "totalValue": 200,
    "abandonedAt": "2025-12-14T10:30:00Z"
  }
}
```

---

### trackPageView()

Track page navigation and visits.

```typescript
export async function trackPageView(
  pageUrl: string,
  userId: number | null | undefined,
  pageTitle?: string,
  sessionId?: string
): Promise<void>
```

**Usage:**

```typescript
// Layout component
export async function RootLayout({ children }) {
  const session = await getSession();
  const { pathname } = useRouter();

  // Track page view on navigation
  useEffect(() => {
    trackPageView(pathname, session?.user?.id || null, document.title);
  }, [pathname]);

  return <>{children}</>;
}
```

**Data Stored:**

```json
{
  "eventType": "PAGE_VIEW",
  "data": {
    "pageUrl": "/products/industrial-supplies",
    "pageTitle": "Industrial Supplies",
    "viewedAt": "2025-12-14T10:30:00Z"
  }
}
```

---

### trackFormSubmit()

Track form submissions across the platform.

```typescript
export async function trackFormSubmit(
  formType: string,
  userId: number | null | undefined,
  metadata?: Record<string, any>,
  sessionId?: string
): Promise<void>
```

**Usage:**

```typescript
// Contact form submission
async function handleFormSubmit(data) {
  const session = await getSession();

  // Track form submission
  await trackFormSubmit(
    'contact_form',
    session?.user?.id || null,
    {
      email: data.email,
      subject: data.subject,
    }
  );

  // Submit form...
}
```

**Data Stored:**

```json
{
  "eventType": "FORM_SUBMIT",
  "data": {
    "formType": "contact_form",
    "email": "user@company.com",
    "subject": "Product Inquiry",
    "submittedAt": "2025-12-14T10:30:00Z"
  }
}
```

---

### trackCustomEvent()

Track custom business events.

```typescript
// Using base trackEvent function
await trackEvent(
  'CUSTOM',
  userId,
  {
    eventName: 'video_watched',
    videoDuration: 3600,
    videoId: 'tutorial-123',
    completionPercentage: 85,
  }
);
```

**Custom Event Examples:**

```typescript
// Video view completion
await trackEvent('CUSTOM', userId, {
  eventName: 'video_completed',
  videoId: 'training-001',
  duration: 1234,  // seconds
});

// Download event
await trackEvent('CUSTOM', userId, {
  eventName: 'resource_downloaded',
  resourceId: 'whitepaper-123',
  resourceType: 'pdf',
});

// Feature usage
await trackEvent('CUSTOM', userId, {
  eventName: 'feature_used',
  featureName: 'bulk_pricing_calculator',
  inputQuantity: 1000,
});

// Account upgrade
await trackEvent('CUSTOM', userId, {
  eventName: 'account_upgraded',
  planFrom: 'free',
  planTo: 'enterprise',
});
```

---

## 5. AnalyticsEvent Database Schema

### Model Definition

```prisma
model AnalyticsEvent {
  id        String @id @default(uuid())
  eventType String @map("event_type")
  userId    Int? @map("user_id")
  sessionId String? @map("session_id")
  timestamp DateTime @default(now())
  data      Json
  source    String @default("B2B_PLATFORM")
  user      User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([eventType])
  @@index([userId])
  @@index([timestamp])
  @@map("analytics_events")
}
```

### Record Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "PRODUCT_VIEW",
  "userId": 42,
  "sessionId": "session-abc123",
  "timestamp": "2025-12-14T10:30:00.000Z",
  "data": {
    "productId": "123",
    "category": "Electronics",
    "price": 999.99,
    "viewedAt": "2025-12-14T10:30:00Z"
  },
  "source": "B2B_PLATFORM"
}
```

---

## 6. Session Management

### Session ID Generation

```typescript
function generateSessionId(): string {
  return randomUUID();  // Cryptographically secure UUID
}
```

### Get or Generate Session ID

```typescript
export function getOrGenerateSessionId(providedSessionId?: string): string {
  return providedSessionId || generateSessionId();
}
```

### Usage in Server Components

```typescript
import { getOrGenerateSessionId } from '@/lib/analytics';

export async function ProductPage() {
  const sessionId = getOrGenerateSessionId();
  // Use sessionId for all events on this session
}
```

---

## 7. Integration with Product Page

### Product Detail Page Example

**File:** `/app/products/[slug]/page.tsx`

```typescript
import { trackProductView } from '@/lib/analytics';
import { getSession } from 'next-auth/react';

export async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  
  // Fetch product
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return <NotFound />;
  }

  // Track view asynchronously (fire-and-forget)
  await trackProductView(
    product.id.toString(),
    session?.user?.id || null,
    {
      category: product.category,
      price: product.price,
      brand: product.brand?.name,
      inStock: product.inStock,
    }
  );

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      {/* Product details */}
    </div>
  );
}
```

---

## 8. Error Handling

### Silent Error Pattern

All analytics functions use try-catch internally to prevent throwing errors:

```typescript
try {
  await prisma.analyticsEvent.create({ data: { /* ... */ } });
} catch (error) {
  // Log error but don't throw
  console.error('Failed to track event:', error);
  // User experience continues normally
}
```

### Error Logging

Errors are logged to console for monitoring:

```
Failed to track event PRODUCT_VIEW: Error: Connection refused
Failed to track event SEARCH: PrismaClientValidationError: Invalid data
```

### Monitoring Errors

Monitor analytics errors in production:

```bash
# Check analytics error logs
grep "Failed to track event" /var/log/app.log | tail -20

# Count errors by type
grep "Failed to track event" /var/log/app.log | sed 's/.*event //' | cut -d: -f1 | sort | uniq -c
```

---

## 9. Admin Dashboard Integration

### Admin CRM Dashboard

**File:** `/app/admin/crm-sync/page.tsx`

The admin dashboard displays analytics data:

```typescript
// Dashboard queries
const analyticsStats = {
  totalPageViews: await getAnalyticsCount('PAGE_VIEW'),
  totalProductViews: await getAnalyticsCount('PRODUCT_VIEW'),
  totalSearches: await getAnalyticsCount('SEARCH'),
  totalFormSubmissions: await getAnalyticsCount('FORM_SUBMIT'),
  cartAbandonments: await getAnalyticsCount('CART_ABANDONED'),
};
```

### Analytics Dashboard Tabs

The admin can view:

1. **Traffic Tab**
   - Page views by URL
   - Visitors over time
   - Traffic sources

2. **Product Tab**
   - Most viewed products
   - Product view trends
   - Product-to-purchase conversion

3. **Search Tab**
   - Popular search queries
   - Search result patterns
   - Search-to-purchase funnel

4. **Form Tab**
   - Submissions by form type
   - Form conversion rate
   - Form abandonment

5. **Behavior Tab**
   - Cart abandonments
   - Session length
   - User journey patterns

---

## 10. Analytics Queries

### Most Viewed Products

```sql
SELECT 
  ae.data->>'productId' as product_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT ae.user_id) as unique_users,
  COUNT(DISTINCT ae.session_id) as unique_sessions
FROM analytics_events ae
WHERE ae.event_type = 'PRODUCT_VIEW'
  AND ae.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY ae.data->>'productId'
ORDER BY view_count DESC
LIMIT 20;
```

### Popular Search Queries

```sql
SELECT 
  ae.data->>'query' as search_query,
  COUNT(*) as count,
  AVG((ae.data->>'resultsCount')::INT) as avg_results
FROM analytics_events ae
WHERE ae.event_type = 'SEARCH'
  AND ae.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY ae.data->>'query'
ORDER BY count DESC
LIMIT 30;
```

### Cart Abandonment Analysis

```sql
SELECT 
  COUNT(*) as total_abandonments,
  COUNT(DISTINCT ae.user_id) as unique_users,
  AVG((ae.data->>'totalValue')::FLOAT) as avg_cart_value,
  MAX((ae.data->>'totalValue')::FLOAT) as max_cart_value
FROM analytics_events ae
WHERE ae.event_type = 'CART_ABANDONED'
  AND ae.timestamp >= NOW() - INTERVAL '30 days';
```

### User Activity Timeline

```sql
SELECT 
  ae.user_id,
  ae.event_type,
  ae.timestamp,
  ae.data
FROM analytics_events ae
WHERE ae.user_id = ?
ORDER BY ae.timestamp DESC
LIMIT 50;
```

### Conversion Funnel

```sql
SELECT 
  'View Product' as stage,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'PRODUCT_VIEW' THEN ae.user_id END) as users
FROM analytics_events ae
WHERE ae.timestamp >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Search' as stage,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'SEARCH' THEN ae.user_id END)
FROM analytics_events ae
WHERE ae.timestamp >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Form Submit' as stage,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'FORM_SUBMIT' THEN ae.user_id END)
FROM analytics_events ae
WHERE ae.timestamp >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Purchase' as stage,
  COUNT(DISTINCT CASE WHEN ae.event_type = 'PURCHASE' THEN ae.user_id END)
FROM analytics_events ae
WHERE ae.timestamp >= NOW() - INTERVAL '30 days';
```

---

## 11. Performance Optimization

### Database Indexes

```sql
-- Analytics queries optimized
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);

-- Combined indexes for common queries
CREATE INDEX idx_analytics_type_time 
  ON analytics_events(event_type, timestamp DESC);

CREATE INDEX idx_analytics_user_type 
  ON analytics_events(user_id, event_type);
```

### Query Optimization

```typescript
// Efficient aggregation
const stats = await prisma.$queryRaw`
  SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as sessions
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '7 days'
  GROUP BY event_type
  ORDER BY count DESC;
`;

// Pagination for large result sets
const events = await prisma.analyticsEvent.findMany({
  where: { eventType: 'PRODUCT_VIEW' },
  orderBy: { timestamp: 'desc' },
  take: 50,
  skip: 0,
});
```

### Data Retention

```typescript
// Archive old events (6+ months)
export async function archiveOldAnalytics() {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  
  const archivedCount = await prisma.analyticsEvent.deleteMany({
    where: {
      timestamp: { lt: sixMonthsAgo },
    },
  });
  
  console.log(`Archived ${archivedCount.count} events`);
}
```

---

## 12. Anonymous User Tracking

### Tracking Non-Authenticated Users

```typescript
// userId is optional - null for anonymous users
await trackProductView(
  productId,
  session?.user?.id || null,  // null for anonymous
  metadata
);
```

### Session-Based Tracking

```typescript
// Track anonymous user through session
const sessionId = generateSessionId();

// All events on same session share the same sessionId
await trackProductView(productId, null, metadata, sessionId);
await trackSearch(query, null, resultsCount, sessionId);
await trackFormSubmit(formType, null, formData, sessionId);

// Later, if user logs in
// Can link session data to user:
await prisma.analyticsEvent.updateMany({
  where: { sessionId },
  data: { userId: newUserId },
});
```

---

## 13. Best Practices

### Timing

```typescript
// Track AFTER successful operation
const product = await getProduct(slug);  // Successful fetch
await trackProductView(product.id, userId);  // Then track
```

### Data Inclusion

```typescript
// Include relevant metadata
await trackProductView(productId, userId, {
  category: product.category,
  price: product.price,
  inStock: product.inStock,
  rating: product.rating,
  // Track context, not just IDs
});
```

### Sensitive Data

```typescript
// DON'T track sensitive data
// ❌ WRONG
await trackEvent('FORM_SUBMIT', userId, {
  creditCard: '4111-1111-1111-1111',  // NEVER!
  password: userPassword,  // NEVER!
});

// ✅ CORRECT
await trackEvent('FORM_SUBMIT', userId, {
  formType: 'payment',
  amount: 100,  // Amount is OK
  // Sensitive data NOT included
});
```

### Batch Operations

```typescript
// For high-volume tracking, batch if possible
async function trackMultipleViews(productIds: string[], userId: number) {
  const promises = productIds.map(id =>
    trackProductView(id, userId)
  );
  await Promise.all(promises);  // All in parallel
}
```

---

## 14. Monitoring & Alerts

### Key Metrics

```sql
-- Events per minute
SELECT 
  DATE_TRUNC('minute', timestamp) as minute,
  COUNT(*) as events
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', timestamp)
ORDER BY minute DESC;

-- Event type distribution
SELECT 
  event_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- Tracking failures (to detect issues)
-- Check application logs for "Failed to track event"
```

### Alerting

Monitor for:

- Sudden drop in tracking volume (database issue)
- Increase in tracking errors (connection problems)
- Unusual event patterns (data quality issue)

---

## 15. Related Documentation

- **CRM Integration:** See `/docs/crm-integration.md` for lead tracking
- **Form Submission:** See `/docs/form-submission.md` for form analytics
- **Authentication:** See `/docs/authentication.md` for user management
- **Admin Dashboard:** See `/app/admin/crm-sync/page.tsx` for analytics UI

---

## 16. Quick Reference

### Tracking Functions

```typescript
// Track generic event
await trackEvent(eventType, userId, data, sessionId);

// Track product view
await trackProductView(productId, userId, metadata);

// Track search
await trackSearch(query, userId, resultsCount);

// Track cart abandonment
await trackCartAbandonment(userId, cartItems, totalValue);

// Track page view
await trackPageView(pageUrl, userId, pageTitle);

// Track form submission
await trackFormSubmit(formType, userId, metadata);
```

### Event Types

```
'PRODUCT_VIEW' - Product page view
'SEARCH' - Search query
'CART_ABANDONED' - Abandoned cart
'CART_CHECKOUT' - Started checkout
'PURCHASE' - Order completed
'PAGE_VIEW' - Page navigation
'FORM_SUBMIT' - Form submission
'CUSTOM' - Custom event
```

### Database Model

```prisma
AnalyticsEvent {
  id: string (UUID)
  eventType: string
  userId: int? (nullable)
  sessionId: string?
  timestamp: datetime
  data: JSON
  source: string ("B2B_PLATFORM")
}
```

### API Summary

- **Non-blocking:** All functions are fire-and-forget
- **Error-safe:** Errors logged but never thrown
- **User-friendly:** Supports authenticated and anonymous tracking
- **Flexible:** Custom events supported via trackEvent()
- **Queryable:** All events indexed for fast analytics queries

