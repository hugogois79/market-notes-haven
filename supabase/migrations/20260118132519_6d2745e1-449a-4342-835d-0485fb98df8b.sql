-- Make the attachments bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'attachments';