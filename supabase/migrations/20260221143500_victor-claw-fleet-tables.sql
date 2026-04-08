-- ============================================================
-- VICTOR CLAW — Fleet Tables
-- Criado: 21-02-2026
-- Agente: Victor Claw (AI Fleet Concierge & Virtual Co-Pilot)
-- ============================================================

-- 1. fleet_vehicles — Viaturas da frota Robsonway
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero           INTEGER,                               -- Número sequencial da frota
  nome             TEXT NOT NULL,                         -- Ex: "Porsche 911 GT3 RS 2025"
  matricula        TEXT,
  combustivel      TEXT DEFAULT 'gasolina_95'             -- 'gasolina_95' | 'gasolina_98' | 'gasoleo' | 'ev' | 'phev_95' | 'phev_98'
                   CHECK (combustivel IN ('gasolina_95','gasolina_98','gasoleo','ev','phev_95','phev_98')),
  deposito_litros  NUMERIC(5,1),                          -- Capacidade do depósito (L)
  consumo_100km    NUMERIC(5,2),                          -- Consumo real (L/100km ou kWh/100km)
  km_actual        INTEGER DEFAULT 0,
  km_proxima_revisao INTEGER,
  data_iuc         DATE,
  data_seguro      DATE,
  data_inspecao    DATE,
  notas            TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_fleet_vehicles()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_updated_fleet_vehicles ON public.fleet_vehicles;
CREATE TRIGGER trg_updated_fleet_vehicles
  BEFORE UPDATE ON public.fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_fleet_vehicles();

-- Índices
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_nome ON public.fleet_vehicles(nome);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_numero ON public.fleet_vehicles(numero);


-- 2. fleet_expenses — Despesas (alimentadas por OCR do Victor Claw)
CREATE TABLE IF NOT EXISTS public.fleet_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data        DATE NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  categoria   TEXT CHECK (categoria IN ('combustivel','portagem','lavagem','estacionamento','manutencao','outro')),
  nif         TEXT,                                       -- NIF do fornecedor
  veiculo_id  UUID REFERENCES public.fleet_vehicles(id) ON DELETE SET NULL,
  descricao   TEXT,
  foto_url    TEXT,                                       -- URL do talão no Supabase Storage
  created_by  TEXT DEFAULT 'Victor Claw',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_expenses_data ON public.fleet_expenses(data DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_expenses_categoria ON public.fleet_expenses(categoria);
CREATE INDEX IF NOT EXISTS idx_fleet_expenses_veiculo ON public.fleet_expenses(veiculo_id);


-- 3. fleet_tasks — Tarefas Hugo → Waldir (geridas pelo Victor Claw)
CREATE TABLE IF NOT EXISTS public.fleet_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  estado         TEXT DEFAULT 'todo'
                 CHECK (estado IN ('todo','in_progress','done','escalado')),
  prioridade     TEXT DEFAULT 'medium'
                 CHECK (prioridade IN ('low','medium','high','urgent')),
  criado_por     TEXT DEFAULT 'Hugo',
  atribuido_a    TEXT DEFAULT 'Waldir',
  data_criacao   TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ,
  kanban_card_id UUID REFERENCES public.kanban_cards(id) ON DELETE SET NULL  -- Link ao board Robsonway Fleet
);

CREATE INDEX IF NOT EXISTS idx_fleet_tasks_estado ON public.fleet_tasks(estado);
CREATE INDEX IF NOT EXISTS idx_fleet_tasks_atribuido ON public.fleet_tasks(atribuido_a);
CREATE INDEX IF NOT EXISTS idx_fleet_tasks_data ON public.fleet_tasks(data_criacao DESC);


-- 4. Seed — 7 Viaturas da Frota Robsonway (21-02-2026)
INSERT INTO public.fleet_vehicles (numero, nome, combustivel, deposito_litros, consumo_100km, notas)
VALUES
  (1, 'Bentley Bentayga Hybrid 2022',  'phev_98', 75,   11.3, 'SUV PHEV. Exclusivamente Gasolina 98.'),
  (2, 'Bentley Continental GT 2025',   'phev_98', 75,   11.0, 'Coupé PHEV. Exclusivamente Gasolina 98.'),
  (3, 'Jeep Grand Cherokee 4xe 2024',  'phev_95', 72,   10.2, 'SUV PHEV. Gasolina 95.'),
  (4, 'Mercedes Vito V300 d 2024',     'gasoleo', 70,    8.5, 'Van transfers VIP. Gasóleo.'),
  (5, 'Porsche 911 GT3 RS 2025',       'gasolina_98', 64, 16.0, 'Track-focused. Exclusivamente Gasolina 98.'),
  (6, 'Porsche Macan Electric 2025',   'ev',      NULL, 21.0, '100% EV. Bateria ~95kWh. Consumo em kWh/100km.'),
  (7, 'Renault Mégane Comercial 2018', 'gasoleo', 47,    5.0, 'Carrinha serviço. Gasóleo.')
ON CONFLICT DO NOTHING;
