# Fase 5 — Rodada 1 (Apple Billing)

## 1. Diagnóstico técnico da rodada 1

### 1.1 Entrada real do fluxo de compra iOS
- O gatilho funcional de checkout no app chama `FEMFLOW.checkout.openCheckout(planId, context)` (ex.: Home bloqueado chama `abrirCheckout` → `openCheckout`).
- Em iOS (`platform === "ios"`), `openCheckout` converte plano para productId Apple e delega para `FEMFLOW.iap.purchase(...)`.
- `FEMFLOW.iap.purchase(...)` (core legado que segue ativo no iOS) executa:
  1. compra nativa (`plugin.purchaseProduct`/`plugin.purchase`),
  2. normalização da transação,
  3. POST backend `action: "iap_apple_activate"` com `correlationId` e `idempotencyKey`,
  4. `FEMFLOW.refreshEntitlements()` (`action: "entitlements_status"`).

### 1.2 Onde cancelamento é tratado
- Cancelamento é tratado no frontend, dentro de `FEMFLOW.iap.purchase(...)`:
  - quando o retorno nativo não traz transação válida e erro contém `cancel`, retorna `status: "cancelled"`;
  - no `catch`, também mapeia erro `cancel*` para `status: "cancelled"`.
- Nesses ramos de cancelamento, não há chamada de `activatePurchaseOnBackend`, portanto **não há mutação esperada de planilha por esse evento**.

### 1.3 Onde restore é tratado
- Frontend: `FEMFLOW.iap.restore()` chama plugin (`restorePurchases`/`restore`), filtra transações ativas, envia batch para backend com `action: "iap_apple_restore"`, `source: "restore"`, `correlationId` e `idempotencyKey` por transação.
- Backend: `iapAppleRestore_(payload)` processa transação a transação via `_processIapAppleActivationCore_(..., "restore")` e retorna `ok|partial|error` com contadores (`restoredCount`, `failedCount`, etc.).
- Em sucesso parcial/total, frontend dispara `refreshEntitlements()` após restore.

### 1.4 Onde `refreshEntitlements` é disparado
- Definição: `FEMFLOW.refreshEntitlements()` faz POST `entitlements_status`, atualiza `localStorage` e dispara evento `femflow:entitlementsUpdated`.
- Disparos da rodada:
  - após `purchase` com backend `ok`;
  - após `restore` com backend `ok|partial`.
- `entitlements_status` calcula acesso a partir da linha da aluna e campos IAP (`IapSource`, `IapStatus`, `IapExpiresAt`, etc.), sendo a fonte server-authoritative para o app.

### 1.5 Anti-steering iOS relevante para a rodada
- Tentativa de checkout externo Hotmart em iOS retorna bloqueio com toast `"Assine no app para continuar"` e log `"[iOS hardening] Checkout externo Hotmart bloqueado no iOS nativo."`.
- Para a rodada 1, confirma que caminho válido no iOS é o Apple IAP.

### 1.6 Colunas da planilha que mudam nos 3 cenários
- Compra aprovada (`iap_apple_activate`): `_persistAppleValidationToRow_` atualiza `Produto`, `LicencaAtiva`, `acesso_personal`, `IapSource`, `IapPlan`, `IapEnv`, `IapProductId`, `IapTransactionId`, `IapPurchaseDate`, `IapOriginalTransactionId`, `IapStatus`, `IapExpiresAt`, `IapLastValidatedAt`, `IapValidationEvidence`, `IapValidationLevel`, `IapValidationMethod`, `IapLastSource`, `IapCorrelationId`, `IapIdempotencyKey`.
- Compra cancelada: sem persistência no backend (esperado sem alteração das colunas IAP/licença).
- Restore (`iap_apple_restore`): para cada transação processada com sucesso usa o mesmo core de ativação/persistência; `IapLastSource` esperado como `restore`.

### 1.7 Logs esperados (pelo código)
- Frontend:
  - `"[FEMFLOW.checkout] openCheckout"`;
  - `"[FEMFLOW.checkout] iOS convergido para trilha server-authoritative."`;
  - em anti-steering (quando aplicável): `"[iOS hardening] Checkout externo Hotmart bloqueado no iOS nativo."`.
- Backend GAS:
  - compra: `"[IAP] validation"` e `"[IAP][activate]"`;
  - restore: `"[IAP][restore]"` por transação;
  - (se houver conflito) `"[IAP] duplicate transaction across users"`.

