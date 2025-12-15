# Quick Reference Guide - Email Service & Codebase

## 🚀 Email Service - 30-Second Setup

```env
# .env.local
RESEND_API_KEY=re_your_api_key
EMAIL_FROM="BZION <noreply@bzionshop.com>"
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
```

**Test it:**
```bash
curl http://localhost:3000/api/health/email
```

---

## 📧 Email Functions Cheat Sheet

```typescript
// Test connection
import { testSMTPConnection } from '@/lib/email-service';
const result = await testSMTPConnection();

// Send verification email
import { sendEmailVerificationEmail } from '@/lib/email-service';
await sendEmailVerificationEmail('user@example.com', 'token123');

// Send password reset
import { sendPasswordResetEmail } from '@/lib/email-service';
await sendPasswordResetEmail('user@example.com', 'reset-token');

// Send test email
import { sendTestEmail } from '@/lib/email-service';
await sendTestEmail('test@example.com');
```

---

## 📁 Store Architecture (After Consolidation)

```
src/
├── stores/                    ✅ Single source of truth
│   ├── authStore.ts          (Authentication state)
│   ├── activity.ts           (User activity)
│   ├── quoteStore.ts         (Quote/RFQ management) ⭐
│   ├── cartStore.ts          (Shopping cart)
│   ├── menuStore.ts          (Navigation)
│   ├── preferencesStore.ts   (User preferences)
│   └── uiStore.ts            (UI state)
│
├── lib/
│   ├── api/                  ⚠️ Consider renaming to "integrations"
│   │   ├── email.ts          (Email helpers)
│   │   └── whatsapp.ts       (WhatsApp helpers)
│   │
│   ├── store/                ❌ DEPRECATED (ready for deletion)
│   │   ├── auth.ts
│   │   ├── activity.ts
│   │   └── quote.ts
│   │
│   └── email-service.ts      ✅ Enhanced with SMTP config
│
└── app/
    └── api/
        ├── auth/             (Auth endpoints)
        ├── health/
        │   └── email/        ✅ NEW: Email testing
        └── ...
```

---

## 🔌 Port Configuration Quick Guide

| Port | Protocol | When to Use | Config |
|------|----------|------------|--------|
| **465** | SSL/TLS | ✅ Always (production) | `secure: true` |
| 587 | STARTTLS | Fallback only | `secure: false` |
| 25 | None | ❌ Never (insecure) | - |
| 2465 | SSL/TLS | Non-standard | Rare |
| 2587 | STARTTLS | Non-standard | Rare |

---

## 🧪 Testing Commands

```bash
# Test SMTP connection
curl http://localhost:3000/api/health/email

# Send test email (development)
curl -X POST http://localhost:3000/api/health/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'

# Check in Resend dashboard
# https://resend.com/emails
```

---

## 🔄 Store Import Patterns

### ✅ Correct (After consolidation)
```typescript
import { useQuoteStore } from '@/stores/quoteStore';
import { useAuthStore } from '@/stores/authStore';
import { useActivityStore } from '@/stores/activity';
```

### ❌ Wrong (Old pattern - avoid)
```typescript
import { useQuoteStore } from '@/lib/store/quote';      // ❌ Deprecated
import { useAuthStore } from '@/lib/store/auth';        // ❌ Deprecated
import { useActivityStore } from '@/lib/store/activity'; // ❌ Deprecated
```

---

## 📊 Configuration Summary

### Email Configuration
```
Host: smtp.resend.com
Port: 465 ✅
Encryption: TLS (secure: true)
Username: resend
Auth: API Key
Status: Production Ready ✅
```

### Rate Limiting
```
Auth endpoints: 5 req/15 min
API endpoints: 10 req/10 sec
RFQ endpoints: 3 req/1 hour
```

### Caching (TTL)
```
Products: 5 minutes
Brands: 1 hour
Categories: 1 hour
Companies: 1 hour
```

---

## 🎯 Common Tasks

