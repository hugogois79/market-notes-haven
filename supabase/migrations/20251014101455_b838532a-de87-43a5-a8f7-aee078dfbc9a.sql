-- Fix profiles table RLS policies to prevent public data exposure
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure RLS policies for profiles table
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix tao_validators table RLS policies to prevent public scraping
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Authenticated users can manage validators" ON public.tao_validators;
DROP POLICY IF EXISTS "Users can view all validators" ON public.tao_validators;
DROP POLICY IF EXISTS "Authenticated users can view validators" ON public.tao_validators;
DROP POLICY IF EXISTS "Authenticated users can insert validators" ON public.tao_validators;
DROP POLICY IF EXISTS "Authenticated users can update validators" ON public.tao_validators;
DROP POLICY IF EXISTS "Authenticated users can delete validators" ON public.tao_validators;

-- Create new secure RLS policies for tao_validators table
CREATE POLICY "Auth users view validators"
ON public.tao_validators FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users insert validators"
ON public.tao_validators FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users update validators"
ON public.tao_validators FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users delete validators"
ON public.tao_validators FOR DELETE
USING (auth.uid() IS NOT NULL);