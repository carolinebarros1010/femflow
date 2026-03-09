# QA técnico E2E — Billing Apple (FemFlow)

## A) Diagnóstico técnico curto (baseado no código real)

### Frontend iOS
- **`purchaseIOS`** está implementado em `app/js/billing/iap-ios.js` e exposto em `FEMFLOW.iapIOS.purchaseIOS`. Ele só executa no iOS nativo, chama o plugin (`purchaseProduct`/`purchase`) e retorna `transactionId`/`originalTransactionId` normalizados. Em erro, normaliza cancelamento para `purchase_cancelled`. 
- **`restoreIOS`** também está em `app/js/billing/iap-ios.js`, usa `restorePurchases`/`restore`, normaliza lista e retorna `restoredCount`.
- No fluxo legado principal, **compra e restore efetivos** (com envio backend) acontecem em `app/core/femflow-core.js`:
  - `FEMFLOW.iap.purchase(...)` chama plugin, depois `activatePurchaseOnBackend(...)` com `action: "iap_apple_activate"`.
  - `FEMFLOW.iap.restore(...)` monta batch de transações ativas e envia `action: "iap_apple_restore"`.
- **`refreshEntitlements`** está em `app/core/femflow-core.js`, chama backend com `action: "entitlements_status"`, atualiza `localStorage` (`femflow_ativa`, `femflow_produto`, `femflow_mode_personal`, `femflow_has_personal`) e dispara evento `femflow:entitlementsUpdated`.
- **Eventos de update de entitlement**:
  - Disparo: `refreshEntitlements` e também após purchase/restore bem-sucedidos no core.
  - Consumo: Home e FlowCenter escutam `document.addEventListener("femflow:entitlementsUpdated", ...)` para re-render/locks.
- **Mensagens de sucesso/erro**:
  - `FEMFLOW.iap._statusCopy()` concentra as mensagens (`success`, `cancelled`, `genericError`, `processing`).
  - Modal/paywall usa `toastIapResult` para exibir mensagens.
  - anti-steering iOS mostra toast **"Assine no app para continuar"** quando tentativa de checkout externo.
- **Anti-steering iOS**:
  - `FEMFLOW.openExternal(url)` bloqueia URLs com `hotmart.com` no iOS nativo.
  - `FEMFLOW.checkout._openHotmartExternal(...)` também bloqueia no iOS nativo.
  - Páginas legadas que chamam `FEMFLOW.openExternal` (ex.: ebooks) herdam esse bloqueio.

### Backend (GAS)
- O roteamento em `staging/GAS/Post.gs` mapeia:
  - `iap_apple_activate` → `iapAppleActivate_`
  - `iap_apple_restore` → `iapAppleRestore_`
  - `entitlements_status` → `entitlementsStatus_`
  - `iap_apple_notification` → `iapAppleNotification_`
- **Activate Apple**:
  - Núcleo em `_processIapAppleActivationCore_` + `_validateAppleTransactionServerSide_` + `_persistAppleValidationToRow_` (`staging/GAS/IapApple.gs`).
  - Trata idempotência por `IapTransactionId` e conflito cross-user (`duplicate_transaction_conflict`).
  - Persiste estado Apple/entitlement e evidência de validação na planilha.
- **Restore Apple**:
  - `iapAppleRestore_` processa batch (`transactions[]`) chamando o core de ativação por item.
  - Retorna `ok`, `partial` ou `error` com contadores (`restoredCount`, `failedCount`, etc.).
- **Entitlement final**:
  - `entitlementsStatus_` usa `computeEntitlementsFromRow_`.
  - Para Apple, considera `IapStatus` + `IapExpiresAt` + coerência com `LicencaAtiva`/`acesso_personal`.
- **Notifications**:
  - `iapAppleNotification_` exige `signedPayload`; faz parse pragmático, idempotência por `notificationUUID`/`notificationId`, validações de produto/env/bundle/originalTransaction.
  - Atualiza `IapStatus`, `LicencaAtiva`, `IapLastNotificationType/Subtype`, `IapValidation*`.
- **Reconciliação**:
  - `reconcileAppleSubscriptions_` seleciona linhas elegíveis (`pending_validation`, `retry`, near-expiry, stale, divergência status/licença etc.).
  - Estratégia mista: `remote` (se há evidência reaproveitável) ou `local_only`.
  - Atualiza status/campos e emite métricas (`remoteValidatedCount`, `localOnlyCount`, `retryCount`...).

