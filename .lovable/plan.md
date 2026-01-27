

## Expiração Diária da Sessão de Autenticação

### Problema Identificado

Atualmente, a sessão de autenticação está configurada com:
- `persistSession: true` - A sessão persiste no localStorage
- `autoRefreshToken: true` - O token é automaticamente renovado

Isto significa que, se alguém deixar a página aberta ou um computador desbloqueado, a sessão permanece ativa indefinidamente, o que representa um risco de segurança.

### Solução Proposta

Implementar um sistema de verificação diária que force o logout automático quando a sessão ultrapassar 24 horas, exigindo que o utilizador faça login novamente.

### Implementação Técnica

#### 1. Modificar o AuthContext para Guardar o Timestamp do Login

```typescript
// Quando o utilizador faz login, guardar o timestamp
localStorage.setItem('session_start_time', Date.now().toString());
```

#### 2. Verificar Expiração no Carregamento da App

```typescript
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

const checkSessionExpiration = async () => {
  const sessionStartTime = localStorage.getItem('session_start_time');
  
  if (sessionStartTime) {
    const elapsed = Date.now() - parseInt(sessionStartTime);
    
    if (elapsed > SESSION_MAX_AGE_MS) {
      // Sessão expirada - fazer logout
      localStorage.removeItem('session_start_time');
      await supabase.auth.signOut();
      return true; // Sessão foi terminada
    }
  }
  
  return false;
};
```

#### 3. Verificação Periódica Enquanto a App Está Aberta

```typescript
useEffect(() => {
  // Verificar a cada hora
  const interval = setInterval(() => {
    checkSessionExpiration();
  }, 60 * 60 * 1000); // 1 hora

  return () => clearInterval(interval);
}, []);
```

### Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/contexts/AuthContext.tsx` | Adicionar lógica de expiração diária da sessão |

### Fluxo de Funcionamento

```text
┌─────────────────────────────────────────────────────────────────┐
│                    UTILIZADOR FAZ LOGIN                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│        Guardar timestamp no localStorage                        │
│        session_start_time = Date.now()                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              APP EM FUNCIONAMENTO                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Verificação a cada hora:                               │  │
│   │  • Se (agora - session_start_time) > 24h                │  │
│   │    → Fazer logout automático                            │  │
│   │    → Redirecionar para /auth                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Comportamento Esperado

1. **Login bem-sucedido**: O timestamp é guardado
2. **Navegação normal (< 24h)**: A sessão funciona normalmente
3. **Após 24 horas**: Logout automático com mensagem informativa
4. **Novo login**: O timestamp é atualizado e o ciclo recomeça

### Alternativas Consideradas

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **Expiração diária (escolhida)** | Logout após 24h | Seguro, previsível | Pode interromper trabalho |
| **Expiração por inatividade** | Logout após X minutos sem interação | Mais flexível | Mais complexo de implementar |
| **Expiração ao fechar browser** | `persistSession: false` | Muito seguro | Inconveniente para utilizadores |

### Extras de Segurança (Opcional)

Se desejares segurança adicional, podemos também:
- Mostrar um aviso 5 minutos antes da expiração
- Permitir "estender sessão" com re-autenticação
- Implementar logout por inatividade (ex: 30 min sem interação)

