# Authentication & Signup Flow Documentation

## Overview

The B2B platform uses NextAuth.js with JWT-based sessions and a Credentials provider for email/password authentication. When users register, they automatically create both a **User** record (for authentication) and a **Customer** record (for CRM tracking).

---

## 1. Signup Flow

### Complete User Journey

```
User fills signup form
         ↓
Client-side validation (password match)
         ↓
POST /api/auth/register
         ↓
Server-side Zod validation
         ↓
Rate limit check (5 req/15 min)
         ↓
Email uniqueness verification
         ↓
Password hashing (bcrypt, salt: 10)
         ↓
Create User record
         ↓
Create Customer record (CRM sync - non-blocking)
         ↓
Return success response (201)
         ↓
Redirect to /login
         ↓
User enters credentials
         ↓
NextAuth validates via Credentials provider
         ↓
JWT token issued with user.id & user.role
         ↓
Redirect to /account (authenticated)
```

---

## 2. Signup Form Component

**File:** `/app/register/page.tsx` (Client Component)

### Form Fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| Full Name | text | Yes | Min 2 characters |
| Email | email | Yes | Valid email format |
| Company Name | text | No | Any text |
| Password | password | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| Confirm Password | password | Yes | Must match password field |

### Client-Side Validation

```typescript
// Before API call validation
if (password !== confirmPassword) {
  toast.error("Passwords don't match");
  return;
}
```

### State Management

```typescript
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [company, setCompany] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
```

### Error Handling

- **Toast notifications** for all errors
- **Password match** validation before API call
- **Loading state** during API request
- **Redirect** to /login on success

### UI Components Used

- `Button` - Submit action
- `Input` - Email, name, company, password fields
- `Label` - Field labels
- `PasswordStrengthMeter` - Custom component showing password strength
- `useToast()` hook - Error/success notifications
- Icons from `lucide-react`: User, Building, Mail, Lock, Eye, EyeOff, Loader2

---

## 3. Registration API Endpoint

**File:** `/api/auth/register/route.ts` (POST Only)

### Input Validation (Zod Schema)

```typescript
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number'),
  company: z.string().optional(),
});
```

### Process Steps

1. **Parse & Validate Request Body**
   - Zod schema validation
   - Returns 400 Bad Request if invalid

2. **Rate Limiting Check**
   ```typescript
   const ip = request.headers.get('x-forwarded-for') || 'anonymous';
   const isRateLimited = await checkRateLimit(ip, 'auth');
   // Limit: 5 requests per 15 minutes
   // Returns 429 Too Many Requests if exceeded
   ```

3. **Email Uniqueness Check**
   ```typescript
   const existingUser = await prisma.user.findUnique({
     where: { email: email.toLowerCase() }
   });
   // Returns 400 if email exists
   ```

4. **Password Hashing**
   ```typescript
   const passwordHash = await hashPassword(password);
   // Uses bcryptjs with 10 salt rounds
   ```

5. **User Creation**
   ```typescript
   const user = await prisma.user.create({
     data: {
       firstName: name,
       email: email.toLowerCase(),
       passwordHash,
       companyName: company || null,
       role: 'customer', // Default role
       isActive: true,
     },
   });
   ```

6. **Automatic CRM Customer Creation** (Non-blocking)
   ```typescript
   // Fire-and-forget, won't break signup if fails
   try {
     await prisma.customer.create({
       data: {
         externalId: user.id, // Links to User
         email: user.email,
         source: 'B2B_PLATFORM',
         customerType: 'RETAILER',
         status: 'ACTIVE',
         metadata: {
           registeredVia: 'b2b-website',
           registrationDate: new Date().toISOString(),
         },
       },
     });
   } catch (error) {
     console.error('Failed to create customer record:', error);
     // Continues without throwing - signup still succeeds
   }
   ```

### Response Format

**Success (201 Created):**
```json
{
  "success": true,
  "userId": "user-uuid"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Email already registered"
}
```

**Error (429 Too Many Requests):**
```
HTTP 429
```

### Response Headers