---

## B) Matriz de QA técnico

> Legenda resultado esperado (resumo):
> - FE = frontend iOS
> - BE = backend GAS
> - Sheet = planilha Alunas

### Compra
1. **Compra aprovada**
- FE: `status=ok`, toast sucesso, evento entitlement update.
- BE: `iap_apple_activate` retorna `ok`, `entitlementStatus=active`.
- Sheet: `LicencaAtiva=true`, `IapStatus=active`, `IapSource=apple_iap`, `IapValidationLevel=pragmatic|pragmatic_remote`.

2. **Compra cancelada**
- FE: `status=cancelled`, toast cancelada.
- BE: não deve haver escrita nova Apple da transação cancelada.
- Sheet: sem alteração de entitlement ativo.

3. **Compra com backend reject** (ex.: produto inválido)
- FE: erro com mensagem backend/`iap_backend_activation_failed`.
- BE: `status=error`, `msg=apple_validation_failed`.
- Sheet: sem ativação (`LicencaAtiva` não sobe para true).

4. **Replay da mesma `transactionId` (mesma usuária)**
- FE: fluxo pode receber ok.
- BE: `status=ok`, `msg=idempotent_replay`.
- Sheet: sem duplicar/sem estado inconsistente.

5. **`duplicate_transaction_conflict` em outra usuária**
- FE: erro.
- BE: `status=error`, `msg=duplicate_transaction_conflict`.
- Sheet: usuária alvo não deve ser ativada.

### Restore
6. **Restore com 1 transação válida**
- FE: `status=ok`, `restoredCount>=1`, refresh entitlement.
- BE: `status=ok` por item e batch.
- Sheet: ativa conforme plano transação.

7. **Restore batch parcialmente válido**
- FE: sucesso funcional, mas validar payload parcial.
- BE: `status=partial`, `failedCount>0`.
- Sheet: somente transações válidas aplicadas.

8. **Restore sem transações**
- FE: `restoredCount=0`; sem crash.
- BE: cai no caminho single payload; esperado erro/sem ativação se sem evidência.
- Sheet: sem mudança indevida.

9. **Restore com replay**
- FE: sucesso/estável.
- BE: itens com `idempotent_replay`.
- Sheet: sem regressão.

10. **Restore com evidência insuficiente**
- FE: erro genérico restore.
- BE: `apple_validation_failed` com reason `missing_apple_evidence` (ou correlato).
- Sheet: não ativa.

### Entitlement
11. **`entitlements_status` após compra ok**
- FE: `femflow_ativa=true`, `femflow_produto=acesso_app`.
- BE: `status=ok`, `entitlementStatus=active`.
- Sheet: coerente com status ativo.

12. **`entitlements_status` após restore**
- FE: idem compra, dependendo do plano restaurado.
- BE: status reflete linha atual.
- Sheet: `IapLastSource=restore` (quando aplicável) + status final.

13. **`entitlements_status` com assinatura expirada**
- FE: acesso_app false.
- BE: `entitlementStatus=expired` para Apple expirada.
- Sheet: `IapStatus=expired`, `LicencaAtiva=false` (após reconcile/notificação).

14. **`entitlements_status` com status `retry`**
- FE: tratar como não plenamente ativa para acesso pago (validar comportamento de bloqueio).
- BE: retorna `status=retry` como entitlementStatus.
- Sheet: `IapStatus=retry`, trilha de validação preservada.

15. **Coerência `LicencaAtiva`/`IapStatus`/`Produto`/`acesso_personal`**
- FE: UI compatível (locks e modo personal corretos).
- BE: `computeEntitlementsFromRow_` coerente.
- Sheet: sem combinação impossível (ex.: expired + licença ativa por longos períodos).

### Notifications
16. **DID_RENEW**
- FE: após refresh entitlement mantém ativo.
- BE: mapeia para `IapStatus=active`.
- Sheet: `IapLastNotificationType=DID_RENEW`, `LicencaAtiva=true`.

17. **EXPIRED**
- FE: acesso bloqueado após refresh.
- BE: `IapStatus=expired`.
- Sheet: `LicencaAtiva=false`, `acesso_personal=false`.

18. **DID_FAIL_TO_RENEW**
- FE: comportamento de retry/grace (sem desbloqueio indevido).
- BE: `IapStatus=retry`.
- Sheet: último tipo notificação atualizado.

