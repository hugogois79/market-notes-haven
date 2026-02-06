
# Plano: Funcionalidade "Pagar Banco" - Pagamento Direto via n8n

## Resumo

Implementar um sistema que permite iniciar um pagamento bancario direto (transferencia SEPA via Wise) a partir de um documento no WorkFlow. O utilizador seleciona "Pagar Banco" no dropdown, preenche/confirma os dados do beneficiario e o sistema chama um webhook n8n que cria a instrucao de pagamento no banco.

## Arquitetura da Solucao

```text
+------------------+     +--------------------+     +------------------+
|   Frontend       |     |   Edge Function    |     |     n8n          |
|   Dialog         | --> |   bank-payment     | --> |  Webhook         |
|   "Pagar Banco"  |     |   -webhook         |     |  --> Wise API    |
+------------------+     +--------------------+     +------------------+
```

## Ficheiros a Criar

### 1. `src/components/companies/BankPaymentDialog.tsx`

Dialogo modal com formulario para pagamento direto:

**Campos do formulario:**
- **Beneficiario** - Input texto, pre-preenchido com `vendor_name` do documento (OCR)
- **IBAN do Beneficiario** - Input texto obrigatorio (campo novo a preencher pelo utilizador)
- **Montante** - Input numerico, pre-preenchido com `total_amount` do documento (OCR)
- **Conta de Origem** - Select das `bank_accounts` ativas (usa `account_number` como IBAN)
- **Referencia** - Input texto, pre-preenchido com nome do documento
- **Data de Execucao** - Input date, default: hoje

**Props do componente:**
```typescript
interface BankPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentUrl: string;
  fileName: string;
  vendorName?: string | null;
  totalAmount?: number | null;
}
```

**Estados visuais:**
- Formulario normal
- "A enviar pagamento..." enquanto processa
- Mensagem de sucesso com detalhes
- Mensagem de erro com opcao de tentar novamente

---

### 2. `src/hooks/useBankPayment.ts`

Hook para gerir o estado e chamada da Edge Function:

```typescript
interface BankPaymentRequest {
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: number;
  currency: string;  // Default: EUR
  sourceAccountId: string;
  reference: string;
  executionDate: string;
  documentId: string;
  documentUrl: string;
}

interface BankPaymentResponse {
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
  message?: string;
}
```

**Funcionalidades:**
- Estado `isSending` para loading
- Estado `result` com resposta do n8n
- Estado `error` para mensagens de erro
- Funcao `sendPayment(data: BankPaymentRequest)`
- Funcao `reset()` para limpar estados

---

### 3. `supabase/functions/bank-payment-webhook/index.ts`

Edge Function que:
1. Recebe dados do frontend (beneficiario, IBAN, montante, conta origem, etc.)
2. Busca detalhes da conta de origem na tabela `bank_accounts` (account_name, account_number como IBAN)
3. Chama o webhook n8n via secret `N8N_BANK_PAYMENT_WEBHOOK`
4. Retorna resultado ao frontend

**Payload enviado ao n8n:**
```json
{
  "beneficiaryName": "Eva Delgado Psicologia",
  "beneficiaryIban": "PT50000000000000000000",
  "amount": 1500.00,
  "currency": "EUR",
  "reference": "RECIBO DE PAGAMENTO No 151",
  "documentId": "uuid-do-documento",
  "sourceAccount": {
    "id": "uuid",
    "name": "Conta CGD",
    "iban": "PT50003504290069921743060"
  }
}
```

---

## Ficheiros a Modificar

### 1. `src/pages/companies/WorkFlowTab.tsx`

**Alteracoes:**
- Adicionar state: `const [showBankPaymentDialog, setShowBankPaymentDialog] = useState(false);`
- Alterar o DropdownMenuItem "Pagar Banco" (linha ~3830) para: `onClick={() => setShowBankPaymentDialog(true)}`
- Renderizar `<BankPaymentDialog>` junto aos outros dialogos (apos linha 4224)

---

### 2. `supabase/config.toml`

Adicionar configuracao da nova edge function:

```toml
[functions.bank-payment-webhook]
verify_jwt = false
```

---

## Dependencias

Nenhuma dependencia nova a instalar.

---

## Secrets Supabase

**A adicionar pelo utilizador:**
- `N8N_BANK_PAYMENT_WEBHOOK`: `https://n8n.gvvcapital.com/webhook/wise-payment`

---

## Fluxo de Utilizacao

1. Utilizador visualiza documento no WorkFlow
2. Clica no dropdown "Pagamento" > "Pagar Banco"
3. Dialogo abre pre-preenchido com dados OCR (vendor_name, total_amount)
4. Utilizador preenche IBAN do beneficiario
5. Utilizador seleciona conta de origem (IBAN exibido a partir de `account_number`)
6. Clica "Enviar Pagamento"
7. Sistema chama Edge Function > n8n > Wise API
8. Feedback de sucesso ou erro apresentado
9. Dialogo fecha apos sucesso

---

## Secao Tecnica

### Query para Contas Bancarias

```typescript
const { data: bankAccounts } = useQuery({
  queryKey: ["bank-accounts-for-payment"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("id, account_name, account_number, company:companies(id, name)")
      .eq("is_active", true)
      .order("account_name");
    if (error) throw error;
    return data;
  },
});
```

### Estrutura do Select de Contas

Cada opcao mostra:
- Nome da empresa (company.name)
- Nome da conta (account_name)
- IBAN formatado (account_number)

### Validacao Frontend

- Beneficiario: obrigatorio, min 2 caracteres
- IBAN: obrigatorio, formato valido (regex PT50...)
- Montante: obrigatorio, maior que 0
- Conta de origem: obrigatorio
- Referencia: obrigatorio

### Consideracoes de Seguranca

- Edge Function nao expoe o secret do webhook n8n
- Autenticacao opcional (verify_jwt = false para simplicidade inicial)
- Logs detalhados para debugging