- `Retry-After: <seconds>` - Included with rate limit responses
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: <count>`

---

## 4. Authentication Configuration

**File:** `/lib/auth/config.ts`

### NextAuth Setup

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Email/password verification happens here
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });
        
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );
        
        if (isPasswordValid) {
          return { id: user.id, email: user.email, role: user.role };
        }
        return null; // Authentication failed
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

### Session Strategy: JWT

- **Token stored in:** Secure HTTP-only cookie (by default)
- **Token includes:** user.id, user.email, user.role, iat (issued at), exp (expiration)
- **Stateless:** Server doesn't need session storage; validates token signature
- **Duration:** Configurable (default 30 days)

### Credentials Provider

- **Provider Type:** Email/Password authentication
- **Flow:** 
  1. User submits email + password
  2. `authorize()` function finds user by email
  3. `verifyPassword()` compares plaintext password with bcrypt hash
  4. If valid: return user object (id, email, role)
  5. If invalid: return null

### Custom Session Type

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: 'customer' | 'admin' | 'support';
    };
  }
}
```

---

## 5. Login Page

**File:** `/app/login/page.tsx` (Client Component)

### Form Fields

| Field | Type | Required |
|-------|------|----------|
| Email | email | Yes |
| Password | password | Yes |

### Authentication Flow

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Uses Zustand store with NextAuth fallback
  const result = await useAuthStore().login(email, password);
  
  if (result.success) {
    // Redirect to /account (authenticated dashboard)
    router.push('/account');
    // Initialize mock user activities
    useAuthStore().initializeMockActivities();
  } else {
    // Show error toast
    toast.error(result.error || 'Login failed');
  }
};
```

### Demo Credentials (For Testing)

Two demo accounts are hardcoded for testing:

```typescript
// Demo account 1
Email: demo@bzion.com
Password: demo123

