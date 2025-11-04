-- Ensure kanban-attachments bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kanban-attachments',
  'kanban-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*', 'application/zip', 'application/x-zip-compressed'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public access to attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload attachments to their cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- Allow public access to view attachments (required for public bucket)
CREATE POLICY "Public access to attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'kanban-attachments');

-- Allow authenticated users to upload attachments
CREATE POLICY "Users can upload attachments to their cards"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kanban-attachments' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own attachments
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kanban-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kanban-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);