# FemFlow — Auditoria Data Safety/Privacy (Play Console + Apple) baseada em código

> Escopo auditado: `app/**`, `android/**`, `ios/**`, `staging/GAS/**`, `app/config/config.js`, `package.json`, `package-lock.json`, `app/docs/privacy.html`, `app/docs/terms.html`, `app/docs/delete-account.html`, `app/docs/legal.js`.
>
> Regra desta versão: somente achados comprováveis no repositório atual.

## Contato oficial de suporte
- **femflow.consultoria@gmail.com**

---

## 1) Evidências encontradas (estado atual do código)

### 1.1 Dados coletados no app (frontend)
- Cadastro/anamnese envia: `nome`, `email`, `telefone`, `dataNascimento`, `senha`, `anamnese`, `objetivo` com `action: "loginOuCadastro"` (app/js/anamnese.js:submitForm).
- Login/sessão envia: `email`, `senha`, `deviceId` com `action: "login"` (app/index.html:loginWithEmail; app/js/anamnese.js:fazerLoginAposCadastro).
- SAC envia: `id`, `categoria_ui`, `mensagem`, `lang`, `contexto` (fase, diaCiclo, diaPrograma, perfilHormonal, nivel, enfase) com `action: "sac_abrir"` (app/core/femflow-core.js:FEMFLOW.enviarSAC).
- Delete account envia: `userId`, `deviceId`, `sessionToken`, `reason`, `requestedAt`, `locale`, `app`, `source`, `userAgent` com `action: "deleteaccountrequest"` (app/core/femflow-core.js:FEMFLOW.renderModalExcluirConta).
- Body Insight envia para GAS (`action: "body_insight_ia"`): `userId`, `photoFrontUrl`, `photoSideUrl` (app/js/body_insight.js:chamarBodyInsightIA).
- Body Insight faz upload de fotos para Firebase Storage em `body_insight/{userId}/{timestamp}_{front|side}.{ext}` e salva análise no Firestore em `users/{uid}/body_insight/{createdAtMs}` (app/js/body_insight.js:uploadPhotoToStorage; app/js/body_insight.js:saveBodyInsightToFirestore).

### 1.2 Dados armazenados no backend (staging/GAS) e Firebase
- **Google Sheets (GAS)**
  - `Alunas` (header formal `HEADER_ALUNAS`), atualizado por cadastro/login/hotmart/admin e leitura para sessão (staging/GAS/Header.gs:HEADER_ALUNAS; staging/GAS/Senha.gs:_loginOuCadastro; staging/GAS/Hotmart.gs:_processarHotmart; staging/GAS/Senha.gs:_assertSession_).
  - `DeleteRequests` (`requestId,userId,email,createdAt,status,processedAt,notes,locale,source,reason,app,ip,userAgent`) via `deleteAccountRequest_` (staging/GAS/DeleteAccount.gs:deleteAccountRequest_).
  - `Leads` (`Data,Nome,Email,Telefone,Origem`) via `leadparcial` (staging/GAS/Infraestrutura.gs:_registrarLead).
  - `Treinos` (`ID,Data,Fase,DiaPrograma,PSE,Apelido,Box,Exercício,Séries,Reps,Peso`) via `salvarTreino_` e `salvarEvolucao_` (staging/GAS/AuxLogica.gs:salvarTreino_; staging/GAS/AuxLogica.gs:salvarEvolucao_).
  - `Diario` (`ID,Data,Fase,Semana,Treino,Tipo,Descanso,Observação`) via `salvarDescanso_` (staging/GAS/AuxLogica.gs:salvarDescanso_).
  - `UltimosPesos` (`ID,Exercicio,UltimoPeso`) via `salvarEvolucao_` (staging/GAS/AuxLogica.gs:salvarEvolucao_).
  - `PushTokens` (`UserId,DeviceId,Platform,Lang,PushToken,UpdatedAt,LastSentAt`) via `register_push_token` (staging/GAS/Push.gs:registerPushToken_).
  - `Notifications` (`Id,Title,Message,Type,Origin,Push,Target,CreatedAt,SendAt,Status,Deeplink`) via `create_notification`/`publish_notification`/`send_notification` (staging/GAS/Notifications.gs:createNotification_; staging/GAS/Notifications.gs:publishNotification_; staging/GAS/Notifications.gs:sendNotification_).
  - `SAC_LOG`, `SAC_DASHBOARD`, `SAC_Metrics`, `SAC_Governanca` via rotas de SAC (staging/GAS/SAC.gs:registrarSACLog_; staging/GAS/SAC.gs:sacRegistrarDashboard_; staging/GAS/SAC.gs:sacRegistrarMetricas_; staging/GAS/SAC.gs:sacLogGovernanca_).
  - `body_insight_usage` (`userId,dataHora,ambiente,tipoPlano,status`) via `registrarUsoBodyInsight_` (staging/GAS/BodyInsightIA.gs:registrarUsoBodyInsight_).
