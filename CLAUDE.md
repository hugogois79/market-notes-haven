# Notes App — Market Notes Haven (GVV Capital)

> App de gestão de notas, empresas, despesas, legal, kanban e operações. Produção: **notes.gvvcapital.com**

*Contexto para Cloud Agents e desenvolvimento*

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Nome** | Market Notes Haven |
| **URL Produção** | https://notes.gvvcapital.com |
| **Cliente** | GVV Capital |
| **Origem** | Lovable (https://lovable.dev/projects/3e1f9388-c70b-4470-8b34-a45fad368700) |

---

## Stack Técnico

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Vite 5, React 18, TypeScript |
| **UI** | shadcn-ui, Radix UI, Tailwind CSS |
| **Estado** | TanStack Query (React Query), React Context |
| **Backend** | Supabase (Auth, DB, Edge Functions, Storage) |
| **Editor** | TipTap (rich text, tabelas) |
| **PWA** | vite-plugin-pwa (Workbox) |

---

## Estrutura de Rotas

- `/` — Dashboard
- `/notes`, `/editor/*` — Notas e editor
- `/kanban`, `/kanban/:boardId` — Kanban
- `/expenses`, `/expenses/:id` — Despesas
- `/legal`, `/legal/cases`, `/legal/contacts`, `/legal/billable-items` — Legal
- `/companies`, `/companies/:id` — Empresas
- `/procurement/*` — Procurement
- `/tao/*` — TAO (validators, performance, investor opportunities)
- `/financeiro`, `/calendar`, `/projects`, `/real-estate`, `/operations`
- `/tokens`, `/crypto/dashboard`, `/markets`, `/securities`

---

## Serviços Externos

| Serviço | Uso |
|---------|-----|
| **Supabase** | Auth, PostgreSQL, Edge Functions, Storage |
| **API local** | `http://127.0.0.1:3001` — `/api/legal-files`, `/api/work-files` |
| **Folder browser** | `/api/browse-folders` — navegação em `/root/Robsonway-Research` |

---

## Comandos

```bash
npm install
npm run dev      # Vite dev (porta 8080 no config; dev-mode usa 8081)
npm run build
npm run preview
npm run lint
```

---

## Regras para Cloud Agents

1. **Não quebrar** — Testar antes de merge. O app está em produção.
2. **Supabase** — Migrations em `supabase/migrations/`. Verificar tipos em `src/integrations/supabase/types.ts`.
3. **Auth** — Rotas protegidas por `ProtectedRoute`. Respeitar fluxo MFA/OTP.
4. **Estilo** — Manter shadcn + Tailwind. Evitar CSS inline ou libs novas sem necessidade.
5. **API proxy** — `/api/legal-files` e `/api/work-files` apontam para servidor local 3001.
6. **Porta dev** — Em dev-mode, usar porta 8081 (ver `.cursor/rules/dev-mode-startup.mdc` no workspace pai).

---

## Deploy

- Produção: Lovable → Netlify ou similar (custom domain notes.gvvcapital.com)
- Servidor: `/var/www/gvvcapital/` (referência do workspace)

---

## Ficheiros Críticos

- `src/routes/AppRoutes.tsx` — Rotas
- `src/main.tsx` — Entry point
- `vite.config.ts` — Config, proxy, PWA
- `supabase/` — Migrations, functions, types
