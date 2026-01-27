

## Adicionar/Remover Páginas de Documentos PDF

### Resumo

Implementar a funcionalidade para adicionar e eliminar páginas individuais de documentos PDF diretamente no visualizador de documentos. Esta funcionalidade permite ao utilizador editar o documento removendo páginas indesejadas ou adicionando novas páginas de outros PDFs.

---

### Localização da Funcionalidade

A funcionalidade será adicionada ao componente **PdfViewer** (`src/components/PdfViewer.tsx`), que é utilizado pelo **DocumentPreview** no workflow. Os controlos aparecerão na barra de ferramentas existente, junto aos botões de navegação de página.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  < Página 3 / 6 >  │  -  125%  +  │  [🗑️ Eliminar] [➕ Adicionar] │  🖨️  ⬇️   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Fluxo de Utilizador

#### Eliminar Página

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. Utilizador navega para a página que quer eliminar          │
│                      │                                         │
│                      ▼                                         │
│  2. Clica no botão "Eliminar Página"                          │
│                      │                                         │
│                      ▼                                         │
│  3. Aparece confirmação: "Eliminar página 3 de 6?"             │
│                      │                                         │
│          ┌───────────┴───────────┐                             │
│          │                       │                             │
│     [Cancelar]              [Eliminar]                         │
│          │                       │                             │
│          ▼                       ▼                             │
│     Fecha dialog           Página é removida                   │
│                                  │                             │
│                                  ▼                             │
│                      PDF modificado é mostrado                 │
│                      (numPages atualizado)                     │
│                                  │                             │
│                                  ▼                             │
│                      Botão "Guardar Alterações" aparece        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Adicionar Página

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. Utilizador clica no botão "Adicionar Página"               │
│                      │                                         │
│                      ▼                                         │
│  2. Dialog abre com opções:                                    │
│     ┌─────────────────────────────────────────┐                │
│     │  Adicionar Página                       │                │
│     │                                         │                │
│     │  📁 Selecionar ficheiro PDF             │                │
│     │  [arquivo.pdf selecionado]              │                │
│     │                                         │                │
│     │  Páginas do ficheiro: 1, 2, 3, 4       │                │
│     │  ☑ Página 1  ☐ Página 2  ☑ Página 3    │                │
│     │                                         │                │
│     │  Inserir: ○ Antes ● Depois da atual    │                │
│     │                                         │                │
│     │  [Cancelar]           [Adicionar]       │                │
│     └─────────────────────────────────────────┘                │
│                      │                                         │
│                      ▼                                         │
│  3. Páginas selecionadas são inseridas                         │
│                      │                                         │
│                      ▼                                         │
│  4. Botão "Guardar Alterações" aparece                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Componentes a Criar/Modificar

| Ficheiro | Tipo | Descrição |
|----------|------|-----------|
| `src/utils/pdfPageManipulation.ts` | Novo | Funções para eliminar e adicionar páginas usando pdf-lib |
| `src/components/PdfViewer.tsx` | Modificar | Adicionar botões e estado para edição de páginas |
| `src/components/pdf/DeletePageDialog.tsx` | Novo | Dialog de confirmação para eliminar página |
| `src/components/pdf/AddPageDialog.tsx` | Novo | Dialog para selecionar e adicionar páginas |

---

### Implementação Técnica

#### 1. Novo Ficheiro: `src/utils/pdfPageManipulation.ts`

```typescript
import { PDFDocument } from 'pdf-lib';

/**
 * Remove uma página específica do PDF
 * @param pdfBytes - ArrayBuffer do PDF original
 * @param pageIndex - Índice da página a remover (0-based)
 * @returns ArrayBuffer do PDF modificado
 */
export async function deletePageFromPdf(
  pdfBytes: ArrayBuffer, 
  pageIndex: number
): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
    throw new Error('Índice de página inválido');
  }
  
  pdfDoc.removePage(pageIndex);
  
  const modifiedBytes = await pdfDoc.save();
  return modifiedBytes.buffer as ArrayBuffer;
}

/**
 * Adiciona páginas de outro PDF ao documento atual
 * @param targetPdfBytes - PDF de destino
 * @param sourcePdfBytes - PDF de origem (de onde vêm as páginas)
 * @param sourcePageIndices - Índices das páginas a copiar (0-based)
 * @param insertAfterIndex - Inserir depois desta página (-1 para início)
 */
export async function addPagesToDocument(
  targetPdfBytes: ArrayBuffer,
  sourcePdfBytes: ArrayBuffer,
  sourcePageIndices: number[],
  insertAfterIndex: number
): Promise<ArrayBuffer> {
  const targetDoc = await PDFDocument.load(targetPdfBytes);
  const sourceDoc = await PDFDocument.load(sourcePdfBytes);
  
  // Copiar páginas do documento fonte
  const copiedPages = await targetDoc.copyPages(sourceDoc, sourcePageIndices);
  
  // Inserir páginas na posição correta
  let insertAt = insertAfterIndex + 1;
  for (const page of copiedPages) {
    targetDoc.insertPage(insertAt, page);
    insertAt++;
  }
  
  const modifiedBytes = await targetDoc.save();
  return modifiedBytes.buffer as ArrayBuffer;
}
```

