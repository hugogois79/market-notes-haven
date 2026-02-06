
# Plano: Otimizar BankPaymentDialog com Autocomplete Wise Recipients

## Visão Geral
Transformar o campo "Beneficiário" num combobox inteligente que:
- Pesquisa em tempo real na tabela `wise_recipients` do Supabase
- Auto-preenche o IBAN quando um recipient é selecionado
- Permite entrada manual de novos beneficiários não registados no Wise
- Faz match fuzzy com `vendorName` ao abrir o diálogo

## Mudanças Necessárias

### 1. Atualizar `useBankPayment.ts`
**Ficheiro**: `src/hooks/useBankPayment.ts`

Adicionar campo `recipientId` à interface `BankPaymentRequest`:

```typescript
export interface BankPaymentRequest {
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: number;
  currency: string;
  sourceAccountId: string;
  reference: string;
  executionDate: string;
  documentId: string;
  documentUrl: string;
  recipientId?: number | null; // NOVO: ID do recipient no Wise
}
```

### 2. Recriar `BankPaymentDialog.tsx`
**Ficheiro**: `src/components/companies/BankPaymentDialog.tsx`

**Mudanças principais**:

#### 2.1 Imports adicionais
Adicionar imports para Popover e Command (já existem no projeto):
```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CheckIcon } from "lucide-react";
```

#### 2.2 Estados adicionais
Adicionar states para o autocomplete:
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
const [popoverOpen, setPopoverOpen] = useState(false);
```

#### 2.3 Query para Wise Recipients
Implementar query com debounce:
```typescript
const { data: wiseRecipients, isLoading: isLoadingRecipients } = useQuery({
  queryKey: ["wise-recipients", searchTerm],
  queryFn: async () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const { data, error } = await supabase
      .from("wise_recipients")
      .select("wise_recipient_id, name, iban")
      .eq("is_active", true)
      .ilike("name", `%${searchTerm}%`)
      .limit(10);
    if (error) throw error;
    return data;
  },
  enabled: !!searchTerm && searchTerm.length >= 2,
});
```

#### 2.4 Função de Match Fuzzy para Pre-fill
Ao abrir o diálogo com `vendorName`, fazer query inicial para encontrar match:
```typescript
// Query adicional para match fuzzy ao abrir
const { data: initialMatch } = useQuery({
  queryKey: ["wise-recipients-initial", vendorName],
  queryFn: async () => {
    if (!vendorName || vendorName.length < 2) return null;
    const { data, error } = await supabase
      .from("wise_recipients")
      .select("wise_recipient_id, name, iban")
      .eq("is_active", true)
      .ilike("name", `%${vendorName}%`)
      .limit(5);
    if (error) throw error;
    return data?.[0] || null; // Retorna primeiro match
  },
  enabled: open && !hasInitialized.current && !!vendorName,
});
```

#### 2.5 Atualizar useEffect de Pre-fill
```typescript
useEffect(() => {
  if (open && !hasInitialized.current) {
    setBeneficiaryName(vendorName || "");
    setAmount(totalAmount?.toString() || "");
    setReference(fileName || "");
    setExecutionDate(format(new Date(), "yyyy-MM-dd"));
    setSourceAccountId("");
    setSearchTerm(vendorName || "");
    setSelectedRecipientId(null);
    setBeneficiaryIban("");
    
    // Se encontrou match no Wise, auto-preencher
    if (initialMatch) {
      setSelectedRecipientId(initialMatch.wise_recipient_id);
      setBeneficiaryIban(initialMatch.iban);
    }
    
    reset();
    hasInitialized.current = true;
  } else if (!open) {
    hasInitialized.current = false;
    setSearchTerm("");
    setPopoverOpen(false);
  }
}, [open, vendorName, totalAmount, fileName, reset, initialMatch]);
```

#### 2.6 Handlers para o Autocomplete
```typescript
const handleSelectRecipient = (recipient: {
  wise_recipient_id: number;
  name: string;
  iban: string;
}) => {
  setBeneficiaryName(recipient.name);
  setBeneficiaryIban(recipient.iban);
  setSelectedRecipientId(recipient.wise_recipient_id);
  setSearchTerm(recipient.name);
  setPopoverOpen(false);
};

