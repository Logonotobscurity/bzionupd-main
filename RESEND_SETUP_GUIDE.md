# Resend Email Service Setup Guide

## 🚀 Quick Setup

### 1. Install Resend Package
```bash
npm install resend
```

### 2. Get API Key from Resend
- Visit: https://resend.com
- Sign up for free account
- Go to API Keys section
- Create new API key
- Copy the key (starts with `re_`)

### 3. Add Environment Variable
In your `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@bzion.com
NEXT_PUBLIC_APP_URL=https://bzion.com
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
```

### 4. Configure Sender Email
Resend requires domain verification for production emails:

**Option A: Use Resend Domain (Development)**
- Use default: `onboarding@resend.dev` (for testing)
- Set `EMAIL_FROM=onboarding@resend.dev` in `.env.local`

**Option B: Verify Your Domain (Production)**
1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `bzion.com`)
3. Add DNS records shown in dashboard
4. Wait for verification (usually 5-30 minutes)
5. Use email like: `noreply@bzion.com`

### 5. Test Email Sending
```typescript
import { sendPasswordResetEmail } from '@/lib/email-service';

// Test in your API route or component
const success = await sendPasswordResetEmail('test@example.com', 'test-token');
console.log(success ? '✅ Email sent!' : '❌ Failed to send');
```

---

## 📋 Environment Variables

```env
# Required for Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=noreply@bzion.com
NEXT_PUBLIC_APP_URL=https://bzion.com
NEXT_PUBLIC_APP_NAME=BZION B2B Platform

# Optional (used for development mode fallback)
NODE_ENV=development|production
```

---

## ✅ Features

- ✅ **Free tier**: 100 emails/day
- ✅ **Simple API**: Only 1 line to send email
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Reliable**: 99.9% uptime SLA
- ✅ **Fast**: Emails delivered in <1 second
- ✅ **Analytics**: Open rates, click tracking
- ✅ **Webhooks**: Track delivery, bounces, complaints
- ✅ **Domain verification**: No SPF/DKIM needed (Resend manages it)

---

## 🔧 Email Functions Available

All functions in `src/lib/email-service.ts`:

### 1. Password Reset Email
```typescript
await sendPasswordResetEmail(
  'user@example.com',
  'reset-token-from-database'
);
```
- Sent from: `/api/auth/forgot-password`
- Template: Password reset with 1-hour expiry
- Link: `/reset-password?token={token}`

### 2. Email Verification
```typescript
await sendEmailVerificationEmail(
  'user@example.com',
  'verification-token-from-database'
);
```
- Sent from: `/api/auth/register`
- Template: Email verification with 24-hour expiry
- Link: `/verify-email?token={token}`

### 3. Welcome Email
```typescript
await sendWelcomeEmail(
  'user@example.com',
  'John' // firstName (optional)
);
```
- Sent from: `/api/auth/register`
- Template: Welcome message with platform features

### 4. Password Changed Confirmation
```typescript
await sendPasswordChangedEmail('user@example.com');
```
- Sent from: `/api/auth/reset-password`
- Template: Password change confirmation

---

## 📧 Email Templates

All templates are HTML + plain text fallback.

### Design Features
- Responsive for mobile/desktop
- Brand colors and logo support
- Clear call-to-action buttons
- Security warnings where appropriate
- Support contact information
- Professional layout

### Customization
Edit in `src/lib/email-service.ts`:
- Change colors, fonts, logos
- Add custom variables
- Modify button text
- Update support email/phone

---

## 🧪 Testing

### Development Mode
If `RESEND_API_KEY` is not set and `NODE_ENV=development`:
- Emails log to console instead of sending
- Useful for testing without API key
- Shows `to`, `subject`, `from`

### Test Email Address
Resend provides test emails:
```
delivered@resend.dev     // Always succeeds
bounced@resend.dev       // Bounce simulation
complained@resend.dev    // Complaint simulation
ooo@resend.dev          // Out of office
```

### Send Test Email
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"delivered@resend.dev"}'
```

---

## 🔐 Security

### API Key Safety
- Never commit API keys to git
- Store only in `.env.local` (not in git)
- Rotate keys regularly
- Use separate keys for dev/prod

### Domain Verification
- Resend manages SPF/DKIM automatically
- No manual DNS configuration needed
- Prevents spoofing and improves deliverability

### Rate Limiting
- Built-in per endpoint
- Free tier: 100 emails/day
- Paid: Up to millions/day
- Contact Resend for higher limits

---

## 📊 Monitoring

### Resend Dashboard
Monitor in real-time:
- Emails sent
- Open rates
- Click rates
- Bounce rate
- Failed deliveries

### Webhooks (Optional)
Set up webhooks to track:
- `email.sent` - Email delivered to server
- `email.delivered` - Email delivered to recipient
- `email.opened` - Email opened by recipient
- `email.clicked` - Link clicked in email
- `email.bounced` - Email bounced
- `email.complained` - User marked as spam

Dashboard → Webhooks → Add endpoint

---

## 🐛 Troubleshooting

### "API key not configured"
**Problem**: `RESEND_API_KEY` not set
**Solution**: 
1. Add key to `.env.local`
2. Restart development server (`npm run dev`)

### "Invalid sender email"
**Problem**: `EMAIL_FROM` not verified
**Solution**:
1. For testing: Use `onboarding@resend.dev`
2. For production: Verify your domain in Resend Dashboard

### "Email not received"
**Checklist**:
1. Check Resend dashboard for delivery status
2. Verify email address is correct
3. Check spam folder
4. Check Resend logs for errors
5. Ensure API key is valid

### Rate limit exceeded
**Problem**: Exceeded 100 emails/day on free tier
**Solution**:
1. Upgrade to paid plan
2. Use `onboarding@resend.dev` for testing (higher limit)
3. Contact Resend support

---

## 💰 Pricing

| Plan | Price | Emails/Day | Features |
|------|-------|-----------|----------|
| Free | $0 | 100 | Basic sending |
| Pro | $20/mo | Unlimited | Analytics, webhooks |

---

## 🔗 Resources

- **Official Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Email Testing**: https://resend.com/emails/preview
- **Status Page**: https://status.resend.com
- **Support**: https://resend.com/support

---

## 📝 Implementation Checklist

- [ ] Install `npm install resend`
- [ ] Create Resend account at resend.com
- [ ] Get API key from Resend dashboard
- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Set `EMAIL_FROM` to your sender email
- [ ] Test with `onboarding@resend.dev` (development)
- [ ] Verify your domain for production
- [ ] Update `EMAIL_FROM` with verified domain
- [ ] Test complete authentication flows
- [ ] Set up webhooks (optional)
- [ ] Monitor dashboard for delivery
- [ ] Set up error logging/alerts

---

**Setup Date**: December 14, 2025
**Status**: Ready for Development ✅
