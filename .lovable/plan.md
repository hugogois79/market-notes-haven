

## Plano: Corrigir Visualização de Category, Project e Value na Lista WorkFlow

### Problema Identificado

Após análise detalhada do código e dados:

1. **Os dados estão guardados corretamente** - Confirmado via SQL que `workflow_files` tem `project_id`, `company_id`, e `total_amount`
2. **Os dados de `financial_transactions` também existem** - A transação tem `project_id` e `total_amount` corretos
3. **O problema está na forma como a UI os mostra**:
   - A coluna "Project" e "Value" usam `getTxForFile()` que depende de `linkedTransactions`
   - A interface `WorkflowFile` não inclui `project_id` 
   - A query principal não faz join com `expense_projects`

### Causa Raiz

A UI tem duas fontes de dados:
- `workflow_files` (dados OCR/draft)
- `financial_transactions` (dados finalizados via `getTxForFile()`)

Quando o utilizador grava via "Editar Movimento", os dados vão para **ambas** as tabelas, mas a lista só mostra dados de `financial_transactions` para Project/Value. Se a query `linkedTransactions` não estiver sincronizada (cache de 2 minutos), a UI mostra "—".

### Solucao

**1. Atualizar a interface `WorkflowFile`** para incluir os campos em falta:

```typescript
interface WorkflowFile {
  // ... campos existentes ...
  project_id?: string | null;          // Adicionar
  expense_projects?: { id: string; name: string } | null;  // Adicionar para join
  category_id?: string | null;         // Adicionar (futuro)
}
```

**2. Atualizar a query principal** de `workflow_files` para incluir join com `expense_projects`:

```typescript
.select(`
  *,
  companies:company_id (id, name),
  expense_projects:project_id (id, name)
`)
```

**3. Modificar as colunas "Project" e "Value"** para usar dados directos do `workflow_files` como fallback:

Na coluna "Project" (linha 3320-3380):
```typescript
{isColumnVisible("project") && (
  <td className="px-3 py-1.5">
    {(() => {
      const tx = getTxForFile(file);
      const projectName = tx?.projectName || file.expense_projects?.name;
      // ... resto da lógica usando projectName
    })()}
  </td>
)}
```

Na coluna "Value" (linha 3382-3434):
```typescript
{isColumnVisible("value") && (
  <td className="px-3 py-1.5 text-right">
    {(() => {
      const tx = getTxForFile(file);
      const value = tx?.value ?? file.total_amount;
      // ... mostrar value se existir
    })()}
  </td>
)}
```

**4. Invalidar queries após save** - Já está implementado (linha 723-725), mas adicionar `refetchInterval: false` para garantir refresh imediato.

### Ficheiros a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/companies/WorkFlowTab.tsx` | Interface `WorkflowFile`, query principal, colunas Project/Value |

### Lógica de Prioridade de Dados

```text
Para Empresa: file.companies?.name > getTxForFile()?.companyName (já implementado)
Para Project: getTxForFile()?.projectName > file.expense_projects?.name (adicionar fallback)
Para Value:   getTxForFile()?.value > file.total_amount (adicionar fallback)
```

### Sequência de Implementação

1. Atualizar interface `WorkflowFile` com campos `project_id` e `expense_projects`
2. Modificar query principal para incluir join com `expense_projects`
3. Modificar coluna "Project" para usar fallback do `workflow_files`
4. Modificar coluna "Value" para usar fallback do `workflow_files`
5. Testar que dados aparecem imediatamente após guardar

### Benefícios

- Dados aparecem imediatamente após "Atualizar" (sem esperar refresh de 2min)
- Consistência entre formulário e lista
- Funciona mesmo se `financial_transactions` ainda não existir (modo draft)

