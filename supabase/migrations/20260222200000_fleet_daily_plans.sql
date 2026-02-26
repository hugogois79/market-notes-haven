-- ============================================================
-- fleet_daily_plans — Planeamento diário estruturado
-- Permite monitorização GPS: posição Waldir vs local planeado
-- Victor Claw | 22-02-2026
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fleet_daily_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data             DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio      TIME NOT NULL,
  hora_fim         TIME NOT NULL,
  local_nome       TEXT NOT NULL,
  latitude         NUMERIC(9,6) NOT NULL,
  longitude        NUMERIC(9,6) NOT NULL,
  raio_metros      INTEGER NOT NULL DEFAULT 30,
  viatura          TEXT,
  descricao        TEXT,
  kanban_card_id   UUID REFERENCES public.kanban_cards(id) ON DELETE SET NULL,
  estado           TEXT NOT NULL DEFAULT 'agendado'
                   CHECK (estado IN ('agendado','em_curso','concluido','falhado','cancelado')),
  alerta_enviado   BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por       TEXT NOT NULL DEFAULT 'Victor',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Garantir que não há sobreposição de horários no mesmo dia
  CONSTRAINT check_hora_valida CHECK (hora_fim > hora_inicio)
);

-- Índice para queries frequentes: "qual é o plano activo agora?"
CREATE INDEX IF NOT EXISTS idx_daily_plans_data_hora
  ON public.fleet_daily_plans (data, hora_inicio, hora_fim);

-- Índice para lookup por estado
CREATE INDEX IF NOT EXISTS idx_daily_plans_estado
  ON public.fleet_daily_plans (estado)
  WHERE estado IN ('agendado', 'em_curso');

-- Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_daily_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_daily_plans_updated_at
  BEFORE UPDATE ON public.fleet_daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_plans_updated_at();

-- RLS: permitir acesso completo (service_role + anon para agentes)
ALTER TABLE public.fleet_daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to fleet_daily_plans"
  ON public.fleet_daily_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- View auxiliar: plano activo AGORA (hora de Lisboa)
CREATE OR REPLACE VIEW public.v_plano_activo AS
SELECT
  id,
  data,
  hora_inicio,
  hora_fim,
  local_nome,
  latitude,
  longitude,
  raio_metros,
  viatura,
  descricao,
  estado,
  alerta_enviado
FROM public.fleet_daily_plans
WHERE
  data = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Lisbon')::DATE
  AND hora_inicio <= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Lisbon')::TIME
  AND hora_fim > (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Lisbon')::TIME
  AND estado IN ('agendado', 'em_curso')
ORDER BY hora_inicio
LIMIT 1;

-- Função RPC: obter plano activo (para chamada directa do n8n/Victor)
CREATE OR REPLACE FUNCTION public.get_plano_activo()
RETURNS TABLE (
  id UUID,
  data DATE,
  hora_inicio TIME,
  hora_fim TIME,
  local_nome TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  raio_metros INTEGER,
  viatura TEXT,
  descricao TEXT,
  estado TEXT,
  alerta_enviado BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.v_plano_activo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função RPC: inserir plano do dia completo (Victor chama isto ao criar o plano matinal)
CREATE OR REPLACE FUNCTION public.inserir_plano_dia(
  p_data DATE,
  p_entradas JSONB  -- array de { hora_inicio, hora_fim, local_nome, latitude, longitude, viatura, descricao, raio_metros? }
)
RETURNS INTEGER AS $$
DECLARE
  entrada JSONB;
  count_inserted INTEGER := 0;
BEGIN
  -- Limpar planos anteriores do mesmo dia (se Victor re-planear)
  DELETE FROM public.fleet_daily_plans
  WHERE data = p_data AND estado = 'agendado';

  FOR entrada IN SELECT * FROM jsonb_array_elements(p_entradas)
  LOOP
    INSERT INTO public.fleet_daily_plans (
      data, hora_inicio, hora_fim, local_nome,
      latitude, longitude, viatura, descricao, raio_metros
    ) VALUES (
      p_data,
      (entrada->>'hora_inicio')::TIME,
      (entrada->>'hora_fim')::TIME,
      entrada->>'local_nome',
      (entrada->>'latitude')::NUMERIC,
      (entrada->>'longitude')::NUMERIC,
      entrada->>'viatura',
      entrada->>'descricao',
      COALESCE((entrada->>'raio_metros')::INTEGER, 30)
    );
    count_inserted := count_inserted + 1;
  END LOOP;

  RETURN count_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.fleet_daily_plans IS 'Planeamento diário estruturado — Victor Claw monitora posição GPS do Waldir vs local planeado';
COMMENT ON FUNCTION public.get_plano_activo IS 'Retorna o plano activo para a hora actual (timezone Europe/Lisbon)';
COMMENT ON FUNCTION public.inserir_plano_dia IS 'Victor insere o plano completo do dia como array JSON — substitui planos "agendado" do mesmo dia';
