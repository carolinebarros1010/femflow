# FemFlow — Vistoria de Dados (Play Console + Apple Privacy)

> Escopo desta vistoria: front-end web app (`app/`), camada mobile (`android/`, `capacitor.config.ts`) e políticas públicas (`app/docs/privacy.html`, `app/docs/delete-account.html`).
> 
> Objetivo: mapear **o que já existe no app** e transformar isso em respostas **prontas para colar** nos formulários de Data Safety (Google Play) e App Privacy (Apple).

## 1) Evidências encontradas no app (estado atual)

### 1.1 Cadastro, login e identificadores
- Cadastro/anamnese coleta: **nome, e-mail, telefone (opcional), data de nascimento e senha**. (`app/js/anamnese.js`)
- Fluxo de login/cadastro envia `action: "loginOuCadastro"` com dados pessoais e anamnese para backend. (`app/js/anamnese.js`)
- App mantém **ID do usuário**, **e-mail**, **token de sessão**, **expiração de sessão** e **deviceId** no armazenamento local. (`app/core/femflow-core.js`, `app/index.html`, `app/js/anamnese.js`)
- `deviceId` é persistido em `localStorage` e cookie `ff_device`. (`app/core/femflow-core.js`)

### 1.2 Saúde e fitness (dados sensíveis)
- App coleta dados de **anamnese** (respostas em escala + objetivo) e envia ao backend. (`app/js/anamnese.js`)
- App coleta **perfil hormonal/ciclo menstrual** (regular, irregular, menopausa, etc.), dia de ciclo e duração do ciclo. (`app/ciclo.html`)
- App usa dados de treino/contexto hormonal para personalizar fluxo e progressão. (`app/core/femflow-core.js`, `app/treino.html`)
- Módulo Body Insight coleta **altura, peso, cintura, quadril, idade**, além de **foto frontal e lateral** para análise. (`app/body_insight.html`, `app/js/body_insight.js`)

### 1.3 Armazenamento e terceiros
- Integração com **Firebase Auth / Firestore / Storage / Messaging** está presente em múltiplas telas. (`app/home.html`, `app/index.html`, `app/treino.html`, `app/body_insight.html`, `app/services/firebase-init.js`)
- Body Insight faz upload de imagens para `firebase.storage` e salva resultados em `users/{uid}/body_insight`. (`app/js/body_insight.js`)
- Há fluxo de entrada por **Hotmart** (query params com `email`, `id`, `nome`, `telefone`) e persistência local desses campos para onboarding. (`app/index.html`, `app/js/anamnese.js`)
- Configuração aponta backend principal em Cloudflare Worker + módulos via Google Apps Script. (`app/config/config.js`)

### 1.4 Suporte, segurança e exclusão
- Existe fluxo de SAC com envio de contexto de uso (fase, dia ciclo, dia programa, nível etc.). (`app/core/femflow-core.js`)
- Existe fluxo de solicitação de exclusão de conta (`deleteAccountRequest`). (`app/core/femflow-core.js`)
- Política de privacidade já declara: retenção de logs técnicos por 90 dias e exclusão em até 30 dias. (`app/docs/privacy.html`, `app/docs/delete-account.html`)

### 1.5 Permissões Android e tracking
- Manifest Android atual declara apenas `INTERNET` (sem permissões sensíveis adicionais). (`android/app/src/main/AndroidManifest.xml`)
- Não foram encontrados SDKs de ad network/IDFA nem bibliotecas nativas de ads no `package.json`. (`package.json`)

---

## 2) Google Play Console — Data Safety (pronto para colar)

## 2.1 "Data collected" (dados coletados)

### A) Personal info
- **Name**: Sim (nome no cadastro/anamnese).
- **Email address**: Sim.
- **Phone number**: Sim (opcional).
- **User IDs**: Sim (ID interno/UID Firebase).

### B) Health and fitness
- **Health info / Fitness info**: Sim.
  - Anamnese
  - Ciclo/fase hormonal
  - Treinos/progressão
  - Biometria corporal (IMC/RCQ) e fotos para Body Insight

### C) App activity
- **In-app interactions / App info and performance (parcial)**: Sim, com base em:
  - progresso e contexto no app
  - eventos de suporte/SAC
  - logs técnicos operacionais (conforme política)

### D) Device or other IDs
- **Device or other IDs**: Sim (deviceId próprio + identificadores de sessão).

### E) Financial info / Purchases
- **Purchase history (limitado)**: Sim, se backend salva status/ID de pedido Hotmart.
- **Payment card/bank**: Não (checkout via Hotmart; app não processa cartão diretamente no código vistoriado).

## 2.2 "Data is shared"
- Marcar **Yes** para compartilhamento com terceiros/processadores:
  - **Google/Firebase** (auth, storage, firestore, messaging)
  - **Hotmart** (fluxo comercial/checkout)