### Add New Email Type
```typescript
// 1. Add function to src/lib/email-service.ts
export async function sendMyCustomEmail(email: string) {
  return sendEmail({
    to: email,
    subject: 'My Custom Email',
    html: '<p>Custom content</p>'
  });
}

// 2. Use in your route
import { sendMyCustomEmail } from '@/lib/email-service';
await sendMyCustomEmail('user@example.com');
```

### Access Store State
```typescript
// In component
import { useQuoteStore } from '@/stores/quoteStore';

export function MyComponent() {
  const { items, addProduct, removeProduct } = useQuoteStore();
  // Use store methods...
}
```

### Test Email Connection
```typescript
import { testSMTPConnection } from '@/lib/email-service';

// In API route or component
const result = await testSMTPConnection();
console.log(result); // { success: boolean, ... }
```

---

## 📋 Checklist for Deployment

### Before Going Live
- [ ] Test email sending in development
- [ ] Verify RESEND_API_KEY is set in production
- [ ] Check EMAIL_FROM is configured
- [ ] Test /api/health/email endpoint
- [ ] Monitor first emails in Resend dashboard
- [ ] Verify email arrives in inbox
- [ ] Check spam folder if not received

### After Going Live
- [ ] Monitor email deliverability
- [ ] Set up bounce handling
- [ ] Monitor failed emails
- [ ] Review analytics in Resend
- [ ] Add email preference management

---

## 🐛 Quick Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "RESEND_API_KEY not set" | Missing env var | Add to .env.local |
| "Socket hang up" | Timeout | Increase SMTP_TIMEOUT |
| "535 Authentication failed" | Wrong API key | Verify key starts with re_ |
| "Certificate validation failed" | TLS issue | In dev mode, this is expected |
| Email not received | Wrong address/rate limit | Check logs and console |

---

## 📚 Documentation Map

| Document | Purpose | Read if... |
|----------|---------|-----------|
| SMTP_PORT_CONFIGURATION.md | Port options & security | Configuring SMTP |
| EMAIL_SERVICE_TESTING_GUIDE.md | Testing & integration | Testing or debugging |
| EMAIL_SERVICE_CONFIGURATION.md | Current setup details | Understanding config |
| CODEBASE_CONSOLIDATION.md | Store consolidation | Learning structure |
| EMAIL_PORT_AND_CONSOLIDATION_SUMMARY.md | This project overview | Reviewing changes |

---

## 🚀 Next Steps

1. **Verify Setup** → Run health check
2. **Send Test Email** → Use POST endpoint
3. **Check Inbox** → Verify delivery
4. **Monitor Dashboard** → Watch Resend
5. **Integrate in Flows** → Use in registration, password reset
6. **Set Up Alerts** → Monitor failures

---

## 💡 Pro Tips

✅ **Port 465** - Use this. It's the standard and most secure.

✅ **Email Testing** - Use the `/api/health/email` endpoint for quick tests.

✅ **Monitor Resend** - Always check https://resend.com/emails for delivery status.

✅ **Store Usage** - Zustand stores are performant; use them freely without performance worries.

✅ **Rate Limiting** - Already set up; no additional work needed.

---

## 🎓 Key Concepts

**SMTP Ports:**
- **465 (SSL/TLS)**: Connection starts encrypted (implicit) - use this
- **587 (STARTTLS)**: Connection starts plain, then upgrades (explicit) - use only if needed
- **25 (SMTP)**: Unencrypted, internal only - never use

**Store Pattern:**
- Zustand is a lightweight state management library
- Stores persist data using browser localStorage
- Multiple independent stores for different features
- `useStore()` hooks from `@/stores/`

**Email Service:**
- Resend SMTP via nodemailer
- 100 emails/day free tier
- Production-ready infrastructure
- Full analytics and webhooks

---

## 📞 Support

### For Email Issues
1. Check RESEND_API_KEY in .env.local
2. Test with `/api/health/email`
3. Check console logs
4. View in Resend dashboard

### For Store Issues
1. Verify import path: `@/stores/...`
2. Check browser DevTools
3. Use React DevTools extension

### For SMTP Issues
1. Check port configuration (should be 465)
2. Verify secure: true
3. Check connection timeout
4. Review SMTP_PORT_CONFIGURATION.md

