-- First, delete duplicate workflow_files keeping only the most recent (by id)
DELETE FROM workflow_files a
USING workflow_files b
WHERE a.id < b.id 
  AND a.file_url = b.file_url;

-- Add UNIQUE constraint on file_url to prevent future duplicates
ALTER TABLE workflow_files 
ADD CONSTRAINT workflow_files_file_url_unique 
UNIQUE (file_url);