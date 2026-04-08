-- Add SELECT policy for company-documents bucket
-- Allow authenticated users to read files from company-documents
CREATE POLICY "Allow authenticated users to read company documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'company-documents' 
  AND auth.uid() IS NOT NULL
);

-- Also add SELECT policy for attachments bucket (currently only has public read but bucket is private)
CREATE POLICY "Allow authenticated users to read attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'attachments' 
  AND auth.uid() IS NOT NULL
);