- **Firebase**
  - Auth/Firestore/Storage/Messaging presentes em HTMLs e inicialização (app/services/firebase-init.js:initFirebaseFemFlow; app/body_insight.html; app/treino.html; app/home.html).
  - Analytics/Crashlytics não identificados (sem SDK/import/init de Analytics/Crashlytics/GA4 no app ou GAS) (busca estática `rg` no repositório).

### 1.3 Logs e retenção real
- Há logs operacionais em execução (`console.log`/`Logger.log`) no GAS, incluindo payload bruto em `doPost` (`RAW DATA`, `ACTION`) (staging/GAS/Post.gs:doPost).
- Persistência de logs em planilhas existe para SAC e uso do Body Insight (staging/GAS/SAC.gs:registrarSACLog_; staging/GAS/BodyInsightIA.gs:registrarUsoBodyInsight_).
- Campo `ip` em `DeleteRequests` é preenchido por `extractRequestIp_`, priorizando `X-Forwarded-For`/`x-forwarded-for` (primeiro IP) e fallback opcional para `e.parameter.ip` em debug/manual (staging/GAS/Post.gs:extractRequestIp_; staging/GAS/DeleteAccount.gs:deleteAccountRequest_).
- Retenção automática em Sheets implementada em `enforceDataRetentionPolicy_` com cobertura de `DeleteRequests` (status `processed`), `SAC_LOG` (coluna `data`) e `body_insight_usage` (coluna `dataHora`), com retenção default de 90 dias e trigger diário via `setupRetentionTrigger_` (staging/GAS/Retention.gs).
- Exceção: há exclusão de linhas por evento Hotmart de cancelamento/reembolso/expiração usando `_purgeStudentDataByIdOrEmail_` (staging/GAS/Hotmart.gs:_purgeStudentDataByIdOrEmail_).

### 1.4 Hotmart / compra / assinatura
- Ação Hotmart processada por fallback do `doPost` quando `_pareceHotmart_(data)` retorna true (staging/GAS/Post.gs:doPost; staging/GAS/Hotmart.gs:_pareceHotmart_).
- Dados tratados no webhook: `event`, buyer/subscriber (`email`, `name`, `phone`), `plan.id`, `plan.name` (staging/GAS/Hotmart.gs:_processarHotmart; staging/GAS/Hotmart.gs:getPlanId; staging/GAS/Hotmart.gs:getPlanName).
- Persistência observada no backend:
  - Em `Alunas`: produto, `DataCompra`, `LicencaAtiva`, telefone, `acesso_personal` (staging/GAS/Hotmart.gs:_processarHotmart).
- **Order ID / transaction ID / valor / moeda / histórico transacional detalhado em aba dedicada: Não identificado no repositório (estado atual)** (staging/GAS/Hotmart.gs).

### 1.5 Identificadores e sessão
- `deviceId` persistido em localStorage (`femflow_device_id`) e cookie (`ff_device`) (app/core/femflow-core.js:FEMFLOW.getDeviceId; app/core/femflow-core.js:FEMFLOW.setDeviceId).
- Sessão local: `femflow_session_token` e `femflow_session_expira` (com chaves legadas também usadas) (app/core/femflow-core.js:getSessionToken; app/core/femflow-core.js:setSessionToken).
- `_assertSession_(id, deviceId, sessionToken)` exige `id` + `sessionToken`; valida token em `Devices` (Auth v2), validade (`expira`) e bind de `deviceId` quando informado (staging/GAS/Senha.gs:_assertSession_).

