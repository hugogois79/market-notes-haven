
Objetivo: fazer com que **boards partilhados** sejam visíveis para qualquer utilizador autenticado que tenha a permissão **Projects**, mantendo a possibilidade de boards privados (apenas owner/admin). Além disso, “Tornar todos partilhados” para os boards existentes.

## 1) Diagnóstico do que está a acontecer agora (porque não aparece nenhum board)
- O `KanbanService.getBoards()` faz `select('*')` a `kanban_boards`.
- A policy atual em `kanban_boards` é:
  - `auth.uid() = user_id OR has_role(auth.uid(), 'admin')`
- Como os boards existentes estão atribuídos ao **admin**, qualquer utilizador **não-admin** (mesmo autenticado) recebe `[]` por RLS.
- No Command Palette isto aparece como “Nenhum board encontrado.” (igual ao teu screenshot).

Conclusão: falta implementar a parte “partilhado por permissão Projects” ao nível de **RLS** e também garantir que **Spaces/Listas/Cards** acompanham a visibilidade.

---

## 2) Alterações no Supabase (migração SQL)
### 2.1 Adicionar flag de partilha
- Adicionar coluna:
  - `kanban_boards.is_shared boolean not null default false`

### 2.2 Marcar boards existentes como partilhados
- `UPDATE kanban_boards SET is_shared = true;`  
  (cumpre “Boards existentes: Tornar todos partilhados”)

### 2.3 Atualizar policies RLS com a regra “Por permissão Projects”
Premissas:
- `expense_users.feature_permissions` é `jsonb` e existe policy SELECT em `expense_users` para qualquer utilizador autenticado (`auth.uid() is not null`), logo pode ser usado dentro das policies sem bloquear.
- A tua regra escolhida: **Boards partilhados: Por permissão Projects**.

#### Policy base de visibilidade de board (conceito)
Um board é visível se:
1) `auth.uid() = kanban_boards.user_id` (owner), ou
2) `has_role(auth.uid(), 'admin')` (admin), ou
3) `kanban_boards.is_shared = true` **e** o utilizador tem `feature_permissions.projects = true`.

Implementação SQL (na migração):
- Substituir policy SELECT de `kanban_boards` por uma nova com estas condições.
- Para spaces/lists/cards/labels/attachments:
  - Alterar policies SELECT para fazer `EXISTS` até ao board e aplicar a mesma condição de visibilidade do board (owner/admin/shared+projects).

### 2.4 Spaces: garantir que aparecem no agrupamento
Como os boards podem estar dentro de spaces, precisamos que o utilizador (com Projects) consiga ver os spaces que tenham pelo menos 1 board visível.
Opções de policy para `kanban_spaces`:
- Permitir SELECT se:
  - owner/admin, ou
  - existe um board naquele space que seja visível (shared+projects).

### 2.5 Índices
Adicionar índices para performance:
- `create index ... on kanban_boards(is_shared) where is_shared = true;`
- (opcional) índice em `kanban_boards(space_id)` se ainda não existir.

---

## 3) Alterações no frontend (para UX e evitar confusão)
Mesmo com RLS correto, vale a pena alinhar UI com permissões:

### 3.1 CommandPalette: esconder “Boards” para quem não tem permissão Projects
Hoje o CommandPalette sempre mostra “Boards”, mas o utilizador pode não ter acesso e vai ver lista vazia.
Mudança:
- Importar `useFeatureAccess()` no `CommandPalette.tsx`
- Só mostrar o item “Boards” (e/ou permitir entrar no submenu) se `isAdmin || hasAccess('projects')`.
- Se decidirmos manter visível (por UX), então mostrar um item informativo no submenu: “Sem acesso a Projects”.

### 3.2 SidebarNav: evitar fetch de boards/spaces quando não faz sentido
Atualmente `SidebarNav` faz fetch de spaces/boards sempre que `!isWorker`, mesmo que o utilizador não tenha permissão Projects.
Mudança:
- No `useEffect`, só fazer fetch se `!isWorker && (isAdmin || hasAccess('projects'))` e **depois** de `roleLoading/permissionsLoading` estarem concluídos.
Isto reduz chamadas desnecessárias e estados confusos.

### 3.3 Tipos/Interfaces
- Atualizar `KanbanBoard` (em `src/services/kanbanService.ts`) para incluir `is_shared?: boolean` (ou obrigatório).
- Atualizar tipos gerados do Supabase (`src/integrations/supabase/types.ts`) para refletir a nova coluna `is_shared`.

---

## 4) Sequência de implementação (passo a passo)
1) Criar nova migração Supabase:
   - `ALTER TABLE kanban_boards ADD COLUMN is_shared boolean not null default false;`
   - `UPDATE kanban_boards SET is_shared = true;`
   - `DROP POLICY` / `CREATE POLICY` para:
     - `kanban_boards` (SELECT)
     - `kanban_spaces` (SELECT)
     - `kanban_lists` (SELECT)
     - `kanban_cards` (SELECT)
     - `kanban_labels` (SELECT)
     - `kanban_attachments` (SELECT)
   - Criar índices necessários.
2) Atualizar frontend:
   - `src/components/CommandPalette.tsx` para respeitar Projects permission.
   - `src/components/sidebar/SidebarNav.tsx` para só fazer fetch quando há permissão e quando loading terminou.
3) Atualizar tipos:
   - `src/integrations/supabase/types.ts` (coluna `is_shared`).
   - `src/services/kanbanService.ts` (interface `KanbanBoard` com `is_shared`).
4) Validação:
   - Testar com um utilizador **admin**: vê tudo.
   - Testar com um utilizador **não-admin com Projects=true**: vê boards partilhados (agora todos).
   - Testar com um utilizador **sem Projects**: não vê boards e não vê “Boards” no CommandPalette/Sidebar (ou vê aviso).

---

## 5) Notas de segurança (importante)
- Não vamos guardar roles no `expense_users`. Continuamos a usar `user_roles` + `has_role(...)` / `get_user_role(...)`.
- A verificação de “tem permissão Projects” será feita no Supabase via `expense_users.feature_permissions->>'projects'`, mas apenas para permitir leitura de boards marcados como `is_shared = true`.
- Como `expense_users` atualmente é legível por qualquer utilizador autenticado, isso já é uma decisão de privacidade existente no teu projeto; esta mudança não a piora, mas vale reavaliar no futuro se quiseres restringir dados pessoais nessa tabela.

---

## Resultado esperado
- Boards passam a aparecer para utilizadores com permissão **Projects** (mesmo não sendo admins).
- Todos os boards existentes ficam visíveis para a equipa (porque foram marcados como `is_shared = true`).
- Mantém-se a possibilidade de criar boards privados (`is_shared = false`) no futuro.
