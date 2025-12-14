# Form Submission Documentation

## Overview

The B2B platform provides a unified form submission system that captures user inquiries, quote requests, and partnership opportunities. All form submissions automatically create corresponding Lead records and CRM notifications for the sales team.

---

## 1. Form Types

### Available Form Types

```typescript
// File: /lib/constants/form-types.ts

export const FORM_TYPES = {
  CONTACT_US: 'contact_us',           // General inquiries
  QUOTE_REQUEST: 'quote_request',     // Product pricing request
  PARTNERSHIP_INQUIRY: 'partnership_inquiry',  // Business partnership
} as const;
```

| Form Type | Code | Purpose | Lead Score | Priority | Use Case |
|-----------|------|---------|-----------|----------|----------|
| Contact Us | `contact_us` | General inquiry | 50 | NORMAL | Information requests |
| Quote Request | `quote_request` | Pricing/product request | 80 | HIGH | Sales opportunity |
| Partnership Inquiry | `partnership_inquiry` | Business partnership | 70 | NORMAL | B2B collaboration |

### Lead Type Mapping

Each form type maps to a Lead type in the CRM:

```typescript
export const getLeadTypeForFormType = (formType: FormType) => {
  switch (formType) {
    case FORM_TYPES.QUOTE_REQUEST:
      return 'QUOTE_REQUEST';
    case FORM_TYPES.PARTNERSHIP_INQUIRY:
      return 'PARTNERSHIP_INQUIRY';
    case FORM_TYPES.CONTACT_US:
    default:
      return 'CONTACT_US';
  }
};
```

---

## 2. Form Fields

### Core Fields

| Field | Type | Required | Validation | Max Length |
|-------|------|----------|-----------|-----------|
| `formType` | enum | Yes | One of: contact_us, quote_request, partnership_inquiry | - |
| `email` | string | Yes | Valid email format | 254 |
| `name` | string | No | Any text | 255 |
| `companyName` | string | No | Any text | 255 |
| `phone` | string | No | Any format | 20 |
| `message` | string | No | Any text | 5000 |
| `metadata` | object | No | JSON object (additional fields) | - |

### Validation Rules

```typescript
// Zod schema for server-side validation
const formSubmissionSchema = z.object({
  formType: z.enum(['contact_us', 'quote_request', 'partnership_inquiry'], {
    errorMap: () => ({
      message: 'formType must be one of: contact_us, quote_request, partnership_inquiry',
    }),
  }),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.any()).optional(),  // Allow additional fields
});
```

---

## 3. Form Submission Endpoint

### API Route

**Endpoint:** `POST /api/forms/submit`
**File:** `/app/api/forms/submit/route.ts`

### Request Format

```json
POST /api/forms/submit

{
  "formType": "quote_request",
  "email": "customer@company.com",
  "name": "John Smith",
  "companyName": "ABC Corporation",
  "phone": "+234-801-234-5678",
  "message": "Need quote for bulk order",
  "metadata": {
    "productCategory": "industrial_supplies",
    "intendedQuantity": 1000,
    "urgency": "high"
  }
}
```

### Response Format

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid email address, formType must be one of: contact_us, quote_request, partnership_inquiry"
}
```

**Rate Limited (429 Too Many Requests):**
```
HTTP 429
Retry-After: 120
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Failed to submit form"
}
```

### Response Headers

```
Content-Type: application/json
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 120  (if rate limited)
```

---

## 4. Form Submission Process

### Complete Flow

```
1. Client Validation
   ├─ Check required fields (formType, email)
   └─ Validate email format

2. Send POST /api/forms/submit
   │
   └─→ Server Processing

3. Server-Side Validation
   ├─ Parse JSON body
   ├─ Validate with Zod schema
   └─ Return 400 if invalid

4. Rate Limiting Check
   ├─ Check IP address (x-forwarded-for header)
   ├─ Verify 10 requests per 15 minutes
   └─ Return 429 if exceeded

