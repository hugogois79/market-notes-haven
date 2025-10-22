-- Ensure storage policies for Expense Receipts bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete expense receipts" ON storage.objects;

-- Create policy to allow authenticated users to upload receipts
CREATE POLICY "Users can upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Expense Receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to view their receipts
CREATE POLICY "Users can view expense receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Expense Receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to update their receipts
CREATE POLICY "Users can update expense receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Expense Receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to delete their receipts
CREATE POLICY "Users can delete expense receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Expense Receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);