-- Clean up all duplicate policies for expense-receipts bucket
DROP POLICY IF EXISTS "Users can view expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload expense receipts" ON storage.objects;

-- Keep only the clean policies
-- Public read access is already set with "Anyone can view receipts"
-- Authenticated users policies are already set for upload, update, delete