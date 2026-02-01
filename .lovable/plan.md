
## Plano: Dropdown com Pesquisa Integrada

### Objetivo
Criar um componente `SearchableSelect` que mantém a aparência visual do Select atual mas adiciona um campo de pesquisa no topo do menu dropdown para filtrar as opções enquanto escreve.

---

### Resultado Visual

```text
┌────────────────────────────────┐
│ Select folder...          ▼   │  ← Trigger (igual ao Select)
└────────────────────────────────┘
         │ (quando abre)
         ▼
┌────────────────────────────────┐
│ 🔍 Pesquisar...               │  ← Campo de pesquisa
├────────────────────────────────┤
│ ✓ Pasta A                     │  ← Opções filtradas
│   Pasta ABC                   │
│   Pasta Alfa                  │
└────────────────────────────────┘
```

---

### Implementação

**Ficheiro a criar:** `src/components/ui/searchable-select.tsx`

Este componente usará:
- `Popover` + `PopoverTrigger` + `PopoverContent` (container)
- `Command` + `CommandInput` + `CommandList` + `CommandItem` (pesquisa e lista)
- Estilo visual idêntico ao `SelectTrigger` atual

**Alterações em:** `src/pages/companies/index.tsx`

1. Importar o novo `SearchableSelect`
2. Substituir o `<Select>` do "Folder Location" pelo novo componente
3. Passar as mesmas props: `value`, `onChange`, `options`, `placeholder`

---

### Detalhes Técnicos

O componente terá esta interface:

```tsx
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}
```

**Funcionalidades:**
- Campo de pesquisa filtra opções em tempo real (case-insensitive)
- Ícone de check na opção selecionada
- Mensagem "Nenhum resultado" quando filtro não encontra nada
- Fecha automaticamente ao selecionar
- Suporta navegação por teclado (setas + Enter)
- Mantém aparência idêntica ao Select (altura, bordas, ícone chevron)

---

### Ficheiros Afetados

| Ficheiro | Ação |
|----------|------|
| `src/components/ui/searchable-select.tsx` | Criar novo componente |
| `src/pages/companies/index.tsx` | Usar o novo componente no Folder Location |