19. **REFUND/REVOKE**
- FE: bloqueio de acesso.
- BE: `IapStatus=revoked`.
- Sheet: `IapExpiresAt` limpo para revoked.

20. **Replay da mesma `notificationUUID`**
- FE: estável.
- BE: `msg=idempotent_notification_replay`.
- Sheet: sem reprocessamento destrutivo.

21. **Notificação sem `signedPayload`**
- FE: sem efeito.
- BE: `status=error`, `msg=missing_signed_payload`.
- Sheet: inalterada.

22. **Notificação com `originalTransactionId` divergente**
- FE: sem mudança de acesso.
- BE: `status=error`, `msg=original_transaction_mismatch`.
- Sheet: inalterada.

### Reconciliação
23. **Linha `pending_validation`** → elegível, tentar remote/local e sair de pendência.
24. **Linha `retry`** → elegível, tentar recuperação.
25. **Linha near-expiry** (<=48h / >=-12h) → elegível.
26. **Expirada mas ativa localmente** → elegível para correção.
27. **Linha stale** (>168h sem validação) → elegível.
28. **Sem evidência remota reaproveitável** → caminho `local_only`.
29. **Reconciliação remota bem-sucedida** → `resultType=remote_validated`.
30. **Reconciliação `local_only`** → aplica heurística local com rastreabilidade.
31. **Reconciliação com `retry`** → mantém rastreio para nova tentativa.
32. **Sem identidade suficiente** (`tx/originalTx` ausente) → não elegível (`missing_transaction_identity`).

### Anti-steering iOS
33. **Tentativa de `openHotmartExternal` no iOS**
- FE: toast bloqueio + `ios_external_checkout_blocked`.

34. **Tentativa de `openExternal` com `hotmart.com` no iOS**
- FE: bloqueia navegação + toast; log warning hardening.

35. **Páginas legadas/comerciais no iOS**
- FE: qualquer fluxo que use `FEMFLOW.openExternal` para Hotmart deve ser bloqueado igual.

---

## C) Checklist operacional executável (por caso)

> Formato: objetivo | pré-condição | ação | esperado FE | esperado BE | esperado Sheet | logs | aprovação

### 1) Compra aprovada
- Objetivo: confirmar ativação ponta a ponta.
- Pré-condição: conta iOS sandbox válida, produto permitido (`com.femflow.app.premium.monthly` ou `com.femflow.app.personal.pro.monthly`).
- Ação: comprar no app iOS.
- FE: retorno `ok`, toast sucesso, evento `femflow:entitlementsUpdated`.
- BE: `iap_apple_activate` `status=ok`, `entitlementStatus=active`.
- Sheet: `IapStatus=active`, `LicencaAtiva=true`, `IapSource=apple_iap`, IDs de transação preenchidos.
- Logs: `[IAP] validation` (ok), `[IAP][activate]` (ok).
- Aprovação: acesso liberado + dados consistentes nas colunas críticas.

### 2) Compra cancelada
- Objetivo: garantir que cancelamento não ativa licença.
- Pré-condição: conta pronta para comprar.
- Ação: iniciar compra e cancelar no sheet Apple.
- FE: mensagem cancelada.
- BE: sem ativação persistida.
- Sheet: sem mudança para ativo.
- Logs: tentativa de compra cancelada (front), sem `[IAP][activate] ok` correspondente.
- Aprovação: nenhum entitlement indevido.

### 3) Compra backend reject
- Objetivo: validar rejeição server-side.
- Pré-condição: forçar payload inválido (produto fora whitelist / receipt inválido em ambiente de teste controlado).
- Ação: chamar `iap_apple_activate` com payload inválido.
- FE: erro.
- BE: `apple_validation_failed` com `reason`.
- Sheet: sem ativação.
- Logs: `[IAP] validation` com `result: reject`.
- Aprovação: rejeição explícita + sem liberar acesso.

### 4) Replay transactionId mesma usuária
- Objetivo: validar idempotência.
- Pré-condição: transação já ativa nessa usuária.
- Ação: reenviar mesmo activate.
- FE: resposta estável.
- BE: `msg=idempotent_replay`.
- Sheet: sem duplicidade/sem regressão.
- Logs: `[IAP][activate]` com replay.
- Aprovação: comportamento determinístico.