const handleBeneficiaryChange = (value: string) => {
  setBeneficiaryName(value);
  setSearchTerm(value);
  setSelectedRecipientId(null); // Limpar selection ao editar manualmente
};
```

#### 2.7 Atualizar validação e handleSubmit
Na validação, fazer IBAN obrigatório apenas se não houver `recipientId`:
```typescript
const handleSubmit = async () => {
  if (!beneficiaryName.trim() || beneficiaryName.length < 2) {
    toast.error("Preencha o nome do beneficiário (mínimo 2 caracteres)");
    return;
  }
  
  // IBAN obrigatório apenas se não houver recipientId
  if (!selectedRecipientId && !beneficiaryIban.trim()) {
    toast.error("Preencha o IBAN do beneficiário");
    return;
  }
  
  // resto da validação...
  
  const response = await sendPayment({
    beneficiaryName: beneficiaryName.trim(),
    beneficiaryIban: beneficiaryIban.trim().replace(/\s/g, ""),
    amount: amountNum,
    currency: "EUR",
    sourceAccountId,
    reference: reference.trim(),
    executionDate,
    documentId,
    documentUrl,
    recipientId: selectedRecipientId, // NOVO
  });
};
```

#### 2.8 UI do Campo Beneficiário
Substituir o `Input` simples por um `Popover` com `Command`:
```tsx
<div className="space-y-2">
  <Label htmlFor="beneficiaryName">Beneficiário *</Label>
  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
    <PopoverTrigger asChild>
      <input
        id="beneficiaryName"
        type="text"
        autoComplete="off"
        value={beneficiaryName}
        onChange={(e) => handleBeneficiaryChange(e.target.value)}
        onFocus={() => setPopoverOpen(true)}
        placeholder="Nome do beneficiário"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </PopoverTrigger>
    {searchTerm.length >= 2 && (
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Pesquisar beneficiário..."
          />
          <CommandList>
            {isLoadingRecipients && (
              <CommandEmpty>A carregar...</CommandEmpty>
            )}
            {!isLoadingRecipients && wiseRecipients?.length === 0 && (
              <CommandEmpty>Sem resultados</CommandEmpty>
            )}
            {wiseRecipients && wiseRecipients.length > 0 && (
              <CommandGroup>
                {wiseRecipients.map((recipient) => (
                  <CommandItem
                    key={recipient.wise_recipient_id}
                    onSelect={() => handleSelectRecipient(recipient)}
                    className="cursor-pointer"
                  >
                    <CheckIcon
                      className="mr-2 h-4 w-4"
                      style={{
                        opacity: selectedRecipientId === recipient.wise_recipient_id ? 1 : 0,
                      }}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{recipient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatIban(recipient.iban)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    )}
  </Popover>
  {selectedRecipientId && (
    <p className="text-xs text-green-600">
      ✓ Recipient Wise confirmado
    </p>
  )}
</div>
```

## Arquitectura de Dados

```
wise_recipients (Supabase)
├── wise_recipient_id (BIGINT) - PK, do Wise
├── name (TEXT) - com índice trigram
├── iban (TEXT)
├── currency (TEXT)
├── account_type (TEXT)
├── legal_type (TEXT)
└── is_active (BOOLEAN)

BankPaymentDialog
├── searchTerm (string) - input do utilizador
├── selectedRecipientId (number | null)
├── beneficiaryName (string) - editável
├── beneficiaryIban (string) - editável, auto-fill se selecionado
└── popoverOpen (boolean)
```

## Fluxo de Utilizador

1. **Diálogo abre** com `vendorName` (ex: "Eva Delgado Martins")
2. **Match fuzzy automático**: Query procura na `wise_recipients` com o `vendorName`
3. **Se encontrado**: Auto-preenche nome, IBAN e seta `selectedRecipientId`
4. **Se não encontrado**: Deixa campo editável para entrada manual
5. **Utilizador digita**: Conforme escreve, aparecem sugestões da tabela
6. **Seleciona sugestão**: Auto-preenche nome e IBAN, seta `recipientId`
7. **Envia com recipientId**: Edge function usa `recipientId` para evitar duplicados no Wise

## Validação de IBAN

- **Com recipientId selecionado**: IBAN é opcional (Wise já tem os dados do recipient)
- **Sem recipientId**: IBAN é obrigatório (novo beneficiário)
- **IBAN permanece editável** em ambos os casos

## Ficheiros a Modificar

1. **`src/hooks/useBankPayment.ts`** - Adicionar `recipientId?` ao `BankPaymentRequest`
2. **`src/components/companies/BankPaymentDialog.tsx`** - Recriar com lógica completa de autocomplete

## Secção Técnica

### Query Supabase com Trigram Index
A tabela `wise_recipients` já tem index trigram no `name`:
```sql
CREATE INDEX idx_wise_recipients_name_trigram ON wise_recipients USING gin (name gin_trgm_ops);
```

Isto permite pesquisa case-insensitive rápida com `ILIKE '%termo%'`

### Debounce
Implementar debounce na pesquisa é recomendado, mas como a query já tem `enabled: !!searchTerm && searchTerm.length >= 2`, o tanstack/react-query fará debounce automático (aguarda 1000ms por padrão).

Se precisa de debounce mais agressivo, usar um `useState` separado com `useEffect` e `setTimeout`.

## Possíveis Edge Cases

1. **Utilizador seleciona recipient, depois edita nome manualmente**: O `recipientId` fica null (correto)
2. **Recipient com mesmo nome pode existir múltiplas vezes**: UI mostra o IBAN para desambiguação
3. **Wise API adiciona novo recipient**: Sync automática de 6h via n8n atualiza a tabela
4. **IBAN inválido**: Validação fica na Edge Function / Wise API

## Performance

- Query só dispara quando `searchTerm.length >= 2`
- Trigram index garante pesquisa O(log n)
- Popover só renderiza quando `popoverOpen === true`
- Initial match query desativa após primeira renderização (`!hasInitialized.current`)

