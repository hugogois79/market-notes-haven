-- Migration: Create legal_case_folders table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zyziolikudoczsthyoja/sql

CREATE TABLE IF NOT EXISTS legal_case_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES legal_cases(id) ON DELETE CASCADE,
  folder_path TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(case_id, folder_path)
);

ALTER TABLE legal_case_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON legal_case_folders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_legal_case_folders_case_id ON legal_case_folders(case_id);
