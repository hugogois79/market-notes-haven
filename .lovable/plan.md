
# Plano: Correção da Análise AI de Anexos Kanban

## ✅ IMPLEMENTADO

## Contexto

O sistema de análise AI de documentos anexados a cards Kanban falhava porque:

1. O bucket `kanban-attachments` é **privado**
2. O código guardava URLs públicas (que não funcionam em buckets privados)
3. Se o signed URL falhasse, havia fallback para URL pública (inútil)
4. Ficheiros eliminados do storage deixavam registos órfãos na base de dados

## Alterações Implementadas

### 1. Base de Dados - Nova coluna storage_path ✅

Adicionada coluna `storage_path` à tabela `kanban_attachments`.

### 2. Frontend - kanbanService.ts ✅

- **uploadAttachment():** Guarda também o `storage_path` na inserção
- **getSignedDownloadUrl():** Usa `storage_path` diretamente se disponível; fallback para extrair do URL público apenas para registos antigos

### 3. Edge Function - analyze-kanban-attachment ✅

- Valida se o ficheiro existe no storage ANTES de gerar signed URL
- Se não existir: apaga registo órfão automaticamente + retorna erro claro
- Se existir: gera signed URL e envia ao n8n

### 4. Frontend - AiAttachmentAnalyzerDialog.tsx ✅

- Envia `storagePath` e `attachmentId` à Edge Function
- Trata erro "file_not_found" com mensagem amigável

### 5. KanbanCardModal.tsx ✅

- Todas as funções de download/preview usam `storage_path` quando disponível

## Benefícios

- Ficheiros privados funcionam corretamente com n8n
- Registos órfãos são limpos automaticamente
- Menos erros confusos para o utilizador
- Código mais robusto e manutenível
