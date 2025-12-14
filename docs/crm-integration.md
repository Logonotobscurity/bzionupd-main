# CRM Integration Documentation

## Overview

The B2B platform includes a comprehensive Customer Relationship Management (CRM) system that automatically captures and tracks leads, customers, and interactions across all user touchpoints. The CRM integrates with the BZION_HUB system via notifications.

---

## 1. CRM Models

### Customer Model (CRM Record)

The `Customer` model represents business customers in the CRM system, linked to User accounts.

```prisma
model Customer {
  id           String @id @default(uuid())          // UUID primary key
  externalId   String? @unique @map("external_id")  // Links to User.id
  source       String                                // How customer was acquired
  email        String @unique                        // Customer email
  firstName    String? @map("first_name")           // First name
  lastName     String? @map("last_name")            // Last name
  companyName  String? @map("company_name")        // Business company name
  phone        String?                               // Contact phone
  customerType String @map("customer_type")         // Classification (RETAILER, DISTRIBUTOR, WHOLESALER)
  status       String @default("ACTIVE")             // Current status (ACTIVE, INACTIVE, PROSPECT)
  metadata     Json?                                 // Flexible JSON data
  createdAt    DateTime @default(now())             // Creation timestamp
  updatedAt    DateTime @updatedAt                  // Last update timestamp
  quotes       Quote[]                              // Related quotes
}
```

**Key Fields:**

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` |
| `externalId` | String | Links to User.id | `user-12345` |
| `source` | String | Acquisition channel | `B2B_PLATFORM`, `IMPORT`, `API` |
| `email` | String | Unique email | `customer@company.com` |
| `customerType` | String | Business classification | `RETAILER`, `DISTRIBUTOR`, `WHOLESALER` |
| `status` | String | Current status | `ACTIVE`, `INACTIVE`, `PROSPECT` |
| `metadata` | JSON | Extensible data | `{ registeredVia: "b2b-website", ... }` |

### Lead Model (Sales Pipeline)

The `Lead` model represents potential customers in the sales pipeline with scoring system.

```prisma
model Lead {
  id           String @id @default(uuid())           // UUID primary key
  email        String                                 // Lead email
  name         String?                                // Lead name
  companyName  String? @map("company_name")         // Company name
  phone        String?                                // Contact phone
  type         String                                 // Lead type (LEAD, CONTACT_REQUEST, QUOTE_REQUEST)
  source       String                                 // Lead source (web_form, newsletter, referral)
  status       String @default("NEW")                 // Status (NEW, CONTACTED, QUALIFIED, CONVERTED, REJECTED)
  leadScore    Int @default(0) @map("lead_score")    // Scoring points (0-100)
  assignedTo   String? @map("assigned_to")           // Assigned sales person
  metadata     Json?                                  // Additional data
  createdAt    DateTime @default(now())              // Creation timestamp
  updatedAt    DateTime @updatedAt                   // Last update timestamp
  convertedAt  DateTime? @map("converted_at")        // Conversion timestamp
}
```

**Key Fields:**

| Field | Type | Purpose | Values |
|-------|------|---------|--------|
| `email` | String | Unique lead email | `prospect@company.com` |
| `type` | String | Lead classification | `LEAD`, `CONTACT_REQUEST`, `QUOTE_REQUEST` |
| `source` | String | How lead was acquired | `web_form`, `newsletter`, `referral` |
| `status` | String | Pipeline status | `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `REJECTED` |
| `leadScore` | Int | Sales priority (0-100) | `50` (contact), `80` (quote request) |
| `assignedTo` | String | Sales rep assignment | Sales rep email or ID |

### Lead Scoring System

Lead scores determine priority for sales follow-up:

| Form Type | Lead Type | Score | Priority |
|-----------|-----------|-------|----------|
| `contact_us` | `CONTACT_REQUEST` | 50 | LOW |
| `quote_request` | `QUOTE_REQUEST` | 80 | HIGH |
| `partnership_inquiry` | `LEAD` | 70 | MEDIUM |

