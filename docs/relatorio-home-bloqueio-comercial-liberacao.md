# Relatório técnico — Fluxo de bloqueio/comercial/liberação da Home (FemFlow)

## 1. Resumo executivo

- **Veredito objetivo:** a Home já separa corretamente “direito de acesso” (backend: `femflow_has_personal`) de “modo personal” (estado de uso local: `femflow_mode_personal`), e renderiza bloqueio/liberação por card via `avaliarAcessoCard` + `podeAcessar` + `free_access`. O fluxo base é server-authoritative para entitlements (`validar`/`entitlements_status`) e não libera conteúdo de treino apenas por clique local.
- **Lógica real hoje:** cards são classificados por categoria (`followme`, `personal`, `muscular`, `esportes`, `casa`, `custom`) e bloqueados quando não passam na regra de produto/ativa/free access. Clique em card bloqueado cai em `openBlockedFlow`, que mostra toast e, na maioria dos casos, abre paywall (`FEMFLOW.billing.openPaywall`).
- **Gargalo/inconsistência:** existem exceções que desviam do CTA comercial padrão:
  1. para `produto=acesso_app` ativo e `checkoutTipo!="personal"`, `openBlockedFlow` **não abre checkout**, só toast orientando “Monte seu treino”;
  2. cards `followme_*` bloqueados mostram “Em breve...” e também **não abrem checkout**;
  3. o card `personal`/`bodyinsight` usa `checkoutTipo="personal"`, portanto mantém CTA comercial específico para plano Personal.
- **Recomendação principal:** centralizar decisão de CTA bloqueado em um único resolver (ex.: `resolveBlockedCardAction`) separado da regra de acesso (`podeAcessar`/`avaliarAcessoCard`), preservando as exceções intencionais (FollowMe “em breve” e Endurance público), e mantendo `FEMFLOW.billing.openPaywall(planId)` como gateway para futura troca de Hotmart por paywall nativo.

---

## 2. Mapeamento do fluxo atual

### 2.1 Passo a passo da Home

1. `DOMContentLoaded` em `home.js` executa skeleton, auto-login e busca de perfil via `action=validar` (`carregarPerfilEAtualizarStorage`).
2. Em sucesso (`status="ok"`), `persistPerfil(perfil)` grava `produto`, `ativa`, `has_personal`, `free_access`, ciclo etc.
3. `rerenderHomeEntitlementsUI()` monta catálogo via Firebase (`carregarCatalogoFirebase`), injeta cards simbólicos e renderiza rails.
4. Cada card renderizado chama `handleCardClick(enfase, locked)`.
5. Se `locked=true`, executa `openBlockedFlow({ enfase, checkoutTipo })`.

### 2.2 Como perfil influencia UI

- `produto` + `ativa` + `femflow_has_personal` + `free_access` definem `locked` por card (`avaliarAcessoCard`).
- `femflow_has_personal` vem do backend (`perfil.acessos.personal`/VIP) e é persistido como direito.
- `femflow_mode_personal` é estado de uso; só ativa ao clicar card `personal` desbloqueado.
- `free_access` (enabled/until/enfases) pode destravar card específico sem alterar produto base.

### 2.3 Impacto de produto/ativa/personal no render e clique

- `hasPersonal=true`: libera quase tudo, exceto categoria `followme`.
- `produto=vip`: libera tudo.
- `produto=followme_*`: libera apenas a própria ênfase followme correspondente.
- `produto=acesso_app` + `ativa=true`: libera categorias `muscular`, `esportes`, `casa`, `custom`; não libera `personal` nem `followme`.
- Clique bloqueado:
  - `personal`/`bodyinsight` -> mensagem + paywall `personal`;
  - cards gerais bloqueados -> mensagem + paywall `access`;
  - exceções: `followme_*` bloqueado (somente “Em breve”), e alguns cenários `acesso_app` ativo (somente orientação de uso).

---

## 3. Inventário de regras encontradas

### 3.1 `app/js/home.js`

- **Perfil e persistência:** `carregarPerfilEAtualizarStorage`, `persistPerfil`, `normalizarFreeAccess`, `isFreeValid`.
- **Classificação de card:** `inferirCategoria`, `categoriaSegueRegrasAcessoApp`.
- **Acesso por card:** `podeAcessar`, `avaliarAcessoCard`, `aplicarAcessoCards`.
- **Construção do catálogo:** `carregarCatalogoFirebase`, `injetarCardsPresets`.
- **Cards simbólicos:** `CARDS_PERSONAL_SIMBOLICOS`, `CARDS_BODYINSIGHT_SIMBOLICOS`, `CARDS_PLANILHAS_30_DIAS`, `CARDS_FOLLOWME_SIMBOLICOS`.
- **Render e clique:** `renderRail`, `handleCardClick`, `openBlockedFlow`, `abrirCheckout`, `abrirCheckoutOuIap`.

