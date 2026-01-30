
# Plano: Alterar Atalho de Criar Tarefa para Tecla "N"

## Alteração

Substituir **Ctrl+N** por apenas **N** (tecla simples) para criar uma nova tarefa no Kanban.

---

## Ficheiros a Modificar

### 1. `src/hooks/useKanbanShortcuts.ts`

Alterar a deteção de tecla de `Ctrl+N` para apenas `N`:

```typescript
// ANTES:
if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
  e.preventDefault();
  onCreateCard();
  return;
}

// DEPOIS:
if (e.key === 'n' || e.key === 'N') {
  e.preventDefault();
  onCreateCard();
  return;
}
```

Atualizar a documentação de atalhos:

```typescript
// ANTES:
{ keys: ['⌘', 'N'], description: 'Criar nova tarefa' }

// DEPOIS:
{ keys: ['N'], description: 'Criar nova tarefa' }
```

---

### 2. `src/hooks/useKeyboardShortcuts.ts`

Atualizar a documentação global de atalhos:

```typescript
// ANTES:
{ keys: ['⌘', 'N'], description: 'Criar nova tarefa (quando num board)' }

// DEPOIS:
{ keys: ['N'], description: 'Criar nova tarefa (quando num board)' }
```

---

## Resultado

- Premir **N** em qualquer board Kanban abre o campo de criação rápida
- Sem conflitos com atalhos do browser
- Padrão consistente com Trello

