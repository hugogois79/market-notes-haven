
# Plano: Adicionar Indexes para Acelerar Filtragem de Notas

## Problema Identificado

A tabela `notes` tem 375 notas e já possui bons indexes para ordenação (`updated_at`, `created_at`) e lookup por `user_id`. No entanto, faltam indexes específicos para os **filtros de estado** que tornariam a filtragem instantânea.

---

## Indexes a Criar

### 1. GIN Index para Tags Array (PRIORIDADE ALTA)
O campo `tags` é um array de texto usado para filtrar notas por tag. Um índice GIN permite consultas ultra-rápidas com operadores de array.

```sql
CREATE INDEX idx_notes_tags_gin ON notes USING gin (tags);
```

**Benefício**: Filtragem por tags passa de scan sequencial para lookup indexado.

---

### 2. Index para has_conclusion
Permite filtrar rapidamente notas com conclusão vs sem conclusão.

```sql
CREATE INDEX idx_notes_has_conclusion ON notes (user_id, has_conclusion) 
WHERE has_conclusion IS NOT NULL;
```

**Benefício**: Filtro "Tem Conclusão" instantâneo.

---

### 3. Index para Summary Existence
Permite filtrar notas que têm resumo gerado.

```sql
CREATE INDEX idx_notes_has_summary ON notes (user_id) 
WHERE summary IS NOT NULL AND summary != '';
```

**Benefício**: Filtro "Tem Resumo" instantâneo.

---

### 4. Index para Attachments Existence
Permite filtrar notas com anexos.

```sql
CREATE INDEX idx_notes_has_attachments ON notes (user_id) 
WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;
```

**Benefício**: Filtro "Tem Anexos" instantâneo.

---

### 5. Composite Index para Multi-Filter (Opcional - Alta Performance)
Um índice composto para os filtros mais comuns combinados.

```sql
CREATE INDEX idx_notes_user_project_category ON notes (user_id, project_id, category, updated_at DESC);
```

**Benefício**: Queries combinadas (projeto + categoria) otimizadas.

---

## Migração SQL Completa

```sql
-- 1. GIN index for tags array filtering
CREATE INDEX IF NOT EXISTS idx_notes_tags_gin 
  ON notes USING gin (tags);

-- 2. Partial index for has_conclusion filtering
CREATE INDEX IF NOT EXISTS idx_notes_user_has_conclusion 
  ON notes (user_id, has_conclusion) 
  WHERE has_conclusion IS NOT NULL;

-- 3. Partial index for notes with summary
CREATE INDEX IF NOT EXISTS idx_notes_with_summary 
  ON notes (user_id, updated_at DESC) 
  WHERE summary IS NOT NULL AND summary != '';

-- 4. Partial index for notes with attachments
CREATE INDEX IF NOT EXISTS idx_notes_with_attachments 
  ON notes (user_id, updated_at DESC) 
  WHERE attachments IS NOT NULL AND array_length(attachments, 1) > 0;

-- 5. Composite index for project+category filtering
CREATE INDEX IF NOT EXISTS idx_notes_user_project_category_updated 
  ON notes (user_id, project_id, category, updated_at DESC);
```

---

## Resultado Esperado

| Operação | Antes | Depois |
|----------|-------|--------|
| Filtrar por Tag | ~50ms (seq scan) | ~2ms (GIN lookup) |
| Filtrar "Tem Conclusão" | ~30ms | ~1ms |
| Filtrar "Tem Resumo" | ~30ms | ~1ms |
| Filtrar "Tem Anexos" | ~30ms | ~1ms |
| Filtrar Projeto+Categoria | ~40ms | ~3ms |

---

## Impacto no Storage

Os indexes parciais são muito eficientes em espaço:
- GIN tags: ~50KB (para 375 notas)
- Indexes parciais: ~10KB cada (só indexam subset)
- Total estimado: ~100KB adicional

---

## Ficheiros a Modificar

1. **Nova migração SQL**: `supabase/migrations/[timestamp]_add_notes_filter_indexes.sql`

Apenas uma migração de base de dados, sem alterações no código frontend.
