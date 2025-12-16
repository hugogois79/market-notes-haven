-- Create table to store folder insights
CREATE TABLE public.folder_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.company_folders(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  last_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id)
);

-- Enable RLS
ALTER TABLE public.folder_insights ENABLE ROW LEVEL SECURITY;

-- Create policies - allow all authenticated users to manage insights
CREATE POLICY "Anyone can view folder insights"
  ON public.folder_insights FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert folder insights"
  ON public.folder_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update folder insights"
  ON public.folder_insights FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete folder insights"
  ON public.folder_insights FOR DELETE
  USING (true);