### 3.2 `app/js/flowcenter.js`

- Duplica camada de mensagem/checkout: `msgCheckout`, `abrirCheckout`, `abrirCheckoutOuIap`.
- Duplica parse/free access: `parseBooleanish`, `parseFreeEnfases`, `normalizarFreeAccess`.
- Mantém bloqueios específicos de botões (`toCustomTrain`, `toEndurance`) com `bloquearBotao`.
- Em vários cenários usa toast sem checkout (ex.: Endurance app sem planilha pública).

### 3.3 `app/core/femflow-core.js`

- `FEMFLOW.toast` (infra de mensagens).
- `FEMFLOW.canAccessEbooks` (lógica de eBooks).
- `FEMFLOW.openExternal` bloqueia Hotmart externo no iOS nativo.
- `FEMFLOW.refreshEntitlements` (`action=entitlements_status`) + `updateEntitlementsFromPayload` (atualização local pós-compra/restore).

### 3.4 `app/js/billing/*`

- `billing/access.js`: API unificada `FEMFLOW.billing.openPaywall(planId, context)`.
- `billing/checkout.js`: gateway por plataforma (iOS -> IAP; web/android -> Hotmart externo via adapter).
- `billing/checkout-hotmart.js`: resolve URLs Hotmart e abertura externa segura.

### 3.5 `app/js/treino.js` e `app/js/treino-engine.js`

- `treino.js` respeita `femflow_has_personal` (direito) + `femflow_mode_personal` (modo).
- `treino-engine.js` separa origem de dados de treino (`personal_trainings` vs `exercicios`) por flag `personal`.
- Não há desbloqueio comercial local de conteúdo: o consumo de treino depende do estado de acesso já vindo da Home/FlowCenter/backend.

---

## 4. Comportamento atual por tipo de card (matriz)

| Tipo do card | Condição de acesso | Renderização | Clique bloqueado | Destino final | Dependência backend |
|---|---|---|---|---|---|
| `personal` | `hasPersonal` (ou VIP) | Card em rail Personal, bloqueado quando sem direito | Toast de Personal + `openPaywall("personal")` | Paywall personal (iOS IAP / web Hotmart) | `validar` (`acessos.personal`) |
| `bodyinsight` | Mesma trilha comercial de personal; desbloqueado por regra de acesso + autenticação Firebase extra | Card na rail Personal (simbólico + acesso aplicado) | Toast de Personal + paywall personal | Se liberado: rota `body_insight.html` após confirmação auth | `validar` + auth Firebase |
| `followme_*` | VIP ou produto exato followme | Rail FollowMe | **Exceção:** toast “Em breve...” sem checkout | Nenhum | `validar` (produto) |
| `muscular`/`esportes`/`casa`/`custom` | `acesso_app` ativo (ou VIP, ou free_access específico, ou hasPersonal) | Rails principais, `locked` por card | Toast de App + `openPaywall("access")` | Paywall access | `validar` + `free_access` |
| `planilha_*` 30 dias | Regra de acesso por card + free | Rail dedicada com cards simbólicos | Em bloqueio segue fluxo app, com exceção `acesso_app` ativo que orienta Home/Monte treino | Se liberado: abre fluxo Endurance no FlowCenter | `validar` + local flags de endurance |
| eBooks | `FEMFLOW.canAccessEbooks()` (`ativa` ou VIP, não trial) | Rail eBooks com lock overlay | `openBlockedFlow()` padrão app | Paywall access (salvo exceções globais) | `validar`/estado local |

---

## 5. Diagnóstico do problema

1. **Por que card bloqueado “só mensagem” em parte dos casos:**
   - Em Home, `openBlockedFlow` contém retornos antecipados que suprimem CTA comercial:
     - `produto=acesso_app` ativo + `checkoutTipo!="personal"` -> toast de orientação e `return`;
     - `enfase startsWith("followme_")` -> toast “Em breve...” e `return`.
2. **Por que Personal é diferente (lógica Hotmart/comercial):**
   - `handleCardClick` define `checkoutTipo="personal"` para `personal` e `bodyinsight`, então bypassa a exceção de `acesso_app` e cai no fluxo de CTA/pagamento dedicado.
3. **Intencional x legado x inconsistência:**
   - Há traço intencional para FollowMe “vitrine em breve”.
   - Há comportamento híbrido legado/comercial entre Home e FlowCenter (mensagens e bloqueios duplicados).
   - Resultado prático: UX inconsistente entre cards bloqueados de trilhas diferentes.

---

## 6. Riscos e impactos

