
# Plano: Correção de Performance - Intervalo Agressivo

## Problema Identificado

O ficheiro `src/components/RichTextEditor/EditorTabs/useTabState.ts` contém um `setInterval` que executa a cada **5 milissegundos** (200x/segundo), causando:
- Lag no movimento do rato
- Uso excessivo de CPU
- Aplicação lenta e pesada

## Código Problemático

```typescript
// Linha 44-57 - executa 200 vezes por segundo!
useEffect(() => {
  const editableCheckInterval = setInterval(() => {
    if (activeTab === "editor" && editorRef.current) {
      if (editorRef.current.contentEditable !== 'true') {
        editorRef.current.contentEditable = 'true';
        editorRef.current.setAttribute('contenteditable', 'true');
      }
    }
  }, 5); // ← PROBLEMA: 5ms = 200 execuções/segundo
  
  return () => clearInterval(editableCheckInterval);
}, [activeTab]);
```

## Solução

Remover completamente este intervalo. A verificação de editabilidade já é feita:
1. No primeiro `useEffect` quando `activeTab` muda (linha 24-41)
2. No `handleContainerClick` quando o utilizador clica (linha 105-130)

Não há necessidade de verificação contínua - o estado de `contentEditable` não muda sozinho.

## Alteração

| Ficheiro | Ação |
|----------|------|
| `src/components/RichTextEditor/EditorTabs/useTabState.ts` | Remover o `useEffect` com `setInterval` (linhas 44-57) |

## Resultado Esperado

- Movimento do rato fluido
- Redução drástica de uso de CPU
- Aplicação responsiva

## Secção Técnica

O intervalo de 5ms viola boas práticas de performance:
- Intervalos inferiores a 16ms (60fps) já são problemáticos
- 5ms significa ~200 operações DOM por segundo
- Cada verificação força o browser a re-avaliar o layout

A solução mantém toda a funcionalidade (editabilidade garantida) sem o custo de performance.