**Scoring Benefits:**
- ✅ Automatic prioritization based on intent
- ✅ Sales team focuses on high-value leads first
- ✅ Equal scoring for same form types
- ✅ Extensible: Add form types and scores in `/lib/constants/form-types.ts`

### CrmNotification Model (System Integration)

The `CrmNotification` model sends notifications to external CRM systems (BZION_HUB).

```prisma
model CrmNotification {
  id            String @id @default(uuid())          // UUID primary key
  type          String                                // Event type (NEW_FORM_SUBMISSION, NEW_LEAD, etc.)
  targetSystem  String @map("target_system")         // Destination (BZION_HUB, SALESFORCE, etc.)
  priority      String @default("NORMAL")             // Priority (LOW, NORMAL, HIGH)
  data          Json                                  // Event data payload
  read          Boolean @default(false)               // Read status
  readAt        DateTime? @map("read_at")            // When marked as read
  createdAt     DateTime @default(now())             // Creation timestamp
}
```

**Key Fields:**

| Field | Purpose | Values |
|-------|---------|--------|
| `type` | Event type | `NEW_FORM_SUBMISSION`, `NEW_LEAD`, `QUOTE_REQUEST` |
| `targetSystem` | Destination system | `BZION_HUB`, `SALESFORCE`, `PIPEDRIVE` |
| `priority` | Processing priority | `LOW`, `NORMAL`, `HIGH` |
| `data` | Event payload | JSON with form/lead/customer data |
| `read` | Confirmation status | `true` when system processed |

### NewsletterSubscriber Model

The `NewsletterSubscriber` model tracks email marketing subscribers.

```prisma
model NewsletterSubscriber {
  id             String @id @default(uuid())          // UUID primary key
  email          String @unique                        // Unique email
  source         String                                // Source (B2B_PLATFORM, IMPORT, etc.)
  status         String                                // Status (SUBSCRIBED, UNSUBSCRIBED)
  subscribedAt   DateTime @default(now()) @map("subscribed_at")
  unsubscribedAt DateTime? @map("unsubscribed_at")    // Opt-out timestamp
  metadata       Json?                                 // Additional data
}
```

---

## 2. Automatic CRM Sync Points

### Point 1: User Registration

**Trigger:** Successful user signup
**File:** `/api/auth/register/route.ts`

When a user creates an account:

```typescript
// 1. User record created
const user = await prisma.user.create({
  data: {
    firstName: name,
    email: email.toLowerCase(),
    passwordHash,
    companyName: company || null,
    role: 'customer',
    isActive: true,
  },
});

// 2. Customer record created automatically (non-blocking)
try {
  await prisma.customer.create({
    data: {
      externalId: user.id,           // Link to User
      email: user.email,
      source: 'B2B_PLATFORM',        // Signup channel
      customerType: 'RETAILER',      // Default type
      status: 'ACTIVE',              // Ready for sales
      metadata: {
        registeredVia: 'b2b-website',
        registrationDate: new Date().toISOString(),
      },
    },
  });
} catch (error) {
  console.error('Failed to create customer record:', error);
  // Signup continues even if CRM creation fails
}
```

**Result:**
- ✅ Customer appears in CRM immediately after signup
- ✅ Status: ACTIVE (ready to contact)
- ✅ Source: B2B_PLATFORM (tracks channel)
- ✅ Non-blocking: User can login even if CRM fails

---

### Point 2: Form Submission

**Trigger:** Form submission via `/api/forms/submit` endpoint
**File:** `/app/api/forms/submit/route.ts`

When user submits a form (contact, quote request, partnership):

