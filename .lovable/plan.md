
# Plano: Adicionar Botão "Supermemory" ao Editor de Notas

## Objetivo
Adicionar um botão **Supermemory** ao lado do botão "Copy" na barra de status do editor de notas. Este botão irá enviar a nota completa (título, conteúdo, resumo, tags e URLs de anexos) para a API da Supermemory.

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                     EditorStatusBar.tsx                         │
│  [Copy] [Supermemory] [Print] [Save] [Delete]                   │
│         └──────────────────┬────────────────┘                   │
│                            │ onClick                            │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Edge Function: send-to-supermemory                 │
│  - Recebe: noteContent + attachments                            │
│  - Formata para Supermemory API                                 │
│  - POST → api.supermemory.ai/v3/documents                       │
│  - Retorna: { id, status } ou { error }                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alterações Necessárias

### 1. Criar Edge Function `send-to-supermemory`

**Ficheiro:** `supabase/functions/send-to-supermemory/index.ts`

A Edge Function vai:
1. Receber o conteúdo da nota via POST (título, categoria, content, tags, summary, attachments)
2. Formatar o conteúdo num formato legível para a Supermemory
3. Enviar para `https://api.supermemory.ai/v3/documents` com:
   - `content`: texto formatado da nota
   - `containerTag`: categoria da nota (ex: "Legal", "Trading")
   - `metadata`: { noteId, title, tags, hasAttachments }
4. Usar a API key da Supermemory (armazenada como secret)
5. Retornar sucesso/erro

**Payload de exemplo para Supermemory:**
```json
{
  "content": "# Relatório Jurídico - Ford Transit 28-XH-55\n\nCategory: Legal\nTags: insolvência, ford, veículo\n\n## Summary\nAnálise jurídica da viatura Ford Transit...\n\n## Content\nRELATÓRIO DE ANÁLISE JURÍDICA...\n\n## Attachments\n- https://storage.../document1.pdf\n- https://storage.../document2.pdf",
  "containerTag": "Legal",
  "metadata": {
    "noteId": "5f6863e7-3b15-475c-8e63-d1d3728efee7",
    "title": "Relatório Jurídico - Ford Transit 28-XH-55",
    "tags": ["insolvência", "ford", "veículo"],
    "hasAttachments": true,
    "source": "gvvc-one"
  }
}
```

### 2. Adicionar Secret da API Supermemory

A API key `sm_Hk8HokoXQyS4aEUSCz4Mgi_j8aYkUjrJ9fy0aacwVcUlpU3C7KEvY6` será armazenada como:
- **Nome:** `SUPERMEMORY_API_KEY`
- **Valor:** A chave fornecida

### 3. Modificar `EditorStatusBar.tsx`

Adicionar o botão Supermemory:
- Ícone: `Brain` ou `Sparkles` (de lucide-react)
- Posição: imediatamente após o botão "Copy"
- Comportamento:
  - Ao clicar, chama a Edge Function com o conteúdo da nota
  - Mostra toast de loading ("A enviar para Supermemory...")
  - Toast de sucesso ou erro conforme resultado

**Novo handler:**
```tsx
const handleSendToSupermemory = async () => {
  if (!noteContent) {
    toast.error("No content to send");
    return;
  }

  try {
    toast.info("A enviar para Supermemory...");
    
    const response = await supabase.functions.invoke('send-to-supermemory', {
      body: {
        noteId,
        title: noteContent.title,
        category: noteContent.category,
        content: noteContent.content,
        tags: noteContent.tags,
        summary: noteContent.summary,
        attachments
      }
    });

    if (response.error) throw response.error;
    
    toast.success("Nota enviada para Supermemory!");
  } catch (error) {
    console.error("Supermemory error:", error);
    toast.error("Erro ao enviar para Supermemory");
  }
};
```

### 4. Atualizar Props do EditorStatusBar

Adicionar propriedade `noteId` ao `EditorStatusBarProps`:
```tsx
interface EditorStatusBarProps {
  // ... existing props
  noteId?: string;  // Novo - para identificar a nota na Supermemory
}
```

### 5. Passar noteId para EditorStatusBar

Em `EditorMain.tsx`, passar a prop `noteId` para o `EditorStatusBar`:
```tsx
<EditorStatusBar 
  // ... existing props
  noteId={noteId}
/>
```

---

## Detalhes Técnicos

### Edge Function - Estrutura Completa

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPERMEMORY_API_KEY = Deno.env.get('SUPERMEMORY_API_KEY');
const SUPERMEMORY_API_URL = 'https://api.supermemory.ai/v3/documents';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId, title, category, content, tags, summary, attachments } = await req.json();

    // Formatar conteúdo para Supermemory
    let formattedContent = `# ${title}\n\n`;
    formattedContent += `**Category:** ${category}\n`;
    if (tags?.length) formattedContent += `**Tags:** ${tags.join(', ')}\n`;
    if (summary) formattedContent += `\n## Summary\n${summary}\n`;
    formattedContent += `\n## Content\n${content}\n`;
    if (attachments?.length) {
      formattedContent += `\n## Attachments\n`;
      attachments.forEach(url => formattedContent += `- ${url}\n`);
    }

    // Enviar para Supermemory
    const response = await fetch(SUPERMEMORY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERMEMORY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: formattedContent,
        containerTag: category?.replace(/\s+/g, '-').toLowerCase(),
        metadata: {
          noteId,
          title,
          tags,
          hasAttachments: attachments?.length > 0,
          source: 'gvvc-one'
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send to Supermemory');
    }

    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Sequência de Implementação

1. **Criar Edge Function** `supabase/functions/send-to-supermemory/index.ts`
2. **Adicionar Secret** `SUPERMEMORY_API_KEY` via Supabase Cloud
3. **Atualizar `EditorStatusBar.tsx`**:
   - Adicionar import do ícone (Brain/Sparkles)
   - Adicionar prop `noteId`
   - Adicionar handler `handleSendToSupermemory`
   - Adicionar botão na UI
4. **Atualizar `EditorMain.tsx`**: passar `noteId` para EditorStatusBar
5. **Deploy Edge Function**
6. **Testar** end-to-end

---

## Resultado Visual Esperado

```
[Copy] [🧠 Supermemory] [Print] [Save] [Delete]
```

Ao clicar:
- Toast: "A enviar para Supermemory..."
- Sucesso: "Nota enviada para Supermemory! ✓"
- Erro: "Erro ao enviar para Supermemory"
