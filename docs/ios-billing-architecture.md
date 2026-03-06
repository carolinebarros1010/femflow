# FemFlow — Arquitetura-alvo de Billing iOS (Apple IAP)

## 1) Diagnóstico de maturidade

### O que já está bom
- Compra iOS via Apple IAP já ocorre no app.
- App já envia payload de compra para backend.
- Backend já registra compra e atualiza colunas corretas.
- Entitlement já pode ser concedido.
- Separação de canais já respeitada: iOS (IAP), Android/Web (Hotmart).

### O que está funcional, mas frágil
- Concessão de entitlement potencialmente dependente de payload cliente (sem validação Apple forte e recorrente).
- Risco de inconsistência em renovação/expiração se não houver reconciliação server-side contínua.
- Restore pode ficar incompleto se não reconciliar histórico por `originalTransactionId`.
- Baixa resiliência operacional sem trilha de auditoria e idempotência forte.

### Obrigatório para App Store (baixo risco de review)
- iOS sem checkout externo para conteúdo digital consumido no app.
- Fluxo de restauração de compras funcional (`Restore Purchases`) no app.
- Regras claras de assinatura no app (termos, preço, período, auto-renovação).
- Backend validando aquisição com dados Apple de forma confiável antes de conceder acesso durável.

### Recomendado para operação robusta
- Backend como fonte única de verdade do entitlement.
- Processamento de renovação/expiração assíncrono (cron + notificações Apple).
- Máquina de estados de assinatura (active, grace, retry, expired, refunded, revoked).
- Auditoria completa de eventos e decisões de entitlement.
- Observabilidade (métricas, alertas, DLQ/reprocessamento).

### Pode ficar para depois
- Score antifraude avançado com heurísticas comportamentais.
- Data warehouse analítico de billing em tempo real.
- Automação de suporte com playbooks e painéis avançados.

---

## 2) Diferença entre cenário “funciona” vs “ideal”

### Cenário atual (funciona)
1. Usuário compra no iOS.
2. App envia payload para backend.
3. Backend registra compra.
4. Entitlement é atualizado.

**Limite:** funciona no happy path, mas pode falhar em bordas (renovação, expiração, restore, fraude, duplicidade, reembolso).

### Cenário ideal (robusto)
1. Compra no iOS gera transação StoreKit.
2. App envia token/transaction para backend autenticado.
3. Backend valida estado da transação com Apple (server-side).
4. Backend persiste evento bruto + snapshot normalizado.
5. Entitlement Engine calcula acesso por regras determinísticas.
6. Renovação/expiração/cancelamento/refund entram por notificações + reconciliação.
7. `/entitlements/status` responde com estado atual, nunca por lógica local frágil.

**Ganho:** segurança, compliance, previsibilidade operacional e escala.

---

## 3) Arquitetura ideal final (desenho textual)

```text
iPhone
  ↓
StoreKit 2 (purchase / transaction updates / restore)
  ↓
App Capacitor (FEMFLOW.IAP)
  ↓  (JWT app + idempotency-key)
Backend API (/iap/apple/*)
  ↓
Apple Validation Layer
  ├─ App Store Server API (transaction/subscription status)
  └─ JWS verification / receipt verification fallback
  ↓
Billing Profile (fonte canônica por userId + originalTransactionId)
  ↓
Entitlement Engine (regras de acesso iOS)
  ↓
Entitlement Store (estado atual + histórico)
  ↓
GET /entitlements/status

Paralelo (assíncrono):
Apple App Store Server Notifications V2
  ↓
POST /iap/apple/notifications
  ↓
Event Processor (idempotente)
  ↓
Billing Profile + Entitlement Engine

Paralelo (reconciliação):
Scheduler/Cron
  ↓
Revalidate subscriptions near-expiry / in-retry / stale
  ↓
Corrige divergências e gera auditoria
```

---

## 4) Caminho incremental recomendado

### Fase A — Validação Apple server-side forte
- **Objetivo:** não conceder acesso durável sem validação server-side.
- **Impacto:** reduz fraude e melhora confiança de dados.
- **Risco:** médio (ajuste de contratos API).
- **Prioridade:** P0.
- **App:** enviar `transactionId`, `originalTransactionId`, `productId`, `appAccountToken` e idempotency key.
- **Backend:** implementar validação com App Store Server API/JWS; persistir resultado.
- **Bloqueador para publicação:** **quase bloqueador** (fortemente recomendado antes de App Store).

