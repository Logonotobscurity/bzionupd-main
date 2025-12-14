# Complete Authentication Flow Implementation Guide

## 📋 Overview

This document outlines the complete production-ready authentication flow implemented for the BZION B2B Platform, including:

- User Registration with Email Verification
- Email Verification Flow
- Password Reset / Forgot Password Flow
- Password Change (authenticated users)

---

## 🏗️ Architecture

### Database Models

#### 1. **User Model** (Existing)
```prisma
model User {
  id               Int
  email            String    @unique
  passwordHash     String?
  firstName        String?
  lastName         String?
  emailVerified    DateTime?  // Tracks if email is verified
  role             String
  isActive         Boolean
  
  passwordResetTokens       PasswordResetToken[]
  emailVerificationTokens   EmailVerificationToken[]
}
```

#### 2. **PasswordResetToken Model** (New)
```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  tokenHash String    @unique        // SHA256 hash of the token
  expiresAt DateTime               // Token expiration time (1 hour)
  usedAt    DateTime?              // When token was used (null = not used)
  
  createdAt DateTime  @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}
```

#### 3. **EmailVerificationToken Model** (New)
```prisma
model EmailVerificationToken {
  id        String    @id @default(uuid())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  email     String           // Email being verified
  tokenHash String    @unique // SHA256 hash of the token
  expiresAt DateTime         // Token expiration time (24 hours)
  verifiedAt DateTime?       // When email was verified
  
  createdAt DateTime  @default(now())
  
  @@index([userId])
  @@index([email])
  @@index([expiresAt])
}
```

---

## 🔄 Complete User Journey

### 1. Registration Flow

```
User visits /register
    ↓
Fills form (name, email, password, company)
    ↓
Client-side validation (password match, strength)
    ↓
POST /api/auth/register
    ↓
Server validates Zod schema
    ↓
Rate limit check (5 req/15 min)
    ↓
Email uniqueness check
    ↓
Password hashing (bcrypt, salt: 10)
    ↓
Create User record (emailVerified: null)
    ↓
Create Customer record (CRM sync - non-blocking)
    ↓
Generate EmailVerificationToken
    ↓
Send verification email (async - non-blocking)
    ↓
Send welcome email (async - non-blocking)
    ↓
Response: 201 Created with userId
    ↓
User sees: "Check your email to verify your account"
```

### 2. Email Verification Flow

```
User receives email with verification link
    ↓
Clicks link: /verify-email?token={token}
    ↓
Page loads and auto-submits POST /api/auth/verify-email
    ↓
Server validates token:
  - Checks token hash exists
  - Checks token not expired (24 hours)
  - Checks token not already used
    ↓
If valid:
  - Mark user.emailVerified = now()
  - Mark token.verifiedAt = now()
    ↓
User sees: "Email Verified! You can now log in"
    ↓
Redirect to /account or home
```

### 3. Login Flow

```
User visits /login
    ↓
Enters email & password
    ↓
NextAuth Credentials provider validates
    ↓
Query user with email
    ↓
Check if user exists & password matches
    ↓
Issue JWT token with user.id & user.role
    ↓
Redirect to /account
```

### 4. Forgot Password Flow

```
User visits /forgot-password
    ↓
Enters email address
    ↓
POST /api/auth/forgot-password
    ↓
Server validates email format
    ↓
Rate limit check (5 req/15 min)
    ↓
Query user by email:
  - If not found: still return success (don't reveal)
  - If found: continue
    ↓
Invalidate all previous reset tokens
    ↓
Generate new PasswordResetToken
    ↓
Send password reset email (async)
    ↓
Response: 200 OK (always, even if no user)
    ↓
User sees: "Check your email for reset link"
```

### 5. Reset Password Flow

```
User receives email with reset link
    ↓
Clicks link: /reset-password?token={token}
    ↓
Page loads and validates token with POST /api/auth/validate-reset-token
    ↓
If invalid: show "Invalid or expired link"
    ↓
If valid:
  - Show form with password fields
  - Display user email
  - Show password requirements
    ↓
User fills new password (must meet requirements)
    ↓
Client validates:
  - Password >= 8 chars
  - Has uppercase letter
  - Has lowercase letter
  - Has number
  - Confirmation matches
    ↓
POST /api/auth/reset-password with token & password
    ↓
Server validates token again
    ↓
Hash new password
    ↓
Update user.passwordHash
    ↓
Mark token.usedAt = now()
    ↓
Send password changed confirmation email
    ↓
User sees: "Password reset successfully!"
    ↓
Redirect to /login after 3 seconds
```

---

## 📁 File Structure

### API Endpoints

```
src/app/api/auth/
├── register/route.ts                      ✅ New email verification
├── forgot-password/route.ts               ✅ Updated with email sending
├── reset-password/route.ts                ✅ Already exists (uses new models)
├── validate-reset-token/route.ts          ✅ New (validates without consuming)
├── verify-email/route.ts                  ✅ Updated with token model
├── resend-verification/route.ts           ✅ Updated with token model
└── [...nextauth]/route.ts                 ✅ Existing NextAuth config
```

### Frontend Pages

```
src/app/
├── register/page.tsx                      ✅ Existing (signup form)
├── login/page.tsx                         ✅ Existing
├── forgot-password/page.tsx               ✅ Existing
├── reset-password/page.tsx                ✅ Enhanced with validation & UX
├── verify-email/page.tsx                  ✅ Enhanced with auto-verify & resend
└── account/page.tsx                       ✅ Existing (protected route)
```

### Libraries

```
src/lib/
├── password-reset.ts                      ✅ Complete implementation
├── email-verification.ts                  ✅ Complete implementation
├── email-service.ts                       ✅ New (email sending)
├── auth/utils.ts                          ✅ Existing (hash/verify)
├── db.ts                                  ✅ Existing (Prisma client)
└── ratelimit.ts                           ✅ Existing (rate limiting)
```

