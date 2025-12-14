# Resend SMTP Setup Guide

Your email service is now configured to use **Resend's SMTP server** instead of the REST API. This provides better compatibility with existing SMTP tooling and client libraries.

## Configuration

### Email Service Code (`src/lib/email-service.ts`)

The email service has been updated to use Nodemailer with Resend's SMTP settings:

```typescript
// Resend SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true, // TLS encryption
  auth: {
    user: 'resend',
    password: process.env.RESEND_API_KEY, // Your Resend API key
  },
});
```

### Key Details

| Setting | Value |
|---------|-------|
| **SMTP Host** | `smtp.resend.com` |
| **SMTP Port** | `465` (TLS encrypted) |
| **Username** | `resend` |
| **Password** | Your `RESEND_API_KEY` |
| **Encryption** | TLS/SSL |

## Environment Setup

### 1. Get Your Resend API Key

If you haven't already:

1. Visit [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Go to **API Keys** in your dashboard
4. Copy your API key (format: `re_xxxxxxxxxxxxxxxxxxxxx`)

### 2. Update `.env.local`

Add or update these environment variables:

```env
# Resend SMTP Configuration
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
EMAIL_FROM=noreply@bzion.com
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
NEXT_PUBLIC_APP_URL=https://bzion.com
```

### 3. Restart Your Development Server

```bash
npm run dev
```

The server will reload and use the Resend SMTP configuration.

## Email Sending Features

The email service now supports:

- ✅ **Password Reset Emails** - Sends reset token with secure link
- ✅ **Email Verification** - Confirms user email addresses
- ✅ **Welcome Emails** - Greets new users after signup
- ✅ **Password Changed Confirmation** - Notifies of password changes
- ✅ **HTML Templates** - Professional formatted emails
- ✅ **Plain Text Fallback** - Graceful degradation for text-only clients
- ✅ **Development Mode** - Console logging when API key not configured

### Email Functions

All email functions maintain the same interface:

```typescript
// Password Reset
await sendPasswordResetEmail(email, resetToken);

// Email Verification
await sendEmailVerificationEmail(email, verificationToken);

// Welcome
await sendWelcomeEmail(email, firstName);

// Password Changed
await sendPasswordChangedEmail(email);
```

## Testing Your SMTP Configuration

### Method 1: Test with cURL

```bash
# Test SMTP connection
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@bzion.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test message</p>"
  }'
```

### Method 2: Test Through Application

1. **Start your server**: `npm run dev`
2. **Go to signup**: Navigate to `/signup`
3. **Create account**: Enter email and password
4. **Check for email**: Look in your inbox for verification email
5. **Monitor console**: Check terminal for `✅ Email sent:` confirmation

### Method 3: Use Resend Dashboard

1. Visit [https://resend.com/emails](https://resend.com/emails)
2. View all emails sent through your account
3. Check delivery status, opens, clicks, and other analytics
4. See real-time logs of SMTP connections

## Benefits of Resend SMTP

| Benefit | Details |
|---------|---------|
| **Compatibility** | Works with any SMTP client or library |
| **Reliability** | 99.9% uptime SLA with automatic retries |
| **Analytics** | Built-in email delivery tracking and analytics |
| **Security** | TLS encryption, IP whitelisting, DKIM signing |
| **Webhooks** | Real-time delivery notifications and events |
| **Free Tier** | 100 emails/day with full feature access |
| **No Setup** | No DNS records, SPF/DKIM configuration needed |
| **Simplicity** | Single API key for all authentication |

## Troubleshooting

### "RESEND_API_KEY not configured"

**Issue**: Email service logs `❌ RESEND_API_KEY not configured in environment variables`

**Solution**:
1. Verify `.env.local` has `RESEND_API_KEY=re_xxxxx`
2. Restart your dev server: `npm run dev`
3. Check that the file doesn't have `RESEND_API_KEY=` with empty value

### "Authentication failed"

**Issue**: SMTP connection fails with authentication error

**Solution**:
1. Verify API key is correct (starts with `re_`)
2. Copy-paste directly from Resend dashboard to avoid typos
3. Ensure no extra spaces or quotes around the key
4. Check API key hasn't expired (Resend keys don't expire)

### "Connection timeout"

**Issue**: SMTP connection times out or cannot reach server

**Solution**:
1. Verify firewall allows outbound connections on port 465
2. Check internet connectivity: `ping smtp.resend.com`
3. Try using port 587 (alternative): Update `port: 587` and `secure: false`
4. Check Resend status: [https://resend.com/status](https://resend.com/status)

### "No emails received"

**Issue**: Emails sent successfully but not appearing in inbox

**Solution**:
1. Check spam/junk folder
2. Verify recipient email address is correct
3. Check Resend dashboard for delivery status and errors
4. Try sending test email through Resend dashboard directly
5. Add sender address to contacts (some email clients auto-file unknown senders)

### "Development mode emails not logging"

**Issue**: Console shows no email logs in development

**Solution**:
1. Verify `NODE_ENV=development` (default for `npm run dev`)
2. Check that `RESEND_API_KEY` is missing (falls back to console logging)
3. Look in terminal/console, not browser console
4. Ensure `sendEmail()` function is being called

## SMTP Port Alternatives

Resend supports both standard SMTP ports:

```typescript
// Option 1: Port 465 (recommended, TLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
});

// Option 2: Port 587 (STARTTLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
});
```

## Rate Limiting

Resend applies rate limiting based on your plan:

- **Free Plan**: 100 emails/day
- **Growth Plan**: Up to 10,000 emails/month
- **Production**: Custom limits

The application implements additional rate limiting at the endpoint level (5 requests per 15 minutes per IP).

## Security Best Practices

### API Key Protection

1. **Never commit** `.env.local` to version control
2. **Use `.gitignore`**: Add `.env.local` to prevent accidental commits
3. **Rotate keys** periodically in Resend dashboard
4. **Environment-specific keys**: Use different keys for dev/staging/production
5. **Monitor usage**: Check Resend dashboard for unusual activity

### Email Verification

1. **Verify email ownership**: All signup users receive verification emails
2. **Token expiration**: Tokens expire after 24 hours
3. **Single-use tokens**: Each token can only verify once
4. **Rate limiting**: Users can resend verification every 60 seconds

### Password Reset

1. **Short expiry**: Reset tokens expire after 1 hour
2. **Single-use**: Token becomes invalid after first use
3. **Email confirmation**: Users reset only their own account
4. **Rate limiting**: 5 requests per 15 minutes per IP

## Monitoring and Analytics

### View Email Metrics

1. Log in to [https://resend.com](https://resend.com)
2. Go to **Emails** tab
3. See delivery status, bounce rate, open rate, click rate
4. Monitor for hard bounces or complaints

### Set Up Webhooks (Optional)

Resend webhooks notify your application of delivery events:

```typescript
// Example webhook event
{
  type: 'email.delivered',
  created_at: '2025-12-14T13:05:00Z',
  data: {
    from: 'noreply@bzion.com',
    to: 'user@example.com',
    status: 'delivered'
  }
}
```

Webhook setup in Resend dashboard: Settings → Webhooks → Add endpoint

## Migration from Previous Setup

If you were previously using:

- **Nodemailer + SMTP server**: No changes needed, configuration is similar
- **Resend REST API**: Drop-in replacement, all code remains the same
- **Other providers** (SendGrid, Mailgun): Update SMTP credentials to Resend

The email functions (`sendPasswordResetEmail`, `sendEmailVerificationEmail`, etc.) remain unchanged.

## Next Steps

1. ✅ Verify `.env.local` has `RESEND_API_KEY`
2. ✅ Restart development server: `npm run dev`
3. ✅ Test signup flow: Create new account
4. ✅ Check email verification: Look for verification email
5. ✅ Test forgot password: Use password reset flow
6. ✅ Monitor dashboard: View all emails at [https://resend.com/emails](https://resend.com/emails)

## Support

- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **SMTP Documentation**: [https://resend.com/docs/send-with-smtp](https://resend.com/docs/send-with-smtp)
- **Resend Status**: [https://status.resend.com](https://status.resend.com)
- **Email Verification Guide**: See `AUTHENTICATION_FLOW_COMPLETE.md`
- **Password Reset Guide**: See `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated**: December 14, 2025  
**Email Service**: Resend SMTP (nodemailer)  
**Node Package**: `nodemailer@^7.0.7`
