

## Implementar Autenticação de Dois Fatores (2FA) com Google Authenticator

### Resumo

Adicionar autenticação TOTP (Time-based One-Time Password) à aplicação usando as APIs de MFA do Supabase. Os utilizadores poderão configurar o Google Authenticator (ou apps compatíveis como Authy) para uma camada extra de segurança no login.

---

### Fluxo de Autenticação com MFA

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE LOGIN COM 2FA                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │  Página Login   │
                        │  (email/pass)   │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Supabase Auth Login   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Verificar se tem MFA  │
                    │  ativo (AAL2 required) │
                    └────────────┬───────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
        SEM MFA ativo                         COM MFA ativo
              │                                     │
              ▼                                     ▼
    ┌─────────────────┐              ┌─────────────────────────┐
    │  Redirecionar   │              │  Mostrar página TOTP    │
    │  para Dashboard │              │  (inserir código 6 dig) │
    └─────────────────┘              └────────────┬────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │  mfa.challenge()        │
                                     │  mfa.verify(code)       │
                                     └────────────┬────────────┘
                                                  │
                                          Código válido?
                                                  │
                              ┌────────────────┴────────────────┐
                              │                                  │
                             SIM                                NÃO
                              │                                  │
                              ▼                                  ▼
                    ┌─────────────────┐              ┌─────────────────┐
                    │  Redirecionar   │              │  Mostrar erro   │
                    │  para Dashboard │              │  Tentar de novo │
                    └─────────────────┘              └─────────────────┘
```

---

### Componentes a Criar

| Componente | Descrição |
|------------|-----------|
| `MFAEnrollment.tsx` | Página/componente para configurar MFA (QR code + confirmação) |
| `MFAVerification.tsx` | Página para inserir código TOTP após login primário |
| `MFASettings.tsx` | Secção nas Definições para gerir MFA (ativar/desativar) |

---

### Alterações nos Ficheiros Existentes

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/Auth.tsx` | Após login, verificar se MFA é necessário e redirecionar |
| `src/pages/Settings.tsx` | Adicionar tab/secção "Segurança" com opção para MFA |
| `src/contexts/AuthContext.tsx` | Adicionar estado e funções para MFA |
| `src/components/ProtectedRoute.tsx` | Verificar nível de autenticação (AAL1 vs AAL2) |
| `src/routes/AppRoutes.tsx` | Adicionar rota `/auth/mfa-verify` |

---

### Detalhes Técnicos de Implementação

#### 1. Novo Componente: MFAEnrollment

```typescript
// Fluxo de enrollment:
// 1. supabase.auth.mfa.enroll({ factorType: 'totp' })
//    - Retorna: { id, totp: { qr_code, secret, uri } }
// 2. Mostrar QR code para o utilizador escanear
// 3. Utilizador insere código de 6 dígitos
// 4. supabase.auth.mfa.challenge({ factorId })
// 5. supabase.auth.mfa.verify({ factorId, challengeId, code })
//    - Se válido, MFA fica ativo
```

#### 2. Novo Componente: MFAVerification

```typescript
// Fluxo de verificação pós-login:
// 1. Obter fatores ativos: supabase.auth.mfa.listFactors()
// 2. Criar challenge: supabase.auth.mfa.challenge({ factorId })
// 3. Utilizador insere código
// 4. Verificar: supabase.auth.mfa.verify({ factorId, challengeId, code })
// 5. Se válido, redirecionar para dashboard
```

#### 3. Alteração no Auth.tsx

```typescript
// Após signInWithPassword bem-sucedido:
const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
  // MFA necessário - redirecionar para página de verificação
  navigate('/auth/mfa-verify');
} else {
  // Login completo
  navigate('/');
}
```

#### 4. Alteração no ProtectedRoute.tsx

```typescript
// Verificar se utilizador tem AAL2 quando MFA está configurado
const checkMFARequired = async () => {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  
  if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
    return false; // MFA necessário mas não verificado
  }
  return true;
};
```

---

### Interface de Configuração MFA (Settings)

