

## Plano: Actualizar Webhook do n8n para Análise de Anexos

### Problema Actual
A Edge Function `analyze-kanban-attachment` usa o secret `N8N_ANALYZE_DOCUMENT_WEBHOOK` que aponta para:
- **Antigo**: `https://n8n.gvvcapital.com/webhook/work-file-extract`

Precisa apontar para:
- **Novo**: `https://n8n.gvvcapital.com/webhook/lovable-doc-summary`

---

### Solução Recomendada

Como a funcionalidade é específica para o Kanban, vou criar um **novo secret dedicado** para não afectar outras funcionalidades que usam o secret antigo.

---

### Alterações Técnicas

**1. Novo Secret a Configurar**

| Nome do Secret | Valor |
|----------------|-------|
| `N8N_KANBAN_DOC_SUMMARY_WEBHOOK` | `https://n8n.gvvcapital.com/webhook/lovable-doc-summary` |

**2. Actualizar Edge Function**

**Ficheiro**: `supabase/functions/analyze-kanban-attachment/index.ts`

Alterar linha 55 de:
```typescript
const n8nWebhookUrl = Deno.env.get('N8N_ANALYZE_DOCUMENT_WEBHOOK');
```

Para:
```typescript
const n8nWebhookUrl = Deno.env.get('N8N_KANBAN_DOC_SUMMARY_WEBHOOK');
```

E actualizar as mensagens de erro correspondentes (linhas 58-63).

---

### Passos de Implementação

1. Actualizar o código da Edge Function para usar o novo secret
2. Adicionar o secret `N8N_KANBAN_DOC_SUMMARY_WEBHOOK` com o valor do novo webhook
3. Deploy da Edge Function
4. Testar a análise de um anexo

---

### Ficheiros a Modificar

| Ficheiro | Acção |
|----------|-------|
| `supabase/functions/analyze-kanban-attachment/index.ts` | Actualizar nome do secret |

### Secrets a Configurar

| Secret | Valor |
|--------|-------|
| `N8N_KANBAN_DOC_SUMMARY_WEBHOOK` | `https://n8n.gvvcapital.com/webhook/lovable-doc-summary` |

