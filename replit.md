# رفيق الحج — Hajj Companion

A full-stack Progressive Web App that guides Muslim pilgrims through their Hajj journey with Arabic RTL UI, compass navigation, group tracking, manasik ritual checklists, and emergency SOS.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/hajj-companion run dev` — run the frontend (Vite dev server, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Wouter routing, TailwindCSS, Arabic RTL (Cairo font), react-leaflet maps
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcryptjs), `requireAuth` middleware
- Validation: Zod (`zod/v4`), `drizzle-zod`, Orval-generated schemas
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, groups, locations, places, navigation, manasik, emergency)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod request/response schemas
- `artifacts/api-server/src/routes/` — Express route handlers (auth, groups, locations, manasik, places, navigation, emergency, dashboard)
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware (`requireAuth`)
- `artifacts/api-server/src/lib/geo.ts` — haversine distance, bearing, Arabic direction names, ETA
- `artifacts/hajj-companion/src/` — React frontend (pages/, components/, lib/)

## Architecture decisions

- Contract-first API: OpenAPI spec drives both server Zod validation and client React Query hooks via Orval codegen.
- JWT stored in localStorage; injected into every API call via `setAuthTokenGetter` in `custom-fetch.ts`.
- All geographic math (bearing, distance, ETA) lives in `lib/geo.ts` on the server; duplicated in `lib/navigation.ts` on the client for offline compass use.
- MANASIK_LIST is static data in the DB schema package — it defines the fixed ritual checklist; user progress is stored in `manasik_progress` table.
- Arabic RTL is set globally via `dir="rtl"` on `<html>`, with Cairo font from Google Fonts.

## Product

- **Auth**: Pilgrims register with passport number, name, nationality, phone. Login via phone + password. JWT auth.
- **Dashboard**: Personalized greeting, manasik completion ring, group summary, nearby saved places, SOS shortcut.
- **Manasik**: Step-by-step ritual checklist (Ihram → Tawaf → Sa'i → Mina → Arafat → Muzdalifah → Rami → Hadyi → Halq → Farewell Tawaf) with status tracking.
- **Places**: Save personal locations with emoji/color, share with group, view on Leaflet map, navigate to any place.
- **Navigation**: Real-time compass bearing + distance using device GPS; Haversine math; Arabic direction names (شمال، جنوب، شرق، غرب…).
- **Group**: Create/join pilgrim groups via 6-character invite code; see live member locations on map.
- **Emergency SOS**: One-tap SOS alert stored in DB; resolve when safe.
- **Profile**: Pilgrim info display, tent zone, emergency contact, logout.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after editing any `lib/*` package before typechecking artifacts — the artifact TS references compiled lib declarations.
- After changing `lib/api-spec/openapi.yaml`, run codegen: `pnpm --filter @workspace/api-spec run codegen`.
- Do not run `pnpm run dev` at workspace root — use individual `--filter` commands or restart workflows.
- `char` is not exported from `drizzle-orm/pg-core` — use `varchar` with a length constraint instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