```text
┌───────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔐 Autenticação de Dois Fatores                        │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │  Estado: ⚪ Desativado / 🟢 Ativado                     │  │
│  │                                                         │  │
│  │  A autenticação de dois fatores adiciona uma camada     │  │
│  │  extra de segurança à sua conta, exigindo um código     │  │
│  │  temporário além da sua password.                       │  │
│  │                                                         │  │
│  │  Apps compatíveis:                                      │  │
│  │  • Google Authenticator                                 │  │
│  │  • Microsoft Authenticator                              │  │
│  │  • Authy                                                │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────┐                │  │
│  │  │      Configurar 2FA                 │                │  │
│  │  └─────────────────────────────────────┘                │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

### Interface de Enrollment (QR Code)

```text
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│         Configurar Autenticação de Dois Fatores              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  Passo 1: Instale uma app de autenticação               │  │
│  │           (Google Authenticator, Authy, etc.)           │  │
│  │                                                         │  │
│  │  Passo 2: Escaneie este código QR                       │  │
│  │                                                         │  │
│  │           ┌─────────────────────┐                       │  │
│  │           │                     │                       │  │
│  │           │      [QR CODE]      │                       │  │
│  │           │                     │                       │  │
│  │           └─────────────────────┘                       │  │
│  │                                                         │  │
│  │  Código manual: ABCD EFGH IJKL MNOP                     │  │
│  │                                                         │  │
│  │  Passo 3: Insira o código de 6 dígitos                  │  │
│  │                                                         │  │
│  │           ┌─┐ ┌─┐ ┌─┐   ┌─┐ ┌─┐ ┌─┐                     │  │
│  │           │ │ │ │ │ │ - │ │ │ │ │ │                     │  │
│  │           └─┘ └─┘ └─┘   └─┘ └─┘ └─┘                     │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────┐                │  │
│  │  │           Verificar                 │                │  │
│  │  └─────────────────────────────────────┘                │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

### Novos Ficheiros a Criar

| Ficheiro | Descrição |
|----------|-----------|
| `src/components/auth/MFAEnrollment.tsx` | Dialog/página para configurar MFA com QR code |
| `src/components/auth/MFAVerification.tsx` | Página para verificar código TOTP após login |
| `src/components/auth/MFASettings.tsx` | Componente para gestão de MFA nas definições |
| `src/pages/auth/MFAVerify.tsx` | Página dedicada à verificação MFA |
| `src/hooks/useMFA.ts` | Hook para gerir estado e operações MFA |

---

### Estrutura do Hook useMFA

```typescript
interface UseMFAReturn {
  // Estado
  isEnrolled: boolean;
  isLoading: boolean;
  factors: Factor[];
  
  // Enrollment
  startEnrollment: () => Promise<EnrollmentData>;
  verifyEnrollment: (code: string) => Promise<boolean>;
  cancelEnrollment: () => void;
  
  // Challenge/Verify
  createChallenge: () => Promise<ChallengeData>;
  verifyChallenge: (code: string) => Promise<boolean>;
  
  // Unenroll
  unenroll: (factorId: string) => Promise<boolean>;
}
```

---

### Sequência de APIs do Supabase

| Operação | API | Descrição |
|----------|-----|-----------|
| Iniciar enrollment | `mfa.enroll({ factorType: 'totp' })` | Gera QR code e secret |
| Listar fatores | `mfa.listFactors()` | Ver fatores configurados |
| Criar challenge | `mfa.challenge({ factorId })` | Prepara verificação |
| Verificar código | `mfa.verify({ factorId, challengeId, code })` | Valida código TOTP |
| Remover fator | `mfa.unenroll({ factorId })` | Desativa MFA |
| Verificar nível | `mfa.getAuthenticatorAssuranceLevel()` | Verificar AAL atual |

---

### Considerações de Segurança

1. **Recovery Codes**: Considerar adicionar códigos de recuperação para caso o utilizador perca acesso ao telemóvel
2. **Forçar Re-autenticação**: Para operações sensíveis (mudar password, desativar MFA), exigir password novamente
3. **Rate Limiting**: O Supabase já implementa rate limiting nas APIs de MFA
4. **Logging**: Registar ativações/desativações de MFA para auditoria

---

### Ordem de Implementação

1. Criar hook `useMFA.ts` com toda a lógica
2. Criar componente `MFAEnrollment.tsx` (configuração com QR)
3. Criar componente `MFAVerification.tsx` (verificação pós-login)
4. Criar página `MFAVerify.tsx` e adicionar rota
5. Adicionar secção MFA em `Settings.tsx`
6. Modificar `Auth.tsx` para verificar necessidade de MFA
7. Modificar `ProtectedRoute.tsx` para verificar AAL
8. Testar fluxo completo

