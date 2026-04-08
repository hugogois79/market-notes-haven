-- VIEW otimizada para AI Agent ler a estrutura do board
CREATE OR REPLACE VIEW ai_board_structure AS
SELECT 
  b.title AS board_name,
  b.id AS board_id,
  l.title AS list_name,
  l.id AS list_id
FROM kanban_boards b
LEFT JOIN kanban_lists l ON l.board_id = b.id AND (l.archived = false OR l.archived IS NULL)
WHERE b.archived = false
ORDER BY b.title, l.position;

-- Índices de performance para queries frequentes
CREATE INDEX IF NOT EXISTS idx_kanban_cards_list_id 
ON kanban_cards(list_id);

CREATE INDEX IF NOT EXISTS idx_kanban_attachments_card_id 
ON kanban_attachments(card_id);

CREATE INDEX IF NOT EXISTS idx_kanban_comments_card_id 
ON kanban_comments(card_id);

CREATE INDEX IF NOT EXISTS idx_kanban_checklists_card_id 
ON kanban_checklists(card_id);

CREATE INDEX IF NOT EXISTS idx_kanban_checklist_items_checklist_id 
ON kanban_checklist_items(checklist_id);

CREATE INDEX IF NOT EXISTS idx_kanban_labels_board_id 
ON kanban_labels(board_id);