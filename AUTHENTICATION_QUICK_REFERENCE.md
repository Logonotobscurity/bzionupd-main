# Quick Reference - Authentication System

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install resend
```

### 2. Configure Resend Email in .env.local
```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev  # For testing
# or verify your domain first for production
EMAIL_FROM=noreply@bzion.com

NEXT_PUBLIC_APP_URL=https://bzion.com
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
```

### 3. Get Resend API Key
- Visit: https://resend.com
- Sign up (free)
- Copy API key from dashboard
- Paste into `RESEND_API_KEY` in .env.local

### 4. Run Prisma Migration
```bash
npx prisma migrate dev --name add_token_models
```

### 5. Start Development
```bash
npm run dev
```

See `RESEND_SETUP_GUIDE.md` for complete setup instructions.

---

## 📋 API Endpoints at a Glance

### Sign Up
```
POST /api/auth/register
Body: {name, email, password, company?}
Returns: {success, userId, message}
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: {email}
Returns: Always success (no email enumeration)
Sends: Password reset email with link
```

### Reset Password
```
POST /api/auth/reset-password
Body: {token, password, confirmPassword}
Returns: {success, message}
```

### Verify Email
```
POST /api/auth/verify-email
Body: {token}
Returns: {success, email, message}
```

### Resend Verification
```
POST /api/auth/resend-verification
Body: {token} OR {email}
Returns: {success, message}
```

### Validate Reset Token (Check only, no consumption)
```
POST /api/auth/validate-reset-token
Body: {token}
Returns: {success, email}
```

---

## 🎨 Page Routes

| Route | Purpose | State |
|-------|---------|-------|
| `/register` | Sign up form | Public |
| `/forgot-password` | Request password reset | Public |
| `/reset-password?token=` | Reset password form | Public |
| `/verify-email?token=` | Email verification | Public |
| `/login` | Login form | Public |
| `/account` | User dashboard | Protected |

---

## 🔑 Key Functions

### Password Reset
```typescript
// Create token
const token = await createPasswordResetToken(email);

// Reset password with token
const success = await resetPasswordWithToken(token, newPassword);

// Check if token is valid
const isValid = await isResetTokenValid(token);

// Get user email from token
const email = await getUserEmailFromResetToken(token);
```

### Email Verification
```typescript
// Create token
const token = await createVerificationToken(userId, email);

// Verify email
const success = await verifyEmail(token);

// Check if verified
const isVerified = await isEmailVerified(userId);

// Get user from token
const user = await getUserFromVerificationToken(token);
```

### Email Sending
```typescript
// Send reset email
await sendPasswordResetEmail(email, token);

// Send verification email
await sendEmailVerificationEmail(email, token);

// Send welcome email
await sendWelcomeEmail(email, firstName?);

// Send confirmation
await sendPasswordChangedEmail(email);
```

---

## 🔐 Security Settings

- **Reset Token Expiry**: 1 hour
- **Verification Token Expiry**: 24 hours
- **Password Hashing**: bcryptjs, 10 rounds
- **Rate Limit**: 5 requests per 15 minutes per IP
- **Token Algorithm**: SHA256
- **Password Requirements**: 8+ chars, 1 uppercase, 1 lowercase, 1 number

---

## 📊 Database Tables

### password_reset_tokens
```
id (UUID) → userId (INT) → token_hash (VARCHAR unique)
expires_at (TIMESTAMP) | used_at (TIMESTAMP nullable)
created_at (TIMESTAMP)
```

### email_verification_tokens
```
id (UUID) → userId (INT) → token_hash (VARCHAR unique)
email (VARCHAR) | expires_at (TIMESTAMP) | verified_at (TIMESTAMP nullable)
created_at (TIMESTAMP)
```

---

## 🧪 Test Commands

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Test123456"}'

# Request reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com"}'

# Verify email (use token from email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"token-from-email"}'
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Email already registered" | Use forgot-password to reset, or different email |
| "Too many requests" | Wait 15 minutes before retrying |
| "Invalid or expired token" | Request new verification or reset link |
| "Emails not sending" | Check SMTP config in .env.local |
| "Token already used" | Request new token, previous was consumed |

---

## 🎯 User Flows Visualized

### Sign Up Flow
```
User fills form → Validate → Create User
                            → Create Token → Send Email
                                          → User verifies
                                          → Redirect login
```

### Password Reset Flow
```
Click "Forgot Password" → Enter email → Create Token
                                     → Send Email
                                     → User clicks link
                                     → Validate Token
                                     → New password form
                                     → Reset password
                                     → Redirect login
```

---

## 📧 Email Template Types

1. **Verification Email**
   - Sent: After registration
   - Contains: Verify link (24-hour)
   - Action: Verify email address

2. **Reset Password Email**
   - Sent: After forgot password request
   - Contains: Reset link (1-hour)
   - Action: Reset password

3. **Welcome Email**
   - Sent: After registration
   - Contains: Feature overview
   - Action: Explore platform

4. **Password Changed Email**
   - Sent: After password reset
   - Contains: Confirmation
   - Action: Security confirmation

---

## 💾 Key Files

```
Core Logic:
├── src/lib/password-reset.ts      (Reset token management)
├── src/lib/email-verification.ts  (Verification token management)
└── src/lib/email-service.ts       (Email templates & sending)

API Routes:
├── src/app/api/auth/register
├── src/app/api/auth/forgot-password
├── src/app/api/auth/reset-password
├── src/app/api/auth/verify-email
├── src/app/api/auth/resend-verification
└── src/app/api/auth/validate-reset-token

Pages:
├── src/app/register/page.tsx
├── src/app/forgot-password/page.tsx
├── src/app/reset-password/page.tsx
└── src/app/verify-email/page.tsx

Database:
└── prisma/schema.prisma (PasswordResetToken, EmailVerificationToken)
```

---

## 🔗 Related Documentation

- Full Guide: `AUTHENTICATION_FLOW_COMPLETE.md`
- Implementation: `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md`
- Original Docs: `docs/authentication.md`
- Schema: `prisma/schema.prisma`

---

**Last Updated**: December 14, 2025
**Ready for Production**: ✅ Yes
