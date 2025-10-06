-- Fix Critical Security Issue: Restrict TAO business data to authenticated users only
-- Drops public read policies and adds authenticated-only policies

-- ============================================
-- TAO_VALIDATORS TABLE
-- ============================================

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow read access for all users" ON public.tao_validators;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view validators"
  ON public.tao_validators
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert validators"
  ON public.tao_validators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update validators"
  ON public.tao_validators
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete validators"
  ON public.tao_validators
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TAO_CONTACT_LOGS TABLE
-- ============================================

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow read access for all users" ON public.tao_contact_logs;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view contact logs"
  ON public.tao_contact_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contact logs"
  ON public.tao_contact_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact logs"
  ON public.tao_contact_logs
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete contact logs"
  ON public.tao_contact_logs
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TAO_NOTES TABLE
-- ============================================

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow read access for all users" ON public.tao_notes;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view tao notes"
  ON public.tao_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tao notes"
  ON public.tao_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tao notes"
  ON public.tao_notes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete tao notes"
  ON public.tao_notes
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TAO_SUBNETS TABLE
-- ============================================

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow read access for all users" ON public.tao_subnets;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view subnets"
  ON public.tao_subnets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subnets"
  ON public.tao_subnets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subnets"
  ON public.tao_subnets
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete subnets"
  ON public.tao_subnets
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TAO_VALIDATOR_SUBNETS TABLE
-- ============================================

-- Drop the public read policy
DROP POLICY IF EXISTS "Allow read access for all users" ON public.tao_validator_subnets;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view validator subnets"
  ON public.tao_validator_subnets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert validator subnets"
  ON public.tao_validator_subnets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update validator subnets"
  ON public.tao_validator_subnets
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete validator subnets"
  ON public.tao_validator_subnets
  FOR DELETE
  TO authenticated
  USING (true);