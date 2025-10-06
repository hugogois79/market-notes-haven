-- Enable RLS on remaining tables without protection

-- PROJECT_CATEGORIES - Junction table linking projects to categories
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project categories for their projects"
  ON public.project_categories
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project categories for their projects"
  ON public.project_categories
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- TRADERS TABLE - User/trader profiles
ALTER TABLE public.traders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view traders"
  ON public.traders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create traders"
  ON public.traders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update traders"
  ON public.traders
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete traders"
  ON public.traders
  FOR DELETE
  TO authenticated
  USING (true);