### 5) duplicate_transaction_conflict
- Objetivo: bloquear fraude/reuso cruzado.
- Pré-condição: tx já vinculada em outra linha usuária.
- Ação: enviar activate dessa tx para outra conta.
- FE: erro.
- BE: `duplicate_transaction_conflict`.
- Sheet: conta alvo não ativada.
- Logs: `[IAP] duplicate transaction across users`.
- Aprovação: bloqueio efetivo.

### 6) Restore 1 válida
- Objetivo: restaurar entitlement corretamente.
- Pré-condição: compra prévia no mesmo Apple ID.
- Ação: botão restaurar compras.
- FE: sucesso + refresh entitlement.
- BE: restore `ok`.
- Sheet: campos Apple atualizados e ativo quando válido.
- Logs: `[IAP][restore]` por transação.
- Aprovação: acesso recuperado.

### 7) Restore parcial
- Objetivo: validar resultado `partial`.
- Pré-condição: batch com item válido e inválido.
- Ação: restore batch.
- FE: sem crash, estado final coerente.
- BE: `status=partial`, `failedCount>0`.
- Sheet: somente válidos persistidos.
- Logs: restore com mix de ok/error.
- Aprovação: parcial controlado e auditável.

### 8) Restore sem transações
- Objetivo: robustez em lista vazia.
- Pré-condição: plugin retorna vazio.
- Ação: restore.
- FE: `restoredCount=0`.
- BE: sem ativação indevida.
- Sheet: sem alteração indevida.
- Logs: restore sem itens.
- Aprovação: sem falso positivo.

### 9) Restore replay
- Objetivo: idempotência no restore.
- Pré-condição: itens já processados.
- Ação: repetir restore.
- FE: estável.
- BE: replay por item.
- Sheet: inalterada funcionalmente.
- Logs: `idempotent_replay`.
- Aprovação: determinístico.

### 10) Restore evidência insuficiente
- Objetivo: rejeitar sem prova mínima.
- Pré-condição: tx sem `receipt`/`signedPayload` válidos.
- Ação: restore.
- FE: erro.
- BE: `apple_validation_failed` reason apropriado.
- Sheet: não ativa.
- Logs: `[IAP] validation` reject.
- Aprovação: bloqueio seguro.

### 11-15) Entitlement
- Repetir padrão: comprar/restaurar/expirar e chamar `entitlements_status`; conferir FE + payload + Sheet.
- Critério central: retorno de `entitlements_status` e estado local (`femflow_ativa`, `femflow_produto`, `femflow_mode_personal`) devem refletir colunas da planilha e regras Apple.

### 16-22) Notifications
- Enviar payloads V2 (ou replays) para `iap_apple_notification`.
- Confirmar mapeamento de status, idempotência por notificationId, erros por payload ausente/divergente.
- Validar colunas de notificação (`IapLastNotificationType`, `IapLastNotificationSubtype`, `IapIdempotencyKey`, `IapCorrelationId`).

### 23-32) Reconcile
- Preparar linhas em estados alvo e executar reconcile.
- Verificar elegibilidade, modo (`remote`/`local_only`/`retry`/`skipped`) e contadores agregados.
- Confirmar correção de divergências (`expired_but_active_locally`, stale, pending_validation, retry).

### 33-35) Anti-steering iOS
- Executar em iPhone nativo iOS:
  - tentativa de checkout externo Hotmart via gateway;
  - tentativa via `FEMFLOW.openExternal("https://pay.hotmart.com/..." )`;
  - tentativa em páginas legadas.
- Esperado: bloqueio + toast + sem navegação externa.

---

## D) Colunas críticas da planilha para QA (e o que devem refletir)

