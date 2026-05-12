# Deployment Guide - Hajj Companion

This guide covers deploying the Hajj Companion monorepo to production using Railway (backend) and Vercel (frontend) with GitHub Actions CI/CD.

## Architecture Overview

```
GitHub Repository (main branch)
    ├── CI/CD Workflows (GitHub Actions)
    ├── API Server (artifacts/api-server) → Railway
    ├── Frontend (artifacts/hajj-companion) → Vercel
    └── Database (PostgreSQL) → Railway
```

---

## Prerequisites

- GitHub repository with code pushed
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- GitHub CLI or web access for secrets management
- Node.js 20.x (for local testing)

---

## Part 1: Railway Setup (Backend + Database)

### 1.1 Create Railway Project

1. Go to https://railway.app and sign up
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize GitHub and select your Hajj Companion repository

### 1.2 Add PostgreSQL Database

1. In Railway project, click "Add Service"
2. Select "PostgreSQL"
3. Railway auto-provisions the database
4. Click on PostgreSQL service → "Connect" tab
5. Copy the `DATABASE_URL` connection string
6. Save it for API server configuration

### 1.3 Deploy API Server

1. In your Railway project, click "Add Service"
2. Select "Deploy from GitHub repo"
3. Choose your Hajj Companion repository
4. Configure:
   - **Root Directory**: Leave empty (uses repository root)
   - **Framework**: Node.js

### 1.4 Set Railway Environment Variables

For the API service in Railway dashboard:

1. Click on the API service
2. Go to "Variables" tab
3. Add the following environment variables:

```
PORT=8080
NODE_ENV=production
DATABASE_URL=<copy from PostgreSQL service>
JWT_SECRET=<generate random string>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.5 Configure Railway Build & Start Commands

In Railway API service settings:

- **Build Command**: `pnpm install && pnpm run build --filter @workspace/api-server`
- **Start Command**: `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`
- **Working Directory**: (leave empty - uses repo root)

### 1.6 Run Database Migrations

After Railway deploys the API:

**Option A: Using Railway CLI**
```bash
railway login
railway link  # Link to your project
railway run pnpm --filter @workspace/db run push
```

**Option B: Railway Dashboard**
1. Click on API service → "Deployment"
2. View logs to confirm it's running
3. Then manually run migration script

### 1.7 Get API URL

Once deployed:
1. Railway project → API service
2. Click "View Logs" to confirm running
3. Railway assigns a public URL (e.g., `https://hajj-api-prod.railway.app`)
4. Copy and save this URL for Vercel configuration

---

## Part 2: Vercel Setup (Frontend)

### 2.1 Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Authorize GitHub and select Hajj Companion repository
5. Vercel auto-detects Vite framework

### 2.2 Configure Build Settings

In Vercel project settings:

**Build & Development:**
- **Framework Preset**: Vite
- **Build Command**: `pnpm run build --filter @workspace/hajj-companion`
- **Output Directory**: `artifacts/hajj-companion/dist/public`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Node.js Version**: 20.x

### 2.3 Set Environment Variables

In Vercel project settings → "Environment Variables":

```
VITE_API_BASE_URL=https://your-railway-api-url.railway.app
BASE_PATH=/
```

Replace `your-railway-api-url.railway.app` with the actual Railway URL from Part 1.7

### 2.4 Deploy

1. Click "Deploy"
2. Vercel builds and deploys automatically
3. Vercel assigns a URL (e.g., `https://hajj-companion.vercel.app`)
4. Deployment takes 2-5 minutes

### 2.5 Verify Deployment

1. Open your Vercel URL in browser
2. Test the authentication flow
3. Check browser DevTools → Network tab
4. Confirm API calls go to your Railway API URL

---

## Part 3: GitHub Actions CI/CD Setup

### 3.1 Add GitHub Secrets

Go to your GitHub repository:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Get From |
|------------|-------|----------|
| `RAILWAY_TOKEN` | Your Railway API token | Railway account settings |
| `VERCEL_TOKEN` | Your Vercel API token | Vercel account page |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Vercel account settings |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Vercel project settings |

### 3.2 Get Railway Token

1. Go to https://railway.app/account/settings
2. Scroll to "API Tokens"
3. Click "Create New Token"
4. Copy the token
5. Add to GitHub as `RAILWAY_TOKEN` secret

### 3.3 Get Vercel Tokens & IDs

1. Go to https://vercel.com/account/tokens
2. Create new token, copy and save as `VERCEL_TOKEN`
3. Go to https://vercel.com/account/settings/organization
4. Find and copy `VERCEL_ORG_ID`
5. Go to your Vercel project → Settings
6. Find and copy `VERCEL_PROJECT_ID`

### 3.4 How CI/CD Works

**CI Workflow** (`.github/workflows/ci.yml`):
- Triggers: On push/PR to main/develop
- Tests: TypeScript checking, builds API & frontend
- Status: ✅ Must pass before merging

**Deploy Workflow** (`.github/workflows/deploy.yml`):
- Triggers: On push to main branch only
- Steps:
  1. Run CI checks
  2. Build production artifacts
  3. Deploy to Railway
  4. Deploy to Vercel

---

