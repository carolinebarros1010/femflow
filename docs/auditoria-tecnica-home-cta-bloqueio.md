# Auditoria técnica profunda — Home cards, CTA comercial e regras de bloqueio (FemFlow)

## 1) Arquitetura atual (origem e propagação de estado)

### 1.1 Fonte de verdade do estado da usuária

A origem primária continua sendo o backend via `action=validar`.

- **Home** chama `carregarPerfilEAtualizarStorage()` e monta URL `?action=validar&id|email`.【F:app/js/home.js†L296-L314】
- **FlowCenter** chama `flowcenterSyncPerfil()` com cache curto (15s), também via `?action=validar&id|email`.【F:app/js/flowcenter.js†L200-L233】
- **Core/Treino** também possuem caminho de validação (`FEMFLOW.carregarPerfil`) para revalidação de estado durante a sessão de treino.【F:app/core/femflow-core.js†L3324-L3384】

### 1.2 Persistência local (frontend)

Após `validar`, os dados são normalizados e persistidos em `localStorage`.

- **Home** (`persistPerfil`) grava `femflow_produto`, `femflow_ativa`, `femflow_has_personal`, `femflow_free_access`, `femflow_fase`, `femflow_diaCiclo`, `femflow_diaPrograma`, `femflow_enfase`; e garante separação entre direito personal e modo personal (`femflow_mode_personal`).【F:app/js/home.js†L494-L533】
- **FlowCenter** (`flowcenterPersistPerfil`) também atualiza `femflow_fase`, `femflow_diaCiclo`, `femflow_diaPrograma`, `femflow_free_access`, `femflow_enfase` (somente se válida), e `femflow_has_personal`.【F:app/js/flowcenter.js†L235-L269】
- **Core** (`FEMFLOW.carregarPerfil`) reforça a mesma família de chaves durante carregamentos secundários (treino/revalidação).【F:app/core/femflow-core.js†L3332-L3376】

### 1.3 Onde cada campo pedido é usado

- **`produto`**: decisão de acesso e lock em Home/FlowCenter; inferência de permissões comerciais e de rota (`vip`, `acesso_app`, `followme_*`, `trial_app`).【F:app/js/home.js†L697-L725】【F:app/js/flowcenter.js†L188-L193】【F:app/js/flowcenter.js†L1883-L1946】
- **`ativa`**: gate adicional para acesso app em Home/FlowCenter, e para botão custom/endurance no FlowCenter.【F:app/js/home.js†L703-L724】【F:app/js/flowcenter.js†L293-L299】【F:app/js/flowcenter.js†L1913-L1917】
- **`personal`** (direito): em Home usa `femflow_has_personal`; em Treino combina `has_personal` + `mode_personal` para modo efetivo, sem liberar por clique local isolado.【F:app/js/home.js†L500-L533】【F:app/js/home.js†L697-L708】【F:app/js/treino.js†L34-L39】【F:app/js/treino.js†L813-L825】
- **`fase`**: define contexto fisiológico e busca de treino/caminhos; persistida e revalidada nos fluxos de perfil/treino.【F:app/js/home.js†L515-L517】【F:app/js/flowcenter.js†L237-L239】【F:app/js/treino.js†L880-L897】
- **`diaCiclo`**: contexto de seleção de treino e chamadas de engine por fase/dia; também usado em persistência de progresso.【F:app/js/home.js†L516-L517】【F:app/js/treino.js†L882-L927】【F:app/js/treino-engine.js†L746-L779】
- **`diaPrograma`**: progresso longitudinal no programa, validações mínimas em Home e uso no Treino/alerts/registro de evolução.【F:app/js/home.js†L1817-L1821】【F:app/js/flowcenter.js†L1911-L1917】【F:app/js/treino.js†L406-L421】

---

## 2) Mapa de dependências por comportamento (acesso, bloqueio, mensagem, redirect, CTA)

## 2.1 Home

- **Liberar/bloquear card**: `inferirCategoria` → `podeAcessar` → `avaliarAcessoCard` → `aplicarAcessoCards`.【F:app/js/home.js†L681-L790】
- **Renderização**: `carregarCatalogoFirebase` + `injetarCardsPresets` + `rerenderHomeEntitlementsUI` + `renderRail`.【F:app/js/home.js†L792-L885】【F:app/js/home.js†L1400-L1447】
- **Clique/roteamento**: `handleCardClick` decide bloqueado/liberado e rotas (`flowcenter`, `body_insight`, modais).【F:app/js/home.js†L1738-L1835】
- **CTA comercial**: `openBlockedFlow` + `msgCheckout` + `abrirCheckout` (`FEMFLOW.billing.openPaywall`).【F:app/js/home.js†L1340-L1392】

