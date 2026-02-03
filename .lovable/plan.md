
## Plano: Adaptar Análise AI para Campos do Kanban Card

### Problema Identificado
O `AiAttachmentAnalyzerDialog` está configurado para extrair dados de **faturas** (vendor_name, invoice_number, total_amount), mas os campos relevantes para um **Kanban Card** são diferentes.

---

### Campos do Kanban Card (da imagem)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Title | texto | Título do card |
| Description | texto | Descrição detalhada |
| Valor (€) | número | Valor monetário |
| Due Date | data | Data de entrega |
| Priority | enum | low/medium/high |
| Tags | array | Etiquetas |
| Tasks | array | Checklist de subtarefas |

---

### Nova Estrutura de Dados Esperada do n8n

O workflow n8n deve retornar JSON com esta estrutura:

```text
{
  "description": "Resumo do documento...",
  "value": 1234.56,
  "due_date": "2026-02-15",
  "priority": "medium",
  "suggested_tags": ["Manutenção", "Motor"],
  "suggested_tasks": [
    "Verificar peças recebidas",
    "Confirmar quantidades",
    "Arquivar fatura"
  ]
}
```

---

### Alterações Técnicas

**1. Actualizar Interface `ExtractedData`**

Alterar de campos de fatura para campos de Kanban:

```text
interface ExtractedData {
  description?: string;
  value?: number;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  suggested_tags?: string[];
  suggested_tasks?: string[];
  summary?: string;  // fallback do n8n
}
```

**2. Actualizar Validação de Dados**

Alterar a verificação de dados válidos para os novos campos:

```text
// Antes
if (!extracted.vendor_name && !extracted.total_amount && !extracted.invoice_date)

// Depois  
if (!extracted.description && !extracted.value && !extracted.summary)
```

**3. Alterar o Callback `onDescriptionGenerated`**

O dialog actualmente só passa a descrição. Deve passar todos os campos extraídos para o modal aplicar directamente:

```text
// Antes
onDescriptionGenerated: (description: string) => void

// Depois
onDataExtracted: (data: ExtractedKanbanData) => void
```

**4. Actualizar KanbanCardModal para Aplicar Dados**

O modal deve receber todos os campos e preencher:
- `setDescription(data.description)`
- `setValue(data.value)`
- `setDueDate(data.due_date)`
- `setTags([...tags, ...data.suggested_tags])`
- `setTasks([...tasks, ...data.suggested_tasks.map(t => ({id, text, completed: false}))])`

**5. Actualizar UI de Confirmação**

Mostrar preview dos novos campos (descrição, valor, data, tags, tarefas) em vez dos campos de fatura.

---

### Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/kanban/AiAttachmentAnalyzerDialog.tsx` | Nova interface, nova UI de confirmação, novo callback |
| `src/components/kanban/KanbanCardModal.tsx` | Handler para aplicar dados extraídos aos campos do card |

---

### Configuração n8n Necessária

O workflow `lovable-doc-summary` deve ser configurado para retornar:

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `description` | string | Sim |
| `value` | number | Não |
| `due_date` | string (YYYY-MM-DD) | Não |
| `priority` | string (low/medium/high) | Não |
| `suggested_tags` | array de strings | Não |
| `suggested_tasks` | array de strings | Não |

---

### Fluxo de Utilização

```text
1. Utilizador clica no ícone ✨ nos Attachments
2. Seleciona o ficheiro a analisar
3. Sistema envia para n8n via Edge Function
4. n8n analisa e retorna campos do Kanban
5. Dialog mostra preview:
   - Descrição sugerida
   - Valor extraído (se houver)
   - Data sugerida (se houver)
   - Tags sugeridas
   - Tarefas sugeridas (checklist)
6. Utilizador confirma
7. Campos são aplicados ao card (merge com existentes)
```
