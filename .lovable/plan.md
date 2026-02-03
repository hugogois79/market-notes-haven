
## Plano: Corrigir Race Condition dos Boards no Command Palette

### Problema Identificado
Quando o utilizador entra no sistema pela primeira vez e abre o `Ctrl+K`, os boards não aparecem na pesquisa. Isto acontece porque:

1. O `CommandPalette` usa `useFeatureAccess()` para verificar permissões
2. Durante o carregamento inicial, `permissionsLoading = true` e `canViewBoards = false`
3. O preload dos boards (linhas 93-100) tem uma condição que faz early return quando `boards.length > 0`
4. Quando as permissões ficam prontas, o `useEffect` não re-executa correctamente porque a dependência `boards.length` impede o refetch

### Solução
Modificar a lógica de preload para:
1. Remover a verificação prematura de `boards.length > 0` que bloqueia o refetch
2. Garantir que o fetch é executado quando as permissões mudam de "a carregar" para "pronto"
3. Adicionar um estado para controlar se já foi feito o fetch inicial

### Alterações Técnicas

**Ficheiro: `src/components/CommandPalette.tsx`**

```typescript
// Adicionar estado para tracking do fetch inicial
const [hasLoadedBoards, setHasLoadedBoards] = useState(false);

// Modificar o useEffect de preload (linhas 92-100)
useEffect(() => {
  if (!open) return;
  if (permissionsLoading) return; // Esperar pelas permissões
  if (!canViewBoards) return;
  if (hasLoadedBoards) return; // Evitar refetch desnecessário
  
  loadBoardsData();
  setHasLoadedBoards(true);
}, [open, canViewBoards, permissionsLoading, hasLoadedBoards]);

// Reset do estado quando o diálogo fecha
useEffect(() => {
  if (!open) {
    setViewMode('main');
    setSearchValue('');
    // NÃO resetar hasLoadedBoards aqui para manter cache
  }
}, [open]);
```

### Lógica do Fix
| Estado | Antes | Depois |
|--------|-------|--------|
| Permissões a carregar | Ignora fetch (correto) | Ignora fetch (correto) |
| Permissões prontas, sem boards | Faz fetch | Faz fetch |
| Permissões prontas, com boards | Ignora (problema!) | Ignora (correto, já tem dados) |
| Abre Ctrl+K antes de permissões | Não carrega | Espera e carrega depois |

### Ficheiros a Modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/components/CommandPalette.tsx` | Substituir lógica `boards.length > 0` por estado `hasLoadedBoards` |

### Resultado Esperado
Quando o utilizador faz login e abre o `Ctrl+K`:
1. Se as permissões ainda estão a carregar, mostra "A carregar boards..."
2. Assim que as permissões ficam prontas, os boards são carregados automaticamente
3. A pesquisa por boards funciona imediatamente
