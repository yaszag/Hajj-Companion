# Quick Start Guide

## Local Development Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL + API Server)
docker-compose up -d

# In a new terminal, start the frontend dev server
pnpm --filter @workspace/hajj-companion run dev

# Frontend will be available at: http://localhost:4173
# API Server at: http://localhost:8090
# PostgreSQL at: localhost:5432
```

### Option 2: Manual Setup

**1. Start PostgreSQL locally (install PostgreSQL first):**
```bash
# macOS/brew
brew services start postgresql

# Windows
# Start PostgreSQL via Services or Windows Subsystem
```

**2. Create database:**
```bash
createdb hajj_db
```

**3. Copy environment files:**
```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp artifacts/hajj-companion/.env.example artifacts/hajj-companion/.env
cp lib/db/.env.example lib/db/.env
```

**4. Update DATABASE_URL in lib/db/.env if needed:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hajj_db
```

**5. Install dependencies:**
```bash
pnpm install
```

**6. Run database migrations:**
```bash
pnpm --filter @workspace/db run push
```

**7. Start API Server (Terminal 1):**
```bash
pnpm --filter @workspace/api-server run dev
```

**8. Start Frontend (Terminal 2):**
```bash
pnpm --filter @workspace/hajj-companion run dev
```

---

## Production Deployment

For full deployment to Railway (backend) and Vercel (frontend), see [DEPLOYMENT.md](./DEPLOYMENT.md)

Quick summary:
1. Set up Railway + PostgreSQL
2. Set up Vercel project
3. Add GitHub secrets (RAILWAY_TOKEN, VERCEL_TOKEN, etc.)
4. Push to main branch → CI/CD handles the rest

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Type checking (all packages)
pnpm run typecheck

# Build all
pnpm run build

# Build specific package
pnpm run build --filter @workspace/api-server
pnpm run build --filter @workspace/hajj-companion

# Start API dev server
pnpm --filter @workspace/api-server run dev

# Start frontend dev server
pnpm --filter @workspace/hajj-companion run dev

# Run database migrations
pnpm --filter @workspace/db run push

# Generate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run generate

# Docker build (same as production)
docker build -t hajj-api .
```

---

## Environment Variables

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:8090  # Points to local API
BASE_PATH=/
PORT=4173
```

**Backend (artifacts/api-server/.env):**
```
PORT=8090
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
JWT_SECRET=dev-secret
```

**Database (lib/db/.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hajj_db
```

---

## Troubleshooting

### Port already in use
```bash
# Find process on port
lsof -i :8090  # macOS/Linux
netstat -ano | findstr :8090  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database connection failed
```bash
# Test PostgreSQL connection
psql postgresql://postgres:postgres@localhost:5432/hajj_db

# Check if PostgreSQL is running
# macOS
brew services list

# Windows
# Check Services app for PostgreSQL
```

### Frontend can't reach API
- Verify API server is running on port 8090
- Check `VITE_API_BASE_URL` in `.env` is correct
- Clear browser cache and restart dev server

---

## Project Structure

```
hajj-companion/
├── artifacts/
│   ├── api-server/      # Express backend
│   ├── hajj-companion/  # React + Vite frontend
│   └── mockup-sandbox/  # UI mockup testing
├── lib/
│   ├── db/              # Drizzle database schema
│   ├── api-zod/         # API validation schemas
│   ├── api-client-react/ # Generated API client
│   └── api-spec/        # OpenAPI specification
├── scripts/             # Seed scripts
├── .github/workflows/   # CI/CD
├── Dockerfile           # Production build
├── docker-compose.yml   # Local development
└── DEPLOYMENT.md        # Deployment guide
```

---

## Next Steps

1. **Read DEPLOYMENT.md** for production setup
2. **Join the team Discord** for questions
3. **Check open issues** for features to work on
4. **Create branches** from main for new features
