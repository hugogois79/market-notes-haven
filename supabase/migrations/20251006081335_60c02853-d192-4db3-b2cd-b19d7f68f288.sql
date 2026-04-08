-- Fix critical security vulnerability: Remove public access to profiles table
-- This prevents unauthorized access to email addresses and other sensitive user data

-- Drop the dangerous "Public Access for Development" policy that exposes all data
DROP POLICY IF EXISTS "Public Access for Development" ON public.profiles;

-- Drop the problematic admin policy that could cause recursive RLS issues
DROP POLICY IF EXISTS "Admins can update user photos and emails" ON public.profiles;

-- Ensure users can view ONLY their own profile (policy may already exist, recreate to be certain)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure users can update ONLY their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);