# Deployment Configuration Complete ✅

This document summarizes the production deployment setup for Hajj Companion using Railway (backend) and Vercel (frontend) with GitHub Actions CI/CD.

## What Was Created

### 1. **Docker & Railway Configuration**
- ✅ `Dockerfile` - Multi-stage production build for API server
- ✅ `railway.toml` - Railway deployment configuration
- ✅ `docker-compose.yml` - Local development environment

### 2. **Vercel Configuration**
- ✅ `vercel.json` - Frontend build and deployment settings with cache headers

### 3. **GitHub Actions CI/CD**
- ✅ `.github/workflows/ci.yml` - Continuous integration (tests, builds, type checking)
- ✅ `.github/workflows/deploy.yml` - Continuous deployment to Railway + Vercel

### 4. **Environment Configuration**
- ✅ `.env.example` files for each package
- ✅ Updated `.gitignore` to exclude `.env` files
- ✅ Environment variable documentation

### 5. **Documentation**
- ✅ `DEPLOYMENT.md` - Complete deployment guide (8 parts)
- ✅ `QUICKSTART.md` - Quick start for local development
- ✅ This file

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│         GitHub Repository                     │
│  (Push triggers GitHub Actions)              │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ┌────────────┐   ┌──────────────┐
    │ CI/Tests   │   │ CI/Tests     │
    │ (GitHub)   │   │ (GitHub)     │
    └─────┬──────┘   └──────┬───────┘
          │                  │
          ▼                  ▼
    ┌──────────────────────────────┐
    │ Deploy to Production          │
    │ (if on main branch)           │
    └────────┬─────────────┬────────┘
             │             │
             ▼             ▼
        ┌─────────┐   ┌──────────┐
        │ Railway │   │ Vercel   │
        │ Backend │   │Frontend  │
        │(API+DB) │   │(React)   │
        └─────────┘   └──────────┘
```

---

## 🚀 Next Steps to Deploy

### Step 1: Commit Configuration Files
```bash
git add .
git commit -m "chore: add production deployment configuration

- Add Dockerfile for Railway backend
- Add vercel.json for frontend
- Add GitHub Actions workflows (CI/CD)
- Add deployment documentation
- Add environment variable examples"
git push origin main
```

### Step 2: Set Up Railway (Backend)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up / Log in

2. **Connect GitHub**
   - Railway → Your Account → Tokens
   - Create API token, save as GitHub secret: `RAILWAY_TOKEN`

3. **Create New Project**
   - Railway Dashboard → New Project
   - Add PostgreSQL database (auto-configured)
   - Note the `DATABASE_URL` connection string

4. **Deploy API Service**
   - Add Service → Deploy from GitHub repo
   - Use `Dockerfile` at repository root
   - Set environment variables:
     ```
     PORT=8080
     DATABASE_URL=<from PostgreSQL service>
     NODE_ENV=production
     JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
     ```

5. **Get API URL**
   - Railway auto-assigns domain (e.g., `https://hajj-api-prod.railway.app`)
   - Save this for Vercel configuration

### Step 3: Set Up Vercel (Frontend)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up / Log in
   - Get tokens: https://vercel.com/account/tokens

2. **Get Vercel IDs**
   - Go to your Vercel dashboard
   - Project Settings → General
   - Copy: `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

3. **Create New Project**
   - Vercel Dashboard → Add New → Project
   - Import your GitHub repository
   - Select framework: "Other" (auto-detects Vite)

4. **Configure Environment**
   - Environment Variables:
     ```
     VITE_API_BASE_URL=https://your-railway-api-url.railway.app
     BASE_PATH=/
     ```

### Step 4: Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret | Value | Get From |
|--------|-------|----------|
| `RAILWAY_TOKEN` | Railway API token | Railway account settings |
| `VERCEL_TOKEN` | Vercel API token | Vercel account page |
| `VERCEL_ORG_ID` | Your Vercel org ID | Vercel project settings |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Vercel project settings |
| `PROD_API_URL` | https://your-railway-api.railway.app | After Railway deploys |

### Step 5: Run Database Migrations

After Railway deploys, run migrations:

**Option A: Via Railway UI**
1. Railway dashboard → Your API service
2. Click "Deployments" → Latest
3. Environment → Add command:
   ```
   postDeployCommand: pnpm --filter @workspace/db run push
   ```

**Option B: Manual SSH**
```bash
railway run pnpm --filter @workspace/db run push
```

### Step 6: Test Deployment

1. **Push to main** (or manually trigger)
   ```bash
   git push origin main
   ```

2. **Watch GitHub Actions**
   - GitHub → Actions tab
   - View `Deploy to Production` workflow
   - Wait for ✅ all steps to complete

3. **Test API**
   ```bash
   curl https://your-railway-api.railway.app/api/health
   ```

4. **Test Frontend**
   - Open `https://your-vercel-url.vercel.app`
   - Try authentication flow
   - Check browser Network tab for API calls

