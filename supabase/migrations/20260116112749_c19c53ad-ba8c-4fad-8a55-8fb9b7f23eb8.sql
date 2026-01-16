-- Add value column to kanban_cards table
ALTER TABLE kanban_cards 
ADD COLUMN value numeric DEFAULT 0;