### 1.6 Delete Account (fluxo completo)
- Frontend envia `action: "deleteaccountrequest"` com `userId`, `deviceId`, `sessionToken`, `reason`, `requestedAt`, `locale`, `app`, `source`, `userAgent` (app/core/femflow-core.js:FEMFLOW.renderModalExcluirConta).
- Backend valida sessão via `_assertSession_` (staging/GAS/DeleteAccount.gs:deleteAccountRequest_; staging/GAS/Senha.gs:_assertSession_).
- Backend grava em `DeleteRequests` com `requestId`, `status: "requested"`, `createdAt`, `locale`, `source`, `reason`, `app`, `userAgent` (e `ip` vazio) (staging/GAS/DeleteAccount.gs:deleteAccountRequest_).
- Rate limit implementado: bloqueia nova solicitação do mesmo usuário em janela de 24h (staging/GAS/DeleteAccount.gs:deleteAccountRequest_).
- Mensagens localizadas (`pt/en/fr`) retornadas pelo backend (staging/GAS/DeleteAccount.gs:localizedDeleteMessage_).

---

## 2) Google Play Console — Data Safety (pronto para colar)

## 2.1 Data collected (Yes/No)
- Name: **Yes**
- Email address: **Yes**
- Phone number: **Yes**
- User IDs: **Yes**
- Health & fitness: **Yes**
- Photos/Videos: **Yes** (Body Insight)
- App activity (in-app interactions/progresso/suporte): **Yes**
- Device or other IDs: **Yes** (`deviceId`, sessão)
- Purchase history: **Yes (limited)** — há persistência de `Produto`, `DataCompra` e `LicencaAtiva` em `Alunas`, sem histórico transacional detalhado (staging/GAS/Hotmart.gs:_processarHotmart; staging/GAS/Header.gs:HEADER_ALUNAS).
- Financial info (card/bank): **No**

## 2.2 Data shared (Yes/No)
- Google Firebase (Auth/Firestore/Storage/Messaging): **Yes** (app/services/firebase-init.js:initFirebaseFemFlow).
- Hotmart: **Yes** — checkout ocorre na Hotmart e os dados de pagamento são fornecidos pelo usuário diretamente na Hotmart; a FemFlow recebe atualizações de status/acesso via webhook/entitlement no backend (staging/GAS/Hotmart.gs:_processarHotmart; app/docs/privacy.html).
- Advertising/Ad networks: **No** (sem SDK ads identificado no repositório).

## 2.3 Purposes (fechado)
- **App functionality**: Yes
- **Account management**: Yes
- **Personalization**: Yes
- **Security / fraud prevention / compliance**: Yes
- **Customer support**: Yes
- **Analytics**: No (não identificado SDK/telemetria analytics)
- **Advertising/Marketing**: No (não identificado SDK ads)

## 2.4 Security
- Data encrypted in transit: **Yes** (requisições HTTPS no app e endpoints HTTPS configurados) (app/config/config.js).
- Data encrypted at rest (Firebase): **Needs confirmation** (serviço gerenciado; sem configuração explícita no código auditado).
- Data encrypted at rest (Google Sheets/GAS): **Não identificado no repositório (estado atual)**.

## 2.5 Retention
- Política pública declara: conta ativa enquanto necessário, logs técnicos até 90 dias e pedidos de exclusão em até 30 dias (app/docs/privacy.html; app/docs/delete-account.html).
- Enforcement automático de retenção em Sheets por job/cleanup: **Yes** (`enforceDataRetentionPolicy_` + trigger diário idempotente em `setupRetentionTrigger_`; executar uma vez no Apps Script para provisionar o trigger).
- Decisão de compliance segura para store: declarar retenção conforme política pública **com gap técnico registrado** (seção 5A).

