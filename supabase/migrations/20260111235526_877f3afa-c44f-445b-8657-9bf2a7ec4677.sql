-- =========================================================
-- TABELA PLAN_SNAPSHOTS - Versionamento de Planos Financeiros
-- =========================================================

CREATE TABLE IF NOT EXISTS public.plan_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  name TEXT,
  notes TEXT,
  projected_3m NUMERIC(15,2),
  projected_6m NUMERIC(15,2),
  projected_1y NUMERIC(15,2),
  total_value_at_snapshot NUMERIC(15,2),
  cashflow_snapshot JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para pesquisa rápida
CREATE INDEX idx_plan_snapshots_user_id ON public.plan_snapshots(user_id);
CREATE INDEX idx_plan_snapshots_date ON public.plan_snapshots(snapshot_date DESC);

-- Habilitar RLS
ALTER TABLE public.plan_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para owner access
CREATE POLICY "Users can view own plan snapshots" 
  ON public.plan_snapshots FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plan snapshots" 
  ON public.plan_snapshots FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan snapshots" 
  ON public.plan_snapshots FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plan snapshots" 
  ON public.plan_snapshots FOR DELETE 
  USING (auth.uid() = user_id);