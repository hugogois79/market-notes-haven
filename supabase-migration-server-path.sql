-- Migration: Add server_path to legal_documents
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zyziolikudoczsthyoja/sql

ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS server_path TEXT;

COMMENT ON COLUMN legal_documents.server_path IS 'Relative path within Legal/ on the server (e.g. "(PT) Rui Alves Pereira/92. Sentenca STJ (12-09-2025).pdf")';
