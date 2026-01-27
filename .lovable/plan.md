

# Plano: Reset de Ficheiros Stuck no Workflow

## Contexto

Existem **31 ficheiros** na tabela `workflow_files` com status "processing" que ficaram presos devido a um erro no workflow n8n (que já foi corrigido - o nó "Load Projects" agora carrega da tabela correta `expense_projects`).

## Ação Necessária

Executar uma query SQL para resetar estes ficheiros para o status "Pending", permitindo que o workflow os reprocesse.

## Query a Executar

```sql
UPDATE workflow_files 
SET status = 'Pending' 
WHERE status = 'processing';
```

## Resultado Esperado

- **31 registos** serão atualizados de `status = 'processing'` para `status = 'Pending'`
- O workflow n8n poderá reprocessar estes ficheiros automaticamente
- Os ficheiros serão processados corretamente com IDs de projeto válidos da tabela `expense_projects`

## Implementação Técnica

Utilizarei a ferramenta de inserção/atualização do Supabase para executar esta query diretamente na base de dados de produção.

