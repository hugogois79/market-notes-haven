-- Criar tabela para guardar preferências de UI do utilizador
CREATE TABLE public.user_ui_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

-- Enable RLS
ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_ui_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_ui_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_ui_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_ui_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_ui_preferences_updated_at
  BEFORE UPDATE ON public.user_ui_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();