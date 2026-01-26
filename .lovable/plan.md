
## Adicionar Thumbnails de Imagem na Secção de Attachments

### Objetivo
Quando um anexo for uma imagem (jpg, jpeg, png, gif, webp), mostrar uma miniatura (thumbnail) da imagem em vez do emoji genérico 🖼️.

### Implementação Técnica

#### 1. Criar Estado para URLs Assinados

Como o bucket `kanban-attachments` é **privado**, precisamos de gerar URLs assinados para cada imagem poder ser exibida como thumbnail.

```typescript
const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
```

#### 2. Carregar Thumbnails ao Obter Anexos

Após carregar os anexos, gerar URLs assinados apenas para ficheiros de imagem:

```typescript
// Dentro de loadAttachments ou useEffect
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const imageAttachments = data.filter(att => {
  const ext = att.filename.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(ext || '');
});

const urls: Record<string, string> = {};
for (const img of imageAttachments) {
  const signedUrl = await KanbanService.getSignedDownloadUrl(img.file_url);
  urls[img.id] = signedUrl;
}
setThumbnailUrls(urls);
```

#### 3. Atualizar a Renderização dos Anexos

Substituir o emoji por um thumbnail quando disponível:

```
Antes:
┌────────────────────────────────────────────────────────────┐
│ 🖼️  WhatsApp Image 2026-01-26...jpeg          ⬇️  🗑️  │
└────────────────────────────────────────────────────────────┘

Depois:
┌────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                   │
│ │ IMG │  WhatsApp Image 2026-01-26...jpeg     ⬇️  🗑️  │
│ └─────┘                                                   │
└────────────────────────────────────────────────────────────┘
```

#### 4. Componente de Thumbnail

```tsx
{thumbnailUrls[attachment.id] ? (
  <img 
    src={thumbnailUrls[attachment.id]} 
    alt={attachment.filename}
    className="w-10 h-10 object-cover rounded border flex-shrink-0"
    onError={(e) => {
      // Fallback to emoji if image fails to load
      e.currentTarget.style.display = 'none';
    }}
  />
) : (
  <span className="text-lg">{getFileIcon(attachment.filename)}</span>
)}
```

### Ficheiro a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/kanban/KanbanCardModal.tsx` | Adicionar estado `thumbnailUrls`, carregar URLs assinados para imagens, renderizar `<img>` em vez de emoji |

### Layout Final

```
┌─────────────────────────────────────────────────────────────────┐
│  Attachments                                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐                                                   │ │
│  │ │      │  WhatsApp Image 2026-01-26 at 10.39.05.jpeg  ⬇️🗑️│ │
│  │ └──────┘                                                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ ┌──────┐                                                   │ │
│  │ │      │  WhatsApp Image 2026-01-26 at 10.39.05(1).jpeg ⬇️🗑️│ │
│  │ └──────┘                                                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ 📄  documento.pdf                                    ⬇️🗑️│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [+ Add Attachment]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Considerações

1. **Performance**: Os URLs assinados são carregados em paralelo para não bloquear a UI
2. **Fallback**: Se a imagem falhar ao carregar, o emoji original é mostrado
3. **Cache**: Os URLs assinados têm validade de 1 hora (suficiente para a sessão)
4. **Outros Ficheiros**: PDFs, documentos Word, etc. mantêm os emojis actuais