- "Processed ephemerally" → **No** (há persistência local e em backend/Firebase).

## 2.3 "Purpose of collection" (finalidades)
Marcar:
- **App functionality**
- **Account management**
- **Product personalization**
- **Analytics** (somente se você realmente usa dados de uso para métricas)
- **Fraud prevention, security, and compliance**
- **Customer support**

Não marcar Marketing/Ads se não houver esse uso.

## 2.4 Retenção (sugestão consistente com política atual)
- Conta e dados principais: **enquanto conta ativa**.
- Logs técnicos: **até 90 dias**.
- Solicitação de exclusão: **processada em até 30 dias**.

## 2.5 Segurança
- **Data encrypted in transit**: Sim (HTTPS).
- **Data encrypted at rest**: Sim, se mantido em Firebase/Google Cloud com padrões default.
  - Se houver qualquer dúvida operacional no backend fora Firebase, validar antes de marcar como “Sim” absoluto.

---

## 3) Apple App Privacy — checklist pronto

## 3.1 Categorias prováveis para declarar
- **Contact Info**: Email, Phone (se usado)
- **Health & Fitness**: anamnese, ciclo/fase, treino, biometria corporal
- **Identifiers**: User ID, Device ID
- **Usage Data**: progresso/interações de uso
- **Diagnostics**: logs/crash (se realmente coletados e vinculados)

## 3.2 "Data Used to Track You"
- Marcar **No**, desde que:
  - não haja tracking cross-app/site para ads,
  - sem SDK de ad network/IDFA,
  - sem compartilhamento para corretagem publicitária.

## 3.3 "Linked to the user"
- **Sim (Linked)** para: Email, User ID, Health/Fitness (quando atrelados à conta).
- Diagnostics: marcar "Not linked" só se de fato anonimizado e sem vínculo de UID/e-mail.

## 3.4 "Data used for"
Marcar:
- **App Functionality**
- **Product Personalization**
- **Account Management**
- **Customer Support**
- **Security**
- **Analytics** (se efetivamente praticado)

---

## 4) Campos específicos pedidos (Body Insight, Personal, Anamnese, Hotmart)

### Body Insight
- Dados: altura, peso, cintura, quadril, idade, foto frontal/lateral, scores e resultado final.
- Uso: funcionalidade principal + personalização + histórico por usuária.
- Terceiros: Firebase Storage/Firestore e endpoint IA no backend.

### Personal (SAC/atendimento)
- Dados: categoria de atendimento, mensagem livre e contexto técnico/treino.
- Uso: suporte e resolução de problemas.
- Compartilhamento: backend próprio (Cloudflare/GAS), eventualmente painel administrativo.

### Anamnese
- Dados: respostas estruturadas (q1...qN), objetivo, cadastro básico.
- Uso: personalização de programa, definição de nível, onboarding.

### Cadastro Hotmart
- Dados de entrada: `email`, `id`, `nome`, `telefone` via query params e storage local.
- Uso: vincular compra/origem ao onboarding/anamnese.
- Observação: app não mostra processamento direto de cartão.

---

## 5) Lacunas obrigatórias antes de submissão final (importante)

Mesmo com a vistoria completa do front, faltam confirmações de backend para evitar resposta inconsistente no store form:

1. **Inventário exato de logs de backend**
   - Quais campos de log são persistidos (IP, user-agent, erros, payload parcial)?
   - Onde e por quanto tempo (Cloudflare/GAS/Firebase)?

2. **Compra/assinatura**
   - Confirmar se existe persistência de `orderId`, status, produto, data de pagamento e retenção.

3. **Analytics real**
   - Se há/ não há GA4, eventos customizados ou relatórios por usuário.
   - Se não houver analytics formal, não marcar essa finalidade.

4. **Crashes/diagnostics**
   - Confirmar se existe ferramenta de crash reporting e se é vinculada a UID.

5. **Criptografia em repouso fora Firebase**
   - Validar componentes fora Google Cloud default.

---

## 6) Versão "curta" (para resposta rápida no formulário)

- Coletamos dados de conta (nome, e-mail, telefone opcional, IDs), dados de saúde/fitness (anamnese, ciclo hormonal, treino e biometria), dados técnicos de sessão/dispositivo (deviceId e sessão) e dados comerciais limitados de origem/compra (Hotmart, sem cartão).
- Compartilhamos dados com processadores essenciais (Firebase/Google e Hotmart).
- Finalidades: funcionalidade do app, gestão de conta, personalização, segurança e suporte (analytics apenas se efetivamente habilitado).
- Retenção: conta enquanto ativa; logs até 90 dias; exclusão em até 30 dias.
- Segurança: criptografia em trânsito (HTTPS) e controles de proteção em provedores de infraestrutura.
