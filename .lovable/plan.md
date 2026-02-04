
# Plano: Correção da Análise AI de Anexos Kanban

## Contexto

O sistema de análise AI de documentos anexados a cards Kanban falha porque:

1. O bucket `kanban-attachments` é **privado**
2. O código guarda URLs públicas (que não funcionam em buckets privados)
3. Se o signed URL falhar, há fallback para URL pública (inútil)
4. Ficheiros eliminados do storage deixam registos órfãos na base de dados

## Alterações Planeadas

### 1. Base de Dados - Nova coluna storage_path

Adicionar coluna `storage_path` à tabela `kanban_attachments` para guardar o caminho relativo do ficheiro (ex: `cardId/timestamp-hash.pdf`), independente do URL.

```text
kanban_attachments
├── id (uuid)
├── card_id (uuid)
├── file_url (text) - mantém para compatibilidade
├── storage_path (text) - NOVO: caminho no bucket
├── filename (text)
├── file_type (text)
├── uploaded_by (uuid)
└── created_at (timestamp)
```

### 2. Frontend - kanbanService.ts

**uploadAttachment():**
- Guardar também o `storage_path` na inserção

**getSignedDownloadUrl():**
- Usar `storage_path` diretamente se disponível
- Fallback para extrair do URL público apenas para registos antigos

### 3. Edge Function - analyze-kanban-attachment

**Validação prévia:**
- Verificar se o ficheiro existe no storage ANTES de gerar signed URL
- Se não existir: devolver erro claro + eliminar registo órfão automaticamente
- Se existir: gerar signed URL e enviar ao n8n

**Fluxo melhorado:**
```text
1. Receber pedido (fileUrl, storagePath, cardId)
2. Determinar storage path (novo campo ou extrair do URL)
3. Verificar existência: storage.from('kanban-attachments').download(path)
4. Se não existe:
   - Apagar registo da tabela kanban_attachments
   - Retornar erro claro ao frontend
5. Se existe:
   - Gerar signed URL (1 hora)
   - Enviar ao n8n webhook
   - Retornar resultado
```

### 4. Frontend - AiAttachmentAnalyzerDialog.tsx

**Tratamento de erro melhorado:**
- Se receber erro "ficheiro não existe", mostrar mensagem amigável
- Recarregar lista de anexos (o órfão já foi limpo)
- Sugerir re-upload do documento

## Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `supabase/migrations/` | Nova coluna `storage_path` |
| `src/services/kanbanService.ts` | Upload guarda storage_path; getSignedUrl usa storage_path |
| `supabase/functions/analyze-kanban-attachment/index.ts` | Validação de existência + auto-limpeza |
| `src/components/kanban/AiAttachmentAnalyzerDialog.tsx` | Enviar storage_path; melhor tratamento de erros |
| `src/components/kanban/KanbanCardModal.tsx` | Recarregar anexos após erro de órfão |

## Benefícios

- Ficheiros privados funcionam corretamente com n8n
- Registos órfãos são limpos automaticamente
- Menos erros confusos para o utilizador
- Código mais robusto e manutenível