5. Database Operations (Transactional)
   ├─ Create FormSubmission record
   ├─ Create Lead record
   ├─ Create CrmNotification record
   └─ All succeed or all rollback

6. Response
   ├─ Return 201 success
   └─ Client receives confirmation

7. Post-Submission
   ├─ BZION_HUB system receives notification
   ├─ Sales team alerted (priority based on score)
   └─ Lead visible in admin dashboard
```

### Step-by-Step Code Flow

```typescript
// 1. Parse and validate request
const body = await request.json();
const validation = formSubmissionSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
    { success: false, error: 'Validation error' },
    { status: 400 }
  );
}

// 2. Rate limit check
const ip = request.headers.get('x-forwarded-for') || 'anonymous';
const { success: rateLimitSuccess } = await checkRateLimit(ip, 'api');

if (!rateLimitSuccess) {
  return NextResponse.json(
    { success: false, error: 'Too many form submissions' },
    { status: 429 }
  );
}

// 3. Calculate lead score
const leadScore = LEAD_SCORE_MAP[formType];
// contact_us → 50, quote_request → 80, partnership_inquiry → 70

// 4. Create records in transaction
const result = await prisma.$transaction(async (tx) => {
  // FormSubmission: Raw form data
  const formSubmission = await tx.formSubmission.create({
    data: {
      formType,
      data: { email, name, companyName, phone, message, ...metadata },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
      status: 'NEW',
    },
  });

  // Lead: CRM sales pipeline record
  const lead = await tx.lead.create({
    data: {
      email,
      name,
      companyName,
      phone,
      type: getLeadTypeForFormType(formType),  // QUOTE_REQUEST, etc.
      source: 'web_form',
      status: 'NEW',
      leadScore,  // Used for prioritization
      metadata: {
        formSubmissionId: formSubmission.id,
        formType,
        ...metadata,
      },
    },
  });

  // CrmNotification: Alert BZION_HUB system
  const notification = await tx.crmNotification.create({
    data: {
      type: 'NEW_FORM_SUBMISSION',
      targetSystem: 'BZION_HUB',
      priority: getNotificationPriority(leadScore),  // HIGH if score > 70
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
        ipAddress: ip,
      },
    },
  });

  return { formSubmission, lead, notification };
});

