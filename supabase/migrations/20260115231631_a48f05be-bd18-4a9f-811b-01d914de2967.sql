-- =============================================
-- PROCUREMENT MODULE: Database Schema
-- =============================================

-- 1. Extend suppliers table with procurement fields
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS crm_stage text DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;

-- 2. Create procurement_projects table
CREATE TABLE IF NOT EXISTS procurement_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  budget numeric,
  status text DEFAULT 'planning',
  deadline date,
  category text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create procurement_assignments table
CREATE TABLE IF NOT EXISTS procurement_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES procurement_projects(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'to_contact',
  last_email_content text,
  last_reply_content text,
  quoted_price numeric,
  notes text,
  contacted_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, supplier_id)
);

-- 4. Create supplier_contact_logs table
CREATE TABLE IF NOT EXISTS supplier_contact_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES procurement_projects(id) ON DELETE SET NULL,
  contact_date date NOT NULL DEFAULT CURRENT_DATE,
  method text,
  direction text DEFAULT 'outbound',
  subject text,
  summary text,
  next_steps text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on all new tables
ALTER TABLE procurement_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contact_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for procurement_projects
CREATE POLICY "Authenticated users can view procurement projects"
  ON procurement_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create procurement projects"
  ON procurement_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update procurement projects"
  ON procurement_projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete procurement projects"
  ON procurement_projects FOR DELETE
  TO authenticated
  USING (true);

-- 7. Create RLS policies for procurement_assignments
CREATE POLICY "Authenticated users can view procurement assignments"
  ON procurement_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create procurement assignments"
  ON procurement_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update procurement assignments"
  ON procurement_assignments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete procurement assignments"
  ON procurement_assignments FOR DELETE
  TO authenticated
  USING (true);

-- 8. Create RLS policies for supplier_contact_logs
CREATE POLICY "Authenticated users can view supplier contact logs"
  ON supplier_contact_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create supplier contact logs"
  ON supplier_contact_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update supplier contact logs"
  ON supplier_contact_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete supplier contact logs"
  ON supplier_contact_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_procurement_projects_status ON procurement_projects(status);
CREATE INDEX IF NOT EXISTS idx_procurement_projects_company_id ON procurement_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_procurement_assignments_project_id ON procurement_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_assignments_supplier_id ON procurement_assignments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_procurement_assignments_status ON procurement_assignments(status);
CREATE INDEX IF NOT EXISTS idx_supplier_contact_logs_supplier_id ON supplier_contact_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contact_logs_project_id ON supplier_contact_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_crm_stage ON suppliers(crm_stage);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- 10. Create trigger for updated_at on new tables
CREATE OR REPLACE FUNCTION update_procurement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_procurement_projects_updated_at
  BEFORE UPDATE ON procurement_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_procurement_updated_at();

CREATE TRIGGER update_procurement_assignments_updated_at
  BEFORE UPDATE ON procurement_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_procurement_updated_at();

CREATE TRIGGER update_supplier_contact_logs_updated_at
  BEFORE UPDATE ON supplier_contact_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_procurement_updated_at();