# Database Connection Troubleshooting Guide

## Current Status

**Error:** `ECONNREFUSED` on `db.prisma.io:5432`

**Cause:** The database server is not accepting connections. This typically means:
- Database server is offline/unavailable
- Database credentials have expired (common with Prisma Cloud free tier)
- Network connectivity issue
- Firewall blocking connection

---

## Immediate Solutions

### Option 1: Use Local PostgreSQL (Recommended for Development)

**Step 1: Install PostgreSQL**
```bash
# On Windows
# Download from: https://www.postgresql.org/download/windows/

# On macOS (with Homebrew)
brew install postgresql

# On Linux
sudo apt-get install postgresql postgresql-contrib
```

**Step 2: Start PostgreSQL**
```bash
# On Windows (if not auto-started)
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start

# On macOS
brew services start postgresql

# On Linux
sudo systemctl start postgresql
```

**Step 3: Create Database and User**
```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database
CREATE DATABASE bzion_dev;

# Create user
CREATE USER bzion_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bzion_dev TO bzion_user;

# Exit
\q
```

**Step 4: Update .env.local**
```env
DATABASE_URL="postgresql://bzion_user:your_secure_password@localhost:5432/bzion_dev?sslmode=disable"
USE_DATABASE=true
```

**Step 5: Run Migrations**
```bash
npx prisma migrate deploy
```

**Step 6: Test Connection**
```bash
curl http://localhost:3000/api/diagnostics/database
```

---

### Option 2: Use Cloud Database (Production)

#### PostgreSQL Providers:
1. **Vercel Postgres** (Recommended if on Vercel)
   - https://vercel.com/postgres
   - Automatic backups
   - Easy integration
   - Free tier available

2. **Railway** (Good for startups)
   - https://railway.app
   - Affordable and reliable
   - Good documentation

3. **Supabase** (PostgreSQL + Auth)
   - https://supabase.com
   - Open-source Firebase alternative
   - Free tier: 500MB database

4. **AWS RDS** (Enterprise)
   - https://aws.amazon.com/rds/
   - Fully managed
   - Scalable

5. **Azure Database for PostgreSQL**
   - https://azure.microsoft.com/en-us/products/postgresql/

---

## Diagnostic Steps

### Test 1: Check Connection String Format
```typescript
// Should be one of:
// postgresql://user:password@host:5432/database
// postgresql://user:password@host:5432/database?sslmode=require
// postgres://user:password@host:5432/database
```

### Test 2: Test Direct Connection
```bash
# Windows (psql in PATH)
psql "postgresql://user:password@host:5432/database"

# Or use pgAdmin
# https://www.pgadmin.org/

# Or use DBeaver
# https://dbeaver.io/
```

### Test 3: Check Network Connectivity
```bash
# Test if host is reachable
ping db.prisma.io

# Test if port is open
telnet db.prisma.io 5432

# On Windows with netstat
netstat -an | findstr 5432
```

### Test 4: Review Logs
```bash
# Check application logs
npm run dev 2>&1 | grep -i database

# Check PostgreSQL logs (if local)
# Windows: C:\Program Files\PostgreSQL\15\data\log\
# macOS: /usr/local/var/postgres/
# Linux: /var/log/postgresql/
```

---

## Prisma Cloud Account Issues

If you're using Prisma Cloud (`db.prisma.io`):

### Check Prisma Cloud Status:
1. Go to https://app.prisma.io
2. Sign in with your account
3. Check if database is still active (might have been deleted)
4. Check plan/billing status (free tier might have expired)
5. Check connection limits

### If Database is Deleted:
1. Create new database in Prisma Cloud
2. Get new connection string
3. Update DATABASE_URL in .env.local
4. Run: `npx prisma db push`
5. Test connection

---

## Temporary Workaround (Development Only)

While setting up a proper database, you can use in-memory storage:

**Update registration endpoint to use mock data:**

```typescript
// src/app/api/auth/register/route.ts
// Add at top
const mockUsers = new Map();

// In POST handler, before Prisma call:
if (process.env.USE_DATABASE !== 'true') {
  // Use in-memory storage
  if (mockUsers.has(email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }
  
  mockUsers.set(email.toLowerCase(), {
    id: mockUsers.size + 1,
    email: email.toLowerCase(),
    firstName: name,
    passwordHash: hashedPassword,
  });
  
  return NextResponse.json({
    success: true,
    message: 'Registration successful (in-memory - dev mode)',
  });
}
```

---

## Environment Variables to Check

```env
# Required
DATABASE_URL=postgresql://...

# Optional
USE_DATABASE=true    # Set to false to use fallback

# Debug
NODE_ENV=development  # Enables verbose logging
DEBUG=prisma:*        # Enable Prisma debugging
```

---

## Testing the Fix

### Step 1: Verify Connection
```bash
curl http://localhost:3000/api/diagnostics/database
```

Expected response (success):
```json
{
  "timestamp": "2025-12-15T...",
  "checks": {
    "databaseConnection": true,
    "connectionDetails": {
      "status": "connected",
      "testQuery": "SELECT 1 (successful)",
      "responseTime": "fast"
    },
    "error": null
  }
}
```

### Step 2: Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "company": "Test Company"
  }'
```

Expected response (success):
```json
{
  "success": true,
  "userId": 1,
  "message": "Registration successful! Please check your email to verify your account."
}
```

### Step 3: Check Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Quick Fix Checklist

- [ ] Verify DATABASE_URL is set correctly
- [ ] Test connection with `curl /api/diagnostics/database`
- [ ] Check if database server is running
- [ ] Verify network connectivity to database host
- [ ] Check database credentials are correct
- [ ] Run `npx prisma migrate deploy` if needed
- [ ] Restart dev server: `npm run dev`
- [ ] Test registration endpoint

---

## Additional Resources

- Prisma Documentation: https://www.prisma.io/docs/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Connection String Format: https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
- Vercel Postgres Setup: https://vercel.com/docs/storage/vercel-postgres/quickstart

---

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
2. **Review .env.local** - Ensure DATABASE_URL is correct
3. **Test database directly** - Use psql or pgAdmin to verify connectivity
4. **Check firewall** - Ensure port 5432 is not blocked
5. **Contact database provider** - Check service status page