## 2. Plano de execução

### Caso 1 — compra aprovada
**Pré-condição**
- Usuária iOS nativo autenticada (com `id`/`email` válidos).
- Produto Apple válido (`com.femflow.app.access.monthly` ou `com.femflow.app.personal.monthly`).
- Linha da usuária existente na aba `Alunas`.

**Ação**
1. Abrir fluxo bloqueado/paywall e tocar em comprar (plano Access ou Personal).
2. Concluir compra no diálogo nativo Apple.

**Resultado esperado no frontend**
- `FEMFLOW.iap.purchase(...)` retorna `status: "ok"`.
- Toast de sucesso (`Assinatura ativa. Acesso liberado.` ou equivalente i18n).
- `refreshEntitlements` executado e `femflow:entitlementsUpdated` disparado.

**Resultado esperado no backend**
- Receber `action: "iap_apple_activate"` com `transactionId` + `idempotencyKey`.
- Retornar `status: "ok"`, `provider: "apple_iap"`, `entitlementStatus: "active"`.
- Depois, `entitlements_status` retorna `status: "ok"`, `isActive: true`.

**Resultado esperado na planilha**
- `LicencaAtiva=true`.
- `IapSource=apple_iap`.
- `IapStatus=active`.
- `IapProductId`, `IapTransactionId`, `IapOriginalTransactionId` preenchidos.
- `IapLastValidatedAt` atualizado.
- `IapLastSource=purchase`.
- `IapCorrelationId` e `IapIdempotencyKey` preenchidos.
- `acesso_personal=true` somente se plano Personal; caso Access, `false`.

**Logs esperados**
- FE: `openCheckout`, `iOS convergido...`.
- BE: `[IAP] validation` e `[IAP][activate]` com `result/status=ok`.

**Critério de aprovação**
- Compra aprovada + entitlement ativo no app + linha da planilha coerente + logs de ativação presentes.

---

### Caso 2 — compra cancelada
**Pré-condição**
- Usuária iOS nativo autenticada.
- Tela de compra aberta com produto válido.

**Ação**
1. Tocar em comprar.
2. Cancelar no prompt nativo Apple (não finalizar pagamento).

**Resultado esperado no frontend**
- Retorno `status: "cancelled"`.
- Toast `Compra cancelada.`
- Sem crash e sem desbloqueio de acesso.

**Resultado esperado no backend**
- Nenhuma ativação confirmada (`iap_apple_activate` não deve persistir alteração para esse cancelamento).
- Sem mudança de entitlement por esse evento.

**Resultado esperado na planilha**
- Colunas de licença/IAP permanecem inalteradas em relação ao estado anterior.

**Logs esperados**
- FE: fluxo de checkout iniciado.
- FE: pode haver abertura de fluxo e até chamada local do plugin de compra.
- BE: ausência de log de ativação bem-sucedida associada ao cancelamento (`[IAP][activate]` com `ok` não deve surgir para esse clique cancelado).

**Guarda de execução (cancelamento)**
- Mesmo com abertura de fluxo/chamada local, o que **não pode** ocorrer é ativação backend bem-sucedida nem mudança de entitlement.

**Critério de aprovação**
- Cancelamento tratado graciosamente (`cancelled`) e nenhuma ativação indevida no backend/planilha.

---

### Caso 3 — restore
**Pré-condição**
- Usuária iOS nativo autenticada com compra Apple prévia restaurável (mesmo Apple ID).

**Ação**
1. Tocar em `Restaurar compras` no paywall/botão de restore.

**Resultado esperado no frontend**
- `FEMFLOW.iap.restore()` retorna `status: "ok"` (ou `partial` no backend, mas frontend trata sucesso do restore quando backend `ok|partial`) com `restoredCount >= 1` quando houver item ativo.
- Executa `refreshEntitlements` e dispara `femflow:entitlementsUpdated`.

**Resultado esperado no backend**
- Receber `action: "iap_apple_restore"` com `transactions[]`.
- Processar por transação e retornar agregados (`restoredCount`, `failedCount`, `status`).
- Para transação válida: persistência equivalente à ativação, `source=restore`.

