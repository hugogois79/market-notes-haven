-- Performance indexes for notes filtering
-- Created to accelerate note filtering operations

-- 1. GIN index for tags array filtering (PRIORITY: HIGH)
-- Enables fast lookups with array operators (@>, &&, etc.)
CREATE INDEX IF NOT EXISTS idx_notes_tags_gin 
  ON notes USING gin (tags);

-- 2. Partial index for has_conclusion filtering
-- Only indexes rows where has_conclusion is not null
CREATE INDEX IF NOT EXISTS idx_notes_user_has_conclusion 
  ON notes (user_id, has_conclusion) 
  WHERE has_conclusion IS NOT NULL;

-- 3. Partial index for notes with summary
-- Accelerates "Has Summary" filter queries
CREATE INDEX IF NOT EXISTS idx_notes_with_summary 
  ON notes (user_id, updated_at DESC) 
  WHERE summary IS NOT NULL AND summary != '';

-- 4. Partial index for notes with attachments
-- Accelerates "Has Attachments" filter queries
CREATE INDEX IF NOT EXISTS idx_notes_with_attachments 
  ON notes (user_id, updated_at DESC) 
  WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;

-- 5. Composite index for project+category filtering
-- Optimizes combined filter queries with ordering
CREATE INDEX IF NOT EXISTS idx_notes_user_project_category_updated 
  ON notes (user_id, project_id, category, updated_at DESC);