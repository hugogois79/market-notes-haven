-- Fase 1: Atualizar boards órfãos para pertencerem ao admin
UPDATE kanban_boards 
SET user_id = '31377412-f0d4-4fdf-bf6b-7ca78d6caedf' 
WHERE user_id IS NULL;

-- Fase 2: Alterar policy de SELECT em kanban_boards
DROP POLICY IF EXISTS "Users can view their own boards" ON kanban_boards;

CREATE POLICY "Users can view boards" 
ON kanban_boards FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Fase 3: Atualizar policies das tabelas dependentes para permitir acesso a admins

-- kanban_spaces
DROP POLICY IF EXISTS "Users can view their own spaces" ON kanban_spaces;
CREATE POLICY "Users can view spaces" 
ON kanban_spaces FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- kanban_lists (usa JOIN com boards)
DROP POLICY IF EXISTS "Users can view lists of their boards" ON kanban_lists;
CREATE POLICY "Users can view lists" 
ON kanban_lists FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM kanban_boards 
    WHERE kanban_boards.id = kanban_lists.board_id 
    AND (kanban_boards.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- kanban_cards (usa JOIN com lists → boards)
DROP POLICY IF EXISTS "Users can view cards of their boards" ON kanban_cards;
CREATE POLICY "Users can view cards" 
ON kanban_cards FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM kanban_lists 
    JOIN kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_lists.id = kanban_cards.list_id 
    AND (kanban_boards.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- kanban_labels
DROP POLICY IF EXISTS "Users can view labels of their boards" ON kanban_labels;
CREATE POLICY "Users can view labels" 
ON kanban_labels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM kanban_boards 
    WHERE kanban_boards.id = kanban_labels.board_id 
    AND (kanban_boards.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- kanban_attachments
DROP POLICY IF EXISTS "Users can view attachments of their cards" ON kanban_attachments;
CREATE POLICY "Users can view attachments" 
ON kanban_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM kanban_cards 
    JOIN kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_attachments.card_id 
    AND (kanban_boards.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);