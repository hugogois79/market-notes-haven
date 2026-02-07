
## Plano: Implementar Dropdown Pesquisável para "Conta de Origem"

### Contexto Atual
O campo "Conta de Origem" no diálogo `BankPaymentDialog` utiliza um componente `Select` simples (Radix UI) que lista todas as contas bancárias. A imagem fornecida mostra que:
- A lista pode ter muitas contas (6+ contas visíveis)
- Cada item mostra: `[Empresa] - [Nome da Conta]` e o IBAN
- Não existe filtro/pesquisa para encontrar contas rapidamente

### Solução Proposta
Substituir o componente `Select` padrão pelo componente `SearchableSelect` já existente no projeto (`src/components/ui/searchable-select.tsx`). Este componente oferece:
- Dropdown com campo de pesquisa integrado (`CommandInput`)
- Filtragem em tempo real enquanto o utilizador escreve
- Interface mais compacta e eficiente para listas longas
- Identidade visual consistente com o resto do projeto

### Arquitetura da Solução

#### 1. Transformar Dados das Contas
O `SearchableSelect` espera um array de `SearchableSelectOption` com:
```typescript
interface SearchableSelectOption {
  value: string;      // ID da conta
  label: string;      // Texto a exibir e pesquisar
}
```

**Estratégia de Label**:
- Formato: `[Empresa] - [Conta] (IBAN)`
- Exemplo: `Splendidoption Lda - BCP (PT50 0033 0000 4554 6327 2060)`
- Permite pesquisar por: nome da empresa, nome da conta, ou IBAN

**Implementação**:
```typescript
const bankAccountOptions = bankAccounts?.map((account) => ({
  value: account.id,
  label: `${account.company?.name} - ${account.account_name} (${formatIban(account.account_number)})`,
})) || [];
```

#### 2. Atualizar Imports
Remover imports `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (não serão mais necessários).

Adicionar import do `SearchableSelect`:
```typescript
import { SearchableSelect } from "@/components/ui/searchable-select";
```

#### 3. Substituir Componente (Linhas 437-455)
Substituir o bloco `<Select>...</Select>` pelo `<SearchableSelect>`:
```typescript
<SearchableSelect
  value={sourceAccountId}
  onValueChange={setSourceAccountId}
  options={bankAccountOptions}
  placeholder="Selecione uma conta"
  searchPlaceholder="Pesquisar por empresa, conta ou IBAN..."
  emptyMessage="Nenhuma conta encontrada"
  disabled={isLoadingAccounts}
/>
```

#### 4. Manter Informação Adicional (Linhas 456-460)
Preservar a exibição do IBAN da conta selecionada abaixo do dropdown:
```typescript
{selectedAccount && (
  <p className="text-xs text-muted-foreground">
    IBAN: {formatIban(selectedAccount.account_number)}
  </p>
)}
```

### Ficheiros a Modificar

| Ficheiro | Secção | Alteração |
|----------|--------|-----------|
| `src/components/companies/BankPaymentDialog.tsx` | **Imports (linhas 15-21)** | Remover imports de `Select` e relacionados |
| `src/components/companies/BankPaymentDialog.tsx` | **Imports (linha 38)** | Adicionar `import { SearchableSelect }` |
| `src/components/companies/BankPaymentDialog.tsx` | **Dentro do render, acima da secção de formulário** | Adicionar lógica para construir `bankAccountOptions` |
| `src/components/companies/BankPaymentDialog.tsx` | **Linhas 437-455** | Substituir bloco `<Select>` por `<SearchableSelect>` |

### Benefícios
1. **Experiência de Utilizador**: Pesquisa rápida mesmo com muitas contas
2. **Consistência**: Reutiliza padrão já implementado no projeto
3. **Manutenibilidade**: Menos código e lógica centralizada
4. **Responsividade**: O `SearchableSelect` funciona bem em desktop e mobile

### Sequência de Implementação
1. Criar lógica para transformar `bankAccounts` em `bankAccountOptions`
2. Adicionar import do `SearchableSelect`
3. Remover imports do `Select` (só se não forem usados em outros componentes)
4. Substituir o JSX do `<Select>` pelo `<SearchableSelect>`
5. Testar a filtragem e seleção

### Considerações Técnicas
- O `SearchableSelect` usa `Popover` + `Command` internamente (mesmo padrão já usado no campo "Beneficiário")
- O `disabled` será baseado em `isLoadingAccounts` 
- A renderização do account selecionado abaixo permanece funcional
