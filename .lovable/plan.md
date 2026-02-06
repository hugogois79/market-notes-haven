
# Plano: Suportar Estado de Aprovação PSD2/SCA no BankPaymentDialog

## Contexto do Problema
O workflow n8n agora retorna um payload estruturado que indica quando o pagamento requer aprovação manual no Wise (devido a PSD2/SCA). O diálogo atual trata todos os casos `success: true` da mesma forma, mostrando sempre "Pagamento Enviado!" sem distinguir entre:
1. **Sucesso Total**: Transfer foi financiada imediatamente
2. **Aguarda Aprovação**: Transfer criada mas funding requer aprovação manual no Wise (PSD2/SCA)

## Novo Formato de Resposta do n8n
```json
{
  "success": true,
  "message": "Transferencia criada no Wise - aguarda aprovacao",
  "payment": {
    "transferId": 1960279419,
    "status": "incoming_payment_waiting",
    "amount": 0.01,
    "beneficiary": "Eva Silva Delgado Martins",
    "reference": "Test PSD2 fix"
  },
  "funding": {
    "status": "pending_user_approval",
    "message": "Aprove o pagamento na app Wise (requisito PSD2/SCA)."
  }
}
```

## Mudanças Técnicas Necessárias

### 1. Atualizar Interface `BankPaymentResponse`
**Ficheiro**: `src/hooks/useBankPayment.ts`

Expandir a interface para capturar a estrutura completa da resposta n8n:

```typescript
export interface PaymentDetails {
  transferId?: number;
  status?: string;
  amount?: number;
  beneficiary?: string;
  reference?: string;
}

export interface FundingStatus {
  status?: string;
  message?: string;
}

export interface BankPaymentResponse {
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
  message?: string;
  payment?: PaymentDetails;
  funding?: FundingStatus;
}
```

**Razão**: Permite que o frontend aceda aos detalhes completos do pagamento e estado de funding.

### 2. Atualizar UI do BankPaymentDialog
**Ficheiro**: `src/components/companies/BankPaymentDialog.tsx`

Modificar a seção de sucesso (linhas 245-261) para distinguir entre 2 estados:

#### Estado A: Sucesso Total (funding não requer aprovação)
- Mostrar ícone verde `CheckCircle2`
- Título: "Pagamento Enviado!"
- Mensagem: usar `result.message` ou padrão
- Comportamento: fechar diálogo automaticamente após 2 segundos

#### Estado B: Aguarda Aprovação PSD2 (funding.status === 'pending_user_approval')
- Mostrar ícone amarelo `Clock` (novo import de lucide-react)
- Título: "Transferência Criada"
- Subtitle: "Aguarda Aprovação no Wise"
- Mostrar detalhes do pagamento em card:
  - Beneficiário (payment.beneficiary)
  - Montante (payment.amount)
  - Referência (payment.reference)
  - ID da Transfer (payment.transferId)
- Mensagem clara: usar `result.funding.message`
- Comportamento: NÃO fechar automaticamente (utilizador deve confirmar)
- Adicionar botão "Abrir Wise" que abre https://wise.com/user/account em nova aba
- Adicionar botão "Fechar" para sair do diálogo

#### Estado C: Erro (result.error)
- Mantém comportamento atual

### 3. Lógica de Renderização
Substituir a lógica de renderização de sucesso por:

```typescript
const needsApproval = result?.funding?.status === 'pending_user_approval';

// Dentro do render:
{result?.success ? (
  needsApproval ? (
    // Novo: UI para "Aguarda Aprovação"
  ) : (
    // Existente: UI para "Sucesso Total"
  )
) : result?.error ? (
  // Existente: UI para erro
) : (
  // Existente: Formulário
)}
```

## Design da UI para "Aguarda Aprovação"

A UI seguirá este layout:

```text
┌──────────────────────────────────────────┐
│  ⏰ (ícone amarelo/amber de relógio)    │
│                                          │
│  Transferência Criada                    │
│  Aguarda Aprovação no Wise               │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Beneficiário: Eva Silva Martins    │  │
│  │ Montante: €0.01                    │  │
│  │ Referência: Test PSD2 fix          │  │
│  │ ID: 1960279419                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ⚠️ Aprove o pagamento na app Wise      │
│     (requisito PSD2/SCA)                │
│                                          │
│  [ Abrir Wise ]  [ Fechar ]             │
└──────────────────────────────────────────┘
```

### Estilos
- Fundo amarelo/amber subtil para o card de informação
- Ícone Clock em amarelo/amber
- Card de detalhes com borda e padding adequados
- Botão "Abrir Wise" como primary (azul/brand)
- Botão "Fechar" como outline

## Importações Necessárias
Adicionar ao BankPaymentDialog.tsx:
```typescript
import { Clock } from "lucide-react";
```

## Ficheiros a Modificar

| Ficheiro | Linhas | Alteração |
|----------|--------|-----------|
| `src/hooks/useBankPayment.ts` | 17-23 | Expandir interfaces `BankPaymentResponse`, adicionar `PaymentDetails` e `FundingStatus` |
| `src/components/companies/BankPaymentDialog.tsx` | 36 (imports) | Adicionar `Clock` do lucide-react |
| `src/components/companies/BankPaymentDialog.tsx` | 245-261 | Substituir lógica de renderização de sucesso por nova lógica com 2 estados |

## Fluxo de Utilizador Atualizado

1. **Utilizador preenche e submete**: Formulário é preenchido e botão "Enviar Pagamento" é clicado
2. **Edge Function processa**: Edge Function chama n8n
3. **n8n cria Transfer**: Wise cria a transfer mas funding requer aprovação
4. **Resposta com pending_user_approval**: n8n retorna `success: true` com `funding.status: 'pending_user_approval'`
5. **UI mostra estado amarelo**: Diálogo exibe card de informação com detalhes e instruções
6. **Utilizador aprova no Wise**: Clica "Abrir Wise" para ir ao portal/app e aprova
7. **Utilizador confirma**: Clica "Fechar" para sair do diálogo

## Secção Técnica: Considerações

### Responsividade
- O card de detalhes deve ser responsivo e funcionar bem em mobile
- O layout deve adaptar-se a ecrãs pequenos

### Internacionalização
- Todas as mensagens estão em português (consistente com o resto da app)
- `result.funding.message` é recebida do n8n e já está em português

### Validação
- A lógica `needsApproval` é baseada apenas em `result?.funding?.status === 'pending_user_approval'`
- Não requer nenhuma validação adicional pois o estado vem da n8n

### Edge Cases
- Se `payment` data estiver incompleta, mostrar valores vazios em vez de quebrar
- Se `funding` não existir, assumir sucesso total (comportamento padrão)

## Sequência de Implementação

1. **Primeiro**: Atualizar interfaces em `useBankPayment.ts`
2. **Segundo**: Adicionar import `Clock` no BankPaymentDialog
3. **Terceiro**: Substituir renderização de sucesso com nova lógica condicional
4. **Verificação**: Testar ambos os estados (sucesso total vs. aguarda aprovação)

