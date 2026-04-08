# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Market Notes Haven is a Vite + React + TypeScript PWA for business management (market notes, legal, kanban, financial, crypto, procurement, etc.). The backend is **Supabase Cloud** (hosted, not local) — no database or Supabase CLI setup is needed.

### Services

| Service | Port | Command | Notes |
|---|---|---|---|
| Vite dev server | 8081 | `npm run dev` | Main frontend; also proxies `/api/legal-files` and `/api/work-files` to port 3001 |
| API server | 3001 | `node api-server.mjs` | Filesystem API for legal/work file browsing; requires `/root/Robsonway-Research/Legal` to exist (`sudo mkdir -p /root/Robsonway-Research/Legal && sudo chmod -R 777 /root/Robsonway-Research`) |

### Standard commands

See `package.json` scripts:
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint` (ESLint; pre-existing warnings/errors exist in the codebase)
- **Preview**: `npm run preview`

### Authentication (2FA/TOTP)

The test account has MFA enabled. To log in programmatically:

1. Secrets needed: `TEST_LOGIN_EMAIL`, `TEST_LOGIN_PASSWORD`, `TEST_LOGIN_OTP_SEED`
2. Generate a TOTP code (requires `pyotp`: `pip install pyotp`):
   ```bash
   python3 << 'PYEOF'
   import os, pyotp, re
   seed = os.environ.get('TEST_LOGIN_OTP_SEED', '')
   cleaned = re.sub(r'[\s\-=]', '', seed).upper()
   padding = (8 - len(cleaned) % 8) % 8
   cleaned += '=' * padding
   totp = pyotp.TOTP(cleaned)
   print(totp.now())
   PYEOF
   ```
3. Enter email + password at `/auth`, then the 6-digit TOTP code at `/auth/mfa-verify`. Codes expire every 30 seconds — generate right before use.

### Production deployment

The app is deployed on a **DigitalOcean droplet** (159.65.68.118), not Lovable. Nginx serves the `dist/` folder directly:
- Deploy: SSH into server → `cd /mnt/volume_sfo2_01/Robsonway-Research/Workspaces/Code/market-notes-haven-app && git pull origin main && npm run build`
- Domain: `notes.gvcapital.com`
- The Lovable preview is separate from production.

### Security — defense-in-depth pattern

All Supabase queries that access user-scoped data MUST filter by `user_id` explicitly, even with RLS enabled. This applies to:
- Notes (`supabaseService.ts`, `fetchService.ts`, `EditorHeader.tsx`, etc.)
- Legal module (`legal_case_folders`, `legal_contact_cases`, `legal_document_contacts`)
- Work module (`workflow_storage_locations`, `project_storage_locations`)
- Do NOT rely solely on Supabase RLS policies.

### Non-obvious caveats

- The API server (`api-server.mjs`) expects `/root/Robsonway-Research/Legal` to exist. Create it with `sudo mkdir -p /root/Robsonway-Research/Legal && sudo chmod -R 777 /root/Robsonway-Research` before starting.
- There is no test framework configured — no unit/integration test suite exists.
- All routes except `/auth` are protected by Supabase authentication. To test authenticated features, a valid Supabase account is required.
- The `.env` file contains Supabase project credentials (anon key) that are committed to the repo.
- Both `package-lock.json` (npm) and `bun.lockb` (bun) exist; use **npm** as the primary package manager.
- The Vite dev server listens on all interfaces on port 8081 (`vite.config.ts`); `vite preview` / `npm run production` uses the same preview port.
- The note editor has a complex save flow across multiple hooks (`useNoteMutations`, `useSaveNote`, `useBasicNoteFields`, `useNoteData`). Manual saves MUST always include `title` and `category` in the payload to prevent data loss.
- The Operations module uses DB enums (`staff_role_category`: Aviation/Maritime/Ground/Office/Household). Map real departments to these via `specific_title`.
- The Recruitment module uses a standalone `recruitment_candidates` table with its own RLS policy.
