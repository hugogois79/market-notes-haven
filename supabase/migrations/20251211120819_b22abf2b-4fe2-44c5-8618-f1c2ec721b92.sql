
-- Create missing lists for Trinidad board
INSERT INTO kanban_lists (board_id, title, position) VALUES 
('f5d8d2d3-65f2-404a-97f1-aeb5908fcade', 'Location', 0),
('f5d8d2d3-65f2-404a-97f1-aeb5908fcade', 'Orçamentar', 4),
('f5d8d2d3-65f2-404a-97f1-aeb5908fcade', 'Alvaro', 5),
('f5d8d2d3-65f2-404a-97f1-aeb5908fcade', 'Fora de Agua', 6);

-- Update existing list positions
UPDATE kanban_lists SET position = 1 WHERE id = '7cd32804-8da4-4a95-910e-90713c5a7d65'; -- Maitenance
UPDATE kanban_lists SET position = 2 WHERE id = '70f659cd-a688-4605-b914-f01dc47df157'; -- Hugo
UPDATE kanban_lists SET position = 3 WHERE id = '298df816-fc13-4469-8dcc-74d4cd3b43af'; -- John

-- Insert cards for Location list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Marina Imperia', '11 Sept - 11 Sept', 0),
  ('Marina Aeroporto Genova', '', 1)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'Location';

-- Insert cards for Maitenance list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Ducha cabin maste', '', 0),
  ('Filtro de generador', '', 1),
  ('Ar Condicionado', '', 2),
  ('Depthfinder não funciona', '', 3),
  ('Chuveiros do Barco - Popa', '', 4),
  ('Revisão do Sidetruster', '', 5),
  ('Seacock Ar Condicionado', '', 6),
  ('Escovas Motor Electrico Direuti', '', 7),
  ('Novas Escovas Parabrisas', '', 8),
  ('Revisar reparar los dos ventiladores de sala de máquinas', '', 9),
  ('Sensores de Avante/Atrás (MAN V12 + ZF 2050A)', '', 10),
  ('Sensores de Temperatura dos Exhaust (MAN V12)', '', 11),
  ('Passarela OPACMARE (Azimut 80)', '', 12)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'Maitenance';

-- Insert cards for Hugo list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Nova decoração barco', '', 0),
  ('Mandar Internet', '', 1),
  ('Chaves do Barco', '', 2),
  ('NAVIOP - Sistema', '', 3)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'Hugo';

-- Insert cards for John list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Substituir o colchão da cabine do capitão', '', 0),
  ('Extintores', '', 1),
  ('Revisão Balsas Salva-vidas Trinidad', '', 2),
  ('Medição Alcatifa Salão Trinidad', '', 3),
  ('Manutenção Sistema Travamento Guincho Âncora', '', 4),
  ('Limpeza e Arejamento Tambuchos - Prevenção Humidade', '', 5),
  ('Limpeza Profissional Sala de Máquinas', '', 6),
  ('Limpeza Profunda Ductos Ar Condicionado', '', 7),
  ('Renovação Rebites Toldos Negros Janelas', '', 8),
  ('Documentação Final Limpeza Crew Area', '', 9),
  ('Inspeção e Inventário Defensas', '', 10)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'John';

-- Insert cards for Orçamentar list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Port Side Cockpit Door (Azimut 80 Flybridge)', '', 0),
  ('Sensores Tanques Trinidad', '', 1),
  ('Reparar Exaustor Cozinha - Azimut 80', '', 2),
  ('Diagnóstico Gerador N2 Cummins Onan 27kW', '', 3),
  ('Novo seguro', '', 4),
  ('Trocar filtros de óleo', '', 5),
  ('Troca Óleo Motores MAN V12 - Azimut 80', '', 6),
  ('Instalar Duchas Popa + Reparar Master - Azimut 80', '', 7),
  ('Diagnosticar Depthfinder - Azimut 80', '', 8),
  ('Intercoolers MAHLE - Motores MAN V12', '', 9),
  ('Troca Óleo Gearboxes ZF - Azimut 80', '', 10)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'Orçamentar';

-- Insert cards for Fora de Agua list
INSERT INTO kanban_cards (list_id, title, description, position)
SELECT l.id, t.title, t.description, t.position
FROM kanban_lists l
CROSS JOIN (VALUES 
  ('Reparo Seacock Ar Condicionado - Azimut 80', '', 0),
  ('Polimento Completo Azimut 80', '', 1),
  ('Fridge - Medidas - Tentar meter 177', '', 2)
) AS t(title, description, position)
WHERE l.board_id = 'f5d8d2d3-65f2-404a-97f1-aeb5908fcade' AND l.title = 'Fora de Agua';
