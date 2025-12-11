-- First, create the Documents list if it doesn't exist
INSERT INTO kanban_lists (board_id, title, position)
SELECT 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade', 'Documents', 7
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_lists 
  WHERE board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND title = 'Documents'
);

-- Add cards to Alvaro list (position 5)
WITH alvaro_list AS (
  SELECT id FROM kanban_lists 
  WHERE board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND title = 'Alvaro'
)
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT al.id, card.title, '', card.position
FROM alvaro_list al
CROSS JOIN (VALUES
  ('Port Side Cockpit Door (Azimut 80 Flybridge)', 0),
  ('Sensores Tanques Trinidad', 1),
  ('Reparar Exaustor Cozinha - Azimut 80', 2),
  ('Diagnóstico Gerador N2 Cummins Onan 27kW', 3),
  ('Novo seguro', 4),
  ('Trocar filtros de óleo', 5),
  ('Troca Óleo Motores MAN V12 - Azimut 80', 6),
  ('Instalar Duchas Popa + Reparar Master - Azimut 80', 7),
  ('Diagnosticar Depthfinder - Azimut 80', 8),
  ('Intercoolers MAHLE - Motores MAN V12', 9),
  ('Troca Óleo Gearboxes ZF - Azimut 80', 10)
) AS card(title, position)
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_cards kc WHERE kc.list_id = al.id AND kc.title = card.title
);

-- Add BALSA card to Documents list
WITH docs_list AS (
  SELECT id FROM kanban_lists 
  WHERE board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND title = 'Documents'
)
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT dl.id, 'BALSA', '', 0
FROM docs_list dl
WHERE NOT EXISTS (
  SELECT 1 FROM kanban_cards kc WHERE kc.list_id = dl.id AND kc.title = 'BALSA'
);