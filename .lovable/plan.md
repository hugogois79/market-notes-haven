
# Plano: Restringir Seleção de Requisitante para Utilizadores Não-Admin

## Contexto

Atualmente, todos os utilizadores podem selecionar qualquer pessoa como "Requisitante" ao criar uma nova requisição de despesas. Isto não faz sentido do ponto de vista de negócio - utilizadores normais devem apenas poder criar requisições para si próprios.

## Lógica de Negócio

```text
┌─────────────────────────────────────────────────────────────┐
│ Comportamento do Campo "Requisitante"                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ SE utilizador É admin:                                      │
│   → Mostrar dropdown com TODOS os requisitantes             │
│   → Permitir seleção livre                                  │
│                                                             │
│ SE utilizador NÃO É admin:                                  │
│   → Mostrar APENAS o próprio utilizador                     │
│   → Pré-selecionar automaticamente                          │
│   → Campo desabilitado (readonly visual)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Alterações Técnicas

### Ficheiro: `src/pages/expenses/new.tsx`

**1. Importar hooks necessários:**
```typescript
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAuth } from "@/contexts/AuthContext";
```

**2. Dentro do componente, adicionar:**
```typescript
const { isAdmin } = useFeatureAccess();
const { user } = useAuth();
```

**3. Criar query para obter o expense_user do utilizador atual:**
```typescript
// Get current user's expense record
const { data: currentUserExpenseRecord } = useQuery({
  queryKey: ["current-expense-user", user?.id],
  queryFn: () => expenseUserService.getCurrentUserExpenseRecord(),
  enabled: !!user && !isAdmin,
});
```

**4. Usar useEffect para pré-selecionar automaticamente para não-admins:**
```typescript
// Auto-select requester for non-admin users
useEffect(() => {
  if (!isAdmin && currentUserExpenseRecord?.id && !requesterId) {
    setRequesterId(currentUserExpenseRecord.id);
  }
}, [isAdmin, currentUserExpenseRecord, requesterId]);
```

**5. Modificar a renderização do campo Requisitante:**

Para não-admins, mostrar o nome como texto readonly em vez do dropdown:

```typescript
<div>
  <Label htmlFor="requester">Requisitante *</Label>
  {isAdmin ? (
    // Admins veem dropdown completo
    <Select value={requesterId} onValueChange={setRequesterId}>
      <SelectTrigger className="mt-2">
        <SelectValue placeholder="Selecione o requisitante" />
      </SelectTrigger>
      <SelectContent>
        {expenseRequesters?.map((requester) => (
          <SelectItem key={requester.id} value={requester.id}>
            {requester.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    // Não-admins veem apenas o seu nome (readonly)
    <Input
      value={currentUserExpenseRecord?.name || "Carregando..."}
      disabled
      className="mt-2 bg-muted"
    />
  )}
</div>
```

## Comportamento Esperado

| Tipo de Utilizador | Antes | Depois |
|-------------------|-------|--------|
| **Admin** | Dropdown com todos | Dropdown com todos (sem alteração) |
| **Não-Admin** | Dropdown com todos | Campo readonly com o seu próprio nome |

## Casos Edge Considerados

1. **Utilizador sem registo expense_user**: Se o utilizador logado não tiver um registo na tabela expense_users, mostrará "Carregando..." e não conseguirá submeter (validação existente já trata isto)

2. **Loading state**: Enquanto carrega o registo do utilizador, o campo mostra "Carregando..."

3. **Consistência com edição**: A mesma lógica deve ser aplicada na página de edição (`edit.tsx`) se existir