```typescript
// Transactional creation of 3 records
const result = await prisma.$transaction(async (tx) => {
  // 1. FormSubmission - Track form data
  const formSubmission = await tx.formSubmission.create({
    data: {
      formType,      // contact_us, quote_request, partnership_inquiry
      data: {
        email,
        name,
        companyName,
        phone,
        message,
        ...metadata,
      },
      ipAddress: ip,
      userAgent,
      status: 'NEW',
    },
  });

  // 2. Lead - Create CRM lead with automatic scoring
  const leadScore = LEAD_SCORE_MAP[formType]; // 50, 80, or 70
  const lead = await tx.lead.create({
    data: {
      email,
      name,
      companyName,
      phone,
      type: getLeadTypeForFormType(formType),  // Maps form type to lead type
      source: 'web_form',
      status: 'NEW',
      leadScore,
      metadata: {
        formSubmissionId: formSubmission.id,
        formType,
      },
    },
  });

  // 3. CrmNotification - Alert external systems
  const notification = await tx.crmNotification.create({
    data: {
      type: 'NEW_FORM_SUBMISSION',
      targetSystem: 'BZION_HUB',
      priority: getNotificationPriority(leadScore),  // HIGH for quote_request
      data: {
        formSubmissionId: formSubmission.id,
        leadId: lead.id,
        formType,
        email,
        name,
        companyName,
        phone,
        leadScore,
        submittedAt: new Date().toISOString(),
      },
    },
  });

  return { formSubmission, lead, notification };
});
```

**Result:**
- ✅ FormSubmission record stores raw form data
- ✅ Lead record created with automatic scoring
- ✅ CrmNotification sent to BZION_HUB system
- ✅ All 3 records linked via IDs
- ✅ Transactional: All succeed or all fail

**Form Types & Scoring:**

| Form Type | Lead Score | Priority | Lead Type |
|-----------|-----------|----------|-----------|
| `contact_us` | 50 | NORMAL | CONTACT_REQUEST |
| `quote_request` | 80 | HIGH | QUOTE_REQUEST |
| `partnership_inquiry` | 70 | NORMAL | LEAD |

---

### Point 3: Newsletter Subscription

**Trigger:** Newsletter signup
**File:** `/api/newsletter-subscribe/route.ts`

When user subscribes to newsletter:

```typescript
// Dual record creation
const [subscriber, lead] = await Promise.all([
  // 1. NewsletterSubscriber - Track email list
  prisma.newsletterSubscriber.create({
    data: {
      email: email.toLowerCase(),
      source: 'B2B_PLATFORM',
      status: 'SUBSCRIBED',
      metadata: {
        subscribedFrom: 'website',
        subscribedDate: new Date().toISOString(),
      },
    },
  }),

  // 2. Lead - Create low-score lead for nurturing
  prisma.lead.create({
    data: {
      email: email.toLowerCase(),
      source: 'newsletter_signup',
      type: 'LEAD',
      status: 'NEW',
      leadScore: 30,  // Low score - nurture track
      metadata: {
        source: 'newsletter_signup',
      },
    },
  }),
]);
```

**Result:**
- ✅ Email added to newsletter list
- ✅ Lead created for nurturing campaigns
- ✅ Source tracked: newsletter_signup
- ✅ Low lead score (30): Nurture track, not sales track

---

## 3. CRM Notification System

### Notification Flow

```
Form Submit / Signup / Newsletter
         ↓
Create FormSubmission / Lead / NewsletterSubscriber
         ↓
Create CrmNotification record
         ↓
Data sent to BZION_HUB (external system)
         ↓
BZION_HUB acknowledges receipt
         ↓
Mark notification.read = true
```

### Notification Payload Example

**Type:** `NEW_FORM_SUBMISSION`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "NEW_FORM_SUBMISSION",
  "targetSystem": "BZION_HUB",
  "priority": "HIGH",
  "data": {
    "formSubmissionId": "form-123",
    "leadId": "lead-456",
    "formType": "quote_request",
    "email": "customer@company.com",
    "name": "John Smith",
    "companyName": "ABC Corp",
    "phone": "+234-801-234-5678",
    "leadScore": 80,
    "submittedAt": "2025-12-14T10:30:00Z",
    "ipAddress": "192.168.1.1"
  },
  "read": false,
  "createdAt": "2025-12-14T10:30:00Z"
}
```

### Notification Types

| Type | Trigger | Priority Logic | Purpose |
|------|---------|-----------------|---------|
| `NEW_FORM_SUBMISSION` | Form submission | Score-based | Alert sales team |
| `NEW_LEAD` | Lead creation | Score-based | Lead assignment |
| `QUOTE_REQUEST` | Quote form | Always HIGH | Urgent sales follow-up |
| `NEWSLETTER_SIGNUP` | Newsletter | Always LOW | Marketing nurture |

---

## 4. Customer Lifecycle

### Lifecycle States

```
PROSPECT
   ↓
