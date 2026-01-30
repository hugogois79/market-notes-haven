
# Plano: Botão AI para Gerar Tarefas Automaticamente

## Resumo

Adicionar um botão "AI" ao modal de visualização/edição de cards (`KanbanCardModal`) que permite ao utilizador colar texto (como relatórios ou emails) e a IA extrai automaticamente as tarefas principais, criando novos cards no board.

## Fluxo do Utilizador

```text
┌─────────────────────────────────────────────────────────────────┐
│  KanbanCardModal                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Surveyer Michele                            [AI] ← NOVO    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Description                                                │ │
│  │ **PROBLEMAS CRÍTICOS...                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ Click no botão AI
┌─────────────────────────────────────────────────────────────────┐
│  Dialog: Gerar Tarefas com AI                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Cole aqui o texto para extrair tarefas...                  │ │
│  │                                                            │ │
│  │ [Textarea com relatório colado]                            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [ ] Adicionar à lista atual (Pipeline)                         │
│  [Cancelar]                     [🤖 Gerar Tarefas]              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ AI processa e extrai tarefas
┌─────────────────────────────────────────────────────────────────┐
│  3 tarefas extraídas:                                           │
│  ☑ Corrigir infiltração no Pilothouse (high)                    │
│  ☑ Verificar leme de estibordo (high)                           │
│  ☑ Avaliar cotovelos de escape (medium)                         │
│  [Cancelar]                     [✓ Criar 3 Cards]               │
└─────────────────────────────────────────────────────────────────┘
```

## Arquitetura Técnica

### 1. Nova Edge Function: `generate-tasks-from-text`

Criar uma edge function dedicada que:
- Recebe texto livre do utilizador
- Usa Lovable AI (Google Gemini) com tool calling para estruturar a resposta
- Retorna array de tarefas com: título, descrição curta, prioridade
- Extrai apenas as tarefas principais (acionáveis)

**Prompt da AI:**
```
Analisa o seguinte texto e extrai as tarefas principais que precisam de ser realizadas.
Para cada tarefa, identifica:
- Título curto e claro (máx 80 caracteres)
- Descrição resumida do que precisa ser feito
- Prioridade (high/medium/low) baseada na urgência mencionada

Foca apenas em itens acionáveis. Ignora contexto informativo.
```

### 2. Novo Componente: `AiTaskGeneratorDialog`

Dialog que contém:
- Textarea para colar o texto
- Estado de loading durante processamento
- Preview das tarefas extraídas com checkboxes
- Botão para criar os cards selecionados

### 3. Integração no KanbanCardModal

- Adicionar botão "AI" pequeno no header (junto ao título)
- O botão abre o `AiTaskGeneratorDialog`
- Após confirmação, cria múltiplos cards usando `KanbanService.createCard()`

## Ficheiros a Criar/Modificar

| Ficheiro | Ação | Descrição |
|----------|------|-----------|
| `supabase/functions/generate-tasks-from-text/index.ts` | Criar | Edge function para processar texto com AI |
| `src/components/kanban/AiTaskGeneratorDialog.tsx` | Criar | Dialog com textarea e preview de tarefas |
| `src/components/kanban/KanbanCardModal.tsx` | Modificar | Adicionar botão AI no header |

## Detalhes de Implementação

### Edge Function

```typescript
// Usar Lovable AI com tool calling para output estruturado
const body = {
  model: "google/gemini-3-flash-preview",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText }
  ],
  tools: [{
    type: "function",
    function: {
      name: "extract_tasks",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", maxLength: 80 },
                description: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] }
              }
            }
          }
        }
      }
    }
  }],
  tool_choice: { type: "function", function: { name: "extract_tasks" } }
};
```

### Componente Dialog

- Checkbox para cada tarefa extraída (todas selecionadas por default)
- Dropdown para escolher a lista destino (default: lista atual do card)
- Loading spinner durante processamento
- Tratamento de erros (rate limit, falhas de rede)

### Criação de Cards

Após confirmação, para cada tarefa selecionada:
```typescript
await KanbanService.createCard({
  title: task.title,
  description: task.description,
  priority: task.priority,
  list_id: selectedListId,
  position: nextPosition++
});
```

## Considerações

- **Rate Limits**: Mostrar toast se API retornar 429
- **Validação**: Mínimo 50 caracteres no texto input
- **UX**: Botão desabilitado se não houver texto
- **Posicionamento**: Novos cards adicionados no final da lista

## Resultado Esperado

O utilizador pode:
1. Abrir qualquer card no Kanban
2. Clicar no botão "AI"
3. Colar um relatório/email extenso
4. A IA extrai automaticamente 3-10 tarefas principais
5. O utilizador revê e confirma
6. Os cards são criados instantaneamente no board
