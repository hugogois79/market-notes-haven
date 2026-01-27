
# Plano: Corrigir Notas Que Não Aparecem Após Login

## Problema Identificado

Após o login, o dashboard mostra "No Notes Yet" (sem notas), mas após um refresh manual da página, as notas aparecem corretamente.

### Causa Raiz

O `NotesProvider` executa a query de notas **imediatamente** quando o componente monta, sem esperar que a autenticação esteja completa:

```text
Timeline do Problema:
┌────────────────────────────────────────────────────────────┐
│ 1. Utilizador faz login                                    │
│    ↓                                                       │
│ 2. Auth event é disparado, mas user ainda não está pronto  │
│    ↓                                                       │
│ 3. NotesProvider monta e executa useQuery IMEDIATAMENTE    │
│    ↓                                                       │
│ 4. Query fetch notas SEM auth.uid() válido                 │
│    ↓                                                       │
│ 5. RLS Policy bloqueia acesso → retorna [] (vazio)         │
│    ↓                                                       │
│ 6. React Query guarda [] em cache                          │
│    ↓                                                       │
│ 7. Dashboard mostra "No Notes Yet"                         │
│    ↓                                                       │
│ 8. Refresh: auth já está ok → notas aparecem               │
└────────────────────────────────────────────────────────────┘
```

### Evidência

A tabela `notes` tem RLS que requer autenticação:
- Policy `SELECT`: `auth.uid() = user_id`
- Sem user autenticado, a query retorna sempre vazio

Outros componentes no projeto (ex: `companies/index.tsx`, `real-estate/index.tsx`) já usam o padrão correto:
```typescript
enabled: !authLoading && !!user
```

## Solução

Modificar o `NotesProvider` para aguardar a autenticação antes de executar a query.

## Alterações Técnicas

### Ficheiro: `src/contexts/NotesContext.tsx`

**Alteração 1 - Importar hook de autenticação:**
```typescript
import { useAuth } from "@/contexts/AuthContext";
```

**Alteração 2 - Usar o estado de autenticação:**
```typescript
export const NotesProvider = ({ children }: NotesProviderProps) => {
  const { user, loading: authLoading } = useAuth();  // NOVO
  const queryClient = useQueryClient();
  
  const { data: notesData, isLoading, refetch } = useQuery({
    queryKey: ['notes', user?.id],  // Incluir user.id na queryKey
    queryFn: fetchNotes,
    staleTime: 30 * 1000,
    enabled: !authLoading && !!user,  // NOVO - só executar após auth
  });
  // ...
};
```

**Resumo das mudanças:**
1. Adicionar `enabled: !authLoading && !!user` à query
2. Incluir `user?.id` na `queryKey` para garantir refetch quando o utilizador muda
3. Usar o hook `useAuth()` para aceder ao estado de autenticação

## Resultado Esperado

Após esta alteração:
1. A query de notas só executa quando o utilizador está autenticado
2. As notas aparecem imediatamente após o login, sem necessidade de refresh
3. A cache é invalidada automaticamente quando o utilizador muda (login/logout)
