-- Migration: Add server_root to workflow_storage_locations and server_path to file tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zyziolikudoczsthyoja/sql

-- 1. Add server_root to workflow_storage_locations (maps to company folder on server)
ALTER TABLE workflow_storage_locations ADD COLUMN IF NOT EXISTS server_root TEXT;
COMMENT ON COLUMN workflow_storage_locations.server_root IS 'Root company folder on server (e.g. "Areg Investment", "Sustainable Yield (UK)")';

-- 2. Add server_path to workflow_files
ALTER TABLE workflow_files ADD COLUMN IF NOT EXISTS server_path TEXT;
COMMENT ON COLUMN workflow_files.server_path IS 'Relative path on server (e.g. "Areg Investment/Work/02 February 2026/Invoice.pdf")';

-- 3. Add server_path to work_documents
ALTER TABLE work_documents ADD COLUMN IF NOT EXISTS server_path TEXT;
COMMENT ON COLUMN work_documents.server_path IS 'Relative path on server';

-- 4. Add server_path to company_documents
ALTER TABLE company_documents ADD COLUMN IF NOT EXISTS server_path TEXT;
COMMENT ON COLUMN company_documents.server_path IS 'Relative path on server';
