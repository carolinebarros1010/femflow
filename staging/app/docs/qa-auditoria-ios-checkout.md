# Re-auditoria técnica — iOS Checkout / IAP / Entitlements (pós-correções)

Data: 2026-03-04
Escopo auditado (código atual):
- `app/core/femflow-core.js`
- `app/js/home.js`
- `app/js/flowcenter.js`
- `staging/GAS/Get.gs`
- `staging/GAS/Post.gs`
- `staging/GAS/IapApple.gs`
- `staging/GAS/Header.gs`

---

## 0) Resumo executivo

### Status geral
- **Convergência de fluxo Home/FlowCenter para `openCheckout`: OK**.
- **Roteamento por plataforma (iOS IAP, Android/Web Hotmart): OK**.
- **Regra de produto base `acesso_app` + personal por AE: OK no Apple Activate**.
- **Gap crítico ainda aberto:** `validar` não aplica expiração Apple (`IapExpiresAt`), enquanto `entitlements_status` aplica.
- **Risco App Store ainda presente:** referências/links Hotmart continuam no bundle e em páginas que podem ser acessadas no iOS.

### Veredito rápido
- Conforme interesse: **Parcial**.
- Pronto para produção iOS: **Não**.

---

## 1) CONFIRMAÇÃO DO FLUXO (fim a fim)

## 1.1 Home — clique em card bloqueado
Cadeia chamada:
1. `renderRail` registra click em `.card`.
2. click chama `handleCardClick(enfase, locked)`.
3. se `locked === true`, chama `openBlockedFlow({ enfase, checkoutTipo })`.
4. `openBlockedFlow` chama `abrirCheckoutOuIap(checkoutTipo)`.
5. `abrirCheckoutOuIap` delega para `abrirCheckout`.
6. `abrirCheckout` chama `FEMFLOW.checkout.openCheckout({ reason: "locked_card", preferredPlan })`.

## 1.2 Home — clique em ebook bloqueado
Cadeia chamada:
1. `renderEbookRail` registra click.
2. `handleEbookClick(card)`.
3. se `locked`, chama `openBlockedFlow()`.
4. converge para `FEMFLOW.checkout.openCheckout(...)`.

## 1.3 FlowCenter — botões bloqueados
Cadeia chamada:
1. `bloquearBotao` intercepta clique.
2. chama `abrirCheckoutOuIap("personal"|"app")`.
3. delega para `abrirCheckout`.
4. `abrirCheckout` chama `FEMFLOW.checkout.openCheckout({ reason: "locked_card", preferredPlan })`.

## 1.4 Entry point único e comportamento por plataforma
No `FEMFLOW.checkout.openCheckout`:
- `preferredPlan` mapeia para `access/personal`.
- Se **não iOS** (`!isIOS()`): `openHotmart(targetPlan)`.
- Se **iOS**:
  - tenta `FEMFLOW.iap.purchase(productId)`;
  - sucesso se `status="ok"` ou `transactionId` presente;
  - fallback para `openPaywall(...)` em `stub/error/ignored` ou exceção.

## 1.5 Conclusão da seção
- ✅ Home e FlowCenter convergem no mesmo entrypoint (`openCheckout`).
- ✅ iOS tenta IAP e faz fallback para modal paywall.
- ✅ Android/Web seguem Hotmart.
- ⚠️ Ainda existem superfícies de Hotmart no código (ver seção 5).

## 1.6 Caminhos alternativos que ainda podem abrir Hotmart no iOS
- `FEMFLOW.checkout.openHotmart` continua público e acionável por qualquer chamada direta.
- `home.js` continua setando `window.FEMFLOW.LINK_ACESSO_APP` e `window.FEMFLOW.LINK_PERSONAL`.
- Páginas `app/ebooks/*.html` mantêm CTAs de compra externa (Hotmart).

---

## 2) CONSISTÊNCIA DE REGRAS (Front x GAS)

## 2.1 Regra produto base + personal modo
### Backend (Apple Activate)
`iapAppleActivate_`:
- resolve SKU `access` e `personal` para `Produto = acesso_app`;
- define personal por `acesso_personal` (AE);
- marca `LicencaAtiva = true`;
- persiste metadados IAP (`IapExpiresAt`, `IapSource`, etc.).

✅ Alinhado com regra: **Personal não é produto, é modo (AE)**.

