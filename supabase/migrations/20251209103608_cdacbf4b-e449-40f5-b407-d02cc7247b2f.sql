-- Create the attachments bucket for loan attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Allow public read access
CREATE POLICY "Allow public read access to attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');