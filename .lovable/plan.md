
# Plano: Mostrar Nome da App no Google Authenticator (2FA)

## Problema

Quando o utilizador configura a autenticação de dois fatores (2FA), o Google Authenticator mostra **"localhost:3000"** em vez do nome da aplicação.

Isto acontece porque o parâmetro `issuer` não está definido no método `mfa.enroll()`, fazendo com que o Supabase use a URL de origem (localhost) como nome.

```text
Atual no Google Authenticator:
┌────────────────────────────────┐
│ localhost:3000                 │
│ 3000:sales@robsonway.com       │
│                                │
│      XXX XXX                   │
└────────────────────────────────┘

Desejado:
┌────────────────────────────────┐
│ GVVC One                       │
│ sales@robsonway.com            │
│                                │
│      XXX XXX                   │
└────────────────────────────────┘
```

## Causa Técnica

O método `supabase.auth.mfa.enroll()` aceita um parâmetro `issuer` que define o nome que aparece na app de autenticação. Este parâmetro **não está a ser passado** atualmente.

**Código atual:**
```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: "totp",
  friendlyName: "Google Authenticator",
  // issuer em falta!
});
```

## Solução

Adicionar o parâmetro `issuer: "GVVC One"` à chamada `mfa.enroll()`.

## Alterações Técnicas

### Ficheiro: `src/hooks/useMFA.ts`

Adicionar o parâmetro `issuer` em **todos** os locais onde `mfa.enroll()` é chamado:

**Linha ~119-122 (chamada principal):**
```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: "totp",
  issuer: "GVVC One",           // NOVO
  friendlyName: "Google Authenticator",
});
```

**Linha ~128-131 (fallback para conflito de nome):**
```typescript
const { data: retryData, error: retryError } = await supabase.auth.mfa.enroll({
  factorType: "totp",
  issuer: "GVVC One",           // NOVO
  friendlyName: `Authenticator ${Date.now()}`,
});
```

## Nota Importante

Para utilizadores que **já configuraram** o 2FA com "localhost:3000", o nome **não será atualizado automaticamente**. Para mostrar o nome correto, teriam de:
1. Desativar o 2FA nas Definições
2. Reativar o 2FA (o que gerará um novo QR code com o issuer correto)

Novos utilizadores verão imediatamente "GVVC One" no Google Authenticator.

## Resultado Esperado

Após esta alteração, quando um utilizador escanear o QR code para configurar 2FA, o Google Authenticator mostrará:

- **Nome da app:** GVVC One
- **Conta:** [email do utilizador]