[Form Submit] → Lead created with score
   ↓
ACTIVE (Customer signup or conversion)
   ↓
[Engagement tracked] → Quote requests, messages
   ↓
CONVERTED (Quote accepted, sale closed)
   ↓
INACTIVE (Account deactivated)
```

### Status Transitions

```typescript
// Lead status flow
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'REJECTED';

// Customer status flow
type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
```

---

## 5. CRM API Integration

### Admin CRM Dashboard

**File:** `/app/admin/crm-sync/page.tsx`

The admin dashboard provides visibility into CRM data:

```typescript
// Dashboard displays:
// - Total leads created
// - Total form submissions
// - Total newsletter subscribers
// - Unread CRM notifications
// - Conversion rate (converted leads / total leads)

// Admin can view:
// 1. Leads Tab - All leads with status, score, dates
// 2. Forms Tab - All form submissions with types
// 3. Subscribers Tab - Newsletter subscribers, subscription dates
// 4. Notifications Tab - CRM notifications with read status
```

### Admin API Endpoint

**File:** `/api/admin/crm-sync/route.ts`

Protected endpoint returning CRM statistics:

```typescript
POST /api/admin/crm-sync

// Requires: session.user.role === 'admin'

// Response:
{
  "stats": {
    "totalLeads": 245,
    "totalForms": 89,
    "totalSubscribers": 1250,
    "unreadNotifications": 12,
    "conversionRate": 18.5
  },
  "leads": [
    {
      "id": "lead-123",
      "email": "customer@company.com",
      "name": "John Smith",
      "type": "QUOTE_REQUEST",
      "status": "NEW",
      "leadScore": 80,
      "createdAt": "2025-12-14T10:30:00Z"
    }
  ],
  "forms": [...],
  "subscribers": [...],
  "notifications": [...]
}
```

---

## 6. Data Relationships

### Entity Relationship Diagram

```
User (1) ──────────→ (1) Customer
  ↓
  └─→ (1:many) Quote
  └─→ (1:many) Notification
  └─→ (1:many) AnalyticsEvent
  └─→ (1:many) ProductView

Form Submission
  ↓
  └─→ (1:1) Lead (via metadata.formSubmissionId)
  └─→ (1:1) CrmNotification

Lead
  ↓
  └─→ (0:1) Customer (when converted)

NewsletterSubscriber
  ↓
  └─→ (0:1) Lead (when qualified)

Quote
  ↓
  └─→ (1:1) Customer
  └─→ (0:1) User
  └─→ (1:many) QuoteLine
  └─→ (1:many) NegotiationMessage
  └─→ (1:many) QuoteEvent