---

## Environment Variables Reference

### Local Development
```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8090
BASE_PATH=/
PORT=4173

# Backend (.env)
PORT=8090
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
JWT_SECRET=dev-secret

# Database (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
```

### Production (Railway)
```
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://...  # From Railway PostgreSQL
JWT_SECRET=<secure-random-key>
```

### Production (Vercel)
```
VITE_API_BASE_URL=https://your-railway-api.railway.app
BASE_PATH=/
```

---

## CI/CD Workflows Explained

### CI Workflow (`ci.yml`)
**Triggers:** On push/PR to main or develop

**Steps:**
1. Check out code
2. Install dependencies
3. Run TypeScript checking
4. Build API server
5. Build frontend
6. Optional: Run linting

**Status:** Runs on every PR - must pass before merging

### Deploy Workflow (`deploy.yml`)
**Triggers:** On push to main branch (auto) or manual trigger

**Steps:**
1. Run CI checks
2. Build production artifacts
3. Deploy to Railway (if CI passes)
4. Deploy to Vercel (if CI passes)

**Status:** Automatic deployment to production on main branch

---

## Monitoring & Maintenance

### Health Checks
```bash
# Check API is running
curl https://your-api.railway.app/health

# Check frontend is accessible
curl https://your-app.vercel.app

# Check database connection (from Railway logs)
railway logs -s api-service
```

### Logs Access
- **Railway**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Deployments → Logs
- **GitHub Actions**: Repository → Actions → Workflow → Logs

### Scaling
- **Railway**: Adjust CPU/RAM in service settings
- **Vercel**: Automatic CDN scaling (free tier included)
- **Database**: Upgrade PostgreSQL plan in Railway

---

## Rollback Procedure

If deployment has issues:

**Railway:**
1. Railway Dashboard → Deployments
2. Select previous working deployment
3. Click "Redeploy"

**Vercel:**
1. Vercel Dashboard → Deployments
2. Select previous working deployment
3. Click "Redeploy"

---

## Common Issues & Solutions

### API calls fail from frontend
- ✅ Check `VITE_API_BASE_URL` in Vercel environment
- ✅ Verify Railway service is running
- ✅ Check CORS headers in API response

### Database migrations fail
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check PostgreSQL service is running on Railway
- ✅ Run manually: `railway run pnpm --filter @workspace/db run push`

### Build fails in Vercel
- ✅ Check Node version matches (should be 20.x)
- ✅ Verify `pnpm-lock.yaml` is committed
- ✅ Check environment variables are set

### Build fails in Railway
- ✅ Review Dockerfile for errors
- ✅ Check `railway.toml` configuration
- ✅ Verify all required env vars are set

---

## Security Checklist

- ✅ `.env` files are in `.gitignore` (not committed)
- ✅ GitHub secrets are configured securely
- ✅ JWT_SECRET is a random 32+ character string
- ✅ DATABASE_URL contains secure password
- ✅ API uses CORS restrictions (optional)
- ✅ Frontend uses HTTPS only in production
- ✅ No sensitive data in source code

---

## Files Overview

| File | Purpose | Location |
|------|---------|----------|
| Dockerfile | Production build image | Root |
| railway.toml | Railway deployment config | Root |
| docker-compose.yml | Local dev environment | Root |
| vercel.json | Vercel build config | Root |
| ci.yml | GitHub CI workflow | .github/workflows/ |
| deploy.yml | GitHub CD workflow | .github/workflows/ |
| DEPLOYMENT.md | Detailed guide (8 sections) | Root |
| QUICKSTART.md | Quick start guide | Root |
| .env.example | Example env vars | Each package |

---

## Support Resources

- **Railway Documentation**: https://docs.railway.app
- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Docker**: https://docs.docker.com
- **Drizzle ORM**: https://orm.drizzle.team

---

## Summary

You now have:
- ✅ Production-ready Docker build
- ✅ Automated CI/CD pipeline
- ✅ Railway backend deployment ready
- ✅ Vercel frontend deployment ready
- ✅ Complete documentation

**To deploy:**
1. Follow "Step 1-6" above
2. Push code to main
3. GitHub Actions will deploy automatically
4. Monitor via Railway & Vercel dashboards

Good luck! 🚀
