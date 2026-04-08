-- ============================================
-- SECURITY FIX: Move pgvector extension from public schema
-- ============================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
-- Note: We need to drop and recreate because ALTER EXTENSION SET SCHEMA 
-- doesn't work reliably with the vector extension
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Update search_path for functions that use vector types
-- This ensures they can find the vector extension in the extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;