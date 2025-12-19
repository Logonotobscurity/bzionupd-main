# Email Service Quick Testing Guide

**Last Updated:** December 18, 2025

---

## 🚀 Quick Start

### 1. Verify Environment Setup
```bash
# Check if RESEND_API_KEY is set
echo $RESEND_API_KEY

# If empty, add to .env.local:
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@bzion.shop
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
```

### 2. Start Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

---

## 🧪 Test Scenarios

### Test 1: Health Check ✅
**Verify SMTP connection is working**

```bash
curl http://localhost:3000/api/health/email
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMTP connection verified",
  "details": {
    "host": "smtp.resend.com",
    "port": 465,
    "secure": true,
    "timestamp": "2025-12-18T10:00:00.000Z"
  }
}
```

### Test 2: Send Test Email ✅
**Send a test email to verify delivery**

```bash
curl -X POST http://localhost:3000/api/health/email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-test-email@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent to your-test-email@example.com"
}
```

### Test 3: Register User (sends 2 emails) 📧📧
**Register a new account - should trigger verification + welcome emails**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!@",
    "companyName": "Acme Corporation"
  }'
```

**Expected Behavior:**
- ✅ Response: 201 Created
- ✅ Message: "User created successfully. Check your email for verification."
- 📧 Email 1: Verification email with verify link (24hr expiry)
- 📧 Email 2: Welcome email with platform features

**Check Server Logs:**
```
✅ Verification email sent to john.doe@example.com
✅ Welcome email sent to john.doe@example.com
```

### Test 4: Forgot Password 🔐
**Request password reset - should send reset email**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link will be sent."
}
```

**Expected Behavior:**
- ✅ Response always returns success (no email enumeration)
- ✅ If user exists, generates reset token
- 📧 Email: Password reset with 1-hour expiry link
- 🔗 Link format: `http://localhost:3000/reset-password?token=xxxxx`

**Check Server Logs:**
```
✅ Password reset email sent to john.doe@example.com
```

### Test 5: Reset Password 🔄
**Complete password reset with token from email**

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "INSERT_TOKEN_FROM_EMAIL_HERE",
    "password": "NewSecurePass456!@",
    "confirmPassword": "NewSecurePass456!@"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Expected Behavior:**
- ✅ Validates token hasn't expired
- ✅ Validates passwords match
- ✅ Hashes new password with bcryptjs
- ✅ Updates user in database
- 📧 Email: Password changed confirmation
- ✅ Deletes reset token (one-time use)

**Check Server Logs:**
```
✅ Password changed email sent to john.doe@example.com
```

### Test 6: Password Changed Notification 🔔
**Manually trigger password change email**

```bash
curl -X POST http://localhost:3000/api/auth/password-changed \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password changed notification email sent."
}
```

**Expected Behavior:**
- 📧 Email: Password changed confirmation
- ✅ Can be triggered from account settings after password change

---

## 📊 Expected Email Types

### 1. Verification Email
- **Recipient:** New user email
- **Subject:** "Verify Your Email - BZION B2B Platform"
- **Trigger:** User registration
- **Content:**
  - Welcome message
  - Verification button (green)
  - Link with 24-hour expiry
  - Support contact info
- **Template:** HTML + Plain text

### 2. Welcome Email
- **Recipient:** New user email
- **Subject:** "Welcome to BZION B2B Platform!"
- **Trigger:** User registration (after verification sent)
- **Content:**
  - Welcome message with first name
  - Platform features list
  - Login button (blue)
  - Support contact info
  - Phone number and chat link
- **Template:** HTML + Plain text

### 3. Password Reset Email
- **Recipient:** User who requested reset
- **Subject:** "Password Reset Request - BZION B2B Platform"
- **Trigger:** User clicks "Forgot Password"
- **Content:**
  - Reset button (blue)
  - Link with 1-hour expiry
  - Security warning
  - Support contact info
- **Template:** HTML + Plain text

### 4. Password Changed Email
- **Recipient:** User who reset password
- **Subject:** "Password Changed - BZION B2B Platform"
- **Trigger:** Successful password reset
- **Content:**
  - Confirmation message
  - Success badge ✓
  - Security notice
  - Support contact info
- **Template:** HTML + Plain text

### 5. Test Email
- **Recipient:** Test email address
- **Subject:** "SMTP Test - BZION B2B Platform"
- **Trigger:** Manual test from `/api/health/email`
- **Content:**
  - Configuration details (host, port, encryption)
  - Timestamp
  - Success verification
- **Template:** HTML + Plain text

---

## 🔍 Email Delivery Monitoring

### Monitor in Resend Dashboard
1. Go to https://resend.com/emails
2. Select your project
3. View all sent emails with status
4. Check delivery metrics
5. View bounces and complaints

### Monitor in Server Logs
```
[Dev Server Console]
✅ Verification email sent to user@example.com
✅ Welcome email sent to user@example.com
✅ Password reset email sent to user@example.com
✅ Password changed email sent to user@example.com

[Browser Dev Tools - Network Tab]
GET /api/health/email → 200 OK
POST /api/auth/register → 201 Created
POST /api/auth/forgot-password → 200 OK
POST /api/auth/reset-password → 200 OK
```

---

## ✅ Testing Checklist

**Before Launch:**
- [ ] RESEND_API_KEY is configured in `.env.local`
- [ ] Dev server running: `npm run dev`
- [ ] Health check passes: `curl http://localhost:3000/api/health/email`
- [ ] Test email sends successfully
- [ ] Register user test (check for 2 emails)
- [ ] Forgot password test (check for 1 email)
- [ ] Password reset test (check for 1 email)
- [ ] All emails display correctly in email client
- [ ] Resend dashboard shows all sent emails
- [ ] No errors in server console
- [ ] No errors in browser dev tools

---

## 🐛 Troubleshooting

### "RESEND_API_KEY not configured"
**Problem:** Emails not sending, API key missing
```bash
# Solution: Add to .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Restart dev server
npm run dev
```

### "Connection timeout" on SMTP
**Problem:** Cannot connect to SMTP server
```bash
# Solution: Check port 465 is accessible
# If behind firewall, try port 587:
SMTP_PORT=587
SMTP_SECURE=false
```

### "Email verification endpoint failed"
**Problem:** Password validation or token issues
```
Check server logs for:
- Token expiry (must be < 1 hour for reset, < 24h for verification)
- Password strength (8+ chars, uppercase, lowercase, number, special char)
- Database connection
```

### "emails sending to console instead of Resend"
**Problem:** Development mode fallback
```
This is normal! If RESEND_API_KEY is not set:
- Emails log to console
- No actual emails sent
- Add RESEND_API_KEY to .env.local to enable real sending
```

### "All emails in spam folder"
**Problem:** Domain reputation or SPF/DKIM issues
**Solution:**
1. Check Resend dashboard for warnings
2. Verify domain in Resend (if using custom domain)
3. Wait 24 hours for DNS propagation
4. For now, use: `noreply@resend.dev` for testing

---

## 📞 Support Resources

- **Resend Docs:** https://resend.com/docs
- **SMTP Docs:** https://resend.com/docs/send-with-smtp
- **Email Templates Guide:** `RESEND_SETUP_GUIDE.md`
- **Configuration Guide:** `EMAIL_SERVICE_CONFIGURATION.md`
- **Testing Guide:** `EMAIL_SERVICE_TESTING_GUIDE.md`

---

## 🚀 Ready to Test!

Everything is configured and ready. Start with Test 1 (Health Check) and work through the scenarios to verify all email flows are working correctly.

**Last implemented:** December 18, 2025  
**Status:** ✅ All email services enabled and ready for testing
