-- Add category_type column to expense_categories
-- 'expense' = only for expenses
-- 'revenue' = only for revenue  
-- 'both' = can be used for both
ALTER TABLE expense_categories ADD COLUMN category_type text DEFAULT 'expense' CHECK (category_type IN ('expense', 'revenue', 'both'));

-- Update existing categories to be expense by default
UPDATE expense_categories SET category_type = 'expense' WHERE category_type IS NULL;