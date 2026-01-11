-- =========================================================
-- TABELA MEMORIES - Memória Permanente da Michele Assistant
-- =========================================================

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para pesquisa rápida
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);

-- Habilitar RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Política de acesso (permite todas as operações para utilizadores autenticados)
CREATE POLICY "Enable all operations for authenticated users" ON memories
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);