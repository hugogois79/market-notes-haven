-- Make the attachments bucket public so files can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'attachments';

-- Drop existing policy if any and create new one for public read access
DROP POLICY IF EXISTS "Public read access for attachments" ON storage.objects;

CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');