// 5. Return success response (201)
return NextResponse.json(
  { success: true, message: 'Form submitted successfully' },
  { status: 201 }
);
```

---

## 5. Client-Side Form Implementation

### Form Component Pattern

```typescript
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ContactForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    formType: 'contact_us',
    email: '',
    name: '',
    companyName: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Client validation
      if (!formData.email) {
        toast.error('Email is required');
        setIsLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Thank you! We\'ll be in touch soon.');
        // Reset form
        setFormData({
          formType: 'contact_us',
          email: '',
          name: '',
          companyName: '',
          phone: '',
          message: '',
        });
      } else {
        toast.error(data.error || 'Failed to submit form');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="your@email.com"
        required
      />
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Your Name"
      />
      <input
        type="text"
        value={formData.companyName}
        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        placeholder="Company Name"
      />
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="+234-801-234-5678"
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Your message..."
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 6. Lead Scoring System

### Score Calculation

```typescript
// File: /lib/constants/form-types.ts

export const LEAD_SCORE_MAP: Record<FormType, number> = {
  [FORM_TYPES.CONTACT_US]: 50,           // General inquiry
  [FORM_TYPES.QUOTE_REQUEST]: 80,        // Active sales opportunity
  [FORM_TYPES.PARTNERSHIP_INQUIRY]: 70,  // Partnership inquiry
};

export const getNotificationPriority = (score: number): string => {
  return score > 70 ? 'HIGH' : 'NORMAL';
};
```

### Score Interpretation

| Score | Meaning | CRM Priority | Follow-up |
|-------|---------|-------------|-----------|
| 50 | Low intent | NORMAL | Email nurture |
| 70 | Medium intent | NORMAL | Sales call |
| 80 | High intent | HIGH | Urgent sales call |

### Dynamic Scoring (Future)

Scores can be enhanced with:
- Engagement metrics (page visits, video views)
- Company size (employee count)
- Industry classification
- Website behavior signals
- Historical interaction frequency

---

## 7. Database Records Created

### FormSubmission Record

```typescript
// Raw form submission data
{
  id: "form-123",
  formType: "quote_request",
  data: {
    email: "customer@company.com",
    name: "John Smith",
    companyName: "ABC Corp",
    phone: "+234-801-234-5678",
    message: "Need bulk pricing",
    metadata: { /* any additional fields */ }
  },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  status: "NEW",
  submittedAt: "2025-12-14T10:30:00Z"
}
```

### Lead Record

```typescript
// CRM lead for sales pipeline
{
  id: "lead-456",
  email: "customer@company.com",
  name: "John Smith",
  companyName: "ABC Corp",
  phone: "+234-801-234-5678",
  type: "QUOTE_REQUEST",           // From form type
  source: "web_form",
  status: "NEW",
  leadScore: 80,                   // From LEAD_SCORE_MAP
  assignedTo: null,                // Unassigned initially
  metadata: {
    formSubmissionId: "form-123",
    formType: "quote_request",
    /* additional metadata */
  },
  createdAt: "2025-12-14T10:30:00Z",
  convertedAt: null
}
```

### CrmNotification Record

```typescript
// Alert to BZION_HUB system
{
  id: "notif-789",
  type: "NEW_FORM_SUBMISSION",
  targetSystem: "BZION_HUB",
  priority: "HIGH",                // score (80) > 70
  data: {
    formSubmissionId: "form-123",
    leadId: "lead-456",
    formType: "quote_request",
    email: "customer@company.com",
    name: "John Smith",
    companyName: "ABC Corp",
    phone: "+234-801-234-5678",
    leadScore: 80,
    submittedAt: "2025-12-14T10:30:00Z",
    ipAddress: "192.168.1.1"
  },
  read: false,
  readAt: null,
  createdAt: "2025-12-14T10:30:00Z"
}
```

---

## 8. Rate Limiting

### Configuration

```typescript
// API form submission rate limiting
const { success, headers } = await checkRateLimit(ip, 'api');

// Limit: 10 requests per 15 minutes per IP
// Storage: Upstash Redis
// Key: `${ip}:api`
```

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 120  (if limited)
```

### Error Response

```json
{
  "success": false,
  "error": "Too many form submissions. Please try again later."
}
```

---

## 9. Error Handling

### Validation Errors

| Error | Status | Message |
|-------|--------|---------|
| Invalid email | 400 | "Invalid email address" |
| Invalid form type | 400 | "formType must be one of: ..." |
| Missing required field | 400 | Field-specific error message |

### Processing Errors

| Error | Status | Message |
|--------|--------|---------|
| Rate limited | 429 | "Too many form submissions" |
| Database error | 500 | "Failed to submit form" |
| Transaction rollback | 500 | "Failed to submit form" |

### Error Response Example

```json
{
  "success": false,
  "error": "Invalid email address",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## 10. Toast Notifications (Frontend)

### Success Message

```
✓ Thank you! We'll be in touch soon.
```

### Error Messages

```
✗ Invalid email address
✗ Failed to submit form. Please try again.
✗ Too many submissions. Please try again later.
```

---

## 11. CRM Workflow

### Sales Team Actions Post-Submission

**In Admin Dashboard:** `/app/admin/crm-sync`

1. **New notification arrives** (if score > 70, marked HIGH)
2. **Sales rep reviews lead** in Leads tab
3. **Contact information visible:**
   - Email: customer@company.com
   - Name: John Smith
   - Company: ABC Corp
   - Phone: +234-801-234-5678
   - Lead Score: 80
   - Source: web_form
4. **Sales rep actions:**
   - Assign to self: `assignedTo = sales-rep@company.com`
   - Update status: NEW → CONTACTED
   - Increase score if qualified: 80 → 90
   - Mark converted: status = CONVERTED, convertedAt = now()

### Status Workflow

```
NEW
  ↓ (Sales rep contacts lead)
CONTACTED
  ↓ (Lead shows interest)
QUALIFIED
  ↓ (Deal moving forward)
CONVERTED
  ↓ (Sale closed)
CUSTOMER (if account created)

Alternative:
NEW → REJECTED (no interest)
```

---

## 12. Form Types and Use Cases

### Contact Us Form

**Purpose:** General inquiries and information requests

**Example Submission:**
```json
{
  "formType": "contact_us",
  "email": "info@company.com",
  "name": "Jane Doe",
  "companyName": "XYZ Trading",
  "message": "What are your business hours?",
  "phone": "+234-901-234-5678"
}
```

**Result:**
- Lead Score: 50 (NORMAL)
- Lead Type: CONTACT_REQUEST
- CRM Priority: NORMAL
- Sales Action: Email response, nurture track

### Quote Request Form

**Purpose:** Product pricing and availability inquiries

**Example Submission:**
```json
{
  "formType": "quote_request",
  "email": "procurement@company.com",
  "name": "John Smith",
  "companyName": "ABC Manufacturing",
  "phone": "+234-801-234-5678",
  "message": "Need quote for 500 units of SKU-12345",
  "metadata": {
    "products": ["SKU-12345", "SKU-67890"],
    "quantity": 500,
    "budget": "50000"
  }
}
```

**Result:**
- Lead Score: 80 (HIGH)
- Lead Type: QUOTE_REQUEST
- CRM Priority: HIGH
- Sales Action: Immediate callback, quote generation

### Partnership Inquiry Form

**Purpose:** Business partnership and collaboration proposals

**Example Submission:**
```json
{
  "formType": "partnership_inquiry",
  "email": "partnerships@company.com",
  "name": "Michael Johnson",
  "companyName": "Global Distributors Ltd",
  "phone": "+234-812-345-6789",
  "message": "Interested in becoming an official distributor in Nigeria",
  "metadata": {
    "distributorType": "regional",
    "yearsInBusiness": 15,
    "targetMarkets": ["Lagos", "Abuja"]
  }
}
```

**Result:**
- Lead Score: 70 (NORMAL)
- Lead Type: PARTNERSHIP_INQUIRY
- CRM Priority: NORMAL
- Sales Action: Partnership evaluation, meeting request

---

## 13. Best Practices

### Form Placement

```typescript
// Use on key pages
- `/` (homepage) - Contact Us form
- `/products/[slug]` - Quote Request form
- `/about` - Partnership inquiry form
- Dedicated `/contact` page - All forms available
```

### Form Data Validation (Frontend)

```typescript
// Before sending to API
const validateForm = (data) => {
  // Required fields
  if (!data.email) return 'Email is required';
  if (!data.formType) return 'Form type is required';

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return 'Invalid email format';

  // Phone format (optional but validate if provided)
  if (data.phone && data.phone.length < 10) return 'Invalid phone number';

  return null;  // Valid
};
```

### Metadata Usage

```typescript
// Add contextual data to submissions
const formData = {
  formType: 'quote_request',
  email: 'customer@company.com',
  name: 'John Smith',
  companyName: 'ABC Corp',
  message: 'Quote request',
  metadata: {
    // Product information
    selectedProducts: ['SKU-123', 'SKU-456'],
    intendedQuantity: 1000,
    deliveryTimeframe: 'ASAP',

    // Page context
    sourceUrl: '/products/industrial-supplies',
    referrer: 'google.com',

    // Behavioral data
    timeOnSite: 300,  // seconds
    pagesVisited: 5,

    // Custom fields
    industryType: 'manufacturing',
    employeeCount: '50-100'
  }
};
```

### Response Handling

```typescript
const response = await fetch('/api/forms/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});

if (response.status === 201) {
  // Success - reset form
  resetForm();
  toast.success('Form submitted successfully!');
} else if (response.status === 400) {
  // Validation error - show field errors
  const data = await response.json();
  data.details?.forEach(error => {
    toast.error(`${error.field}: ${error.message}`);
  });
} else if (response.status === 429) {
  // Rate limited
  toast.error('Too many submissions. Please try again in 15 minutes.');
} else {
  // Server error
  toast.error('Failed to submit form. Please try again.');
}
```

---

## 14. Monitoring & Analytics

### Form Submission Metrics

```sql
-- Daily submissions by form type
SELECT 
  DATE(submitted_at) as date,
  form_type,
  COUNT(*) as count
FROM form_submissions
WHERE submitted_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(submitted_at), form_type
ORDER BY date DESC;

-- Submission status distribution
SELECT status, COUNT(*) as count
FROM form_submissions
GROUP BY status;

-- Lead conversion rate by form type
SELECT 
  l.type,
  COUNT(*) as total_leads,
  SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) as converted,
  ROUND(
    100.0 * SUM(CASE WHEN l.status = 'CONVERTED' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as conversion_rate
FROM leads l
WHERE l.source = 'web_form'
GROUP BY l.type;

-- High-value leads (score > 70)
SELECT 
  COUNT(*) as count,
  SUM(CASE WHEN status = 'CONTACTED' THEN 1 ELSE 0 END) as contacted,
  SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as converted
FROM leads
WHERE lead_score > 70;
```

---

## 15. Troubleshooting

### Problem: Form submission fails with 400 error

**Cause:** Invalid form data
**Solution:** Check validation error details in response, ensure:
- Email is valid format
- formType is one of: contact_us, quote_request, partnership_inquiry
- All required fields present

### Problem: Rate limit (429) error

**Cause:** Too many submissions from same IP
**Solution:** Wait 15 minutes before submitting again (per IP)

### Problem: Form submits but no lead created

**Cause:** Database/transaction error
**Check:** 
- Database connection (`DATABASE_URL` env var set)
- Prisma migrations up to date
- Lead table exists and accessible

### Problem: CRM notification not appearing in BZION_HUB

**Cause:** System hasn't processed notification yet
**Solution:** 
- Check `crm_notifications` table for unread records
- Verify `read` = false
- Check `targetSystem` = 'BZION_HUB'

---

## 16. Related Documentation

- **CRM Integration:** See `/docs/crm-integration.md` for lead and customer models
- **Authentication:** See `/docs/authentication.md` for user management
- **Analytics:** See `/docs/analytics-tracking.md` for form submission tracking
- **Admin Dashboard:** See `/app/admin/crm-sync/page.tsx` for sales team interface

---

## 17. Quick Reference

### Constants File

```typescript
// /lib/constants/form-types.ts
export const FORM_TYPES = {
  CONTACT_US: 'contact_us',
  QUOTE_REQUEST: 'quote_request',
  PARTNERSHIP_INQUIRY: 'partnership_inquiry',
};

export const LEAD_SCORE_MAP = {
  contact_us: 50,
  quote_request: 80,
  partnership_inquiry: 70,
};

export const FORM_TYPE_LABELS = {
  contact_us: 'Contact Us',
  quote_request: 'Quote Request',
  partnership_inquiry: 'Partnership Inquiry',
};
```

### API Endpoint Summary

```
POST /api/forms/submit

Rate Limit: 10 requests per 15 minutes per IP
Response: 201 (success), 400 (validation), 429 (rate limited), 500 (error)
Creates: FormSubmission + Lead + CrmNotification (transactional)
```

### Example cURL Request

```bash
curl -X POST http://localhost:3000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "quote_request",
    "email": "customer@company.com",
    "name": "John Smith",
    "companyName": "ABC Corp",
    "phone": "+234-801-234-5678",
    "message": "Need quote for bulk order"
  }'
```

