

## Plano: Botão AI para Análise de Anexos do Kanban Card

### Objetivo
Adicionar um botão de AI junto à secção de Attachments que, quando existem anexos, chama um webhook do n8n para analisar o documento. Após análise, a informação extraída é aplicada à descrição do card mediante confirmação do utilizador.

---

### Fluxo Proposto

```text
┌─────────────────────────────────────────────────────┐
│  Attachments          [✨]  ← Novo botão AI         │
│ ┌──────────────────────────────────────────────────┐│
│ │ 📄 Pipetas de Admission Gasoil (31-01-2026)...  ││
│ └──────────────────────────────────────────────────┘│
│ [📎 Add Attachment (max 50MB)]                      │
└─────────────────────────────────────────────────────┘
         │
         ▼ (clique no botão AI)
┌─────────────────────────────────────────────────────┐
│  Dialog: Analisar Documento com AI                  │
│                                                     │
│  Selecione o anexo para analisar:                   │
│  ○ Pipetas de Admission Gasoil (31-01-2026)...      │
│                                                     │
│  [Cancelar]                [Analisar]               │
└─────────────────────────────────────────────────────┘
         │
         ▼ (após resposta do webhook)
┌─────────────────────────────────────────────────────┐
│  Dialog: Confirmar Descrição                        │
│                                                     │
│  A AI extraiu a seguinte informação:                │
│ ┌──────────────────────────────────────────────────┐│
│ │ Fornecedor: Varandas Oil                         ││
│ │ Data: 31-01-2026                                 ││
│ │ Valor: €1,234.56                                 ││
│ │ Descrição: Pipetas para admissão de gasoil...   ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│  [Cancelar]          [Aplicar à Descrição]          │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Description [🔸 actualizada]                       │
│ ┌──────────────────────────────────────────────────┐│
│ │ Fornecedor: Varandas Oil                         ││
│ │ Data: 31-01-2026                                 ││
│ │ Valor: €1,234.56                                 ││
│ │ Descrição: Pipetas para admissão de gasoil...   ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

### Componentes a Criar/Modificar

| Componente | Tipo | Descrição |
|------------|------|-----------|
| `AiAttachmentAnalyzerDialog.tsx` | **Novo** | Dialog para selecionar anexo e mostrar resultados |
| `analyze-kanban-attachment` | **Nova Edge Function** | Gera signed URL e chama o webhook do n8n |
| `KanbanCardModal.tsx` | **Modificar** | Adicionar botão AI junto a "Attachments" |

---

### Alterações Técnicas

**1. Nova Edge Function: `supabase/functions/analyze-kanban-attachment/index.ts`**

Reutiliza a lógica existente do `analyze-document-webhook`, mas adaptada para o bucket `kanban-attachments`:

```typescript
// Recebe: fileUrl, fileName, mimeType, cardId
// 1. Extrai caminho do ficheiro do URL
// 2. Gera signed URL (1 hora) para o bucket 'kanban-attachments'
// 3. Chama N8N_ANALYZE_DOCUMENT_WEBHOOK com o signed URL
// 4. Retorna dados extraídos pelo OCR (vendor_name, total_amount, etc.)
```

**2. Novo Componente: `src/components/kanban/AiAttachmentAnalyzerDialog.tsx`**

Estado e props:

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  attachments: KanbanAttachment[];
  cardId: string;
  onDescriptionGenerated: (description: string) => void;
}

// Estados internos:
// - selectedAttachment: KanbanAttachment | null
// - isAnalyzing: boolean
// - extractedData: { vendor_name, total_amount, invoice_date, ... } | null
// - generatedDescription: string
```

Fases do dialog:
1. **Selecção**: Lista de anexos com radio buttons
2. **A analisar**: Loading spinner enquanto espera resposta do webhook
3. **Confirmação**: Preview da descrição gerada, botões "Cancelar" / "Aplicar"

**3. Modificar: `src/components/kanban/KanbanCardModal.tsx`**

Linha ~547, adicionar botão AI junto ao label "Attachments":

```typescript
<div className="flex items-center justify-between mb-1">
  <Label>Attachments</Label>
  {attachments.length > 0 && (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowAiAttachmentDialog(true)}
      className="h-7 w-7"
      title="Analisar anexo com AI"
    >
      <Sparkles className="h-4 w-4" />
    </Button>
  )}
</div>
```

Handler para receber a descrição gerada:

```typescript
const handleAiDescriptionGenerated = (newDescription: string) => {
  // Opção 1: Substituir descrição
  setDescription(newDescription);
  
  // Opção 2: Concatenar (se já existir descrição)
  // setDescription(prev => prev ? `${prev}\n\n---\n\n${newDescription}` : newDescription);
};
```

---

### Formato da Descrição Gerada

O webhook do n8n já extrai campos como:
- `vendor_name` (Fornecedor)
- `invoice_date` (Data)
- `total_amount` (Valor)
- `line_items_summary` (Descrição dos itens)

A descrição gerada terá o formato:

```
**Fornecedor:** Varandas Oil
**Data:** 31-01-2026
**Valor:** €1,234.56

**Detalhes:**
Pipetas para admissão de gasoil - quantidade: 50 unidades
```

---

### Ficheiros a Criar/Modificar

| Ficheiro | Acção |
|----------|-------|
| `supabase/functions/analyze-kanban-attachment/index.ts` | Criar |
| `supabase/config.toml` | Adicionar entrada para nova função |
| `src/components/kanban/AiAttachmentAnalyzerDialog.tsx` | Criar |
| `src/components/kanban/KanbanCardModal.tsx` | Modificar |

---

### Configuração Necessária

A Edge Function reutiliza o secret existente:
- `N8N_ANALYZE_DOCUMENT_WEBHOOK` - Já configurado no projecto

---

### Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Nenhum anexo | Botão AI não aparece |
| Múltiplos anexos | Utilizador seleciona qual analisar |
| Webhook falha | Mostra mensagem de erro amigável |
| OCR não extrai dados | Informa que não foi possível extrair informação |
| Descrição já existe | Pergunta se quer substituir ou concatenar |

---

### Segurança

- Signed URLs são gerados server-side na Edge Function
- Validade de 1 hora para processamento pelo n8n
- Bucket `kanban-attachments` mantém-se privado