### Fase B — Entitlement 100% server-side
- **Objetivo:** backend decide acesso; app só consulta status.
- **Impacto:** evita concessão indevida por manipulação cliente.
- **Risco:** médio.
- **Prioridade:** P0.
- **App:** usar `/entitlements/status` em login, foreground e pós-compra.
- **Backend:** motor de regras determinístico + cache curto.
- **Bloqueador:** **sim** para robustez mínima.

### Fase C — Restore robusto
- **Objetivo:** restauração confiável em reinstall/troca de aparelho.
- **Impacto:** reduz churn e tickets de suporte.
- **Risco:** baixo/médio.
- **Prioridade:** P0.
- **App:** botão restore explícito e fluxo guiado.
- **Backend:** reconciliar por `originalTransactionId` + histórico Apple.
- **Bloqueador:** **sim** (expectativa Apple e UX).

### Fase D — Renovação, expiração, retry
- **Objetivo:** manter estado de assinatura sempre correto.
- **Impacto:** evita acesso indevido ou bloqueio indevido.
- **Risco:** médio.
- **Prioridade:** P1.
- **App:** refletir estados (ativo, grace, expirado).
- **Backend:** state machine + jobs near-expiry.
- **Bloqueador:** não estrito para TestFlight, mas crítico para produção.

### Fase E — App Store Server Notifications V2
- **Objetivo:** quase real-time de eventos de billing.
- **Impacto:** resposta rápida a renew/refund/revoke.
- **Risco:** médio (segurança de endpoint, idempotência).
- **Prioridade:** P1.
- **App:** nenhuma mudança relevante.
- **Backend:** endpoint notificações + verificação JWS + processamento idempotente.
- **Bloqueador:** não estrito para subir, **altamente recomendado** para produção.

### Fase F — Observabilidade e suporte
- **Objetivo:** operação confiável e auditável.
- **Impacto:** reduz MTTR, melhora suporte.
- **Risco:** baixo.
- **Prioridade:** P2.
- **App:** logs técnicos mínimos (correlation-id).
- **Backend:** métricas, alertas, trilha de auditoria, reprocessamento.
- **Bloqueador:** não, mas essencial para escala.

---

## 5) Requisitos mínimos para TestFlight (seguro)
- iOS sem checkout externo para assinatura digital.
- Compra IAP funcionando ponta a ponta em Sandbox/TestFlight.
- Endpoint server-side que valida compra com Apple antes de conceder entitlement persistente.
- Endpoint `/entitlements/status` confiável.
- Restore funcional no app.
- Logs básicos com correlation-id e idempotência no backend.

## 6) Requisitos mínimos para App Store Review (baixo risco)
- Tudo de TestFlight +
- UI de assinatura transparente (preço, período, renovação, termos e privacidade).
- Restore Purchases claramente acessível.
- Sem caminhos alternativos de pagamento para iOS no app.
- Tratamento consistente para usuário sem assinatura ativa.

## 7) Requisitos do cenário ideal de produção
- Notificações Apple V2 ativas + verificação criptográfica.
- Reconciliação periódica automática.
- Máquina de estado de assinatura formal.
- Auditoria completa (evento bruto, decisão, operador/sistema).
- Antifraude com idempotência e deduplicação global.
- SLO/SLA de billing + alertas de divergência.

---

## 8) Modelo de dados recomendado

### Essencial
- `userId`
- `platform` (`ios`)
- `provider` (`apple_iap`)
- `productId`
- `transactionId` (único)
- `originalTransactionId` (índice)
- `environment` (`Sandbox`/`Production`)
- `purchaseDate`
- `periodStart`
- `periodEnd`
- `status` (`active|expired|grace|retry|refunded|revoked`)
- `isAutoRenew`
- `lastValidatedAt`
- `source` (`purchase|restore|notification|reconcile`)

### Recomendado
- `appAccountToken` (UUID estável por usuário)
- `storefront`
- `currency`
- `price`
- `offerType`/`offerIdentifier`
- `revocationDate` / `revocationReason`
- `gracePeriodExpiresAt`
- `billingRetryUntil`
- `rawPayloadHash`
- `receiptHash`
- `idempotencyKey`
- `correlationId`

