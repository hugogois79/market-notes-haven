

# Plano: Assistente AI Kanban no Botao Flutuante

## Resumo

Quando o utilizador esta numa pagina de **boards Kanban** (`/kanban` sem ID de board ou na lista de boards), o botao flutuante preto no canto inferior direito muda de comportamento: em vez de fazer perguntas sobre notas, permite colar texto e gerar automaticamente **boards**, **listas** e **cards**.

## O que muda para o utilizador

1. **Botao flutuante muda de cor** quando esta na pagina de boards (gradiente azul/indigo)
2. **Icone diferente** (Layout/Grid em vez de Sparkles)
3. **Ao clicar**, abre um painel lateral com:
   - Caixa de texto grande para colar conteudo (relatorios, emails, etc.)
   - Botao "Gerar Estrutura" que envia para a AI
   - Preview dos itens extraidos com checkboxes
   - Botao para criar os itens selecionados

## Fluxo de utilizacao

```text
1. Utilizador navega para /kanban (lista de boards)
2. Clica no botao flutuante (agora azul)
3. Cola um texto longo (ex: relatorio de projeto)
4. Clica "Gerar Estrutura"
5. AI extrai:
   - Boards (projetos distintos)
   - Listas (fases/categorias)
   - Cards (tarefas individuais)
6. Utilizador seleciona quais criar
7. Clica "Criar Selecionados"
8. Itens sao criados na base de dados
```

## Detalhes Tecnicos

### 1. Modificar AIAssistant.tsx

Adicionar detecao da rota Kanban boards:

```typescript
// Detecao de contexto
const isCalendarPage = location.pathname === '/calendar';
const isKanbanBoardsPage = location.pathname === '/kanban';  // NOVO
```

Adicionar estados para modo Kanban:

```typescript
// Estados para modo Kanban
const [kanbanInputText, setKanbanInputText] = useState('');
const [kanbanExtractedItems, setKanbanExtractedItems] = useState<ExtractedKanbanItems | null>(null);
const [kanbanStep, setKanbanStep] = useState<'input' | 'results'>('input');
```

Renderizar UI diferente quando `isKanbanBoardsPage`:
- Textarea para input de texto
- Lista de resultados com checkboxes agrupados por tipo
- Botoes de acao

### 2. Criar Edge Function: generate-kanban-structure

Nova funcao baseada na `generate-tasks-from-text` mas com schema expandido:

**Prompt:**
```
Analisa o texto e extrai estruturas para um sistema Kanban:
- Boards: projetos ou contextos distintos
- Listas: fases, categorias ou estados
- Cards: tarefas individuais acionaveis

Cada board pode ter listas associadas.
Cada lista pode ter cards associados.
```

**Tool Call Schema:**
```typescript
{
  type: "function",
  function: {
    name: "extract_kanban_structure",
    parameters: {
      type: "object",
      properties: {
        boards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              color: { type: "string", enum: ["blue", "green", "purple", "orange", "red"] }
            }
          }
        },
        lists: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              boardRef: { type: "number", description: "Index do board associado (0-based), ou null se for lista geral" }
            }
          }
        },
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              listRef: { type: "number", description: "Index da lista associada (0-based), ou null" }
            }
          }
        }
      }
    }
  }
}
```

### 3. Logica de Criacao

Quando o utilizador confirma a criacao:

1. **Criar Boards** selecionados usando `KanbanService.createBoard()`
2. **Criar Listas** selecionadas:
   - Se tem `boardRef`, associar ao board recem-criado
   - Se nao, criar num board "Inbox" ou pedir ao utilizador
3. **Criar Cards** selecionados:
   - Se tem `listRef`, associar a lista recem-criada
   - Se nao, criar numa lista default

### 4. Interface Visual

**Estado Inicial (input):**
```
+----------------------------------+
|  Assistente AI - Kanban          |
+----------------------------------+
|                                  |
|  [Icone LayoutGrid]              |
|  Cole texto para extrair         |
|  boards, listas e cards          |
|                                  |
|  +----------------------------+  |
|  |  [Textarea grande]         |  |
|  +----------------------------+  |
|                                  |
|  [Gerar Estrutura]               |
+----------------------------------+
```

**Estado Resultados:**
```
+----------------------------------+
|  12 itens encontrados            |
+----------------------------------+
|  BOARDS (2)                      |
|  [x] Projeto Marina              |
|  [x] Manutencao Casa             |
|                                  |
|  LISTAS (4)                      |
|  [x] A Fazer -> Projeto Marina   |
|  [x] Em Progresso -> Proj. Marina|
|  ...                             |
|                                  |
|  CARDS (6)                       |
|  [x] Reparar motor (high)        |
|  [x] Pintura casco (medium)      |
|  ...                             |
+----------------------------------+
|  [Voltar]  [Criar 10 Selecionados]|
+----------------------------------+
```

## Ficheiros a Modificar/Criar

| Ficheiro | Acao | Descricao |
|----------|------|-----------|
| `src/components/AIAssistant.tsx` | Modificar | Adicionar modo Kanban com UI especifica |
| `supabase/functions/generate-kanban-structure/index.ts` | Criar | Nova edge function para extrair estruturas |
| `supabase/config.toml` | Modificar | Adicionar configuracao da nova funcao |

## Notas de Implementacao

- O modo Kanban so ativa na rota `/kanban` (lista de boards), nao dentro de um board especifico (`/kanban/:id`)
- Os boards criados ficam sem space_id (aparecem em "Sem Espaco")
- Cores dos boards sao sugeridas pela AI ou usam default
- A criacao e feita em batch mas sequencialmente para manter referencias