## 2.2 Regra de entitlements
### Backend (`entitlements_status`)
`entitlementsStatus_` retorna:
- `acesso_app`
- `modo_personal`
- `source/plan/expiresAt/produto`

E aplica expiração Apple:
- se `source === apple_iap` e `IapExpiresAt` expirado: força `acesso_app=false` e `modo_personal=false`.

### Front (`refreshEntitlements`)
- chama action `entitlements_status`;
- atualiza localStorage com `updateEntitlementsFromPayload`;
- emite evento `femflow:entitlementsUpdated`.

## 2.3 Divergência ainda existente com `validar`
`_validarPerfil_` (fonte principal de Home/FlowCenter) ainda calcula `ativa` por `LicencaAtiva`/VIP e **não lê/aplica `IapExpiresAt`**.

Impacto:
- sessão pode vir “ativa” via `validar`, mas “expirada” via `entitlements_status`.
- comportamento pode oscilar conforme endpoint consumido no momento.

## 2.4 Ebooks
No front (`FEMFLOW.canAccessEbooks` e fallback em `home.js`):
- `trial_app` => bloqueado
- `ativa=true` ou `vip` => liberado

✅ Regra dos ebooks está aderente ao solicitado.

---

## 3) ANÁLISE DE BUGS / RISCOS LÓGICOS (com severidade)

## Alta
1. **Divergência de autorização entre `validar` e `entitlements_status`**
   - Evidência: expiração Apple só é aplicada em `entitlementsStatus_`.
   - Impacto: acesso incorreto pós-expiração, inconsistência de estado e risco de cobrança/compliance.
   - Correção: centralizar cálculo de entitlement em função única consumida por ambos endpoints.

2. **Risco de steering externo no iOS (App Review)**
   - Evidência: URLs Hotmart continuam no core/home e páginas de ebooks com CTA externo.
   - Impacto: possível rejeição App Store se revisores encontrarem rota/tela acessível.
   - Correção: build flag iOS para remover/esconder qualquer compra externa e texto relacionado.

3. **Sem trava de concorrência de compra (multi-clique)**
   - Evidência: `openCheckout` e botão buy do modal disparam `iap.purchase` sem `inFlight`.
   - Impacto: múltiplas tentativas simultâneas, duplicidade de chamadas e UX degradada.
   - Correção: mutex transacional + estado de loading/disable em botões.

## Média
4. **Race de atualização de UI após purchase/restore**
   - Evidência: há evento `femflow:entitlementsUpdated`, mas Home/FlowCenter não re-renderizam explicitamente nesse evento.
   - Impacto: tela pode permanecer bloqueada até refresh/navigation.
   - Correção: listeners para recomputar bloqueios e re-render local.

5. **Fallback do modal com pouca observabilidade de erro**
   - Evidência: botão buy no modal chama `iap.purchase` e ignora retorno.
   - Impacto: falha sem feedback claro de causa/ação seguinte.
   - Correção: capturar status/erro, mostrar mensagem e opção de tentar novamente.

6. **Restore sem feedback explícito no fluxo de UX**
   - Evidência: botão restore chama `iap.restore()` sem confirmação visual robusta.
   - Impacto: usuária não sabe se restaurou; aumenta chamados de suporte.
   - Correção: toasts/estado de sucesso/erro + refresh visual do bloqueio.

## Baixa
7. **Detecção iOS por UA pode classificar PWA como iOS nativo**
   - Evidência: `isIOS()` mistura `Capacitor.getPlatform()` + heurística de user-agent.
   - Impacto: PWA iPad/Mac touch pode cair em tentativa IAP sem plugin.
   - Correção: priorizar detecção de runtime nativo quando necessário para compra.

8. **Constante Hotmart não utilizada no FlowCenter**
   - Evidência: `const LINK_ACESSO_APP` em `flowcenter.js` sem uso funcional.
   - Impacto: ruído e chance de regressão.
   - Correção: remover constante morta.

9. **Leitura por índice fixo em partes do GAS**
   - Evidência: `_validarPerfil_` usa `row[5]`, `row[7]` etc.
   - Impacto: manutenção frágil se schema mudar.
   - Correção: migrar para mapa por header (`header.indexOf`/mapa único).

---

## 4) EDGE CASES (simulação técnica)