#### 2. Modificações no `PdfViewer.tsx`

**Novos Estados:**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [modifiedPdfBytes, setModifiedPdfBytes] = useState<ArrayBuffer | null>(null);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [showAddDialog, setShowAddDialog] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

**Novas Props (opcionais):**
```typescript
interface PdfViewerProps {
  url: string;
  filename?: string;
  editable?: boolean;  // Nova prop para ativar edição
  onSave?: (modifiedPdf: Blob) => Promise<void>;  // Callback para guardar
}
```

**Novos Botões na Toolbar:**
```tsx
{editable && (
  <>
    <div className="w-px h-6 bg-border mx-2" />
    
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowDeleteDialog(true)}
      disabled={loading || numPages <= 1}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4 mr-1" />
      Eliminar
    </Button>
    
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowAddDialog(true)}
      disabled={loading}
    >
      <Plus className="h-4 w-4 mr-1" />
      Adicionar
    </Button>
    
    {isEditing && (
      <Button
        size="sm"
        onClick={handleSaveChanges}
        disabled={isSaving}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-1" />
        )}
        Guardar
      </Button>
    )}
  </>
)}
```

#### 3. Novo Componente: `DeletePageDialog.tsx`

```tsx
interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageNumber: number;
  totalPages: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

// Dialog com AlertDialog para confirmar eliminação
// Mostra aviso se for a última página (não permitido)
```

#### 4. Novo Componente: `AddPageDialog.tsx`

```tsx
interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
  onConfirm: (file: File, pageIndices: number[], insertBefore: boolean) => void;
  isAdding: boolean;
}

// Dialog com:
// - Input para selecionar ficheiro PDF
// - Preview das páginas do PDF selecionado (thumbnails)
// - Checkboxes para selecionar páginas
// - Radio para inserir antes/depois da página atual
```

---

### Fluxo de Dados para Guardar

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  PdfViewer (editable mode)                                      │
│       │                                                         │
│       │ onSave(modifiedPdfBlob)                                 │
│       ▼                                                         │
│  WorkFlowTab / DocumentPreview                                  │
│       │                                                         │
│       │ Upload para Supabase Storage                            │
│       │ (substituir ficheiro original)                          │
│       ▼                                                         │
│  supabase.storage.from('bucket').upload()                       │
│       │                                                         │
│       │ Atualizar URL se necessário                             │
│       ▼                                                         │
│  Refrescar visualização                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Integração com WorkFlowTab

Para ativar a edição no visualizador do workflow, será necessário:

1. Modificar `DocumentPreview` para passar a prop `editable` e `onSave`
2. No `WorkFlowTab`, implementar o handler `onSave` que:
   - Faz upload do PDF modificado para o Supabase Storage
   - Atualiza o registo na tabela `workflow_files` se necessário
   - Mostra toast de sucesso/erro

---

### Tratamento de PDFs Protegidos

Para PDFs encriptados (que o `pdf-lib` não consegue processar diretamente), a funcionalidade reutilizará a lógica existente em `convertProtectedPdfToClean` do `pdfMerger.ts`:

1. Tentar carregar com `pdf-lib`
2. Se falhar por encriptação, converter via rendering com `pdfjs-dist`
3. Aplicar as modificações ao PDF "limpo"

---

### Considerações de UX

| Cenário | Comportamento |
|---------|---------------|
| Eliminar última página | Botão desativado (não permitido) |
| PDF com 1 página | Botão "Eliminar" desativado |
| Múltiplas edições | Alterações são cumulativas até guardar |
| Fechar sem guardar | Warning dialog a perguntar se quer descartar |
| PDF protegido | Conversão automática (pode demorar) |
| Erro ao guardar | Toast de erro + mantém alterações locais |

---

### Ficheiros a Criar

| Ficheiro | Descrição |
|----------|-----------|
| `src/utils/pdfPageManipulation.ts` | Funções deletePageFromPdf e addPagesToDocument |
| `src/components/pdf/DeletePageDialog.tsx` | Dialog de confirmação de eliminação |
| `src/components/pdf/AddPageDialog.tsx` | Dialog para adicionar páginas |

---

### Ficheiros a Modificar

| Ficheiro | Alterações |
|----------|------------|
| `src/components/PdfViewer.tsx` | Adicionar estados, props e botões de edição |
| `src/components/companies/DocumentPreview.tsx` | Passar props editable e onSave ao PdfViewer |
| `src/pages/companies/WorkFlowTab.tsx` | Implementar handler onSave para guardar PDF |

---

### Ordem de Implementação

1. Criar `src/utils/pdfPageManipulation.ts` com as funções base
2. Criar `DeletePageDialog.tsx` com confirmação
3. Criar `AddPageDialog.tsx` com seleção de ficheiro e páginas
4. Modificar `PdfViewer.tsx` para suportar modo editável
5. Modificar `DocumentPreview.tsx` para passar props
6. Modificar `WorkFlowTab.tsx` para implementar o save
7. Testar com PDFs normais e protegidos