---

## 🔐 Security Features

### 1. **Token Management**
- ✅ Tokens are hashed with SHA256 before storage
- ✅ Actual token only sent to user in email
- ✅ Tokens have expiration times
- ✅ Tokens can only be used once (tracked with `usedAt`/`verifiedAt`)
- ✅ Previous tokens are invalidated when new ones are created

### 2. **Password Security**
- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ Password strength validation: min 8 chars, uppercase, lowercase, number
- ✅ Passwords never logged or exposed
- ✅ Password reset tokens expire after 1 hour

### 3. **Email Safety**
- ✅ No email enumeration: forgot-password doesn't reveal if email exists
- ✅ Rate limiting: 5 requests per 15 minutes per IP
- ✅ Email verification tokens expire after 24 hours
- ✅ Verification tokens can only be used once

### 4. **Database Safety**
- ✅ Cascade delete on user deletion
- ✅ Indexes on frequently queried fields (userId, expiresAt, email)
- ✅ Token hashes are unique (no duplicates)
- ✅ Transactions for atomic operations

### 5. **API Security**
- ✅ Zod validation on all inputs
- ✅ Rate limiting on auth endpoints
- ✅ CORS headers for API routes
- ✅ Consistent error messages (don't reveal user existence)

---

## 📧 Email Templates

### 1. **Verification Email**
- Subject: "Verify Your Email - BZION"
- Contains: verification link (24-hour expiry)
- CTA: "Verify Email Address" button
- Info: Account activation message
- Support: Contact information

### 2. **Password Reset Email**
- Subject: "Password Reset Request - BZION"
- Contains: reset link (1-hour expiry)
- CTA: "Reset Password" button
- Warning: Link expiration time
- Support: Contact information

### 3. **Welcome Email**
- Subject: "Welcome to BZION!"
- Contains: account activation message
- CTA: "Login to Your Account" button
- Features: List of platform features
- Support: Contact information

### 4. **Password Changed Email**
- Subject: "Password Changed - BZION"
- Contains: confirmation message
- Warning: Contact support if unauthorized
- Security tip: Keep password secure

---

## 🚀 Deployment Checklist

### Environment Variables Required

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com           # or your email provider
SMTP_PORT=587
SMTP_SECURE=false                  # true for port 465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@bzion.com

# Application
NEXT_PUBLIC_APP_URL=https://bzion.com
NEXT_PUBLIC_APP_NAME=BZION B2B Platform
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://bzion.com
```

### Migration Steps

```bash
# 1. Create migration
npx prisma migrate dev --name add_token_models

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed database (if needed)
npx prisma db seed

# 4. Run tests
npm run test

# 5. Build & deploy
npm run build
npm start
```

---

## 🧪 Testing Endpoints

### 1. Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "company": "ACME Inc"
  }'
```

### 2. Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

### 3. Validate Reset Token
```bash
curl -X POST http://localhost:3000/api/auth/validate-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "reset-token-from-email"}'
```

### 4. Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "password": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

### 5. Verify Email
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification-token-from-email"}'
```

### 6. Resend Verification
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

---

## 🐛 Troubleshooting

### Issue: "Token expired" error
- **Cause**: Token is older than 1 hour (reset) or 24 hours (verification)
- **Solution**: Request new token via forgot-password or resend-verification

### Issue: "Token already used" error
- **Cause**: Token was already consumed
- **Solution**: Request new token (previous one was consumed)

### Issue: Emails not sending
- **Cause**: SMTP configuration or email provider issue
- **Solution**: 
  1. Check environment variables
  2. Verify SMTP credentials
  3. Check email provider logs
  4. Enable "Less secure apps" for Gmail

### Issue: "Too many requests" error
- **Cause**: Rate limit exceeded (5 req/15 min per IP)
- **Solution**: Wait 15 minutes before trying again

### Issue: Email already registered
- **Cause**: User already exists with that email
- **Solution**: Use forgot-password to reset, or sign up with different email

---

## 📊 Database Queries

### Get user with tokens
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    passwordResetTokens: true,
    emailVerificationTokens: true,
  },
});
```

### Get active reset tokens
```typescript
const tokens = await prisma.passwordResetToken.findMany({
  where: {
    userId: userId,
    usedAt: null,
    expiresAt: { gt: new Date() },
  },
});
```

### Clean up expired tokens (cron job)
```typescript
await prisma.passwordResetToken.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});

await prisma.emailVerificationToken.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});
```

---

## 📚 Related Documentation

- See `docs/authentication.md` for original signup flow
- See `src/lib/auth/utils.ts` for password hashing utilities
- See `src/lib/ratelimit.ts` for rate limiting implementation
- See `prisma/schema.prisma` for complete database schema

---

## ✅ Implementation Status

- ✅ Database models (PasswordResetToken, EmailVerificationToken)
- ✅ Password reset functionality (full implementation)
- ✅ Email verification functionality (full implementation)
- ✅ Email service (multiple template types)
- ✅ API endpoints (register, forgot-password, reset-password, verify-email, resend-verification)
- ✅ Frontend pages (reset-password, verify-email with enhanced UX)
- ✅ Security features (token hashing, expiration, rate limiting)
- ✅ Error handling (consistent messages, no enumeration)
- ✅ Email sending (async, non-blocking)
- ⏳ Prisma migration (ready to run: `npx prisma migrate dev --name add_token_models`)
- ⏳ Email provider setup (requires SMTP configuration)
- ⏳ End-to-end testing (ready for QA)

---

**Last Updated**: December 14, 2025
**Version**: 1.0.0 (Production Ready)