### Avançado
- `riskScore`
- `deviceFingerprintHash` (com cuidado LGPD)
- `firstSeenAt` / `lastSeenAt` por `originalTransactionId`
- tabela de `billing_events` (append-only)
- tabela de `entitlement_decisions` (append-only)
- `supportAnnotations`

---

## 9) Contratos de API recomendados

### POST `/iap/apple/activate`
Request:
```json
{
  "userId": "u_123",
  "platform": "ios",
  "productId": "femflow.premium.monthly",
  "transactionId": "1000001234567890",
  "originalTransactionId": "1000001234500000",
  "appAccountToken": "550e8400-e29b-41d4-a716-446655440000",
  "environmentHint": "Production"
}
```
Response:
```json
{
  "ok": true,
  "entitlement": {
    "isActive": true,
    "plan": "premium",
    "status": "active",
    "periodEnd": "2026-01-31T23:59:59Z"
  },
  "billing": {
    "provider": "apple_iap",
    "originalTransactionId": "1000001234500000",
    "lastValidatedAt": "2026-01-01T12:00:00Z"
  }
}
```

### POST `/iap/apple/restore`
Request:
```json
{
  "userId": "u_123",
  "platform": "ios",
  "transactions": [
    {
      "transactionId": "1000001234567890",
      "originalTransactionId": "1000001234500000",
      "productId": "femflow.premium.monthly"
    }
  ]
}
```
Response:
```json
{
  "ok": true,
  "restored": 1,
  "entitlement": {
    "isActive": true,
    "status": "active",
    "periodEnd": "2026-01-31T23:59:59Z"
  }
}
```

### GET `/entitlements/status?platform=ios`
Response:
```json
{
  "userId": "u_123",
  "platform": "ios",
  "provider": "apple_iap",
  "isActive": true,
  "status": "active",
  "plan": "premium",
  "periodEnd": "2026-01-31T23:59:59Z",
  "sourceOfTruth": "server"
}
```

### POST `/iap/apple/notifications`
Request: payload bruto Apple (JWS signedPayload).
Response:
```json
{ "ok": true }
```

### GET `/billing/profile`
Response:
```json
{
  "userId": "u_123",
  "ios": {
    "provider": "apple_iap",
    "originalTransactionId": "1000001234500000",
    "status": "active",
    "periodEnd": "2026-01-31T23:59:59Z"
  },
  "android_web": {
    "provider": "hotmart",
    "status": "active"
  }
}
```

---

## 10) Restore ideal

### No app
1. Usuário toca “Restaurar compras”.
2. App executa restore no StoreKit e coleta transações elegíveis.
3. App envia lista de transações para `/iap/apple/restore` com idempotency key.
4. App consulta `/entitlements/status` e atualiza UI.

### No backend
1. Recebe transações e valida com Apple server-side.
2. Consolida por `originalTransactionId`.
3. Recalcula entitlement no motor.
4. Retorna estado final canônico.

### Como reconciliar e evitar restore falso
- Não confiar em “flag local restaurado”.
- Restore só efetiva entitlement após validação Apple.
- Se transação não pertence ao ecossistema esperado (bundle/product), rejeitar.
- Se `originalTransactionId` já vinculado a outro usuário, abrir fluxo de resolução segura (não conceder automaticamente).

### Reflexo no entitlement
- Entitlement atualizado apenas por decisão server-side.
- Histórico marca `source=restore` para auditoria.

---

## 11) Expiração, renovação, cancelamento e refund

### Mínimo viável
- Job diário para revalidar assinaturas ativas/near-expiry.
- Atualizar `status` e `periodEnd` no backend.
- Se expirou, remover entitlement imediatamente.

### Ideal completo
- Notifications V2 + reconciliação periódica (defesa em profundidade).
- Estados suportados:
  - `active`
  - `grace` (acesso opcional por regra de negócio)
  - `retry` (falha cobrança)
  - `expired`
  - `revoked`
  - `refunded`
- Regras práticas:
  - **renewal:** estende `periodEnd`, mantém ativo.
  - **expiration:** status `expired`, remove acesso.
  - **billing retry:** status `retry`, política clara de acesso.
  - **revoke/refund:** remover acesso e registrar motivo.
  - **cancelamento voluntário:** mantém ativo até fim do período pago.

---

## 12) Antifraude (hardening)

### O backend jamais deve confiar do cliente
- “isPremium=true” vindo do app.
- Datas de validade calculadas no cliente.
- Qualquer payload não validado na Apple.

### Validação de IDs
- `transactionId` deve ser único globalmente.
- `originalTransactionId` é a âncora de assinatura.
- Validar aderência de `bundleId`, `productId`, `environment`.

### Duplicidade e idempotência
- Chave idempotente por requisição (`Idempotency-Key`).
- Constraint única em `transactionId`.
- Processador de eventos (notificações/jobs) idempotente por `eventId`/hash.

### Evitar payload forjado e concessão indevida
- Autenticar usuário no backend antes de qualquer ativação.
- Verificar assinatura/JWS da Apple no servidor.
- Conceder entitlement somente após validação canônica.
- Tratar divergências como “pendente de validação”, nunca como ativo automático.

---

## 13) Riscos reais do cenário atual e mitigação
- **Risco:** concessão por payload cliente sem validação profunda.
  - **Mitigação:** validação Apple server-side obrigatória.
- **Risco:** falhas em renew/expire sem processamento assíncrono.
  - **Mitigação:** notifications + cron de reconciliação.
- **Risco:** restore incompleto.
  - **Mitigação:** fluxo restore formal + reconciliação por `originalTransactionId`.
- **Risco:** falta de trilha para suporte/auditoria.
  - **Mitigação:** event store append-only + correlation-id.

---

## 14) Melhor estratégia de curto prazo (sem overengineering)

### Melhor cenário pragmático (agora)
1. Validação Apple server-side no activate/restore.
2. Entitlement decidido só no backend.
3. Endpoint `/entitlements/status` canônico.
4. Restore funcional e testado.
5. Job diário de reconciliação de status.

### Mínimo seguro
- Fases A + B + C completas.
- Parte essencial da Fase D (expiração correta).

### O que não pode faltar
- Sem concessão de acesso confiando no cliente.
- Idempotência + deduplicação de transações.
- Restore acessível no app.

### O que pode adiar
- Notifications V2 (curto prazo) se houver cron robusto.
- Antifraude avançado por score.
- Observabilidade avançada (mantendo logging básico suficiente).

---

## 15) Checklists finais

### Checklist TestFlight
- [ ] Compra iOS sandbox/testflight ponta a ponta.
- [ ] `POST /iap/apple/activate` validando Apple server-side.
- [ ] `GET /entitlements/status` usado como fonte de verdade no app.
- [ ] Restore Purchases funcional.
- [ ] Idempotência e deduplicação ativas.
- [ ] Logs com correlation-id.

### Checklist App Store submission
- [ ] Sem checkout externo no iOS para conteúdo digital.
- [ ] Tela de assinatura clara (preço, período, auto-renovação, termos/privacidade).
- [ ] Restore facilmente encontrável.
- [ ] Comportamento correto quando assinatura expira.
- [ ] Fluxo iOS isolado de Hotmart sem confusão na UX.

### Checklist produção robusta
- [ ] Notifications V2 verificadas e processadas idempotentemente.
- [ ] Reconciliação periódica ativa.
- [ ] Máquina de estados completa.
- [ ] Auditoria append-only de billing e entitlement.
- [ ] Alertas operacionais e dashboards.
- [ ] Playbook de suporte para disputa de entitlement.

---

## A) Veredito honesto
- **Hoje:** **funcional** (entre funcional e quase pronto para TestFlight).
- **Pronto para TestFlight:** **sim, após endurecer validação server-side + restore confiável + entitlement canônico**.
- **Pronto para App Store:** **quase**, depende de fechar mínimos de compliance/restore/transparência.
- **Pronto para produção robusta:** **ainda não**, faltam notificações/reconciliação/auditoria completa.

## B) Recomendação executiva

### Ideal absoluto
- Arquitetura event-driven com validação Apple criptográfica, notifications V2, reconciliação, state machine completa e observabilidade madura.

### Ideal pragmático (recomendado agora)
- A+B+C+D mínimo: validação server-side forte, entitlement 100% backend, restore robusto, expiração correta por reconciliação diária.

### Próximo passo mais importante
- **Implementar imediatamente a validação Apple server-side obrigatória no `activate` e `restore`, tornando o backend a única autoridade de entitlement.**
