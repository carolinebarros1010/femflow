# Auditoria técnica — Checkout iOS / Entitlements / Consistência Front x GAS

Data: 2026-03-04
Escopo analisado: `app/core/femflow-core.js`, `app/js/home.js`, `app/js/flowcenter.js`, `staging/GAS/Get.gs`, `staging/GAS/Post.gs`, `staging/GAS/IapApple.gs`, `staging/GAS/Header.gs`.

## 1) Confirmação do fluxo (fim a fim)

### 1.1 Home (card bloqueado)
- Clique no card chama `handleCardClick(enfase, locked)`.
- Se `locked`, chama `openBlockedFlow({ enfase, checkoutTipo })`.
- `openBlockedFlow` chama `abrirCheckoutOuIap(checkoutTipo)`.
- `abrirCheckoutOuIap` delega para `abrirCheckout`.
- `abrirCheckout` chama `FEMFLOW.checkout.openCheckout({ reason: "locked_card", preferredPlan })`.

### 1.2 Home (ebook bloqueado)
- Clique no ebook chama `handleEbookClick(card)`.
- Se bloqueado, chama `openBlockedFlow()`.
- O fluxo converge para o mesmo `FEMFLOW.checkout.openCheckout(...)`.

### 1.3 FlowCenter (botões bloqueados)
- O helper `bloquearBotao` intercepta clique e chama `abrirCheckoutOuIap("personal"|"app")`.
- `abrirCheckoutOuIap` delega para `abrirCheckout`.
- `abrirCheckout` chama `FEMFLOW.checkout.openCheckout({ reason: "locked_card", preferredPlan })`.

### 1.4 Decisão por plataforma no entrypoint único
- `openCheckout` calcula plano (`access` / `personal`).
- Se **não iOS**: chama `openHotmart(targetPlan)`.
- Se **iOS**: tenta `FEMFLOW.iap.purchase(productId)`.
- Se compra retorna sucesso (`status === "ok"` ou `transactionId`), encerra sem modal.
- Se retorno for `stub/error/ignored` (ou exceção): abre modal iOS (`openPaywall`).

### 1.5 Confirmação das regras pedidas
- ✅ Home e FlowCenter convergem para `openCheckout`.
- ✅ iOS tenta IAP e faz fallback para paywall modal.
- ✅ Android/Web continuam via Hotmart no ramo `!isIOS()`.
- ⚠️ Há links Hotmart hardcoded ainda presentes em `home.js` e `flowcenter.js` (constantes), embora o caminho de bloqueio atual esteja centralizado em `openCheckout`.

### 1.6 Caminhos alternativos que podem abrir Hotmart no iOS
- `FEMFLOW.checkout.openHotmart` permanece público e chamável diretamente por qualquer código futuro.
- `home.js` define `window.FEMFLOW.LINK_*` com URLs Hotmart; isso não abre checkout sozinho, mas mantém a superfície para abertura externa.
- Existem páginas separadas de ebooks com links Hotmart (`app/ebooks/*.html`) que podem violar diretriz de iOS se acessíveis dentro do app nativo.

---

## 2) Consistência de regras (Front x GAS)

### 2.1 Produto base e personal como modo
- Backend Apple activate resolve ambos SKUs para `produto: "acesso_app"` e diferencia modo por `acesso_personal` (AE).
- Isso está alinhado com regra de negócio “Personal é modo, não produto”.

### 2.2 Entitlements (GAS)
- `entitlementsStatus_` devolve `acesso_app` e `modo_personal`.
- Se `source === "apple_iap"` e `IapExpiresAt` expirado, força `acesso_app=false` e `modo_personal=false`.

### 2.3 Entitlements (Front)
- `refreshEntitlements` chama action `entitlements_status`, atualiza localStorage e dispara evento `femflow:entitlementsUpdated`.
- `updateEntitlementsFromPayload` grava:
  - `femflow_ativa` por `acesso_app`
  - `femflow_produto` para `acesso_app` quando entitlement ativo
  - `femflow_mode_personal` e `femflow_has_personal` por `modo_personal`