```

---

## 7. Metadata Patterns

### Customer Metadata

```json
{
  "registeredVia": "b2b-website",
  "registrationDate": "2025-12-14T10:30:00Z",
  "industryType": "manufacturing",
  "employeeCount": "50-100",
  "annualRevenue": "5M-10M",
  "customField1": "value"
}
```

### Lead Metadata

```json
{
  "formSubmissionId": "form-123",
  "formType": "quote_request",
  "campaignSource": "email_campaign",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer_sale",
  "referralSource": "partner_xyz"
}
```

### Notification Data

```json
{
  "formSubmissionId": "form-123",
  "leadId": "lead-456",
  "formType": "quote_request",
  "email": "customer@company.com",
  "name": "John Smith",
  "companyName": "ABC Corp",
  "phone": "+234-801-234-5678",
  "leadScore": 80,
  "submittedAt": "2025-12-14T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 8. CRM Integration Points

### REST API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/forms/submit` | POST | Submit form → Create Lead + Notification | No |
| `/api/auth/register` | POST | Register user → Create Customer | No |
| `/api/newsletter-subscribe` | POST | Subscribe → Create NewsletterSubscriber | No |
| `/api/admin/crm-sync` | GET/POST | Retrieve CRM stats | Admin only |
| `/api/v1/rfq/submit` | POST | Quote request → CrmNotification | No |

### Webhook Integration

The platform sends CrmNotification records to BZION_HUB via:

1. **Direct Database Access** - BZION_HUB queries `crm_notifications` table
2. **Polling** - BZION_HUB polls for `read = false` notifications
3. **Event Streaming** - Real-time notification via message queue (future)

### Sync Status Tracking

```sql
-- Check unread notifications
SELECT id, type, targetSystem, priority, createdAt 
FROM crm_notifications 
WHERE read = false 
ORDER BY priority DESC, createdAt DESC;

-- Mark as read after processing
UPDATE crm_notifications 
SET read = true, read_at = NOW() 
WHERE id = ?;

-- Check sync statistics
SELECT 
  COUNT(*) as total_leads,
  SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
  AVG(lead_score) as avg_score
FROM leads;
```

---

## 9. Best Practices

### Creating Leads Manually (Admin)

```typescript
// Via API or database
await prisma.lead.create({
  data: {
    email: 'prospect@company.com',
    name: 'Jane Doe',
    companyName: 'XYZ Corp',
    phone: '+234-801-234-5678',
    type: 'LEAD',
    source: 'manual_import',
    status: 'NEW',
    leadScore: 60,
    metadata: {
      importedBy: 'admin',
      importDate: new Date().toISOString(),
    },
  },
});
```

### Updating Lead Status (CRM System)

```typescript
// When sales team contacts lead
await prisma.lead.update({
  where: { id: leadId },
  data: {
    status: 'CONTACTED',
    assignedTo: 'sales-rep@company.com',
    updatedAt: new Date(),
  },
});

// When lead qualifies for sales
await prisma.lead.update({
  where: { id: leadId },
  data: {
    status: 'QUALIFIED',
    leadScore: 85,  // Increase score
    updatedAt: new Date(),
  },
});

// When lead converts to customer
await prisma.lead.update({
  where: { id: leadId },
  data: {
    status: 'CONVERTED',
    convertedAt: new Date(),
    updatedAt: new Date(),
  },
});
```

### Converting Lead to Customer (Manual)

```typescript
// If lead exists but no customer record
const customer = await prisma.customer.create({
  data: {
    externalId: userId,  // Link to User if exists
    email: lead.email,
    firstName: lead.name?.split(' ')[0],
    lastName: lead.name?.split(' ')[1],
    companyName: lead.companyName,
    phone: lead.phone,
    source: 'LEAD_CONVERSION',
    customerType: 'RETAILER',
    status: 'ACTIVE',
    metadata: {
      convertedFromLeadId: lead.id,
      convertedDate: new Date().toISOString(),
    },
  },
});

// Update lead
await prisma.lead.update({
  where: { id: lead.id },
  data: { status: 'CONVERTED', convertedAt: new Date() },
});
```

---

## 10. Performance Optimization

### Database Indexes

```sql
-- Lead queries optimized
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_createdAt ON leads(created_at DESC);

-- CRM notification polling optimized
CREATE INDEX idx_crm_notifications_read ON crm_notifications(target_system, read);
CREATE INDEX idx_crm_notifications_createdAt ON crm_notifications(created_at DESC);

-- Newsletter subscriber lookups optimized
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
```

### Query Optimization

```typescript
// Efficient lead retrieval with pagination
const leads = await prisma.lead.findMany({
  where: { status: 'NEW' },
  orderBy: [{ leadScore: 'desc' }, { createdAt: 'desc' }],
  take: 20,
  skip: 0,
});

// Batch notification processing
const unreadNotifications = await prisma.crmNotification.findMany({
  where: { read: false, targetSystem: 'BZION_HUB' },
  orderBy: { priority: 'desc' },
  take: 100,
});

// Conversion rate calculation
const stats = await prisma.$queryRaw`
  SELECT 
    COUNT(*) as total_leads,
    SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted_leads,
    ROUND(
      100.0 * SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) / COUNT(*),
      2
    ) as conversion_rate
  FROM leads;