## 2.2 FlowCenter

- **Sincronização de perfil**: `flowcenterSyncPerfil` + `flowcenterPersistPerfil`.【F:app/js/flowcenter.js†L200-L269】
- **Locks de botões**: `refreshFlowcenterLocksFromEntitlements` e `bloquearBotao` (com opção de bloquear checkout).【F:app/js/flowcenter.js†L277-L300】【F:app/js/flowcenter.js†L712-L737】
- **CTA comercial**: `msgCheckout` + `abrirCheckout` + `abrirCheckoutOuIap`; chamados em `toTrain`, extras e bloqueios de botões.【F:app/js/flowcenter.js†L36-L63】【F:app/js/flowcenter.js†L1863-L1917】

## 2.3 Treino

- **Dependência de estado**: lê `has_personal` + `mode_personal`, valida `enfase`, `fase`, `diaCiclo`, `diaPrograma` antes de montar sessão de treino.【F:app/js/treino.js†L34-L39】【F:app/js/treino.js†L843-L927】
- **Revalidação dinâmica**: `revalidarPerfilTreino()` chama `FEMFLOW.carregarPerfil` e encerra treino se estado mudou no backend.【F:app/js/treino.js†L402-L432】

## 2.4 Treino Engine

- **Origem dos blocos por estado**: separa caminhos de dados para treino normal (`exercicios`) e personal (`personal_trainings`) conforme `personal` e contexto de fase/dia/enfase.【F:app/js/treino-engine.js†L746-L779】【F:app/js/treino-engine.js†L1130-L1159】

## 2.5 Respiração e helpers globais

- **Respiração**: não há `app/js/respiracao.js`; o fluxo observado usa roteamento direto (`respiracao.html`) em FlowCenter/Treino e CTA contextual dentro de Treino. Não há gate comercial no código analisado para esse atalho. 【F:app/js/flowcenter.js†L742-L745】【F:app/js/treino.js†L1383-L1411】
- **Helper global comercial**: `FEMFLOW.billing.openPaywall(planId, context)` é o ponto central de checkout chamado por Home/FlowCenter.【F:app/js/billing/access.js†L1-L17】

---

## 3) Home — fluxo detalhado de renderização → interação → ação

1. **Carrega perfil e persiste estado** (`validar` + localStorage).【F:app/js/home.js†L296-L314】【F:app/js/home.js†L494-L533】
2. **Monta catálogo Firebase** (`exercicios`) e normaliza `enfase`/categoria por doc.【F:app/js/home.js†L814-L880】
3. **Avalia lock por card** com regra produto+ativa+hasPersonal + exceção `free_access` por ênfase e validade temporal.【F:app/js/home.js†L759-L779】
4. **Injeta cards simbólicos**:
   - Personal (`personal`, `monte_seu_treino`).【F:app/js/home.js†L891-L924】
   - BodyInsight simbólico (entra no rail personal/custom).【F:app/js/home.js†L926-L935】
   - FollowMe simbólico quando vazio.【F:app/js/home.js†L1110-L1127】【F:app/js/home.js†L1431-L1437】
   - Planilhas 30 dias (rail dedicado).【F:app/js/home.js†L937-L1108】【F:app/js/home.js†L1445-L1446】
5. **Renderiza rails e bind de clique** em cada card via `renderRail`/`handleCardClick`.【F:app/js/home.js†L1309-L1317】【F:app/js/home.js†L1440-L1447】
6. **Interação**:
   - bloqueado ⇒ `openBlockedFlow` (toast/checkout ou toast-only por exceções).【F:app/js/home.js†L1369-L1392】
   - liberado ⇒ rotas/modais por tipo (bodyinsight, planilha, followme, treino comum, ciclo não configurado).【F:app/js/home.js†L1750-L1835】

---

## 4) Clique no card — caminhos exatos

### 4.1 Card liberado

