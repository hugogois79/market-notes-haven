-- Create table for workflow storage location configurations
CREATE TABLE public.workflow_storage_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.company_folders(id) ON DELETE SET NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  folder_path text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, year, month)
);

-- Enable RLS
ALTER TABLE public.workflow_storage_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view storage locations"
ON public.workflow_storage_locations
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert storage locations"
ON public.workflow_storage_locations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update storage locations"
ON public.workflow_storage_locations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete storage locations"
ON public.workflow_storage_locations
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_workflow_storage_locations_updated_at
BEFORE UPDATE ON public.workflow_storage_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();