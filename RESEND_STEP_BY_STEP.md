# Email Service Migration to Resend - Step-by-Step Guide

## 📋 Complete Setup in 5 Minutes

### Step 1: Install Resend Package (30 seconds)

```bash
npm install resend
```

**What this does**: Adds Resend's email sending library to your project.

---

### Step 2: Create Resend Account (2 minutes)

1. Go to: https://resend.com
2. Click "Sign Up" (free account)
3. Enter email and password
4. Verify email address
5. You're done! ✅

---

### Step 3: Get API Key (1 minute)

1. Log in to https://resend.com/dashboard
2. Click on "API Keys" in left sidebar
3. Click "Create API Key"
4. Give it a name: `BZION Development`
5. Copy the key (starts with `re_`)
6. Save it somewhere safe (you'll need it next)

**Your key looks like**: `re_aBcDeFgHiJkLmNoPqRsTuVwXyZ`

---

### Step 4: Add Environment Variable (1 minute)

Open `.env.local` in your project root:

```env
# Email Service (Resend)
RESEND_API_KEY=re_aBcDeFgHiJkLmNoPqRsTuVwXyZ
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
```

**Note**: 
- `EMAIL_FROM=onboarding@resend.dev` is the **testing email** (always works)
- After you verify your domain, you can use `noreply@bzion.com`

**Don't have .env.local?** Create a new file at project root with above content.

---

### Step 5: Restart Development Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**You should see**:
```
> next dev --turbopack -p 3000
  ▲ Next.js 16.0.8
  ▲ using Turbopack
  ✓ Ready in XXXms
```

---

## ✅ Verification - Test It!

### Test 1: Check email sending works

Go to: http://localhost:3000/forgot-password

1. Enter any email: `test@example.com`
2. Click "Send Reset Link"
3. You should see: "Check your email for password reset link"

**Check the logs**:
- You should see in terminal: `✅ Email sent: mail_xxxxxxxxxxxxx`

### Test 2: Verify in Resend Dashboard

1. Go to: https://resend.com/dashboard
2. Click "Emails"
3. You should see your test email in the list
4. Click on it to see details

### Test 3: Test with Real Email

For testing, use Resend's test emails:

In forgot-password form, use: `delivered@resend.dev`

Then check Resend dashboard → Emails → See it marked as "Delivered"

---

## 🎯 Next: Verify Your Domain (Optional, for Production)

Once you're ready for production:

### Step 1: Add Your Domain to Resend

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain: `bzion.com`
4. Click "Add"

### Step 2: Add DNS Records

Resend shows 3 DNS records to add:
- CNAME record
- SPF record (sometimes combined)
- DKIM record (sometimes combined)

Add these to your domain registrar (GoDaddy, Namecheap, Route53, etc.)

### Step 3: Wait for Verification

- Wait 5-30 minutes
- Resend automatically verifies
- Status changes to "Verified" ✅

### Step 4: Update .env.local

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@bzion.com    # Now use your domain!
```

### Step 5: Restart Server

```bash
npm run dev
```

---

## 🔍 Troubleshooting

### ❌ "RESEND_API_KEY not configured"

**Solution**:
1. Double-check `.env.local` has `RESEND_API_KEY=re_xxxxx`
2. Restart dev server (Ctrl+C, then `npm run dev`)
3. Make sure key is copied exactly (no extra spaces)

### ❌ "Email not received"

**Checklist**:
1. ✅ Check your email spam folder
2. ✅ Verify API key is correct in `.env.local`
3. ✅ Restart dev server after adding key
4. ✅ Use `onboarding@resend.dev` for testing (always works)
5. ✅ Check Resend dashboard → Emails for delivery status

### ❌ "Invalid sender email"

**For Development**: 
- Use `EMAIL_FROM=onboarding@resend.dev` (provided by Resend)

**For Production**:
- Must verify domain first
- Then use `EMAIL_FROM=noreply@bzion.com`

### ❌ "Cannot find module 'resend'"

**Solution**:
```bash
npm install resend
npm run dev
```

---

## 📊 What to Expect

### Sent Email Template Examples

**Password Reset Email**:
```
Subject: Password Reset Request - BZION B2B Platform
From: noreply@bzion.com
Body: Contains reset link with 1-hour expiry
      "This link will expire in 1 hour for security reasons"
```

**Verification Email**:
```
Subject: Verify Your Email - BZION
From: noreply@bzion.com
Body: Contains verification link with 24-hour expiry
      "This link will expire in 24 hours"
```

**Welcome Email**:
```
Subject: Welcome to BZION!
From: noreply@bzion.com
Body: Welcome message with platform features
      Login button to dashboard
```

---

## 🎉 You're Ready!

Once you complete Step 5, you have:

✅ Email service fully configured
✅ Ready to test authentication flows
✅ Can send password resets
✅ Can send verification emails
✅ Can monitor in Resend dashboard

---

## 📚 Additional Resources

| Resource | Link |
|----------|------|
| Resend Docs | https://resend.com/docs |
| API Reference | https://resend.com/docs/api-reference |
| Dashboard | https://resend.com/dashboard |
| Pricing | https://resend.com/pricing |
| Status | https://status.resend.com |
| Support | https://resend.com/support |

---

## ⏱️ Time Breakdown

| Step | Time |
|------|------|
| Install Resend | 30 sec |
| Create account | 2 min |
| Get API key | 1 min |
| Add to .env | 1 min |
| Restart server | 30 sec |
| **Total** | **~5 minutes** ✅ |

---

## 🚀 Next Steps After Setup

1. **Test authentication flows**:
   - Visit `/register` and sign up
   - Check verification email
   - Visit `/forgot-password` and request reset
   - Check reset email

2. **Monitor in dashboard**:
   - View sent emails at https://resend.com/emails
   - Check delivery status
   - Monitor open rates

3. **For production**:
   - Verify your domain
   - Update `EMAIL_FROM` to your domain
   - Set up webhooks (optional)
   - Enable analytics

---

**Setup Guide**: December 14, 2025
**Difficulty**: ⭐ Easy
**Time**: ~5 minutes
**Status**: ✅ Ready to Go