// Demo account 2
Email: test@bzion.com
Password: test123
```

These are displayed on the login page for user convenience.

### UI Components

- `Button` - Submit action
- `Input` - Email and password fields
- `Label` - Field labels
- `useAuthStore()` hook - Zustand authentication store
- `useRouter()` hook - Navigation after successful login
- Icons from `lucide-react`: Mail, Lock, Eye, EyeOff, Loader2

---

## 6. Database Models

### User Model (Authentication)

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String
  firstName     String
  lastName      String?
  phone         String?
  companyName   String?
  role          String      @default("customer") // 'customer', 'admin', 'support'
  emailVerified DateTime?
  isActive      Boolean     @default(true)
  
  // Relations
  customer      Customer?   @relation("UserToCustomer")
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

**Key Fields:**
- `id`: UUID generated by Prisma (cuid)
- `email`: Unique identifier for login
- `passwordHash`: Bcrypt hashed password (never stored plaintext)
- `role`: Determines access level ('customer', 'admin', 'support')
- `isActive`: Soft delete support

### Customer Model (CRM)

```prisma
model Customer {
  id              String    @id @default(uuid())
  externalId      String    @unique // Links to User.id
  email           String
  customerType    String    // 'RETAILER', 'DISTRIBUTOR', 'WHOLESALER'
  status          String    @default("ACTIVE") // 'ACTIVE', 'INACTIVE', 'PROSPECT'
  source          String    // 'B2B_PLATFORM', 'IMPORT', 'API'
  metadata        Json?     // Flexible data storage
  
  // Relations
  user            User      @relation("UserToCustomer", fields: [externalId], references: [id])
  quotes          Quote[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Key Fields:**
- `id`: UUID (primary key for CRM)
- `externalId`: User.id (bidirectional linking)
- `customerType`: Business classification
- `status`: Current CRM status
- `source`: How customer was acquired
- `metadata`: JSON field for extensible data

### Relationship

```
User (1) ─────→ (1) Customer
user.id = customer.externalId
```

---

## 7. CRM Integration

### Automatic Customer Creation on Signup

When a user successfully registers:

1. **User record created** with email, passwordHash, firstName, role
2. **Customer record created automatically** with:
   - `externalId`: Set to User.id (for bidirectional linking)
   - `email`: Same as User.email
   - `source`: 'B2B_PLATFORM' (indicates signup channel)
   - `customerType`: 'RETAILER' (default type)
   - `status`: 'ACTIVE' (ready for sales team)
   - `metadata`: Registration context (date, method)

### Non-Blocking Implementation

Customer creation is **non-blocking**: If it fails, the signup still succeeds. This prevents database issues from breaking authentication.

```typescript
try {
  await prisma.customer.create({
    data: { /* customer data */ }
  });
} catch (error) {
  console.error('Failed to create customer:', error);
  // Signup continues - user can still login
}
```

### Benefits

- ✅ Automatic CRM synchronization on signup
- ✅ All new users immediately visible to sales team
- ✅ User.id and Customer.id linked for tracking
- ✅ Source tracking enables analytics (which channel users came from)
- ✅ Non-blocking prevents signup failures from CRM issues

---

## 8. Password Security

### Hashing Strategy

**File:** `/lib/auth/utils.ts`

```typescript
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
  // Salt rounds: 10 (bcryptjs default)
  // Time cost: ~100ms per hash
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
  // Returns true if plaintext password matches hash
}
```

### Password Requirements

- **Minimum length:** 8 characters
- **Uppercase:** At least 1 letter (A-Z)
- **Lowercase:** At least 1 letter (a-z)
- **Numeric:** At least 1 digit (0-9)
- **Special characters:** Not required (but not prohibited)

### Storage

- Passwords are **never stored plaintext**
- Only `passwordHash` is persisted in database
- Each hash is unique (bcrypt includes salt)
- Hashing is async and computationally expensive (prevents brute force)

### Verification

- Login process: Plaintext password → bcrypt.compare() → hash comparison
- No password is ever displayed or returned from API
- Hashes cannot be reversed to original passwords

---

## 9. Security Measures

### Rate Limiting

**Endpoint:** `/api/auth/register`

```typescript
const isRateLimited = await checkRateLimit(ip, 'auth');
```

- **Limit:** 5 requests per 15 minutes
- **Key:** Client IP address (from x-forwarded-for header)
- **Storage:** Upstash Redis
- **Response:** HTTP 429 Too Many Requests if exceeded
- **Purpose:** Prevents brute force and spam signup

### Role-Based Access Control

```typescript
// Only admins can access admin dashboard
if (session.user.role !== 'admin') {
  return new Response('Unauthorized', { status: 403 });
}
```

**User Roles:**
- `customer` - Default role for new signups
- `admin` - Full system access
- `support` - Customer support team access

### Session Security

- **Token storage:** Secure HTTP-only cookies (prevents XSS theft)
- **Token signing:** HMAC-SHA256 validation
- **Token expiration:** Configurable (default 30 days)
- **CSRF protection:** Built into NextAuth

### Email Uniqueness

```typescript
const existing = await prisma.user.findUnique({
  where: { email: email.toLowerCase() }
});

if (existing) {
  return Response.json({ error: 'Email already registered' }, { status: 400 });
}
```

- **Case-insensitive:** Emails lowercased before storage
- **Unique constraint:** Database enforces uniqueness at DB level
- **Prevents:** Multiple accounts with same email

---

## 10. Error Handling

### Client-Side Errors

| Error | Type | User Message |
|-------|------|--------------|
| Password mismatch | Validation | "Passwords don't match" |
| Network error | API | "Failed to create account. Please try again." |
| Duplicate email | API | "Email already registered" |
| Rate limited | API | "Too many signup attempts. Please try again later." |
| Invalid password | Validation | "Password must be 8+ chars with uppercase, lowercase, number" |

### Server-Side Responses

| Status | Scenario | Response Body |
|--------|----------|----------------|
| 201 | Success | `{ "success": true, "userId": "..." }` |
| 400 | Invalid input | `{ "error": "Name must be at least 2 characters" }` |
| 400 | Email exists | `{ "error": "Email already registered" }` |
| 429 | Rate limited | Empty (rate limit headers included) |
| 500 | Server error | `{ "error": "Internal server error" }` |

### Toast Notifications

Error messages shown via `useToast()` hook:

```typescript
const { toast } = useToast();

// Validation error
toast.error('Passwords don\'t match');

// API error response
const data = await response.json();
toast.error(data.error || 'Signup failed');

// Success (on login page)
toast.success('Account created! Please log in.');
```

---

## 11. Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SIGNUP PROCESS                          │
└─────────────────────────────────────────────────────────────┘

User navigates to /register
         ↓
Form loads with fields:
  • Full Name
  • Email
  • Company Name (optional)
  • Password (with strength indicator)
  • Confirm Password
         ↓
User fills form and clicks "Sign Up"
         ↓
Client validates:
  • Password match
  • Form completeness
         ↓
POST /api/auth/register
  Body: { name, email, password, company }
         ↓
Server validates with Zod:
  • Email format
  • Password requirements (8+ chars, uppercase, lowercase, number)
  • Name length (2+ chars)
         ↓
Rate limit check:
  • Max 5 requests per 15 minutes per IP
  • Returns 429 if exceeded
         ↓
Email uniqueness check:
  • Query User.email in database
  • Returns 400 if exists
         ↓
Hash password:
  • bcrypt.hash(password, 10)
  • ~100ms computation
         ↓
Create User record:
  • INSERT INTO User (email, passwordHash, firstName, role, ...)
  • Returns user.id
         ↓
Create Customer record (non-blocking):
  • INSERT INTO Customer (externalId=user.id, source='B2B_PLATFORM', ...)
  • Errors don't break signup
         ↓
Return 201 success:
  { "success": true, "userId": "..." }
         ↓
Client receives success:
  • Clear form
  • Show success message
  • Redirect to /login (500ms delay)
         ↓
User enters email + password on /login
         ↓
NextAuth Credentials provider:
  • Find User by email
  • bcrypt.compare(password, hash)
  • Validates password
         ↓
JWT token created:
  • Token includes: user.id, user.role, email
  • Signed with secret key
  • Stored in secure HTTP-only cookie
         ↓
Session callback adds to session:
  • session.user.id
  • session.user.role
         ↓
Redirect to /account
         ↓
User authenticated and ready to use B2B platform
```

---

## 12. Login Process

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN PROCESS                           │
└─────────────────────────────────────────────────────────────┘

User navigates to /login
         ↓
Form loads with fields:
  • Email
  • Password
  • "Sign In" button
         ↓
Optionally shows demo credentials:
  • demo@bzion.com / demo123
  • test@bzion.com / test123
         ↓
User enters credentials and clicks "Sign In"
         ↓
Client calls useAuthStore().login(email, password)
         ↓
Zustand store calls NextAuth signIn('credentials', ...)
         ↓
NextAuth routes to CredentialsProvider.authorize()
         ↓
Database lookup:
  • SELECT * FROM User WHERE email = ?
  • If not found, authorization fails
         ↓
Password verification:
  • bcrypt.compare(plaintext, hash)
  • Returns boolean
         ↓
If password incorrect:
  • Return null to NextAuth
  • Frontend shows toast: "Invalid credentials"
         ↓
If password correct:
  • Return user object { id, email, role }
         ↓
JWT callback:
  • Create token with user.id, user.role
  • Sign token with secret key
         ↓
Session callback:
  • Add id and role to session.user
  • Returns augmented session
         ↓
Set secure HTTP-only cookie:
  • Cookie name: next-auth.session-token
  • Contains signed JWT
  • HttpOnly, Secure, SameSite=Lax flags
         ↓
Redirect to /account
         ↓
/account page (Server Component):
  • Call getSession() from NextAuth
  • Access session.user.id, session.user.role
  • Render authenticated content
         ↓
User is now logged in
```

---

## 13. Protected Routes

### Server Component Pattern

```typescript
// /app/account/page.tsx
import { getSession } from 'next-auth/react';

export default async function AccountPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.email}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Client Component Pattern

```typescript
// Client component
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);
  
  if (status === 'loading') return <div>Loading...</div>;
  
  return <div>User: {session?.user?.email}</div>;
}
```

### Admin-Only Route Pattern

```typescript
// /app/admin/page.tsx
import { getSession } from 'next-auth/react';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || session.user.role !== 'admin') {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Dashboard</div>;
}
```

---

## 14. Testing Guide

### Manual Testing Checklist

- [ ] **Signup with valid data** → User created, redirects to login
- [ ] **Signup with duplicate email** → Shows error "Email already registered"
- [ ] **Signup with weak password** → Shows password requirement errors
- [ ] **Signup with mismatched passwords** → Shows "Passwords don't match"
- [ ] **Login with correct credentials** → Session created, redirects to account
- [ ] **Login with wrong password** → Shows "Invalid credentials"
- [ ] **Login with non-existent email** → Shows "Invalid credentials"
- [ ] **Multiple rapid signups** → 5th attempt shows rate limit error
- [ ] **Access admin page without admin role** → Shows "Access Denied"
- [ ] **Clear cookies and refresh** → Redirects to login

### Demo Credentials for Testing

```
Email: demo@bzion.com
Password: demo123

