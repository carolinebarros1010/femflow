# Relatório Analítico — DeleteAccountRequest (Parte 2, backend GAS)

## 1) Fluxo ponta a ponta (App → Post.gs → DeleteAccount.gs → Sheets)
1. O app envia `action="deleteaccountrequest"` com `userId`, `deviceId`, `sessionToken`, `requestedAt`, `locale`, `reason`, `userAgent`.
2. `doPost(e)` em `staging/GAS/Post.gs` faz parse do body e extrai IP real com `extractRequestIp_(e, data)`.
3. No `switch(action)`, a ação cai em `deleteAccountRequest_(data, requestIp)`.
4. `deleteAccountRequest_` valida sessão com `_assertSession_`, grava em `DeleteRequests` e atualiza `Alunas`.
5. Na `Alunas`, marca:
   - `StatusConta = "delete_requested"`
   - `DeleteRequestedAt = requestedAt`
6. Em seguida invalida sessões ativas (`Devices`, `DeviceId`, `SessionToken`, `SessionExpira`) para corte imediato.

---

## 2) Relação entre aba Alunas e DeleteRequests
- `DeleteRequests` é o trilho operacional/auditável da solicitação (com `status`, `processedAt`, `ip`, `userAgent`).
- `Alunas` representa o estado de acesso da conta (controle em runtime):
  - `StatusConta` governa bloqueio de login e endpoints autenticados.
  - `DeleteRequestedAt` registra quando o bloqueio foi solicitado.
- A implementação conecta os dois lados no mesmo fluxo transacional de request, reduzindo janela de uso residual.

---

## 3) O que muda no login e no `_assertSession_`
### Login / loginOuCadastro
- Antes de qualquer lógica de sessão/device slots, o backend checa:
  - `StatusConta` normalizado (`delete_requested` / `pendente_exclusao`)
  - `Produto == exclusao_solicitada`
- Em bloqueio de exclusão, retorna payload padrão para FE:
```json
{
  "ok": false,
  "status": "blocked_delete_requested",
  "messageLocalized": "...",
  "supportEmail": "femflow.consultoria@gmail.com",
  "messages": { "pt": "...", "en": "...", "fr": "..." }
}
```

### `_assertSession_`
- Para endpoints autenticados, `_assertSession_` também bloqueia por exclusão **antes** da validação de token/device.
- Status bloqueados em runtime: `delete_requested`, `pendente_exclusao` (via normalização), `bloqueada`, `excluida`.
- Para exclusão (status/produto), mantém o mesmo payload padronizado e mensagem consistente.

---

## 4) Onde o bloqueio acontece e prioridade dos checks
1. **Login (`_fazerLogin`)**:
   - Checa status/produto de exclusão primeiro.
   - Só depois valida senha/sessão por device.
2. **Cadastro com e-mail existente (`_loginOuCadastro`)**:
   - Checa status/produto de exclusão primeiro.
3. **Endpoints autenticados (`_assertSession_`)**:
   - Checa status/produto de exclusão primeiro.
   - Só depois executa validação de token/device slots e fallback legado.

Resultado: evita cair em erro de “conta conectada em outro dispositivo” quando a conta já está em exclusão solicitada.

---

## 5) Evidências (funções/colunas)
- Entrada e IP:
  - `doPost` + `extractRequestIp_` em `staging/GAS/Post.gs`.
  - Prioridade `X-Forwarded-For`/`x-forwarded-for`, primeiro IP da cadeia.
- Fluxo de exclusão:
  - `deleteAccountRequest_` em `staging/GAS/DeleteAccount.gs`.
  - Colunas em `DeleteRequests`: `ip`, `status`, `processedAt`.
- Estado de conta e sessão:
  - `HEADER_ALUNAS`: `StatusConta`, `DeleteRequestedAt`, `Devices`, `AuthVersion`, `LastAuthMigrationAt`, `DeviceId`, `SessionToken`, `SessionExpira`.
  - `ensureAlunasHasColumns_()` garante presença do header e valida índices críticos.
- Bloqueio de autenticação:
  - `_statusContaBloqueiaLogin_`, `_produtoBloqueiaLogin_`, `_deleteRequestedAuthPayload_`, `_assertSession_` em `staging/GAS/Senha.gs`.
- Retenção:
  - `enforceDataRetentionPolicy_` + `setupRetentionTrigger_` em `staging/GAS/Retention.gs`.
  - Decisão documentada: purge em `DeleteRequests` somente para `status="processed"`.

---

## 6) Checklist de testes manuais (passo a passo)
1. **Solicitar exclusão com sessão válida**
   - Fazer POST com `action=deleteaccountrequest` e sessão válida.
   - Esperado:
     - linha criada em `DeleteRequests` com `status=requested` e `ip` preenchido quando header existir;
     - `Alunas.StatusConta=delete_requested`;
     - `Alunas.DeleteRequestedAt` preenchido;
     - campos de sessão/dispositivos invalidados.

2. **Tentar login após solicitar exclusão**
   - Chamar `action=login` com credenciais válidas.
   - Esperado:
     - retorno `status=blocked_delete_requested`;
     - mensagem de exclusão + `supportEmail`;
     - **não** retornar erro de “outro dispositivo”.

3. **Tentar endpoint autenticado com token antigo**
   - Ex.: `salvartreino` com token anteriormente válido.
   - Esperado: `_assertSession_` negar por status de conta/produto de exclusão.

4. **Validar captura de IP**
   - Enviar request com header `X-Forwarded-For: 1.2.3.4, 10.0.0.1`.
   - Esperado: coluna `ip` em `DeleteRequests` salva como `1.2.3.4`.
   - Sem header, validar fallback manual por `e.parameter.ip`.

5. **Validar trigger de retention**
   - Executar `setupRetentionTrigger_()` uma vez no projeto Apps Script.
   - Esperado:
     - retorno `{status:"ok", created:true|false, ...}`;
     - sem duplicação de trigger quando já existir;
     - trigger diário para `enforceDataRetentionPolicy_`.

6. **Validar política de purge de DeleteRequests**
   - Criar registros antigos `processed` e `requested`.
   - Executar `enforceDataRetentionPolicy_()`.
   - Esperado:
     - remove apenas `processed` fora da janela;
     - mantém `requested` pendente até processamento.
