
# Plano: Corrigir Impressão dos Comprovativos

## Problema Identificado

Os comprovativos (recibos) não aparecem na impressão porque as imagens estão a usar **blob URLs** que não são transferíveis entre janelas do browser.

### Causa Técnica
- Quando o comprovativo é um **PDF**: O sistema converte para imagem usando `canvas.toDataURL()`, gerando uma **data URL base64** que funciona corretamente
- Quando o comprovativo é uma **imagem** (JPG, PNG, etc.): O sistema usa `URL.createObjectURL()`, gerando um **blob URL** que **não é acessível** na nova janela de impressão

## Solução Proposta

Converter as imagens para **data URL base64** (igual ao que já é feito para PDFs), garantindo que funcionam em qualquer janela.

## Alterações Técnicas

### Ficheiro: `src/pages/expenses/[id].tsx`

Modificar a secção de processamento de imagens (linhas 269-278) para:

```text
Antes (não funciona):
┌─────────────────────────────────────────┐
│ Download imagem do Supabase             │
│           ↓                             │
│ URL.createObjectURL(data)               │
│           ↓                             │
│ blob:https://... (NÃO FUNCIONA)         │
└─────────────────────────────────────────┘

Depois (solução):
┌─────────────────────────────────────────┐
│ Download imagem do Supabase             │
│           ↓                             │
│ FileReader.readAsDataURL(blob)          │
│           ↓                             │
│ data:image/png;base64,... (FUNCIONA!)   │
└─────────────────────────────────────────┘
```

### Código a Implementar

Substituir o bloco de processamento de imagens:

```typescript
// Handle images directly - convert to base64 data URL
if (data.type.startsWith('image/')) {
  console.log('Processing image file...');
  try {
    // Convert blob to base64 data URL (works across windows)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(data);
    });
    console.log('Created image data URL');
    return {
      expense,
      images: [dataUrl],
      type: 'image',
    };
  } catch (imgError) {
    console.error('Error processing image:', imgError);
    return null;
  }
}
```

## Resultado Esperado

Após esta alteração, os comprovativos (imagens JPG, PNG, etc.) aparecerão corretamente na página de impressão, tal como os PDFs já funcionam.
