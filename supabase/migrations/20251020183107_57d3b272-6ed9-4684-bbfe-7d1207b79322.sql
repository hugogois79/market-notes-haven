-- Drop existing policies
DROP POLICY IF EXISTS "Users can view projects from their companies" ON public.financial_projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.financial_projects;

-- Create updated policy for viewing projects
-- Users can view projects where their company is the owner OR in the associated_companies array
CREATE POLICY "Users can view projects from their companies"
ON public.financial_projects
FOR SELECT
USING (
  company_id IN (
    SELECT companies.id
    FROM companies
    WHERE (
      companies.owner_id = auth.uid() 
      OR companies.id IN (
        SELECT company_users.company_id
        FROM company_users
        WHERE company_users.user_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1
    FROM companies
    WHERE (
      companies.id = ANY(financial_projects.associated_companies)
      AND (
        companies.owner_id = auth.uid()
        OR companies.id IN (
          SELECT company_users.company_id
          FROM company_users
          WHERE company_users.user_id = auth.uid()
        )
      )
    )
  )
);

-- Create updated policy for managing projects
-- Admins/Managers can manage projects where their company is the owner OR in associated_companies
CREATE POLICY "Admins can manage projects"
ON public.financial_projects
FOR ALL
USING (
  company_id IN (
    SELECT companies.id
    FROM companies
    WHERE companies.owner_id = auth.uid()
    UNION
    SELECT company_users.company_id
    FROM company_users
    WHERE (
      company_users.user_id = auth.uid() 
      AND company_users.role IN ('admin', 'manager')
    )
  )
  OR EXISTS (
    SELECT 1
    FROM companies
    WHERE (
      companies.id = ANY(financial_projects.associated_companies)
      AND (
        companies.owner_id = auth.uid()
        OR companies.id IN (
          SELECT company_users.company_id
          FROM company_users
          WHERE (
            company_users.user_id = auth.uid()
            AND company_users.role IN ('admin', 'manager')
          )
        )
      )
    )
  )
);