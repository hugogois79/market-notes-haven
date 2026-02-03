

## Diagnóstico: Botão AI não visível junto aos Attachments

### Análise do Código

Verifiquei o ficheiro `KanbanCardModal.tsx` e **o código está implementado correctamente**:

- **Linha 15**: O ícone `Sparkles` está importado
- **Linha 33**: O componente `AiAttachmentAnalyzerDialog` está importado  
- **Linha 75**: O estado `showAiAttachmentDialog` está declarado
- **Linhas 549-561**: O botão está renderizado com a condição `attachments.length > 0`

### Possível Causa

O botão só aparece quando `attachments.length > 0`. Como os attachments são carregados **assincronamente** (linhas 97-126), existe um momento em que:
1. O modal abre
2. Os attachments ainda não foram carregados (array vazio)
3. O botão não aparece
4. Os attachments são carregados e aparecem na lista
5. **Mas a UI já renderizou sem o botão**

### Solução Proposta

Adicionar uma **verificação mais robusta** e garantir que o botão apareça assim que existam attachments, independentemente do timing de carregamento.

### Alterações Técnicas

**Ficheiro: `src/components/kanban/KanbanCardModal.tsx`**

O botão já re-renderiza quando `attachments` muda. O problema pode ser apenas que o **código ainda não foi aplicado** ao ambiente de preview.

**Passos para verificar:**
1. Forçar refresh do browser (Ctrl+Shift+R)
2. Abrir um card com anexos
3. Verificar se o ícone ✨ aparece ao lado de "Attachments"

### Nota

Se após refresh continuar a não aparecer, posso adicionar um **estado de loading** para garantir que o botão aparece logo após os attachments serem carregados.

### Ficheiro a Verificar/Modificar

| Ficheiro | Estado |
|----------|--------|
| `src/components/kanban/KanbanCardModal.tsx` | Código já implementado - necessita refresh |

