-- Corrigir FK space_id para ON DELETE CASCADE
ALTER TABLE kanban_boards 
DROP CONSTRAINT IF EXISTS kanban_boards_space_id_fkey;

ALTER TABLE kanban_boards 
ADD CONSTRAINT kanban_boards_space_id_fkey 
FOREIGN KEY (space_id) 
REFERENCES kanban_spaces(id) 
ON DELETE CASCADE;

-- Adicionar coluna created_at a kanban_checklists
ALTER TABLE kanban_checklists 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();