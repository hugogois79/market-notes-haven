-- Map expenses project_id from financial_projects to expense_projects by name
UPDATE public.expenses e
SET project_id = ep.id
FROM public.financial_projects fp, public.expense_projects ep
WHERE e.project_id = fp.id AND fp.name = ep.name;

-- Set any remaining unmapped project_ids to NULL
UPDATE public.expenses 
SET project_id = NULL
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM public.expense_projects);

-- Add new foreign key that references expense_projects
ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_project 
FOREIGN KEY (project_id) 
REFERENCES public.expense_projects(id) 
ON DELETE SET NULL;