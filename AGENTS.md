# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Market Notes Haven is a Vite + React + TypeScript PWA for business management (market notes, legal, kanban, financial, crypto, procurement, etc.). The backend is **Supabase Cloud** (hosted, not local) — no database or Supabase CLI setup is needed.

### Services

| Service | Port | Command | Notes |
|---|---|---|---|
| Vite dev server | 8080 | `npm run dev` | Main frontend; also proxies `/api/legal-files` and `/api/work-files` to port 3001 |
| API server | 3001 | `node api-server.mjs` | Filesystem API for legal/work file browsing; requires `/root/Robsonway-Research/Legal` to exist (`sudo mkdir -p /root/Robsonway-Research/Legal && sudo chmod -R 777 /root/Robsonway-Research`) |

### Standard commands

See `package.json` scripts:
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint` (ESLint; pre-existing warnings/errors exist in the codebase)
- **Preview**: `npm run preview`

### Non-obvious caveats

- The API server (`api-server.mjs`) expects `/root/Robsonway-Research/Legal` to exist. Create it with `sudo mkdir -p /root/Robsonway-Research/Legal && sudo chmod -R 777 /root/Robsonway-Research` before starting.
- There is no test framework configured — no unit/integration test suite exists.
- All routes except `/auth` are protected by Supabase authentication. To test authenticated features, a valid Supabase account is required.
- The `.env` file contains Supabase project credentials (anon key) that are committed to the repo.
- Both `package-lock.json` (npm) and `bun.lockb` (bun) exist; use **npm** as the primary package manager.
- The Vite dev server listens on `::` (all interfaces) on port 8080.
