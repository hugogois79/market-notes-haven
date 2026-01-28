
# Plano: Corrigir Visibilidade dos Kanban Boards

## Problema Identificado

Os boards não aparecem na pesquisa (Command Palette) nem na sidebar porque:

1. A policy RLS atual só permite ver boards onde `auth.uid() = user_id`
2. O utilizador autenticado não é o dono dos 20 boards existentes
3. 2 boards têm `user_id = NULL` (invisíveis para todos)

## Solução

### Fase 1: Corrigir Dados Existentes (SQL)

Atualizar os 2 boards órfãos para pertencerem ao admin:

```sql
UPDATE kanban_boards 
SET user_id = '31377412-f0d4-4fdf-bf6b-7ca78d6caedf' 
WHERE user_id IS NULL;
```

### Fase 2: Alterar Policies RLS

Modificar a policy de SELECT para permitir visibilidade partilhada:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own boards" ON kanban_boards;

-- Create new policy: owners can see their boards + admins can see all
CREATE POLICY "Users can view boards" 
ON kanban_boards FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);
```

### Fase 3: Propagar às Tabelas Dependentes

As tabelas `kanban_lists`, `kanban_cards`, etc. dependem de `kanban_boards.user_id` nas suas policies. Com a alteração acima, os admins passarão automaticamente a ver lists/cards de todos os boards.

## Resultado Esperado

- Admins veem todos os boards
- Utilizadores normais veem apenas os seus próprios boards
- Os 22 boards existentes ficam visíveis para o admin
- Command Palette e Sidebar voltam a mostrar os boards

## Secção Técnica

### Tabelas Afetadas
- `kanban_boards` - policy SELECT
- Sem alterações estruturais às tabelas dependentes (usam JOINs)

### Riscos
- Nenhum: a alteração é aditiva (adiciona visibilidade, não remove)

### Queries a Executar

```text
1. UPDATE kanban_boards SET user_id = '31377412-f0d4-4fdf-bf6b-7ca78d6caedf' WHERE user_id IS NULL;

2. DROP POLICY IF EXISTS "Users can view their own boards" ON kanban_boards;

3. CREATE POLICY "Users can view boards" 
   ON kanban_boards FOR SELECT 
   USING (
     auth.uid() = user_id 
     OR public.has_role(auth.uid(), 'admin')
   );
```