1. **iOS sem plugin (webview/PWA)**
- Resultado atual: `purchase` retorna `stub` ⇒ `openCheckout` cai no paywall.
- Avaliação: fallback funcional e sem Hotmart.

2. **iOS com plugin, sem produtos carregados**
- `purchase` pode falhar no plugin; `openCheckout` abre paywall em exceção/erro.
- Avaliação: funcional, mas sem UX clara no modal para diagnóstico.

3. **Compra concluída, backend activate falha**
- `purchase` rejeita ao falhar `activatePurchaseOnBackend`.
- `openCheckout` cai no catch e abre paywall.
- Avaliação: risco de “paguei e não liberou” até restore/retry.

4. **Rede offline em purchase/activate**
- Purchase pode falhar cedo (fallback modal).
- Se compra conclui no device e falha no activate por rede, entitlement pode atrasar.
- Avaliação: precisa estratégia de retry automático/sincronização posterior.

5. **Restore em novo dispositivo**
- `restore` percorre transações ativas, ativa no backend, depois refresh entitlements.
- Avaliação: core correto; falta UX de confirmação.

6. **Expiração Apple**
- `entitlements_status`: re-bloqueia corretamente.
- `validar`: ainda pode manter ativa.
- Avaliação: inconsistência crítica permanece.

7. **Usuária Hotmart antiga migra para iOS IAP**
- Apple activate normaliza `Produto=acesso_app` e AE para personal.
- Avaliação: coerente com regra de negócio.

8. **AE=true e LicencaAtiva=false**
- `entitlements_status` pode retornar `modo_personal=true` com `acesso_app=false` (caso não expirado por Apple e dados inconsistentes).
- Avaliação: validar regra de negócio desejada; pode exigir normalização para evitar personal sem base ativa.

---

## 5) CONFORMIDADE APP STORE (risco de rejeição)

## Checklist de compliance observado
- iOS bloqueado não deve abrir Hotmart: **OK no fluxo central `openCheckout`**.
- Paywall iOS sem menção explícita a Hotmart: **OK**.
- Botão restore visível: **OK**.
- Referências externas de compra no bundle: **NÃO OK** (ainda existem).

## Classificação de risco
- **Risco de rejeição: Médio/Alto**.
  - **Médio** se rotas externas estiverem realmente inacessíveis no app iOS de review.
  - **Alto** se qualquer caminho navegável mostrar CTA/link Hotmart no iOS.

---

## 6) CHECKLIST FINAL — “PRONTO PARA SUBIR” (20 itens)

1. Home card bloqueado (iOS) tenta IAP antes de qualquer outra ação.
2. FlowCenter bloqueado (iOS) tenta IAP no mesmo entrypoint.
3. Ebooks bloqueados em trial_app.
4. Ebooks liberados em assinante (`LicencaAtiva=true`) e VIP.
5. Fallback paywall abre quando plugin ausente.
6. Fallback paywall abre quando purchase retorna erro.
7. Android/Web continuam abrindo Hotmart.
8. Nenhuma rota iOS navegável exibe CTA de pagamento externo.
9. Strings PT/EN/FR revisadas no paywall e toasts de bloqueio.
10. Duplo clique no comprar não gera múltiplas compras.
11. Compra aprovada + activate ok desbloqueia UI sem reload.
12. Compra aprovada + activate fail mostra erro recuperável.
13. Restore em novo device reativa entitlements com feedback claro.
14. `entitlements_status` consistente com dados de planilha.
15. `validar` consistente com `entitlements_status` para expiração Apple.
16. Expiração (`IapExpiresAt`) testada com timezone/ISO real.
17. `iap_apple_activate` grava `Produto=acesso_app` para ambos SKUs.
18. `acesso_personal` (AE) é a única fonte de personal entitlement.
19. Logs de purchase/activate/restore/entitlements capturados para suporte.
20. Testes de downgrade/upgrade no grupo de assinatura validados.

---

## 7) VEREDITO

- **Está conforme interesse?** **Parcial**.
- **Está pronto para produção iOS?** **Não**.

### 3 correções prioritárias antes de enviar para review
1. **Unificar entitlement entre `validar` e `entitlements_status`**, incluindo expiração Apple em ambos.
2. **Remover/ocultar toda superfície de compra externa no build iOS** (código, páginas e strings).
3. **Adicionar controle de concorrência + feedback UX robusto** para purchase/restore (loading, sucesso, erro, retry).