- Função: `handleCardClick`.
- Fluxos:
  - `bodyinsight`: `garantirAcessoBodyInsight()` e `router("body_insight.html")`.【F:app/js/home.js†L1750-L1755】
  - `planilha_*`: abre modal e inicia Endurance público via FlowCenter.【F:app/js/home.js†L1757-L1759】【F:app/js/home.js†L1493-L1517】
  - `monte_seu_treino`: abre confirmação/modal custom.【F:app/js/home.js†L1767-L1770】
  - `personal`: ativa `femflow_mode_personal=true` (se acesso app ativo) e vai para FlowCenter.【F:app/js/home.js†L1781-L1791】
  - demais: valida ciclo/config mínimo e abre modal de novo programa.【F:app/js/home.js†L1799-L1835】

### 4.2 Card bloqueado

- Função: `openBlockedFlow`.
- Mensagens/ação:
  - `produto=acesso_app` ativo e não personal: **toast orientação** e retorna sem checkout.【F:app/js/home.js†L1373-L1383】
  - `followme_*`: **toast “em breve”** e retorna sem checkout.【F:app/js/home.js†L1385-L1388】
  - restante: toast comercial + `openPaywall` (`personal` ou `access`).【F:app/js/home.js†L1390-L1392】

### 4.3 Card Personal

- `checkoutTipo` forçado para `personal` em bloqueio; desbloqueado ativa modo personal e navega FlowCenter.【F:app/js/home.js†L1740-L1747】【F:app/js/home.js†L1781-L1791】

### 4.4 Card FollowMe

- Categoria followme é bloqueada para quem não tem produto correspondente/VIP; bloqueado cai em “em breve”.【F:app/js/home.js†L681-L713】【F:app/js/home.js†L1385-L1388】
- Em caso liberado, seleção segue `selecionarCoach` via modal de novo programa.【F:app/js/home.js†L1486-L1491】【F:app/js/home.js†L1826-L1829】

### 4.5 Card com ciclo não configurado

- Em cards liberados normais, se `femflow_cycle_configured !== "yes"`, Home dispara loading, salva ênfase e emite `stateChanged` com impacto fisiológico (sem abrir treino diretamente).【F:app/js/home.js†L1799-L1811】

---

## 5) Comportamento comercial (Hotmart/paywall/fallback)

- Home e FlowCenter não chamam Hotmart direto: chamam `FEMFLOW.billing.openPaywall(planId, context)`.【F:app/js/home.js†L1357-L1363】【F:app/js/flowcenter.js†L53-L59】
- Gateway (`billing/checkout.js`) resolve plataforma:
  - iOS nativo: trilha IAP.
  - web/android/fallback: adaptador Hotmart externo (`_openHotmartExternal`).【F:app/js/billing/checkout.js†L21-L70】
- Adaptador Hotmart resolve URLs por `planId` e usa `FEMFLOW.openExternal` para abertura segura.【F:app/js/billing/checkout-hotmart.js†L66-L124】
- `FEMFLOW.openExternal` bloqueia hosts comerciais (Hotmart) no iOS nativo e mostra mensagem para assinar no app (compliance).【F:app/core/femflow-core.js†L311-L346】

**Conclusão comercial:** a “lógica Hotmart” do Personal existe como **destino de gateway por planId e plataforma**, não como hardcode no clique da Home.

---

## 6) Consistência entre Home x FlowCenter x Treino

### Inconsistências encontradas

1. **Mensagens comerciais duplicadas** (`msgCheckout`) em Home e FlowCenter, com risco de drift de copy/tradução.【F:app/js/home.js†L1340-L1355】【F:app/js/flowcenter.js†L36-L51】
2. **Exceções toast-only distribuídas**:
   - Home: `acesso_app` ativo e FollowMe bloqueado.
   - FlowCenter: `bloquearBotao(..., impedirCheckout:true)` em custom/endurance.
   Isso mantém comportamento equivalente em parte, mas por caminhos diferentes e não centralizados.【F:app/js/home.js†L1373-L1388】【F:app/js/flowcenter.js†L1995-L2023】
3. **Atualização de entitlements no Core** redefine `has_personal` com base em `modo_personal`, podendo colidir com semântica “direito backend vs modo de uso” estabelecida na Home/FlowCenter.【F:app/core/femflow-core.js†L1987-L2006】【F:app/js/home.js†L500-L533】
4. **Treino** segue regra de segurança (não libera por local-only), mas precisa conciliar múltiplas fontes de perfil (`femflow:ready`, `carregarPerfil`, localStorage), aumentando complexidade de diagnóstico de estado.
   【F:app/js/treino.js†L785-L825】【F:app/js/treino.js†L402-L432】