**Resultado esperado na planilha**
- `IapLastSource=restore`.
- `IapStatus` e `LicencaAtiva` coerentes com transação válida (normalmente `active`/`true`).
- Atualização de `IapTransactionId`/`IapOriginalTransactionId`/`IapLastValidatedAt` conforme restore processado.

**Logs esperados**
- BE: `[IAP][restore]` por transação processada.
- Após refresh: resposta de `entitlements_status` coerente com linha.

**Critério de aprovação**
- Restore sem erro, entitlement final correto no app e planilha atualizada com traço de `restore`.

## 3. Checklist operacional

- [ ] iPhone/iOS nativo logado com usuária alvo (`femflow_id`/`femflow_email` válidos).
- [ ] Clique correto no gatilho de compra (paywall/home bloqueado) ou restore.
- [ ] Botão `Restaurar compras` visível e acessível no paywall/tela principal de assinatura no iOS.
- [ ] Compra aprovada: retorno `status=ok` no FE.
- [ ] Compra cancelada: retorno `status=cancelled` no FE.
- [ ] Restore: retorno com `restoredCount` esperado.
- [ ] `refreshEntitlements` executou após compra aprovada/restore.
- [ ] Entitlement final no app condiz com o cenário (ativo ou inalterado no cancelamento).
- [ ] Planilha: conferir `LicencaAtiva`, `acesso_personal`, `IapStatus`, `IapLastSource`, IDs de transação e validação.
- [ ] Logs backend encontrados (`[IAP][activate]` compra aprovada, `[IAP][restore]` restore).
- [ ] Nenhuma ativação indevida em caso cancelado.

## 4. Colunas a conferir

- **Produto**
  - Compra aprovada/restore ativo: `acesso_app`.
  - Cancelamento: sem mudança.
- **LicencaAtiva**
  - Compra aprovada/restore ativo: `true`.
  - Cancelamento: sem mudança.
- **acesso_personal**
  - Personal aprovado/restore personal: `true`.
  - Access aprovado: `false`.
  - Cancelamento: sem mudança.
- **IapSource**
  - Compra aprovada/restore processado: `apple_iap`.
  - Cancelamento: sem mudança.
- **IapPlan**
  - Access/Personal conforme `productId` Apple.
  - Cancelamento: sem mudança.
- **IapProductId**
  - `com.femflow.app.access.monthly` ou `com.femflow.app.personal.monthly` na aprovação/restore.
  - Cancelamento: sem mudança.
- **IapTransactionId**
  - Preenchido/atualizado em aprovação/restore.
  - Cancelamento: sem mudança.
- **IapOriginalTransactionId**
  - Preenchido/atualizado em aprovação/restore.
  - Cancelamento: sem mudança.
- **IapStatus**
  - Esperado `active` em aprovação/restore de assinatura ativa.
  - Cancelamento: sem mudança.
- **IapExpiresAt**
  - Data de expiração recebida/normalizada em aprovação/restore.
  - Cancelamento: sem mudança.
- **IapLastValidatedAt**
  - Atualizado em aprovação/restore.
  - Cancelamento: sem mudança.
- **IapValidationLevel**
  - Resultado da validação server-side (ex.: `pragmatic`, `pragmatic_remote`, `local_only`, etc.).
  - Cancelamento: sem mudança.
- **IapValidationMethod**
  - Método usado na validação (`signed_payload`, `receipt`, `local_expiry_inference`, etc.).
  - Cancelamento: sem mudança.
- **IapLastSource**
  - `purchase` na compra aprovada.
  - `restore` no restore.
  - Cancelamento: sem mudança.
- **IapCorrelationId**
  - UUID de correlação enviado pelo FE na compra/restore.
  - Cancelamento: sem mudança.
- **IapIdempotencyKey**
  - Chave `ios:<transactionId>` (ou equivalente) em compra/restore processado.
  - Cancelamento: sem mudança.

## 5. Critérios de aprovação da rodada 1

1. **Compra aprovada**: FE sucesso + backend `iap_apple_activate` ok + `entitlements_status` ativo + planilha coerente com Apple IAP.
2. **Compra cancelada**: FE `cancelled` + sem ativação indevida + planilha sem alteração indevida.
3. **Restore**: FE restore concluído + backend `iap_apple_restore` com processamento válido + entitlement final correto + trilha `IapLastSource=restore`.
4. **Observabilidade**: logs mínimos presentes para rastreabilidade (checkout FE, activate/restore BE).
