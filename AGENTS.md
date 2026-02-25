# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Market Notes Haven ("ONE") — a React + Vite + TypeScript business management PWA built with shadcn/ui and Tailwind CSS. It connects to a **remote Supabase cloud instance** for auth, database, and storage (no local DB setup needed). Supabase Edge Functions (22) are deployed remotely.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (serves on port 8080) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

### Dev server notes

- The Vite dev server listens on `::` (all interfaces), port **8080**.
- Proxy rules forward `/api/legal-files` and `/api/work-files` to `http://127.0.0.1:3001` (optional `api-server.mjs`).
- A custom Vite plugin serves `/api/browse-folders` for filesystem browsing during dev.
- ESLint reports pre-existing warnings/errors (mostly `@typescript-eslint/no-explicit-any` and react-hooks exhaustive-deps) — these are part of the existing codebase.

### Authentication

The app requires Supabase auth with email verification. To test beyond the login page, you need valid credentials for the remote Supabase instance at `zyziolikudoczsthyoja.supabase.co`. Provide them via `TEST_LOGIN_USERNAME` and `TEST_LOGIN_PASSWORD` secrets.

### Optional local API server

`node api-server.mjs` on port 3001 provides filesystem access for legal/work file management features. Not required for most development tasks.