---

## 3) Apple App Privacy — pronto para colar

## 3.1 Data types collected
- Contact Info: **Yes** (nome, e-mail, telefone)
- Identifiers: **Yes** (ID usuário, `deviceId`, token de sessão)
- Health & Fitness: **Yes** (anamnese, ciclo/fase, treino, biometria)
- User Content: **Yes** (fotos do Body Insight)
- Usage Data: **Yes** (progresso, eventos SAC, contexto de uso)
- Diagnostics: **No** (Crashlytics/SDK diagnóstico dedicado não identificado)
- Purchases: **Yes (limited entitlement data)**
- No payment card/bank data stored by FemFlow; processed by Hotmart.

## 3.2 Linked to user (Yes/No)
- Contact Info: **Yes**
- Identifiers: **Yes**
- Health & Fitness: **Yes**
- User Content (fotos Body Insight): **Yes**
- Usage Data (SAC/progresso): **Yes**
- Diagnostics: **No**

## 3.3 Used to track
- **No**.
- Justificativa: não foram identificados SDKs de ads/IDFA/analytics cross-app no código auditado (busca estática `rg`).

## 3.4 Purposes
- App Functionality: **Yes**
- Personalization: **Yes**
- Account Management: **Yes**
- Customer Support: **Yes**
- Security: **Yes**
- Third-party Advertising: **No**
- Developer’s Advertising/Marketing: **No**
- Analytics: **No**

---

## 4) Consistência com documentos públicos
- `app/docs/privacy.html` declara compartilhamento com Google/Firebase e Hotmart, retenção (90 dias logs / 30 dias delete) e coleta de device/session/IP/user-agent quando disponível.
- `app/docs/delete-account.html` declara prazo de processamento de até 30 dias.
- Este audit mantém essas declarações e registra gaps quando o código backend não mostra enforcement automático de retenção.

---

## Status da fase
- **Concluído com ressalvas**: fluxo de exclusão endurecido no backend, retenção automática diária ativa por trigger e coleta de IP em pedidos de exclusão. Ressalvas permanecem apenas para itens fora do escopo desta fase (ex.: analytics/crash e operação manual do processamento final em até 30 dias).

## 5A) Gaps / Risks
- **Gap 1 — Retention enforcement em Sheets**: **Fechado**. Rotina automática implementada (`enforceDataRetentionPolicy_`) e trigger diário idempotente (`setupRetentionTrigger_`).
- **Gap 2 — IP em DeleteRequests**: **Fechado**. Campo `ip` agora é preenchido via `extractRequestIp_` a partir de header `X-Forwarded-For` (quando disponível), com fallback explícito para `e.parameter.ip`.
- **Gap 3 — Analytics/Crash SDK ausente**: aberto por escopo; ausência confirmada de SDK de analytics/crash dedicado no repositório auditado; manter declarações de analytics/diagnostics em No evita overclaim (busca estática `rg`).

---

## 5) Evidence Map

## 5.1 Inventário validado por busca estática (`rg`) — LocalStorage keys (amostra principal para compliance)
- `femflow_auth`
- `femflow_id`
- `femflow_email`
- `femflow_device_id`
- `femflow_session_token`
- `femflow_session_expira`
- `femflow_sessionToken` (legado)
- `femflow_sessionExpira` (legado)
- `lead_nome`
- `lead_email`
- `lead_telefone`
- `lead_data_nascimento`
- `femflow_hotmart_id`
- `femflow_lang`
- `firebase_sync_failed`
- `post_login_redirect`

## 5.2 Cookies (nome identificado)
- `ff_device`

## 5.3 Firestore/Storage paths (exatos)
- Storage: `body_insight/{userId}/{timestamp}_{front|side}.{ext}`
- Firestore: `users/{uid}/body_insight/{createdAtMs}`