---

## 7) Auditoria de código (estrutura)

- **Duplicação de lógica**:
  - `parseBooleanish`, `parseFreeEnfases`, `parseFreeUntil`, `normalizarFreeAccess` em Home/FlowCenter.
  - `msgCheckout` + abertura de checkout em Home/FlowCenter.
  【F:app/js/home.js†L316-L372】【F:app/js/flowcenter.js†L80-L171】
- **Regras espalhadas**: política de acesso em Home, bloqueio de botões no FlowCenter, e reforços no Treino.
- **Mensagens hardcoded**: diversos toasts comerciais/operacionais fora de `lang.js`.
- **Funções extensas**: `handleCardClick` (Home) e `initFlowCenter` concentram muitos cenários.
- **Acoplamento comercial + acesso**: `openBlockedFlow` mistura motivo de lock, copy e ação de checkout em um único bloco.

---

## 8) Preparação para IAP Apple (substituição de checkout externo)

## Estado atual

- Já existe gateway canônico por `planId` (`access|personal`) em billing, com branch iOS e fallback web/android. 【F:app/js/billing/checkout.js†L21-L73】
- Há camada iOS IAP com mapeamento de produtos (`iap-ios.js`) e payloads de resultado. 【F:app/js/billing/iap-ios.js†L8-L58】
- Há refresh de entitlements (`entitlements_status`) e evento global de atualização. 【F:app/core/femflow-core.js†L2008-L2025】

## Pontos ideais para integrar evolução IAP

1. **Interceptar clique bloqueado**: em uma policy única usada por Home + FlowCenter antes de chamar checkout.
2. **Compra nativa**: manter no gateway (`billing/checkout.js`/`iap-ios.js`), não nas telas.
3. **Restore purchases**: manter centralizado em camada IAP/Core (já existe stub/infra).
4. **Sincronização backend**: continuar via `refreshEntitlements` após compra/restauração, sem liberar conteúdo localmente.

---

## 9) Riscos técnicos, regressões e áreas sensíveis

### 9.1 Riscos

- Regressão de conversão/compliance se FollowMe deixar “em breve” sem regra de produto clara.
- Divergência de UX se ajustar apenas Home e não FlowCenter.
- Regressão de entitlement se alterar sem cuidado `updateEntitlementsFromPayload` (semântica `has_personal` vs `mode_personal`).
- Traduções inconsistentes devido a mensagens hardcoded replicadas.

### 9.2 Áreas sensíveis (não tocar no patch futuro inicial)

- Backend `validar`, `entitlements_status`, login e schema/planilha.
- Fluxo de auth e sessão.
- Seleção de origem de treino no `treino-engine` (apenas consumo de estado já resolvido).

### 9.3 Possíveis regressões específicas

- Desbloqueio indevido de card por erro na normalização de `free_access.enfases`.
- Roteamento incorreto de planilhas/endurance público caso mude ordem de validação em `handleCardClick`.
- Quebra de iOS nativo se bypassar `openPaywall` e abrir link externo diretamente.

---

## 10) Recomendação arquitetural e abordagem futura (sem implementar patch)

1. **Extrair policy única de bloqueio/CTA** (`resolveBlockedAction`) usada por Home/FlowCenter.
2. **Separar explicitamente**:
   - decisão de acesso (`locked`),
   - decisão de comunicação (`toastKey`),
   - decisão comercial (`planId|null`).
3. **Centralizar copy i18n** no `lang.js` para remover `msgCheckout` duplicada.
4. **Manter `openPaywall` como único gateway** para permitir troca Hotmart ⇄ paywall nativo sem retrabalho de telas.
5. **Preservar invariantes**:
   - backend autoritativo de liberação,
   - distinção direito personal x modo personal,
   - comportamento comercial dedicado do card Personal.

---

## 11) Veredito final da auditoria complementar

- O sistema já está parcialmente preparado para IAP por possuir gateway de billing e sincronização de entitlements.
- O principal gargalo não é o provedor de checkout, e sim a **política de bloqueio/CTA fragmentada** entre Home e FlowCenter.
- O ajuste mais seguro no próximo passo é arquiteturalmente pequeno: **unificar policy de bloqueio** sem tocar backend/login/validar/schema.

