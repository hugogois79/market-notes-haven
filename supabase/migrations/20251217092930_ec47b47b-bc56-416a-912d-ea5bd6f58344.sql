-- Create workflow_files table for daily work items
CREATE TABLE public.workflow_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.workflow_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workflow files" 
ON public.workflow_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflow files" 
ON public.workflow_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflow files" 
ON public.workflow_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflow files" 
ON public.workflow_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workflow_files_updated_at
BEFORE UPDATE ON public.workflow_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();