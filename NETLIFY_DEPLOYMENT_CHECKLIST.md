# Netlify Deployment Checklist

## Pre-Deployment Setup ✅

### 1. Repository Configuration
- [x] All code pushed to GitHub main branch
- [x] `.gitignore` includes sensitive files (.env.local, node_modules, .next, etc.)
- [x] No secrets committed to git
- [x] SSH key properly configured for GitHub

### 2. Code Quality
- [x] Run `npm run typecheck` - passes without errors
- [x] Run `npm run build` - compiles successfully
- [x] Run `npm run lint` - no critical errors
- [x] All TypeScript errors resolved

### 3. Dependencies
- [x] `npm install` completes successfully
- [x] Node version 20.x compatible
- [x] All required packages installed
- [x] No deprecated packages

---

## Netlify Configuration ✅

### 4. Site Connection
- [x] Site connected to GitHub repository (Logonotobscurity/bzionu)
- [x] Production branch set to `main`
- [x] Automatic deployments enabled

### 5. Build Settings
In **Site Settings > Build & Deploy > Build settings**:
- [x] Build command: `npm run build`
- [x] Publish directory: `.next`
- [x] Node version: Set to 20

In **netlify.toml**:
- [x] Build command configured
- [x] Publish directory configured
- [x] Environment variables documented
- [x] Headers configured for caching

---

## Environment Variables Setup 🔒

### 6. Netlify UI Environment Configuration
In **Site Settings > Build & Deploy > Environment**:

#### Authentication
- [ ] `NEXTAUTH_URL` = `https://bzionshopfmcg.netlify.app`
- [ ] `NEXTAUTH_SECRET` = (your secure secret - copy from .env)
- [ ] `AUTH_URL` = `https://bzionshopfmcg.netlify.app`

#### Database
- [ ] `DATABASE_URL` = (your full PostgreSQL connection string)

#### Email Service
- [ ] `EMAIL_SERVER_HOST` = `smtp.resend.com`
- [ ] `EMAIL_SERVER_PORT` = `587`
- [ ] `EMAIL_SERVER_USER` = `resend`
- [ ] `EMAIL_SERVER_PASSWORD` = (your Resend API key)
- [ ] `EMAIL_FROM` = `BZION <noreply@bzion.shop>`

#### Caching
- [ ] `UPSTASH_REDIS_REST_URL` = (your Upstash URL)
- [ ] `UPSTASH_REDIS_REST_TOKEN` = (your Upstash token)

#### Public Variables (safe to add)
- [ ] `NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE` = `+2347010326015`
- [ ] `NEXT_PUBLIC_APP_VERSION` = `1.0.0`
- [ ] `NEXT_WHATSAPP_BUSINESS_URL` = (your WhatsApp link)
- [ ] `WHATSAPP_BUSINESS_NUMBER` = `+2347010326015`
- [ ] `WHATSAPP_BUSINESS_URL` = (your WhatsApp link)
- [ ] `DATA_SOURCE` = `static`

#### Build Environment
- [ ] `NODE_ENV` = `production`
- [ ] `NODE_VERSION` = `20`
- [ ] `NPM_FLAGS` = `--include=dev`

### 7. External Services Configuration

**Database (Prisma)**
- [ ] PostgreSQL database accessible from Netlify
- [ ] Database firewall allows Netlify IPs
- [ ] Connection string tested locally

**Email Service (Resend)**
- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Test email sent successfully

**Caching (Upstash Redis)**
- [ ] Upstash account created
- [ ] Redis database created
- [ ] REST endpoint and token copied
- [ ] Network access configured

---

## Pre-Deployment Testing 🧪

### 8. Local Testing
```bash
# Build test (should complete without errors)
npm run build

# Type checking
npm run typecheck

# Dev server test
npm run dev
# Visit http://localhost:3000/login
# Visit http://localhost:3000/admin (if authorized)
```

### 9. Manual Deployment Trigger
- [ ] Navigate to https://app.netlify.com/sites/bzionshopfmcg
- [ ] Click **Deployments** tab
- [ ] Click **"Trigger deploy"** → **"Deploy site"**
- [ ] Wait for build to complete
- [ ] Check build logs for warnings/errors

---

## Post-Deployment Verification ✅

### 10. Accessibility Testing
Visit https://bzionshopfmcg.netlify.app and verify:
- [ ] Homepage loads without errors
- [ ] `/login` page accessible
- [ ] `/register` page works
- [ ] Authentication flow functional
- [ ] `/admin` dashboard loads (if admin)
- [ ] Email notifications work

### 11. Browser Console Check
- [ ] No critical JavaScript errors
- [ ] No red errors in console
- [ ] Network requests successful
- [ ] API calls complete successfully

### 12. Build Log Review
In **Deployments > [Latest Deploy] > Logs**:
- [ ] No Prisma errors
- [ ] No NextAuth errors
- [ ] No missing environment variables
- [ ] All imports resolved

### 13. Functionality Verification
- [ ] Create test account (sign up)
- [ ] Login with credentials
- [ ] Reset password (if available)
- [ ] Magic link authentication
- [ ] Admin features (if applicable)
- [ ] Database queries working

---

## Post-Deployment Configuration

### 14. Domain Setup (if using custom domain)
- [ ] Custom domain configured in Netlify
- [ ] DNS records updated
- [ ] SSL certificate generated (automatic)
- [ ] Force HTTPS enabled

### 15. Monitoring & Alerts
- [ ] Netlify build notifications enabled
- [ ] Email alerts configured for failed deployments
- [ ] Performance monitoring set up
- [ ] Error tracking configured

### 16. Documentation
- [ ] NETLIFY_ENV_SETUP_GUIDE.md created
- [ ] README updated with deployment info
- [ ] Team has access to deployment process
- [ ] Troubleshooting guide documented

---

## Ongoing Maintenance

### 17. Regular Updates
- [ ] Check for Netlify announcements
- [ ] Monitor Node.js version updates
- [ ] Update dependencies regularly
- [ ] Review environment variables quarterly

### 18. Security
- [ ] Never expose sensitive variables in logs
- [ ] Rotate secrets periodically
- [ ] Review GitHub access
- [ ] Monitor database security

### 19. Performance Optimization
- [ ] Monitor build times (should be < 5 minutes)
- [ ] Check Lighthouse scores
- [ ] Optimize bundle size
- [ ] Monitor API response times

---

## Quick Links

- 📱 Site Dashboard: https://app.netlify.com/sites/bzionshopfmcg
- 🌐 Live Site: https://bzionshopfmcg.netlify.app
- 📊 Analytics: https://app.netlify.com/sites/bzionshopfmcg/analytics
- ⚙️ Settings: https://app.netlify.com/sites/bzionshopfmcg/settings
- 📝 Build Logs: https://app.netlify.com/sites/bzionshopfmcg/deploys

---

## Troubleshooting Quick Links

- NextAuth Issues: See NETLIFY_ENV_SETUP_GUIDE.md - Troubleshooting section
- Database Errors: Check DATABASE_URL in Netlify UI
- Build Failures: Review build logs in Deployments tab
- Environment Variables: Verify all variables are set in Netlify UI

---

## Notes

- Keep .env.local for local development (git-ignored)
- Never commit sensitive values to GitHub
- Use .env.local.example as reference for local setup
- All production variables go in Netlify UI only

Last Updated: December 19, 2025
