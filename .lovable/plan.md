
## Plano: Seleção Inteligente de Lista de Destino

### Objetivo
Quando o utilizador está num board específico e gera cards via AI, a lista de destino deve ser **identificada automaticamente** pela AI, analisando o texto passado e os nomes das listas disponíveis. Todos os cards vão para a mesma lista.

---

### Comportamento Atual vs. Pretendido

| Atual | Pretendido |
|-------|------------|
| Sempre usa a primeira lista | AI escolhe a lista mais adequada |
| Ignora nomes das listas | Considera nomes das listas no contexto |
| Nenhuma indicação ao utilizador | Mostra qual lista foi escolhida |

---

### Fluxo Proposto

```text
Utilizador cola texto
       ↓
Frontend envia:
  - text (texto do utilizador)
  - availableLists: ["Maitenance", "Legal", "Finance"]
       ↓
┌──────────────────────────────────────────────────┐
│  Edge Function: generate-tasks-from-text         │
│                                                  │
│  AI analisa texto + nomes das listas e decide:  │
│  - Tarefas extraídas (título, descrição, etc.)  │
│  - suggestedList: "Maitenance" (UMA para todos) │
└──────────────────────────────────────────────────┘
       ↓
Frontend mostra:
  "Cards serão adicionados à lista: Maitenance"
       ↓
Utilizador confirma → Todos os cards criados em "Maitenance"
```

---

### Alterações Técnicas

**1. Edge Function: `supabase/functions/generate-tasks-from-text/index.ts`**

Receber `availableLists` e adicionar ao prompt:

```typescript
const { text, availableLists } = await req.json();

const systemPrompt = `Analisa o seguinte texto e extrai as tarefas principais...
${availableLists?.length > 0 ? `
As listas disponíveis são: ${availableLists.join(', ')}.
Analisa o contexto do texto e indica qual das listas é mais apropriada para receber TODAS estas tarefas.
Devolve o nome exato de uma das listas disponíveis.
` : ''}`;
```

Adicionar `suggestedList` ao schema de output:

```typescript
parameters: {
  properties: {
    tasks: { /* ... existente ... */ },
    suggestedList: {
      type: "string",
      description: "Nome exato da lista mais apropriada para todas as tarefas"
    }
  },
  required: ["tasks", "suggestedList"]
}
```

**2. Frontend: `src/components/AIAssistant.tsx`**

Na função `generateKanbanStructure`:

- Enviar `availableLists` (nomes das listas do board atual)
- Guardar `suggestedList` retornada pela AI

Novo estado:

```typescript
const [suggestedListName, setSuggestedListName] = useState<string | null>(null);
```

Na função `createSelectedItems`:

- Usar `suggestedListName` para encontrar o `list_id` correspondente
- Fallback para primeira lista se nome não corresponder

No UI de resultados:

- Mostrar: "Lista destino: [nome da lista sugerida]"

---

### Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `supabase/functions/generate-tasks-from-text/index.ts` | Receber `availableLists`, atualizar prompt, retornar `suggestedList` |
| `src/components/AIAssistant.tsx` | Enviar listas disponíveis, mostrar lista sugerida, usar na criação |

---

### Exemplo de Resultado

```text
┌─────────────────────────────────────────────────┐
│ 🎯 A adicionar ao board: TRINIDAD               │
│    Lista destino: Maitenance                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Cards (3)                                       │
├─────────────────────────────────────────────────┤
│ ☑ Reparar ar condicionado           [high]     │
│ ☑ Verificar sistema de aquecimento  [medium]   │
│ ☑ Limpar calhas do telhado          [low]      │
└─────────────────────────────────────────────────┘
│            [Adicionar 3 cards]                  │
└─────────────────────────────────────────────────┘
```

---

### Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Lista sugerida não existe | Usa a primeira lista como fallback |
| Texto sem contexto claro | AI escolhe a lista mais genérica |
| Board sem listas | Mostra erro (comportamento atual) |