### 2.4 Divergência importante com `validar`
- Home/FlowCenter dependem primariamente de `action=validar` para montar estado.
- `validar` considera `ativa` por `LicencaAtiva` (ou VIP) e **não aplica expiração Apple (`IapExpiresAt`)**.
- Portanto, após expiração Apple, `entitlements_status` pode negar acesso, mas `validar` continuar marcando `ativa=true`.

### 2.5 Ebooks
- Front define ebooks bloqueados quando `produto === trial_app`; liberados para `ativa=true` ou `vip`.
- Regra está coerente com o solicitado.

---

## 3) Bugs / riscos lógicos (com severidade)

## Alta
1. **Divergência crítica `validar` x `entitlements_status` (expiração Apple)**
   - Evidência: expiração só é aplicada em `entitlementsStatus_`; `validar` não considera `IapExpiresAt`.
   - Impacto: usuária iOS expirada pode continuar com acesso indevido; risco de inconsistência de cobrança e compliance.
   - Correção: aplicar regra de expiração também em `validar` (ou fazer `validar` consumir `entitlementsStatus_` internamente).

2. **Risco App Store: links/pistas de Hotmart no bundle iOS**
   - Evidência: constantes Hotmart em `home.js`, `flowcenter.js`, `femflow-core.js` e páginas `app/ebooks` com CTA externo.
   - Impacto: possível rejeição por “steering to external purchase” se revisores encontrarem rota/tela acessível.
   - Correção: em build iOS, remover/feature-flag todo texto/link Hotmart e esconder páginas com compra externa.

3. **Sem lock anti-duplo clique no purchase**
   - Evidência: `openCheckout` e botões do modal chamam `FEMFLOW.iap.purchase` sem mutex/inFlight.
   - Impacto: múltiplos disparos simultâneos de compra/activate, UX ruim, erros intermitentes.
   - Correção: implementar `purchaseInFlight` global + desabilitar botão até resolução.

## Média
4. **Race pós-compra: UI pode não refletir imediatamente em Home/FlowCenter**
   - Evidência: `refreshEntitlements` atualiza localStorage, mas Home/FlowCenter não escutam `femflow:entitlementsUpdated` para re-render imediato.
   - Impacto: card ainda bloqueado até recarregar/revalidar.
   - Correção: listeners em Home/FlowCenter para reaplicar regras após evento.

5. **Fallback parcial no modal (compra falha no modal não reabre fallback orientado)**
   - Evidência: botão `ff-ios-buy` chama `iap.purchase` diretamente e ignora resultado.
   - Impacto: em erro no plugin/rede, usuária fica sem feedback estruturado além eventual toast.
   - Correção: tratar retorno/erro no botão, exibir estado e CTA de retry.

6. **Restore sem feedback de resultado para usuário**
   - Evidência: botão restore chama `iap.restore()` sem UI de sucesso/falha.
   - Impacto: restore pode funcionar sem usuária saber; suporte aumenta.
   - Correção: toast/modal de sucesso, e erro contextual com próximos passos.

7. **Detecção iOS por user-agent pode afetar PWA em iPad/Mac touch**
   - Evidência: `isIOS` usa UA + `maxTouchPoints` além Capacitor platform.
   - Impacto: PWA web em iPad pode entrar em fluxo IAP sem plugin (vai cair em paywall fallback).
   - Correção: exigir `Capacitor.getPlatform()==ios` para comportamento de compra nativa, mantendo fallback explícito para web.

## Baixa
8. **Constante Hotmart não utilizada em `flowcenter.js`**
   - Evidência: `const LINK_ACESSO_APP` declarada e sem uso.
   - Impacto: ruído e risco de regressão futura.
   - Correção: remover constante morta.

9. **Dependência de índices fixos em partes do GAS**
   - Evidência: `Get.gs` lê `row[5]`, `row[7]`, etc.; embora `Header.gs` mantenha contrato canônico.
   - Impacto: quebra silenciosa se colunas mudarem fora do header oficial.
   - Correção: migrar leituras para map por nome (`header.indexOf`/header map), como já feito em IAP.

---

## 4) Edge cases simulados

1. **iOS sem plugin (webview/PWA)**
   - Comportamento: `iap.purchase` retorna `stub` → `openCheckout` abre paywall.
   - Resultado: fallback ok, sem Hotmart.