## 5.4 Sheets no GAS (nome + header + action que grava)
- `Alunas` — `HEADER_ALUNAS` — `loginOuCadastro` / `login` / Hotmart (`_processarHotmart`) / admin update/create.
- `DeleteRequests` — `requestId,userId,email,createdAt,status,processedAt,notes,locale,source,reason,app,ip,userAgent` — `deleteaccountrequest`.
- `Leads` — `Data,Nome,Email,Telefone,Origem` — `leadparcial`.
- `Treinos` — `ID,Data,Fase,DiaPrograma,PSE,Apelido,Box,Exercício,Séries,Reps,Peso` — `salvartreino`, `salvarevolucao`.
- `Diario` — `ID,Data,Fase,Semana,Treino,Tipo,Descanso,Observação` — `salvardescanso`.
- `UltimosPesos` — `ID,Exercicio,UltimoPeso` — `salvarevolucao`.
- `PushTokens` — `UserId,DeviceId,Platform,Lang,PushToken,UpdatedAt,LastSentAt` — `register_push_token`.
- `Notifications` — `Id,Title,Message,Type,Origin,Push,Target,CreatedAt,SendAt,Status,Deeplink` — `create_notification/publish_notification/send_notification`.
- `SAC_LOG` — `Timestamp,TicketId,AlunoId,Categoria,Mensagem,Severidade,Rota,Origem,Pagina` — `sac_abrir`.
- `SAC_DASHBOARD` — `timestamp,ticketId,alunaId,categoria,severidade,rota,status,mensagem,origem,pagina,lang` — `sac_abrir`.
- `SAC_Metrics` — `Data,TicketId,Categoria,Rota,IA_Usada,Status,Tokens,CustoUSD,Lang` — `sac_abrir`.
- `SAC_Governanca` — `Data,TicketId,Motivo,CustoHoje,CustoMes` — `sac_abrir`.
- `body_insight_usage` — `userId,dataHora,ambiente,tipoPlano,status` — `body_insight_ia`.

## 5.5 Actions `doPost` relevantes (lista)
- `login`
- `register`
- `loginoucadastro`
- `enviarcadastro`
- `leadparcial`
- `sac_abrir`
- `body_insight_ia`
- `create_notification`
- `publish_notification`
- `send_notification`
- `solicitarreset`
- `resetsenha`
- `resetdevice`
- `logoutdevice`
- `migrarauth2batch`
- `setenfase`
- `setfase`
- `setperfilhormonal`
- `setdiaciclo`
- `resetprograma`
- `salvartreino`
- `salvarevolucao`
- `getultimopeso`
- `setmanualstart`
- `setciclostart`
- `setnivel`
- `upgrade`
- `recuperarid`
- `sync`
- `setciclo`
- `salvardescanso`
- `descanso`
- `setdiaprograma`
- `getdiaprograma`
- `settreinossemana`
- `endurance_setup`
- `endurance_treino`
- `endurance_check`
- `endurance_plan_token`
- `deleteaccountrequest`
- `register_push_token`
- `send_push`
- `admin_update_aluna`
- `admin_create_aluna`
- fallback Hotmart (`_pareceHotmart_` → `_processarHotmart`)

## 5.6 Android permissions
- `android.permission.INTERNET` (somente)

---

## 6) Verification commands (para rodar local)

```bash
# Hotmart / order / purchase
rg -n "hotmart|checkout|order|purchase|subscription|plan\.id|plan\.name" staging/GAS app

# Analytics / crash / GA4
rg -n "analytics|crashlytics|ga4|gtag|firebase\.analytics|logEvent|sentry|mixpanel|amplitude" app staging/GAS package.json package-lock.json capacitor.config.*

# Firestore / Storage paths (Body Insight)
rg -n "firebase\.storage\(|storagePath|collection\('users'\)|collection\('body_insight'\)|photoFrontUrl|photoSideUrl|body_insight_ia" app/js/body_insight.js staging/GAS/BodyInsightIA.gs

# Sessão / assert
rg -n "_assertSession_|sessionToken|deviceId|Devices|AuthVersion|deleteaccountrequest" staging/GAS app/core/femflow-core.js

# Android permissions
grep -R "uses-permission" android/app/src/main/AndroidManifest.xml android/**/AndroidManifest.xml
```