1. **Regressão de conversão/compliance:** mudar FollowMe para checkout sem alinhar estratégia comercial pode quebrar expectativa de “em breve”.
2. **Conflito Home x FlowCenter:** ambos têm regras/toasts/checkout próprios; ajustar só Home pode manter inconsistência no FlowCenter.
3. **Risco em entitlements:** `updateEntitlementsFromPayload` em core força `femflow_has_personal` com base em `modo_personal`, potencialmente conflitando com semântica “direito x modo” se payload vier parcial.
4. **i18n:** `msgCheckout` está duplicada e hardcoded em Home/FlowCenter (pt/en/fr), fora do `lang.js`.
5. **Futuro paywall nativo:** boa notícia: Home/FlowCenter já chamam `FEMFLOW.billing.openPaywall`, então troca de provedor está relativamente desacoplada; o problema maior é a decisão de **quando** chamar CTA, não **como** comprar.

---

## 7. Recomendação de arquitetura

1. **Separar 3 camadas explicitamente:**
   - `accessPolicy` (liberado/bloqueado) — já existe parcialmente em `podeAcessar`/`avaliarAcessoCard`.
   - `blockedActionPolicy` (mensagem/CTA/destino por contexto).
   - `checkoutGateway` (já centralizado em billing).
2. **Criar helper dedicado para bloqueio de card**, por exemplo:
   - `resolveBlockedCardAction({ enfase, categoria, produto, ativa, hasPersonal, source })` -> `{ type: "toast_only" | "checkout", planId, messageKey, reason }`.
3. **Centralizar mensagens em i18n (`lang.js`)** e remover duplicação `msgCheckout` em Home/FlowCenter.
4. **Preservar Personal como vitrine comercial dedicada** com planId `personal`.
5. **Manter backend-authoritative:** nenhum unlock local; apenas navegação/CTA local.

---

## 8. Plano de implementação sugerido

### Patch mínimo seguro

- Alterar só `home.js`:
  - introduzir resolver local para bloqueios;
  - manter FollowMe `toast_only`;
  - manter Personal `checkout(personal)`;
  - para demais cards bloqueados, padronizar CTA `access`.

**Vantagem:** baixo risco, rápida entrega.

**Limite:** FlowCenter continua duplicado/inconsistente.

### Patch ideal

- Criar módulo compartilhado (ex.: `app/js/billing/blocked-cta-policy.js`):
  - regras de mensagem + decisão CTA;
  - usar em Home e FlowCenter;
  - mover copy para `lang.js`.

**Vantagem:** elimina divergência estrutural e prepara troca de Hotmart por paywall nativo sem mexer em telas.

**Custo:** alteração em mais arquivos e validação cruzada maior.

### Recomendação final

- Executar **patch mínimo seguro** agora para destravar problema do card Personal x demais cards bloqueados na Home.
- Planejar **patch ideal** na sequência curta para convergir Home/FlowCenter.

---

## 9. Critérios de aceite

### Deve funcionar após ajuste

1. Card `personal` bloqueado -> mensagem comercial de Personal + CTA `planId=personal`.
2. Card `bodyinsight` bloqueado -> mesma trilha de Personal.
3. Cards app bloqueados (`muscular/esportes/casa/custom/planilhas/ebooks`) -> mensagem comercial de App + CTA `planId=access`.
4. FollowMe bloqueado mantém comportamento definido pela estratégia atual (se mantido “em breve”, sem checkout).
5. Nenhum card desbloqueia conteúdo sem entitlement backend válido.

### Não deve mudar

1. Regra de liberação por `validar`/`acessos`/`free_access`.
2. Semântica `has_personal` (direito) x `mode_personal` (modo).
3. Rotas de treino e consumo de conteúdo no `treino.js`/`treino-engine.js`.

### Testes manuais recomendados

- Usuária `trial_app`.
- Usuária `acesso_app` ativa sem personal.
- Usuária com `acessos.personal=true`.
- Usuária `vip`.
- Usuária `followme_*`.
- Caso com `free_access.enabled=true` e `enfase` específica liberada.
- iOS nativo vs web/android para validar gateway de checkout.

---

## 10. Proposta de patch (sem implementar)

### Funções a alterar

1. `app/js/home.js`
   - `openBlockedFlow`
   - `handleCardClick`
   - (novo) `resolveBlockedCardAction`
   - (novo) `getBlockedMessageByKey`

2. `app/js/flowcenter.js` (ideal/fase 2)
   - substituir `msgCheckout`/`bloquearBotao` por policy compartilhada.

### Helpers a criar

- `resolveBlockedCardAction(context)`
  - entrada: `enfase`, `categoria`, `produto`, `ativa`, `hasPersonal`, `source`.
  - saída: `{ toastKey, checkoutPlanId|null, skipCheckout, reasonCode }`.

### Strings/constants a centralizar

- Mensagens de bloqueio app/personal/followme/endurance em `lang.js`.
- Chaves de motivo (`locked_card`, `blocked_followme_coming_soon`, etc.) para telemetria.

### O que não deve ser tocado

- Backend `validar` / `entitlements_status`.
- Estrutura de planilha/schema de entitlements.
- Regras de unlock de conteúdo em `treino-engine`.
- Fluxo de auth/login.

