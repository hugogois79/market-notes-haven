-- Create table for workflow column configurations
CREATE TABLE IF NOT EXISTS public.workflow_column_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  column_id text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, column_id)
);

-- Enable RLS
ALTER TABLE public.workflow_column_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own column config"
  ON public.workflow_column_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own column config"
  ON public.workflow_column_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own column config"
  ON public.workflow_column_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own column config"
  ON public.workflow_column_config FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_workflow_column_config_updated_at
  BEFORE UPDATE ON public.workflow_column_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();