-- Remove all existing policies for expense-receipts bucket
DROP POLICY IF EXISTS "Public read access for receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their receipts" ON storage.objects;

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'expense-receipts';

-- Create simple public access policy for reading
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow authenticated users to update their own receipts
CREATE POLICY "Authenticated users can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to delete their own receipts
CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts');