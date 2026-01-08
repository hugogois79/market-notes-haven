-- Make the note_attachments bucket public so that getPublicUrl() works correctly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'note_attachments';