- `Produto`: produto de perfil (`acesso_app`, `trial_app`, etc.) coerente com entitlement atual.
- `LicencaAtiva`: flag operacional de licença; para Apple deve convergir com `IapStatus` após notification/reconcile.
- `acesso_personal`: direito de personal; deve cair para `false` quando assinatura não ativa.
- `IapSource`: `apple_iap` para assinaturas Apple.
- `IapPlan`: `access` ou `personal` conforme productId.
- `IapEnv`: ambiente Apple (`Sandbox`/`Production` quando informado).
- `IapProductId`: SKU Apple efetiva.
- `IapTransactionId`: transactionId mais recente aplicada.
- `IapOriginalTransactionId`: identidade da cadeia de assinatura; pivô de notification.
- `IapStatus`: estado atual (`active`, `expired`, `retry`, `pending_validation`, `revoked`).
- `IapExpiresAt`: data fim conhecida.
- `IapLastValidatedAt`: timestamp da última validação/reconciliação.
- `IapValidationEvidence`: JSON de evidência (hash, receipt/signedPayload/notification metadata).
- `IapValidationLevel`: `pragmatic_remote`, `pragmatic`, `local_only`, `unverified`.
- `IapValidationMethod`: método (`verifyReceipt`, `signed_payload_consistency`, etc.).
- `IapLastSource`: origem da última mutação (`purchase`, `restore`, `notification`, `reconcile`).
- `IapLastReconcileMode`: resultado do reconcile (`remote`, `local_only`, `retry`, `skipped`).
- `IapCorrelationId`: correlação do fluxo atual (activate/notification/reconcile).
- `IapIdempotencyKey`: chave anti-replay (tx/notification).
- `IapLastNotificationType`: último tipo Apple recebido.
- `IapLastNotificationSubtype`: subtype Apple recebido.

---

## E) Roteiro operacional Sandbox/TestFlight (manual)

1. **Preparação**
- Limpar estado local no app (logout/login) e garantir conta QA conhecida na planilha.
- Confirmar build iOS com plugin NativePurchases ativo.
- Confirmar SKUs Apple da build e do backend whitelist.

2. **Compra iOS (happy path)**
- Abrir paywall iOS no app.
- Comprar plano access.
- Validar UI liberada + evento entitlement update.
- Conferir backend/log e colunas críticas.

3. **Restore iOS**
- Acionar restore.
- Validar contagem retornada e estado final.
- Conferir linha da planilha.

4. **Relogin**
- Logout/login sem reinstalar.
- Chamar fluxo que dispara `entitlements_status`.
- Confirmar persistência de acesso.

5. **Reinstall**
- Desinstalar/reinstalar app.
- Login + restore.
- Confirmar recuperação correta do entitlement.

6. **Expiração simulada / reconcile**
- Em Sandbox, aguardar ciclo curto de renovação/expiração quando possível.
- Se não viável no tempo, ajustar linha QA controlada (ambiente de staging) para estado elegível e rodar reconcile.
- Confirmar correção de status e licença.

7. **Notifications (quando aplicável)**
- Disparar notificações de teste (ou replay de payload real anonimizado) para endpoint staging.
- Validar mapeamento status/notificação e idempotência.

8. **Fallback quando evento Apple não for facilmente disparável**
- Priorizar validação por:
  - activate/restore + entitlements_status,
  - manipulação controlada de estados QA na planilha,
  - execução de reconcile,
  - replay de payloads notificação salvos.

---

## F) Utilitários leves propostos (implementados)

Criados em `staging/GAS/IapAppleQaDebug.gs` (sem alterar fluxo principal):
- `qaAppleBillingSnapshot_(payload)`
  - Snapshot resumido de billing Apple por `id/userId/email`.
- `qaAppleEntitlementSnapshot_(payload)`
  - Snapshot + entitlement computado pelo mesmo `computeEntitlementsFromRow_`.
- `qaAppleInspectByOriginalTransaction_(payload)`
  - Inspeção por `originalTransactionId`.
- `qaRunAppleReconcileNow_(payload)`
  - Disparo de `reconcileAppleSubscriptions_` com guarda por token (`QA_DEBUG_TOKEN`).

> Uso sugerido: execução manual no Apps Script editor ou endpoint debug interno controlado (não exposto publicamente sem autenticação extra).

---

## G) Critérios objetivos de aprovação de release

### Pronto para TestFlight
- Casos 1, 2, 4, 6, 9, 11, 12, 33, 34, 35 aprovados.
- Sem regressão de anti-steering iOS.
- Sem conflito de idempotência evidente.

### Pronto para App Store
- Casos 1–22 aprovados com evidências (logs + planilha + captura funcional).
- Reconciliação (23–32) ao menos em staging com resultados auditáveis.
- Zero `duplicate_transaction_conflict` falso positivo em rodada final.

### Pronto para produção robusta
- Cobertura completa 1–35 com evidência rastreável.
- Rotina de reconcile operacional (monitorar `retryCount`, `errorCount`, `stale_validation`).
- Taxa de erro backend Apple dentro do limite acordado no release (definir SLO interno).
- Processo de auditoria recorrente para divergência `LicencaAtiva` vs `IapStatus`.

