
## Atualizar Branding na Página de Login

### Objetivo
Alterar o nome da aplicação de "MarketNotes" para "ONE" e atualizar a frase descritiva para algo mais abrangente.

### Alterações a Realizar

| Elemento | Atual | Novo |
|----------|-------|------|
| Título | `MarketNotes` | `ONE` |
| Tagline | `Your market research and analysis hub` | `The place where everything happens` |

### Ficheiro a Modificar

**`src/pages/Auth.tsx`**

Linha 117:
```tsx
// De:
<CardTitle className="text-2xl font-bold text-center text-[#1EAEDB]">MarketNotes</CardTitle>

// Para:
<CardTitle className="text-2xl font-bold text-center text-[#1EAEDB]">ONE</CardTitle>
```

Linhas 118-120:
```tsx
// De:
<CardDescription className="text-center">
  Your market research and analysis hub
</CardDescription>

// Para:
<CardDescription className="text-center">
  The place where everything happens
</CardDescription>
```

### Resultado Visual

```
┌─────────────────────────────────────────┐
│           [GVVC Logo]                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │              ONE                  │  │
│  │  The place where everything       │  │
│  │           happens                 │  │
│  │                                   │  │
│  │   [Login]        [Sign Up]        │  │
│  │                                   │  │
│  │   Email                           │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │                         │     │  │
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  │   Password                        │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │                         │     │  │
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  │        [  Login  ]                │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Consistência com Sidebar
Esta alteração mantém a consistência com a marca "GVVC One" já implementada no `SidebarFooter`.
