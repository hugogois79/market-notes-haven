-- Add assigned projects to expense requesters
ALTER TABLE expense_requesters
ADD COLUMN assigned_project_ids uuid[] DEFAULT ARRAY[]::uuid[];

-- Create index for better query performance
CREATE INDEX idx_expense_requesters_assigned_projects ON expense_requesters USING GIN(assigned_project_ids);