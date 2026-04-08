-- Add associated companies field to financial_projects
ALTER TABLE public.financial_projects 
ADD COLUMN associated_companies UUID[] DEFAULT ARRAY[]::UUID[];

-- Add comment to explain the field
COMMENT ON COLUMN public.financial_projects.associated_companies IS 'Array of company IDs associated with this project';