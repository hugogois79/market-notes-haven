-- Fix TAO tables security - Add user_id columns and proper RLS policies

-- Add user_id columns to TAO tables
ALTER TABLE tao_notes ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE tao_contact_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE tao_subnets ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Set user_id for existing records to the first user (or you can set to a specific admin user)
-- This is a safe default - you may want to review and adjust these records manually
UPDATE tao_notes SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE tao_contact_logs SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE tao_subnets SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after backfilling
ALTER TABLE tao_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tao_contact_logs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tao_subnets ALTER COLUMN user_id SET NOT NULL;

-- Drop the old permissive policies
DROP POLICY IF EXISTS "Authenticated users can view tao notes" ON tao_notes;
DROP POLICY IF EXISTS "Authenticated users can insert tao notes" ON tao_notes;
DROP POLICY IF EXISTS "Authenticated users can update tao notes" ON tao_notes;
DROP POLICY IF EXISTS "Authenticated users can delete tao notes" ON tao_notes;

DROP POLICY IF EXISTS "Authenticated users can view tao contact logs" ON tao_contact_logs;
DROP POLICY IF EXISTS "Authenticated users can insert tao contact logs" ON tao_contact_logs;
DROP POLICY IF EXISTS "Authenticated users can update tao contact logs" ON tao_contact_logs;
DROP POLICY IF EXISTS "Authenticated users can delete tao contact logs" ON tao_contact_logs;

DROP POLICY IF EXISTS "Authenticated users can view tao subnets" ON tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can insert tao subnets" ON tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can update tao subnets" ON tao_subnets;
DROP POLICY IF EXISTS "Authenticated users can delete tao subnets" ON tao_subnets;

-- Create new user-scoped policies for tao_notes
CREATE POLICY "Users can view their own tao notes"
ON tao_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tao notes"
ON tao_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tao notes"
ON tao_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tao notes"
ON tao_notes FOR DELETE
USING (auth.uid() = user_id);

-- Create new user-scoped policies for tao_contact_logs
CREATE POLICY "Users can view their own tao contact logs"
ON tao_contact_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tao contact logs"
ON tao_contact_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tao contact logs"
ON tao_contact_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tao contact logs"
ON tao_contact_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create new user-scoped policies for tao_subnets
CREATE POLICY "Users can view their own tao subnets"
ON tao_subnets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tao subnets"
ON tao_subnets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tao subnets"
ON tao_subnets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tao subnets"
ON tao_subnets FOR DELETE
USING (auth.uid() = user_id);

-- Remove the dangerous development policy from settings table
DROP POLICY IF EXISTS "Public Access for Development" ON settings;

-- Add user_id to payment_methods and files tables
ALTER TABLE payment_methods ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE files ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Backfill existing records
UPDATE payment_methods SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE files SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE payment_methods ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE files ALTER COLUMN user_id SET NOT NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can view payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can insert payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can update payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can delete payment methods" ON payment_methods;

DROP POLICY IF EXISTS "Authenticated users can view files" ON files;
DROP POLICY IF EXISTS "Authenticated users can create files" ON files;
DROP POLICY IF EXISTS "Authenticated users can update files" ON files;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON files;

-- Create new user-scoped policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
ON payment_methods FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
ON payment_methods FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
ON payment_methods FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
ON payment_methods FOR DELETE
USING (auth.uid() = user_id);

-- Create new user-scoped policies for files
CREATE POLICY "Users can view their own files"
ON files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files"
ON files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
ON files FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON files FOR DELETE
USING (auth.uid() = user_id);

-- Fix expense_requesters to be admin-only
DROP POLICY IF EXISTS "Authenticated users can manage requesters" ON expense_requesters;

CREATE POLICY "Admins can manage requesters"
ON expense_requesters FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active requesters"
ON expense_requesters FOR SELECT
USING (is_active = true);