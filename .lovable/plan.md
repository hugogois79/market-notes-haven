

## Adicionar Tooltip Rico ao Badge de Empréstimo

### Objetivo

Expandir o badge "Empréstimo" na tabela do Workflow com um tooltip interativo que mostra os detalhes completos do empréstimo inter-empresas ao passar o mouse.

---

### Alterações a Implementar

**Ficheiro a modificar:** `src/pages/companies/WorkFlowTab.tsx`

#### 1. Adicionar Import do Tooltip

Adicionar os componentes de Tooltip aos imports existentes:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
```

#### 2. Modificar o Badge de Empréstimo (linhas 3147-3155)

Substituir o badge simples por um badge com tooltip rico que mostra:

| Campo | Descrição | Cor |
|-------|-----------|-----|
| Credor | Empresa que empresta | Verde |
| Devedor | Empresa que recebe | Laranja |
| Valor | Montante formatado em EUR | Slate |
| Data | Data de início do empréstimo | Slate |

---

### Resultado Visual

```text
┌──────────────────────────────────────────────────────────────┐
│  📄 Ficheiro.pdf    [Empréstimo] ◄── hover aqui             │
│                          │                                   │
│                          ▼                                   │
│                    ┌─────────────────────────────┐           │
│                    │ 💰 Detalhes do Empréstimo   │           │
│                    │                             │           │
│                    │ 🟢 Credor:                  │           │
│                    │    Sustainable Yield Ltd    │           │
│                    │                             │           │
│                    │ 🟠 Devedor:                 │           │
│                    │    Epicatmosphere Lda       │           │
│                    │                             │           │
│                    │ 💶 Valor: 300,00 €          │           │
│                    │ 📅 Data: 27/01/2026         │           │
│                    └─────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

---

### Campos Disponíveis no `_pendingLoan`

Os dados do empréstimo são armazenados como JSON string e incluem:

- `lending_company_name` - Nome do credor
- `lending_company_id` - ID do credor
- `borrowing_company_name` - Nome do devedor
- `borrowing_company_id` - ID do devedor
- `amount` - Valor do empréstimo
- `start_date` - Data de início
- `interest_rate` - Taxa de juro (opcional)
- `monthly_payment` - Pagamento mensal (opcional)

---

### Implementação Técnica

O código fará `JSON.parse()` do campo `_pendingLoan` para extrair os dados e mostrá-los formatados no tooltip. O valor será formatado usando `toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })` e a data com `format(new Date(...), 'dd/MM/yyyy')`.

