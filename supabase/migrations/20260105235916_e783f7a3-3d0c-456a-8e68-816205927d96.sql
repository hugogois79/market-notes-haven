-- Drop existing policies on wealth_assets
DROP POLICY IF EXISTS "Users can view their own wealth assets" ON wealth_assets;
DROP POLICY IF EXISTS "Users can insert their own wealth assets" ON wealth_assets;
DROP POLICY IF EXISTS "Users can update their own wealth assets" ON wealth_assets;
DROP POLICY IF EXISTS "Users can delete their own wealth assets" ON wealth_assets;

-- Create proper RLS policies for wealth_assets
CREATE POLICY "Users can view their own wealth assets" 
ON wealth_assets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wealth assets" 
ON wealth_assets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wealth assets" 
ON wealth_assets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wealth assets" 
ON wealth_assets FOR DELETE 
USING (auth.uid() = user_id);

-- Same for wealth_transactions
DROP POLICY IF EXISTS "Users can view their own wealth transactions" ON wealth_transactions;
DROP POLICY IF EXISTS "Users can insert their own wealth transactions" ON wealth_transactions;
DROP POLICY IF EXISTS "Users can update their own wealth transactions" ON wealth_transactions;
DROP POLICY IF EXISTS "Users can delete their own wealth transactions" ON wealth_transactions;

CREATE POLICY "Users can view their own wealth transactions" 
ON wealth_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wealth transactions" 
ON wealth_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wealth transactions" 
ON wealth_transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wealth transactions" 
ON wealth_transactions FOR DELETE 
USING (auth.uid() = user_id);