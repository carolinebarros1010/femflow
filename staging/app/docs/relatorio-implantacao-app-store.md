# Relatório de implantação — FemFlow (`app/`) para App Store / Google Play

## 1) Escopo analisado

Este relatório cobre a pasta `app/` (front web/PWA), integração com Capacitor e pré-requisitos de publicação em **Apple App Store** e **Google Play**.

## 2) Diagnóstico executivo

**Status atual:** o projeto está **parcialmente preparado** para publicação mobile.

- ✅ Base web/PWA existe (`manifest.json`, `service-worker.js`, ícones e telas).
- ✅ Existe configuração inicial do Capacitor (`capacitor.config.ts`) e script de build para gerar `cap/www`.
- ⚠️ Não há projeto nativo versionado no repositório (`ios/` e `android/` ausentes).
- ⚠️ Há inconsistências técnicas no manifesto e no cache offline.
- ❌ Itens obrigatórios de compliance para loja (políticas e operação) não aparecem implementados na camada `app/`.

## 3) Evidências técnicas encontradas

### 3.1 PWA / manifesto

- O manifesto define app name, ícones, screenshots e modo standalone.
- As entradas de `screenshots` apontam para arquivos `.png`, porém com `type: "image/webp"`, o que gera inconsistência de metadado.

### 3.2 Service Worker

- O cache inicial (`ASSETS`) referencia `./js/ciclo.js`.
- O arquivo `app/js/ciclo.js` não existe na árvore atual.
- Resultado esperado: falha de pre-cache desse item (já tratada com `catch`, mas reduz previsibilidade offline).

### 3.3 Empacotamento mobile (Capacitor)

- Existe configuração Capacitor com `appId` e `webDir` (`cap/www`).
- Existe script para copiar `app/` para `cap/www` e ajustar paths (`tools/build-capacitor.mjs`).
- Não existem diretórios `ios/` e `android/` no repositório atual.

## 4) Checklist de prontidão para publicação

## 4.1 Google Play

### Técnico
- [ ] Gerar projeto Android (`npx cap add android`) e commitar baseline técnico.
- [ ] Definir `versionCode` e `versionName` por release.
- [ ] Configurar assinatura (upload key / Play App Signing).
- [ ] Validar permissões do app (somente as estritamente necessárias).
- [ ] Corrigir inconsistências do `manifest.json` e do pre-cache.
- [ ] Rodar bateria de testes em device real (login, push, offline, compra/licença, recuperação de senha).

### Compliance / conteúdo
- [ ] URL pública de Política de Privacidade.
- [ ] URL de Termos de Uso.
- [ ] Fluxo/documentação de exclusão de conta e dados (quando aplicável).
- [ ] Classificação de conteúdo (questionário Play).
- [ ] Declarações de coleta/uso de dados (Data Safety) alinhadas ao app real.

## 4.2 Apple App Store

### Técnico
- [ ] Gerar projeto iOS (`npx cap add ios`) e configurar assinatura/certificados.
- [ ] Ajustar metadados nativos (bundle id, versão/build, ícones, launch/splash).
- [ ] Mapear todos os usos de APIs sensíveis e chaves `NS*UsageDescription` em `Info.plist`.
- [ ] Testar app em iPhone real com cenários críticos (auth, push, offline, deeplink).

### Compliance / review
- [ ] Política de Privacidade acessível publicamente e no app.
- [ ] Informações de conta de teste para reviewer (se login obrigatório).
- [ ] Evidenciar valor nativo mínimo (performance, push, offline, integrações), evitando rejeição como "app web empacotado sem valor adicional".
- [ ] Processo de exclusão de conta conforme diretrizes vigentes (se houver criação de conta).

## 5) Lacunas prioritárias (o que falta)

Prioridade alta (bloqueia submissão com baixo risco de retrabalho):

1. **Criar e versionar projetos nativos iOS/Android**.
2. **Corrigir inconsistências do manifesto** (`screenshots` com `type` divergente do arquivo).
3. **Remover/ajustar asset inexistente no SW** (`./js/ciclo.js`).
4. **Publicar páginas legais** (Privacidade, Termos e exclusão de conta/dados) com links claros no app e na ficha da loja.
5. **Definir pipeline de release** (build + versionamento + assinatura + smoke tests).

## 6) Plano de implantação recomendado (90 dias)

### Fase 1 — Hardening técnico (Semana 1–2)
- Corrigir `manifest.json` e `service-worker.js`.
- Estabilizar build (`app -> cap/www`) e criar script único de release.
- Gerar `android/` e `ios/` com Capacitor e validar build local.

### Fase 2 — Compliance e operação (Semana 2–4)
- Publicar Política de Privacidade/Termos e fluxo de exclusão.
- Preparar inventário de dados coletados, finalidade e retenção.
- Elaborar checklist de revisão (Play + Apple) para cada release.

### Fase 3 — QA e submissão (Semana 4–6)
- Testes funcionais fim-a-fim em devices reais.
- Teste de regressão de login social, push, offline e recuperação de senha.
- Submissão primeiro em canal fechado (Play Internal Testing / TestFlight).

### Fase 4 — Go-live controlado (Semana 6–8)
- Publicação gradual (staged rollout).
- Monitorar crash rate, ANR, feedback de review e funil de ativação.
- Planejar patch de correção rápida (D+1 / D+7).

## 7) Riscos principais

- **Risco de rejeição em review** por ausência de evidências de valor além de webview.
- **Risco de compliance** por ausência/insuficiência de páginas legais e política de dados.
- **Risco operacional** por falta de pipeline formal de versionamento e assinatura.

## 8) Recomendação final

A FemFlow está em um ponto bom para iniciar a trilha mobile, porém ainda **não está pronta para submissão imediata** às lojas sem correções técnicas e pacote de compliance.

Com a execução das 5 lacunas prioritárias e um ciclo curto de QA em device real, a publicação é viável em janela de **4 a 8 semanas**.
