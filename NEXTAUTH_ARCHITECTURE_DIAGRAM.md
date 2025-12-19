# NEXTAUTH CONFIGURATION - ARCHITECTURE DIAGRAM

## File Structure After Fix

```
c:\Users\Baldeagle\bzionu\
├── ✅ auth.ts                              ← NEW: Root Auth Config
│   ├── Import NextAuth, adapters, providers
│   ├── Configure Email provider (magic links)
│   ├── Configure Credentials provider (email/password)
│   ├── Setup Prisma adapter for DB
│   ├── Setup JWT session strategy
│   └── Export: { handlers, auth, signIn, signOut }
│
├── src/
│   ├── lib/
│   │   ├── ✅ auth.ts                     ← UPDATED: Re-export wrapper
│   │   │   └── export { ... } from '~/auth'
│   │   │
│   │   ├── auth/
│   │   │   ├── config.ts                  ← ⚠️ Deprecated (no longer used)
│   │   │   └── utils.ts
│   │   │
│   │   └── db/
│   │       └── index.ts                   ← Database connection
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── ✅ route.ts        ← UPDATED: Route handler
│   │   │               ├── import { handlers } from '~/auth'
│   │   │               └── export { GET, POST } = handlers
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                   ← Auth form
│   │   │
│   │   └── account/
│   │       └── page.tsx                   ← Protected route
│   │
│   ├── middleware.ts                      ← Route protection
│   │
│   ├── components/
│   │   └── auth/                          ← Auth UI components
│   │
│   └── styles/
│
├── prisma/
│   └── schema.prisma                      ← Database schema
│       └── includes User, Account, Session models
│
├── public/
├── package.json
├── tsconfig.json                          ← Path aliases:
│   │                                         @/* → src/*
│   │                                         ~/* → ./
│   └── # Path resolution: ~/auth → ./auth.ts ✅
│
└── docs/
    ├── NEXTAUTH_FIX_COMPLETE.md            ← Detailed explanation
    ├── NEXTAUTH_CONFIG_REFERENCE.md        ← Quick reference
    └── NEXTAUTH_FIX_EXECUTION_SUMMARY.md   ← This fix summary
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│ Login Form (/login)   →  Email/Password Input                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ POST Form Data
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXTAUTH API ROUTE HANDLER                          │
├─────────────────────────────────────────────────────────────────┤
│ /api/auth/[...nextauth]/route.ts                                │
│ ├── imports { handlers } from '~/auth'  ✅                      │
│ └── exports { GET, POST } = handlers                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
          ┌──────────────────┐  ┌──────────────────┐
          │  Email Provider  │  │ Credentials      │
          │  (Magic Links)   │  │ Provider         │
          │                  │  │ (email+password) │
          └────────┬─────────┘  └────────┬─────────┘
                   │                     │
                   └──────────┬──────────┘
                              │
                         ┌────▼─────┐
                         │ Prisma   │
                         │ Adapter  │
                         └────┬─────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL DB   │
                    ├───────────────────┤
                    │ - users table     │
                    │ - sessions table  │
                    │ - accounts table  │
                    └───────────────────┘
```

## Authentication Flow

```
STEP 1: User visits /login
        ↓
        GET /api/auth/signin (client-side)
        ↓
        NextAuth renders signin form

STEP 2: User submits credentials
        ↓
        POST /api/auth/callback/credentials
        ↓
        Credentials provider authorize() called

STEP 3: Provider verifies password against DB
        ├─ Valid: Create JWT token
        │         Store in HTTP-only cookie
        │         Call jwt() callback → session() callback
        │         Redirect to /account
        │
        └─ Invalid: Return null → Show error → Redirect to /login

STEP 4: Protected routes check session
        ├─ Middleware.ts uses withAuth()
        ├─ API routes call auth() function
        └─ Pages use getSession() / useSession()

STEP 5: Session stored in secure HTTP-only cookie
        ├─ Browser sends cookie with each request
        ├─ NextAuth validates JWT signature
        ├─ Returns user data + custom properties
        └─ Application displays personalized content
```

## Export Chain Diagram

```
┌────────────────────────────────────────────────────┐
│              /auth.ts (Root)                       │
│  - Creates handler via NextAuth()                  │
│  - Wraps in handlers = { GET, POST }               │
│  - Exports handlers, auth, signIn, signOut ✅      │
└────────────┬──────────────────────────────────────┘
             │ Imported by two paths:
             │
        ┌────┴──────────────────────────────────┐
        │                                       │
        ▼ Direct Import                         ▼ Re-export
┌──────────────────────────────┐      ┌─────────────────────────┐
│ /api/auth/.../route.ts       │      │ /src/lib/auth.ts        │
│ import from '~/auth'     ✅  │      │ export from '~/auth' ✅ │
│                              │      │                         │
│ export { GET, POST }         │      │ Used by:                │
│   = handlers             ✅  │      │ - Middleware            │
│                              │      │ - Server components     │
│                              │      │ - API routes            │
└──────────────────────────────┘      └─────────────────────────┘
         ✅ Working                            ✅ Backward Compatible
```

## Path Resolution

```
tsconfig.json paths:
├─ "@/*" → "src/*"                    ← Used for src folder
├─ "~/*" → "./*"                      ← Used for root folder
│
Import resolution for '~/auth':
├─ Match rule: "~/*" → "./*"
├─ Resolve: ~/auth → ./auth
├─ Result: c:\...\bzionu\auth.ts  ✅
│
Import resolution for '@/lib/auth':
├─ Match rule: "@/*" → "src/*"
├─ Resolve: @/lib/auth → src/lib/auth
├─ Result: c:\...\bzionu\src\lib\auth.ts  ✅
```

## API Endpoints

```
NextAuth v4.24.7 Endpoints:
├─ GET  /api/auth/signin              ← Sign in page
├─ GET  /api/auth/signout             ← Sign out handler
├─ GET  /api/auth/session             ← Get current session (JSON)
├─ GET  /api/auth/providers           ← List available providers
├─ GET  /api/auth/csrf                ← Get CSRF token
├─ POST /api/auth/callback/[provider] ← OAuth/Credentials callback
└─ POST /api/auth/_log                ← Error logging

Protected by NextAuth:
├─ /api/admin/*                       ← Requires auth + admin role
├─ /account                           ← Requires auth
└─ /checkout                          ← Requires auth
```

## Configuration Summary

```
NextAuth Configuration:
├─ Adapter: PrismaAdapter(prisma)
├─ Session Strategy: JWT
├─ Providers:
│  ├─ Credentials (email + password)
│  └─ Email (magic links)
├─ Callbacks:
│  ├─ jwt() - Add custom properties to token
│  └─ session() - Add custom properties to session
└─ Pages:
   ├─ signIn: /login
   ├─ verifyRequest: /auth/verify-request
   └─ error: /auth/error

Database Models (Prisma):
├─ User
│  ├─ id, email, hashedPassword
│  ├─ firstName, lastName, companyName
│  ├─ role, isActive, emailVerified
│  └─ timestamps
├─ Account (OAuth)
├─ Session (JWT stored in DB)
└─ VerificationToken (Email provider)
```

---

**Architecture Status**: ✅ **COMPLETE AND VERIFIED**
**LastUpdated**: December 18, 2025