## Part 4: Environment Variables Reference

### Development (Local)

**Frontend (artifacts/hajj-companion/.env):**
```
VITE_API_BASE_URL=http://localhost:8090
BASE_PATH=/
PORT=4173
```

**Backend (artifacts/api-server/.env):**
```
PORT=8090
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
JWT_SECRET=dev-secret-key
```

**Database (lib/db/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
```

### Production (Railway Backend)

```
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://...  (from Railway PostgreSQL)
JWT_SECRET=<secure-random-32-char-string>
```

### Production (Vercel Frontend)

```
VITE_API_BASE_URL=https://your-railway-api.railway.app
BASE_PATH=/
```

---

## Part 5: Deployment Checklist

Before going live:

- [ ] PostgreSQL database created on Railway
- [ ] API server deployed to Railway
- [ ] Environment variables set in Railway
- [ ] Database migrations ran successfully
- [ ] Frontend project created on Vercel
- [ ] Frontend environment variables set with correct API URL
- [ ] GitHub secrets added (RAILWAY_TOKEN, VERCEL_TOKEN, etc.)
- [ ] CI/CD workflows configured and tested
- [ ] Test deployment by pushing to main branch
- [ ] Verify API responses from frontend work
- [ ] Monitor logs for errors

---

## Part 6: Monitoring & Debugging

### Railway Logs

1. Go to your Railway project
2. Select your API service
3. Click "Logs" tab
4. Real-time logs appear
5. Use for debugging deployment issues

### Vercel Logs

1. Go to your Vercel project
2. Click "Deployments"
3. Select a deployment
4. Click "View Logs"
5. See build and runtime logs

### Health Check

Test if API is running:

```bash
curl https://your-railway-api.railway.app/health
```

Should return HTTP 200.

### Test Frontend API Call

In browser console on Vercel URL:

```javascript
fetch('https://your-api.railway.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    passportNo: 'TEST123',
    fullNameAr: 'اختبار',
    nationality: 'SA',
    phone: '9665555555',
    password: 'Test1234'
  })
}).then(r => r.json()).then(console.log)
```

---

## Part 7: Troubleshooting

### Issue: Frontend can't connect to API

**Solution:**
1. Verify `VITE_API_BASE_URL` in Vercel environment variables
2. Check API server is running: `curl https://your-api/health`
3. Check CORS headers in API response
4. Check browser console for error messages

### Issue: Database migration fails

**Solution:**
```bash
# Run manually via Railway CLI
railway run pnpm --filter @workspace/db run push

# Or check logs for error details
railway logs -s api-service
```

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify Node.js version is 20.x
3. Ensure `pnpm-lock.yaml` is committed to Git
4. Check all environment variables are set

### Issue: Build fails on Railway

**Solution:**
1. Check Railway deployment logs
2. Verify start command is correct
3. Check all required environment variables
4. Ensure `package.json` scripts are valid

### Issue: API returns 404 errors

**Solution:**
1. Verify API server started correctly: check logs
2. Check routes are registered in API service
3. Verify database connection works
4. Check JWT_SECRET is set

---

## Part 8: Continuous Deployment Flow

After initial setup, here's the deployment flow:

```
1. Developer pushes to main branch
   ↓
2. GitHub Actions triggers CI workflow
   ├─ TypeScript check
   ├─ Build API
   ├─ Build frontend
   ├─ All tests pass?
   ↓
3. If all pass → Deploy workflow starts
   ├─ Deploy to Railway (API + DB)
   ├─ Deploy to Vercel (Frontend)
   ↓
4. New code live in production
   ├─ Frontend: https://your-app.vercel.app
   ├─ Backend: https://your-api.railway.app
```

**Note:** Deployments only happen on `main` branch. Use feature branches for development.

---

## Quick Reference Commands

### Local Development

```bash
# Install dependencies
pnpm install

# Type checking
pnpm run typecheck

# Build all
pnpm run build

# Start API server (port 8090)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 4173)
pnpm --filter @workspace/hajj-companion run dev

# Run database migrations
pnpm --filter @workspace/db run push
```

### Railway Commands

```bash
# Login to Railway
railway login

# Link to project
railway link

# View logs
railway logs -s api-service

# Run command in Railway environment
railway run pnpm --filter @workspace/db run push

# Redeploy
railway redeploy
```

### Docker (Optional - for local testing of production build)

```bash
# Build image
docker build -t hajj-api .

# Run container
docker run -e PORT=8080 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=secret \
  -p 8080:8080 \
  hajj-api
```

---

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Drizzle Migrations**: https://orm.drizzle.team/docs/migrations
- **Express.js**: https://expressjs.com/
- **React + Vite**: https://vitejs.dev/guide/

---

## Summary

You now have a complete CI/CD pipeline:

✅ **Local Development** - Works with your current config  
✅ **GitHub Actions** - Automated tests on every push  
✅ **Railway** - Backend + Database hosting  
✅ **Vercel** - Frontend hosting with CDN  
✅ **Production** - Auto-deploys to both services on main branch push  

Next step: **Follow Part 1-3 to set up Railway, Vercel, and GitHub secrets**, then push to main to trigger automatic deployment.
