# Netlify Deployment Configuration Guide

## Critical Steps for Production Deployment

### 1. Set Environment Variables in Netlify UI

Navigate to your Netlify site settings and set these environment variables:

#### Required for Authentication
- **NEXTAUTH_URL**: `https://bzionshopfmcg.netlify.app`
- **NEXTAUTH_SECRET**: `Xhs5QRfukZTPuvRl9YTGqVMdtO2ddO+K9va07qA+JAs=`

#### Database (Critical)
- **DATABASE_URL**: Your Prisma PostgreSQL connection string

#### Email Service
- **EMAIL_SERVER_HOST**: `smtp.resend.com`
- **EMAIL_SERVER_PORT**: `587`
- **EMAIL_SERVER_USER**: `resend`
- **EMAIL_SERVER_PASSWORD**: Your Resend API key

#### Redis Caching
- **UPSTASH_REDIS_REST_URL**: Your Upstash Redis URL
- **UPSTASH_REDIS_REST_TOKEN**: Your Upstash Redis token

#### Build Configuration
- **NODE_VERSION**: `20`
- **NODE_ENV**: `production`
- **NPM_FLAGS**: `--include=dev`

### 2. How to Set Environment Variables

1. Go to your Netlify site dashboard
2. Click "Site Settings" → "Build & Deploy" → "Environment"
3. Click "Add environment variables" or "Edit variables"
4. Add each variable with its value
5. Redeploy the site

### 3. Common Issues and Solutions

#### Issue: "Configuration error" on /auth/error page
**Cause**: `NEXTAUTH_URL` is not set or points to wrong domain
**Fix**: Set `NEXTAUTH_URL=https://bzionshopfmcg.netlify.app` in Netlify

#### Issue: Can't reach database server
**Cause**: `DATABASE_URL` not set in Netlify environment
**Fix**: Ensure `DATABASE_URL` is set in Netlify UI

#### Issue: Email not sending
**Cause**: Email environment variables not configured
**Fix**: Verify EMAIL_SERVER_* variables in Netlify

#### Issue: Slow page loads / TTFB > 1000ms
**Cause**: Database connection timeouts on admin pages
**Fix**: Ensure DATABASE_URL points to a responsive database server

### 4. Testing Authentication After Deployment

1. Visit `https://bzionshopfmcg.netlify.app/api/auth/debug`
2. Check the response for proper environment configuration
3. Visit `/login` to test the login flow

### 5. Monitoring

Monitor your Netlify functions logs for any errors:
1. Go to "Netlify UI" → "Functions"
2. Check logs for errors related to NextAuth
3. Verify database connectivity

## Important Notes

- ✅ `NEXTAUTH_SECRET` must be the same across all deployments
- ✅ `NEXTAUTH_URL` must match your actual deployment domain
- ✅ Database connection must be accessible from Netlify's network
- ✅ All secrets should be set as environment variables, not in files
- ⚠️ Never commit `.env.production` with real secrets to Git
