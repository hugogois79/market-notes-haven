-- Add color column to kanban_lists
ALTER TABLE kanban_lists ADD COLUMN color TEXT DEFAULT '#f3f4f6';

-- Update existing lists to have the default color
UPDATE kanban_lists SET color = '#f3f4f6' WHERE color IS NULL;