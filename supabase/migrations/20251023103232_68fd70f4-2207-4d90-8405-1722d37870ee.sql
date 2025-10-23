-- Update expense-receipts bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'expense-receipts';

-- Ensure the SELECT policy works correctly
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;

-- Create a simpler public read policy since bucket is now public
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts');