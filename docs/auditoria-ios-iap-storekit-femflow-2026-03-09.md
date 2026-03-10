# Auditoria iOS IAP / StoreKit / App Store Connect — FemFlow

Data: 2026-03-09
Escopo técnico: `app/core/femflow-core.js`, `app/js/billing/access.js`, `app/js/billing/iap-ios.js`, `app/js/billing/checkout.js`, `app/js/home.js`, `app/js/flowcenter.js`, `docs/ios-iap-bridge-contract.md`.

## 1) Veredito da modelagem dos 2 produtos

### acesso_app
- **Recomendação:** `auto-renewable subscription`.
- **Motivo:** o app já opera com semântica mensal (`com.femflow.app.access.monthly`) e copy legal de renovação automática no paywall, o que alinha com assinatura recorrente Apple. `non-consumable` e `non-renewing` aumentariam fricção operacional e risco de inconsistência de acesso/expiração.

### modo_personal
- **Recomendação:** também `auto-renewable subscription`, de preferência como SKU/plano dentro do mesmo grupo de assinatura (ou grupo com regra clara de coexistência), não como consumível.
- **Motivo:** no código, `modo_personal` é entitlement derivado de assinatura ativa + flag pessoal (`acesso_app && modo_personal`), então o modelo recorrente simplifica upgrades/downgrades, restore e revisão Apple.

## 2) Verificação dos Product IDs

- IDs técnicos encontrados no app:
  - `com.femflow.app.access.monthly`
  - `com.femflow.app.personal.monthly`
- IDs aparecem de forma consistente em:
  - core IAP (`FEMFLOW.IAP_*`)
  - catálogo iOS (`IOS_PRODUCT_MAP`)
  - contrato de bridge/documentação.
- **Conclusão:** internamente consistente.
- **Ponto de atenção:** nomes de negócio (`acesso_app`, `modo_personal`) **não** devem ser usados como `productId` no StoreKit; no código atual, quando bridge nativa não responde, há fallback para fluxo que usa os IDs canônicos (bom).

## 3) Verificação das chamadas de billing

### getProducts
- Implementado via plugin nativo (`getProducts`/`listProducts`) no core e exposto via `FEMFLOW.billing.getProducts`.
- Resultado: correto para catálogo mínimo de 2 SKUs.

### openPaywall
- Home e FlowCenter chamam `FEMFLOW.billing.openPaywall(planId, context)` em pontos de bloqueio.
- No iOS, tenta bridge `window.webkit.messageHandlers.iap.postMessage`; sem bridge, cai no checkout convergido (`FEMFLOW.checkout.openCheckout`) que tenta purchase IAP.

### purchase(productId)
- Fluxo principal iOS convergido:
  1. compra nativa (`purchaseProduct`/`purchase`),
  2. normalização de transação,
  3. ativação server-side (`iap_apple_activate`),
  4. refresh de entitlements.
- **Ponto forte:** backend é fonte de verdade antes de liberar sucesso final.

### restorePurchases
- Implementa restore nativo (`restorePurchases`/`restore`) e envia lote ativo ao backend (`iap_apple_restore`), seguido de refresh.
- **Ponto forte:** restore ligado ao backend, não apenas cache local.

### syncEntitlements / callbacks / UI
- `syncEntitlements` chama `FEMFLOW.access.refresh()` e dispara `femflow:entitlementsUpdated`.
- Home e FlowCenter escutam esse evento e re-renderizam/atualizam locks.

### Backend update após compra/restore
- Compra: `iap_apple_activate`.
- Restore: `iap_apple_restore` com transações ativas e idempotency por transaction id.
- Entitlement final: `entitlements_status`.

## 4) Verificação da bridge JS ↔ iOS

### Estado atual
- Contrato de saída JS→iOS está definido (`openPaywall`, `purchase`, `restore`, `getProducts`) e implementado no `access.js`.
- Contrato de entrada iOS→JS está definido via `window.FEMFLOW_IAP_BRIDGE` com:
  - `purchaseSuccess`
  - `purchaseFailed`
  - `entitlementsUpdated`
  - `restore`

### Consistência de payload
- Estrutura geral está coerente com doc do contrato.
- `entitlementsUpdated` já atualiza cache + sincroniza backend.

### Lacunas
- Não há callback explícito de “restoreFailed” dedicado (usa sync genérico/erro indireto).
- Não há ACK/resultado síncrono de `postMessage` (limitação normal de WKWebView), então observabilidade depende de callback e logs.

## 5) O que está certo

- Product IDs canônicos consistentes em core + camada iOS + documentação.
- Fluxo purchase/restore server-authoritative (ativa no backend antes de considerar acesso).
- Home e FlowCenter entram no paywall em pontos de bloqueio corretos.
- Atualização de UI por evento de entitlement sem exigir reload total.
- Restore disponível no fluxo iOS.

## 6) O que está errado / risco técnico

- Existem **duas camadas parcialmente sobrepostas** (`core` e `billing/iap-ios`) com compat legado; aumenta risco de regressão em manutenção.
- `purchase` aceita `planIdOrProductId`; se caller enviar valor inesperado fora do catálogo, pode gerar erro tardio em runtime (não crítico, mas pode melhorar validação explícita).
- Contrato bridge não explicita evento dedicado para falha de restore e estado de processamento (UX/telemetria).

## 7) O que falta fazer (antes de App Review)

1. Confirmar no App Store Connect os dois produtos ativos com os IDs exatos:
   - `com.femflow.app.access.monthly`
   - `com.femflow.app.personal.monthly`
2. Garantir ambos em estado “Ready to Submit”/aprovável, com pricing, localizações, screenshot se exigido e metadata legal.
3. Executar testes sandbox completos:
   - compra sucesso,
   - cancelamento,
   - restore com assinatura ativa,
   - restore sem histórico,
   - renovação/expiração.
4. Fechar matriz de observabilidade (logs de callback + backend correlationId).
5. (Recomendado) adicionar callback bridge `restoreFailed` e estado `purchasePending`/`restorePending` para UX melhor.

## 8) Riscos de rejeição Apple

- **Médio**, se metadados de assinatura/termos/privacidade no App Store Connect não estiverem completos/coerentes com o paywall.
- **Médio**, se fluxo de restore não estiver claro ao usuário (botão existe, mas UX de erro/sucesso pode ficar opaca dependendo do callback nativo).
- **Baixo/Médio**, se qualquer superfície iOS ainda expuser fluxo de compra externa indevido em build final (há hardening, mas precisa validar build real).

## 9) Checklist final de publicação

- [ ] Produtos no ASC criados com IDs exatos e tipo correto (auto-renewable).
- [ ] Ambos vinculados ao app e configurados com preço/localização.
- [ ] Paywall iOS exibindo preço, termo de renovação, links de termos e privacidade.
- [ ] Botão restore funcional e validado em sandbox.
- [ ] Compra `acesso_app` ativa entitlement base.
- [ ] Compra `modo_personal` ativa entitlement personal sem quebrar base.
- [ ] `entitlements_status` refletindo estado real após purchase/restore.
- [ ] Home re-renderiza após compra/restore sem reload manual.
- [ ] FlowCenter atualiza locks após compra/restore.
- [ ] Treino respeita flags (`femflow_ativa`, `femflow_has_personal`, `femflow_mode_personal`).
- [ ] Logs backend com correlation/idempotency para auditoria.
- [ ] TestFlight validado com conta sandbox (casos happy path + edge cases).

## Veredito final de prontidão

- **Arquitetura:** pronta (server-authoritative e com restore).
- **Modelagem dos produtos:** correta **se** ambos forem auto-renewable.
- **Chamadas de billing:** majoritariamente corretas.
- **Bridge JS↔iOS:** funcional, com pequenas lacunas de eventos/telemetria.
- **Status de publicação:** **ainda não pronto para review final** sem confirmação operacional em App Store Connect + rodada sandbox evidenciada.
