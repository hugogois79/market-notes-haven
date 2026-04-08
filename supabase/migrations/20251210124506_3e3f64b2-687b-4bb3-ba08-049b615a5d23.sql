-- Create expense_users table for managing users with assigned projects
CREATE TABLE public.expense_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  assigned_project_ids UUID[] DEFAULT ARRAY[]::uuid[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on user_id to prevent duplicates
ALTER TABLE public.expense_users ADD CONSTRAINT expense_users_user_id_key UNIQUE (user_id);

-- Enable Row Level Security
ALTER TABLE public.expense_users ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see their own record
CREATE POLICY "Users can view their own expense_user record" 
ON public.expense_users 
FOR SELECT 
USING (auth.uid() = user_id);

-- Authenticated users can manage expense_users (for admins)
CREATE POLICY "Authenticated users can manage expense_users" 
ON public.expense_users 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expense_users_updated_at
BEFORE UPDATE ON public.expense_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();