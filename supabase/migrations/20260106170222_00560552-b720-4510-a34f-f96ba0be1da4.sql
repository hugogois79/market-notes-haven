-- Add missing UPDATE policy for portfolio_snapshots (needed for upsert)
CREATE POLICY "Users can update their own snapshots" 
ON portfolio_snapshots 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);