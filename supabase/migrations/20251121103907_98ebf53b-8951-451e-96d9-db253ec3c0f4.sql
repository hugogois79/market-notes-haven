-- Add attachment_count column to kanban_cards
ALTER TABLE kanban_cards 
ADD COLUMN attachment_count integer DEFAULT 0;