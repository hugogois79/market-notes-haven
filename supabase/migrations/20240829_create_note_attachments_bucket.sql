
-- Create 'note_attachments' bucket if it doesn't exist
DO $$
BEGIN
    -- Check if bucket already exists
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'note_attachments'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('note_attachments', 'Note Attachments', true);
        
        -- Create policy to allow authenticated users to upload files
        INSERT INTO storage.policies (bucket_id, name, operation, expression)
        VALUES 
            ('note_attachments', 'Authenticated users can upload files', 'INSERT', '(auth.role() = ''authenticated'')'),
            ('note_attachments', 'Authenticated users can update files', 'UPDATE', '(auth.role() = ''authenticated'')'),
            ('note_attachments', 'Authenticated users can delete files', 'DELETE', '(auth.role() = ''authenticated'')'),
            ('note_attachments', 'Anyone can view files', 'SELECT', 'true');
    END IF;
END $$;