2. **iOS com plugin mas sem produtos carregados**
   - `purchase` independe de `listProducts` prévio; pode falhar no plugin.
   - Em erro/exceção no `openCheckout`: abre paywall.
   - No modal, nova tentativa pode repetir falha sem UX clara.

3. **Compra concluída no device, backend activate falha**
   - `purchase` chama `activatePurchaseOnBackend`; erro rejeita promise.
   - `openCheckout` captura e abre paywall.
   - Usuária pode ter pago, mas continuar bloqueada até restore/retry.

4. **Rede offline durante purchase/activate**
   - Se compra não inicia: fallback modal.
   - Se compra conclui e activate falha por rede: risco de “paguei e não liberou”.

5. **Restore em novo dispositivo**
   - `restore` itera transações ativas e chama activate para cada uma.
   - Depois chama `refreshEntitlements`.
   - Funcional, porém sem feedback UX robusto.

6. **Expiração Apple**
   - Em `entitlements_status`: re-bloqueia.
   - Em `validar`: pode continuar liberado (gap crítico).

7. **Migração Hotmart antiga para iOS IAP**
   - Apple activate força `Produto=acesso_app`; AE define personal.
   - Compatível com regra de produto base único.

8. **AE=true e LicencaAtiva=false**
   - Em `entitlements_status`, `modo_personal` pode vir true mesmo com `acesso_app=false` (quando não expirado por Apple).
   - No front, `femflow_has_personal=true` pode coexistir com acesso app negado; verificar se UI bloqueia corretamente cards base.

---

## 5) Conformidade App Store (risco de rejeição)

- **Texto/link externo no iOS**: há forte presença de links Hotmart no código e páginas de ebooks com compra externa.
- **Paywall iOS**: copy atual fala de assinatura in-app e tem botão restore (positivo).
- **Restore visível**: está presente no modal iOS.
- **Risco estimado**: **Médio/Alto**.
  - Médio se rotas externas não forem acessíveis no app iOS final.
  - Alto se qualquer tela iOS expuser CTA/link Hotmart.

---

## 6) Checklist “pronto para subir” (20 itens)

1. Validar card bloqueado Home (iOS) → tentativa IAP.
2. Validar card bloqueado FlowCenter (iOS) → tentativa IAP.
3. Confirmar fallback para modal em plugin ausente.
4. Confirmar fallback para modal em erro de purchase.
5. Confirmar Android/Web abre Hotmart normalmente.
6. Garantir nenhum CTA Hotmart aparece no build iOS.
7. Testar duplo clique rápido no botão de compra.
8. Testar compra aprovada + activate OK + desbloqueio imediato UI.
9. Testar compra aprovada + activate FAIL (mensagem e recovery).
10. Testar restore com assinatura ativa em novo dispositivo.
11. Testar restore sem assinatura (mensagem amigável).
12. Validar `entitlements_status` após purchase/restore.
13. Validar `validar` reflete expiração Apple (ajustar antes de subir).
14. Validar regra ebooks: trial bloqueia; ativa/vip libera.
15. Validar AE/personal: modo ligado apenas por coluna AE, não produto.
16. Confirmar Apple activate grava `Produto=acesso_app`.
17. Testar downgrade/upgrade entre SKUs do grupo de assinatura.
18. Revisar logs essenciais (`purchase`, `activate`, `entitlements`, `restore`).
19. Revisar strings PT/EN/FR do paywall e mensagens bloqueio.
20. Testar expiração real/simulada (ISO + timezone) e re-bloqueio total.

---

## 7) Veredito

- **Está conforme interesse?** **Parcial**.
- **Está pronto para produção iOS?** **Não**, devido a gap crítico entre `validar` e `entitlements_status` + risco de compliance por links externos.
- **Top 3 correções antes de review Apple**:
  1. Unificar regra de entitlement/expiração em `validar` e `entitlements_status`.
  2. Implementar lock de concorrência e UX de erro/sucesso para purchase/restore.
  3. Remover/ocultar totalmente referências Hotmart no build iOS (código, textos e páginas acessíveis).
