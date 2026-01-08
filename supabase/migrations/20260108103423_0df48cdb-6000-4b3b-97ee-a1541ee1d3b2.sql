-- Fix storage bucket security: Replace public read policies with user-scoped policies

-- 1. Drop dangerous public policies for Note Attachments bucket
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- 2. Drop dangerous public policies for attachments bucket  
DROP POLICY IF EXISTS "Allow public read access to attachments" ON storage.objects;

-- 3. Drop dangerous public policies for kanban-attachments bucket
DROP POLICY IF EXISTS "Public access to attachments" ON storage.objects;

-- 4. Create user-scoped SELECT policy for Note Attachments
-- Files are stored with user_id as first folder segment: {user_id}/filename
CREATE POLICY "Users can view their own note attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'Note Attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create user-scoped SELECT policy for attachments bucket
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Create user-scoped SELECT policy for kanban-attachments bucket
CREATE POLICY "Users can view their own kanban attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kanban-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);