`;
```

---

## 11. Error Handling

### Non-Blocking CRM Operations

All CRM record creation is non-blocking to prevent signup/form submission failures:

```typescript
// Try to create customer, but don't break signup if it fails
try {
  await prisma.customer.create({ data: { /* ... */ } });
} catch (error) {
  console.error('Failed to create customer record:', error);
  // Signup continues
}
```

### Transactional CRM Sync

Form submissions use database transactions to ensure consistency:

```typescript
try {
  await prisma.$transaction(async (tx) => {
    // All 3 records created together
    // If any fails, all are rolled back
    const formSubmission = await tx.formSubmission.create({ /* ... */ });
    const lead = await tx.lead.create({ /* ... */ });
    const notification = await tx.crmNotification.create({ /* ... */ });
    return { formSubmission, lead, notification };
  });
} catch (error) {
  console.error('Transaction failed:', error);
  return NextResponse.json({ error: '...' }, { status: 500 });
}
```

---

## 12. Monitoring & Alerts

### Key Metrics to Monitor

```sql
-- Daily new leads
SELECT DATE(created_at) as date, COUNT(*) as count
FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Lead status distribution
SELECT status, COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY count DESC;

-- Unprocessed notifications (potential issues)
SELECT COUNT(*) as pending_notifications
FROM crm_notifications
WHERE read = false AND created_at < NOW() - INTERVAL '1 hour';

-- Conversion funnel
SELECT 
  'Total Leads' as stage, COUNT(*) as count FROM leads
UNION ALL
SELECT 'Contacted' as stage, COUNT(*) FROM leads WHERE status IN ('CONTACTED', 'QUALIFIED', 'CONVERTED')
UNION ALL
SELECT 'Qualified' as stage, COUNT(*) FROM leads WHERE status IN ('QUALIFIED', 'CONVERTED')
UNION ALL
SELECT 'Converted' as stage, COUNT(*) FROM leads WHERE status = 'CONVERTED';
```

---

## 13. Related Documentation

- **Authentication:** See `/docs/authentication.md` for user/customer creation
- **Form Submission:** See `/docs/form-submission.md` for form type details
- **Analytics:** See `/docs/analytics-tracking.md` for event tracking
- **Admin Dashboard:** See admin features in `/app/admin/crm-sync/page.tsx`

---

## 14. Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `/prisma/schema.prisma` | CRM database schema (Customer, Lead, NewsletterSubscriber, CrmNotification) |
| `/lib/constants/form-types.ts` | Form types and lead scoring configuration |
| `/app/api/forms/submit/route.ts` | Form submission with auto-CRM sync |
| `/api/auth/register/route.ts` | Registration with auto-customer creation |
| `/api/newsletter-subscribe/route.ts` | Newsletter with dual record creation |
| `/app/admin/crm-sync/page.tsx` | Admin dashboard for CRM visibility |
| `/api/admin/crm-sync/route.ts` | Protected API for CRM statistics |

### Common Queries

```typescript
// Find lead by email
const lead = await prisma.lead.findFirst({
  where: { email: 'customer@company.com' }
});

// Get high-score leads (sales priority)
const highPriorityLeads = await prisma.lead.findMany({
  where: { leadScore: { gte: 70 }, status: 'NEW' },
  orderBy: { leadScore: 'desc' }
});

// Get customer with linked quotes
const customer = await prisma.customer.findUnique({
  where: { id: customerId },
  include: { quotes: true }
});

// Count leads by type
const leadsByType = await prisma.lead.groupBy({
  by: ['type'],
  _count: true,
  orderBy: { _count: { _all: 'desc' } }
});
```

---

## 15. Future Enhancements

Potential improvements not yet implemented:

- [ ] Lead scoring automation based on engagement
- [ ] AI-powered lead qualification
- [ ] Automated email campaigns based on lead status
- [ ] Salesforce integration
- [ ] Slack notifications for high-priority leads
- [ ] Lead reassignment workflows
- [ ] A/B testing for form variations
- [ ] Custom CRM fields
- [ ] Lead source attribution modeling

