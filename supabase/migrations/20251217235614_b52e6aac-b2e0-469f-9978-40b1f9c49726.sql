-- Enable pg_trgm extension for text search first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes to optimize expense_projects queries
CREATE INDEX IF NOT EXISTS idx_expense_projects_name ON public.expense_projects(name);
CREATE INDEX IF NOT EXISTS idx_expense_projects_is_active ON public.expense_projects(is_active);

-- Trigram index for fuzzy text search on name
CREATE INDEX IF NOT EXISTS idx_expense_projects_name_trgm ON public.expense_projects USING gin(name gin_trgm_ops);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_expense_projects_active_name ON public.expense_projects(is_active, name);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_expense_projects_start_date ON public.expense_projects(start_date);
CREATE INDEX IF NOT EXISTS idx_expense_projects_end_date ON public.expense_projects(end_date);