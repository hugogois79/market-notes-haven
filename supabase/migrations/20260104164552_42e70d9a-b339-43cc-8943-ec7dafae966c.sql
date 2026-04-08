-- Add company_id field to workflow_files table for direct company association
ALTER TABLE workflow_files 
ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_workflow_files_company_id ON workflow_files(company_id);