Email: test@bzion.com
Password: test123
```

### Database Verification

```sql
-- Check user creation
SELECT id, email, firstName, role, createdAt FROM "User" 
ORDER BY createdAt DESC LIMIT 5;

-- Check CRM customer creation
SELECT id, externalId, email, source, customerType, status, createdAt 
FROM "Customer" 
ORDER BY createdAt DESC LIMIT 5;

-- Verify linking
SELECT u.id, u.email, c.id as customer_id, c.source 
FROM "User" u 
LEFT JOIN "Customer" c ON c.externalId = u.id
ORDER BY u.createdAt DESC LIMIT 5;
```

---

## 15. Troubleshooting

### Problem: Users stuck on signup page after clicking submit

**Cause:** Network error or API timeout
**Solution:** Check browser DevTools → Network tab → `/api/auth/register` response

### Problem: "Invalid credentials" on login with correct password

**Cause:** Password hash might be corrupted or user was created without proper hashing
**Solution:** Delete user record and sign up again

### Problem: Rate limit returning 429

**Cause:** More than 5 signup attempts from same IP in 15 minutes
**Solution:** Wait 15 minutes or change IP (VPN)

### Problem: Customer record not created in CRM

**Cause:** Non-blocking error during creation; check server logs
**Solution:** Check database for User record (should exist); manually create Customer if needed

### Problem: Session lost after page refresh

**Cause:** Cookies deleted or session expired (30 days default)
**Solution:** User needs to login again; clear browser cache

---

## 16. Security Checklist

- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ Rate limiting on signup (5 req/15 min)
- ✅ Email uniqueness enforced at database level
- ✅ JWT tokens in secure HTTP-only cookies
- ✅ Role-based access control implemented
- ✅ Admin endpoints require explicit role check
- ✅ Input validation with Zod schema
- ✅ SQL injection protection (Prisma ORM)
- ✅ CSRF protection (NextAuth built-in)
- ✅ No sensitive data in response bodies
- ✅ Error messages don't leak system info

---

## 17. Performance Considerations

### Optimizations

- **Password hashing:** Async operation (doesn't block event loop)
- **Rate limiting:** Redis lookup (fast, <10ms typical)
- **Database queries:** Indexed on email field (primary key)
- **JWT verification:** Synchronous, ~1ms (no database lookup on every request)

### Load Times

| Operation | Duration | Location |
|-----------|----------|----------|
| Password hash | ~100ms | Server |
| Rate limit check | <10ms | Redis |
| User creation | <50ms | PostgreSQL |
| Customer creation | <50ms | PostgreSQL (non-blocking) |
| JWT verification | ~1ms | Memory |

---

## 18. Future Enhancements

Potential improvements not yet implemented:

- [ ] Email verification before account activation
- [ ] Password reset flow via email
- [ ] Two-factor authentication (2FA)
- [ ] OAuth/Google login provider
- [ ] Account deactivation/deletion
- [ ] Password change endpoint
- [ ] Login history audit log
- [ ] IP whitelist for admin accounts
- [ ] CAPTCHA for signup rate limiting
- [ ] User profile completion wizard

---

## 19. Related Documentation

- **CRM Integration:** See `/docs/crm-integration.md`
- **Form Submission:** See `/docs/form-submission.md`
- **Analytics Tracking:** See `/docs/analytics-tracking.md`
- **Admin Dashboard:** See `/docs/admin-features.md`

---

## 20. Quick Reference

### Key Files

| File | Purpose | Type |
|------|---------|------|
| `/app/register/page.tsx` | Signup form UI | Client Component |
| `/app/login/page.tsx` | Login form UI | Client Component |
| `/api/auth/register/route.ts` | Registration endpoint | API Route |
| `/lib/auth/config.ts` | NextAuth configuration | Config |
| `/lib/auth/utils.ts` | Password utilities | Utilities |
| `/prisma/schema.prisma` | Database schema | Schema |

### Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|----------------|
| `/register` | GET | Signup form page | No |
| `/api/auth/register` | POST | Create user account | No |
| `/login` | GET | Login form page | No |
| `/api/auth/callback/credentials` | POST | NextAuth credentials validation | No |
| `/api/auth/session` | GET | Get current session | Yes |
| `/account` | GET | User dashboard | Yes |

### Environment Variables

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host/dbname
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

