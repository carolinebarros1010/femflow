# Relatório de Auditoria Completa — Implantação MaleFlow (sobre FemFlow)

> **Escopo auditado:** `femflow/painelpersonalGAS/*.gs` (01–12, 04_PLANNER_OPENAI, firestore-import) e `femflow/painelpersonal.html`.
> 
> **Objetivo:** detectar inconsistências de assinatura, chamadas quebradas, bugs de sintaxe/duplicação, bugs lógicos e riscos de integração MaleFlow (target/app, endpoints, payloads, Firestore, segurança, schema).

---

## 1) Sumário executivo

**Status geral:** **🟠 Amarelo (risco alto de integração)**

### Top 10 riscos (com severidade)
| # | Severidade | Risco | Impacto resumido |
|---|---|---|---|
| 1 | **P0** | **Auth quebrado**: Front-end envia `senha_hash`, backend espera `senha`. | ✅ **Resolvido**: backend aceita `senha` ou `senha_hash`. |
| 2 | **P0** | **Funções duplicadas com assinaturas divergentes**: `resolverCanonicoIdOpenAI_`, `buildCandidatesSemantico_`, `tituloFallbackPorEnfase_`, `normalizarCiclo_`, `normalizarDiaTreino_`. | ✅ **Resolvido**: renomeadas funções locais e removidas duplicatas globais. |
| 3 | **P1** | **POST API usa `pedidoTexto` apenas**: ações `gerarbase/gerar30` ignoram payload JSON direto. | ✅ **Resolvido**: POST agora aceita `pedidoTexto` ou JSON direto. |
| 4 | **P1** | **Painel HTML não envia `target/app`**. | ✅ **Resolvido**: UI inclui Target e envia parâmetro. |
| 5 | **P1** | **MaleFlow docId Firestore não segue spec `/blocos/bloco_100`**. | ⚠️ **Parcial**: docId usa prefixo `bloco_100_XX`; validar com o app. |
| 6 | **P1** | **OpenAI gate nunca ativa para MaleFlow** (usa `dia` 1..N vs janela 14–18). | Planner OpenAI nunca usado no MaleFlow, mesmo habilitado. |
| 7 | **P1** | **Assinaturas de fallback divergentes**. | ✅ **Resolvido**: isoladas por nome. |
| 8 | **P1** | **Normalizadores duplicados**. | ✅ **Resolvido**: `normalizarCiclo_`/`normalizarDiaTreino_` consolidados. |
| 9 | **P2** | **Risco CORS/HTML**: Painel abre link em nova aba quando fetch falha, mas resposta HTML pode ser interpretada como erro. | UX inconsistente; debugging difícil. |
|10 | **P2** | **Sheet headers MaleFlow/FemFlow dinâmicos** podem causar colunas ausentes em abas antigas. | Importação falha por faltas obrigatórias. |

---

## 2) Inventário e mapa de dependências (A)

### 2.1 Funções públicas/principais por arquivo

> **Obs.:** lista focada em funções “externamente chamadas” ou centrais no pipeline.

- **01_NORMALIZACAO.gs**
  - `normalizar_`, `normalizarFase_`, `normalizarEnfaseParaGrupo_`, `resolverEnfasePorEsporte_`, `normalizaKey_`, `normalizaKeyStrict_`, `limparComplementosSemanticos_`, `normalizarCiclo_`, `normalizarDiaTreino_`.

- **02_BASE_EXERCICIOS.gs**
  - `carregarBaseExercicios_`, `normalizarGrupoMuscular_`, `tokensFrom_`, `tokenScore_`, `tokenMatch_`, `encontrarHitBase_`, `encontrarHitBaseSemLog_`, `aplicarSubstituicaoPorNivelCompat_`.

- **03_ALIAS_CANON.gs**
  - `logCanonResolver_`, `salvarAliasAprendido_`, `buildAliasLookup_`, `buildAliasesExerciciosLookup_`, `buildExerciseAliasesSheetLookup_`, `resetAliasesCache_`, `resolverAlias_`, `resolverAliasSheetCanonico_`, `resolverAliasExerciciosId_`, `resolverTituloCanonico_`, `resolverCanonicoIdOpenAI_`, `importarAliasesDoCanonLog_`, `auditarAliases_`.

- **04_PLANNER_OPENAI.gs**
  - `openaiChat_`, `plannerIntencoesOpenAI_`, `gerarExerciciosParaEnfaseOpenAI_`, `getOpenAIKey_`, `getOpenAIModel_`.

- **05_FALLBACK_LOCAL.gs**
  - `planoFaseFallback_`, `resolverGruposPorEstrutura_`, `buildCandidatesSemanticoFallback_`, `resolverExercicioPorIntencaoFallback_`, `tituloFallbackPorEnfaseFallback_`.

- **06_RESOLVER_EXERCICIO.gs**
  - `resolverExercicioPorIntencao_`, `aplicarSubstituicaoPorNivel_`, `extrairHistoricoIdsNDias_`, `calcularScoreSemantico_`, `resolverExercicioAncora_`, `resolverExercicioForcadoPorGrupo_`, `buildCandidatesSemanticoLocal_`, `tituloFallbackPorEnfaseLocal_`, `resolverCanonicoIdOpenAI_legacy_`.

- **07_GERAR_DIA.gs**
  - `gerarDia_`, `linhaTempo_`, `linhaHiit0_`, `montarBoxesComSeriesEspeciais_`, `distribuirBoxes_`.

- **08_ORQUESTRADOR.gs**
  - `gerarFemFlow30Dias`, `gerarBaseOvulatoria_`, `distribuirBaseOvulatoriaPara30Dias_`, `gerarBaseMaleFlowSomente_`, `gerarBaseABCDE_MaleFlow_`, helpers auxiliares (reps, fases, etc.).

- **09_HTTP_ENDPOINT.gs**
  - `doGet`, `doPost`, `mergePostParams_`, `parsePostBodyOnly_`, `montarPedidoFromGet_`, `respostaGet_`, `jsonOK_`, `jsonERR_`.

- **10_PEDIDO_PARSER.gs**
  - `parsePedido_`, `validarPedido_`, `normalizarTarget_`, `normalizarPadraoCiclo_`.

- **11_ORQUESTRADOR_HELPERS.gs**
  - `planejarFaseComOpenAI_`, `plannerExerciciosOpenAI_`, `resolverExercicioPorTitulo_`, `salvarNaAbaTabela_`, `gerarCSV_`, `relinkarAba_`, `aplicarSerieEspecialBaseOvulatoria_`.

- **12_AUTH.gs**
  - `autenticarPersonal_`, `cadastrarPersonal_`, `hashSenha_`, `normalizarTelefone_`.

- **firestore-import.gs**
  - `importarTreinosFEMFLOW_aba`, `importarTreinosFEMFLOW`, `importarAbaParaFirestore_`, `firestoreGET_`, `firestorePATCH_`, `getFirebaseAccessToken`.

- **painelpersonal.html**
  - Funções JS de UI: `collectParams`, `runAction`, `buildUrl`, login/signup (envia `senha_hash`).

### 2.2 Mapa de dependências (função → função chamada)

> **Legenda:** (OK) encontrado; (⚠️) provável quebra/assinatura divergente.

| Função chamadora | Chama | Arquivo esperado | Status |
|---|---|---|---|
| `gerarFemFlow30Dias` | `parsePedido_`, `validarPedido_` | `10_PEDIDO_PARSER.gs` | OK |
| `gerarFemFlow30Dias` | `carregarBaseExercicios_` | `02_BASE_EXERCICIOS.gs` | OK |
| `gerarBaseOvulatoria_` | `planejarFaseComOpenAI_` | `11_ORQUESTRADOR_HELPERS.gs` | OK |
| `gerarBaseOvulatoria_` | `plannerExerciciosOpenAI_` | `11_ORQUESTRADOR_HELPERS.gs` | OK |
| `gerarBaseOvulatoria_` | `resolverExercicioPorIntencao_` | `06_RESOLVER_EXERCICIO.gs` | OK |
| `gerarBaseOvulatoria_` | `gerarDia_` | `07_GERAR_DIA.gs` | OK |
| `resolverExercicioPorIntencao_` | `buildCandidatesSemanticoLocal_` | `06` | OK |
| `resolverExercicioPorIntencao_` | `tituloFallbackPorEnfaseLocal_` | `06` | OK |
| `encontrarHitBase_` | `resolverCanonicoIdOpenAI_` | `03` | OK |
| `doPost` | `gerarFemFlow30Dias` | `08_ORQUESTRADOR.gs` | OK (payload robusto) |
| `doPost` | `autenticarPersonal_` | `12_AUTH.gs` | OK (senha_hash aceito) |
| `importarTreinosFEMFLOW_aba` | `importarTreinosFEMFLOW` | `firestore-import.gs` | OK |
| `painelpersonal.html` | `runAction` (GET) | `doGet` | OK |

---

## 3) Auditoria de assinaturas (B)

| CALLSITE | ASSINATURA ESPERADA | ASSINATURA REAL | RISCO | FIX SUGERIDO |
|---|---|---|---|---|
| `resolverExercicioPorIntencao_` → `buildCandidatesSemanticoLocal_(intent, ctx, base)` | `(intent, ctx, base)` | OK | **OK** | — |
| `resolverExercicioAncora_` → `tituloFallbackPorEnfaseLocal_(ctx)` | `(ctx)` | OK | **OK** | — |
| `encontrarHitBase_` → `resolverCanonicoIdOpenAI_(titulo, base)` | `(titulo[,base])` | OK (única em 03) | **OK** | — |
| `parsePedido_` → `normalizarCiclo_` | retorna `abc/abcd/abcde` | OK (única em 01) | **OK** | — |
| `parsePedido_` → `normalizarDiaTreino_` | tolerante | OK (única em 01) | **OK** | — |
| `doPost` → `gerarFemFlow30Dias(pedido)` | aceita string ou objeto | OK | **OK** | — |
| `doPost` → `autenticarPersonal_(payload)` | aceita `senha` ou `senha_hash` | OK | **OK** | — |
| `importarTreinosFEMFLOW_aba(destino, { target })` | `(nomeAba, opts)` | OK | **OK** | — |

---

## 4) Auditoria de sintaxe/colagem/duplicação (C)

### Achados principais
1) **Duplicação crítica de funções globais** (potencial override): ✅ resolvida com renomeações locais e remoção de duplicatas.

2) **Assinaturas divergentes** (ex.: fallback vs core): ✅ resolvidas (funções locais isoladas).

3) **Optional chaining / spread** (ex.: `ctx?.maxTreinoExercicios`, `{ ...e.parameter }`) — funciona em V8 moderno, mas quebra em runtime antigo do Apps Script.

### Snippets aplicados (referência)

```js
// 06_RESOLVER_EXERCICIO.gs
function buildCandidatesSemanticoLocal_(intent, ctx, base) { /* ... */ }
function tituloFallbackPorEnfaseLocal_(ctx) { /* ... */ }
function resolverCanonicoIdOpenAI_legacy_(titulo, base) { /* ... */ }

// 05_FALLBACK_LOCAL.gs
function buildCandidatesSemanticoFallback_(ctx, base) { /* ... */ }
function tituloFallbackPorEnfaseFallback_(enfase, nivel, i) { /* ... */ }
```

---

## 5) Auditoria de lógica/regras (D)

### 07_GERAR_DIA.gs
- **Ordem por box**: implementada via `ordemBox` por box. ✅
- **Limite de 10 treinos/dia**: clamp aplicado antes da distribuição. ✅
- **HIIT + resfriamento no box 0**: ordem coerente (aquecimento=1, hiit=2, resfriamento=3). ✅

### 08_ORQUESTRADOR.gs
- **Fluxo** `gerar base → distribuir 30 → salvar → CSV`: ok para FemFlow.
- **MaleFlow**: `gerarBaseABCDE_MaleFlow_` usa `dia=1..N`, o que **inibe o gate do OpenAI** (`OPENAI_DIAS_PICO`), mesmo com OpenAI habilitado. ⚠️
- **ctx compatível** FemFlow/MaleFlow: inclui `fase/dia` e `ciclo/diatreino`. ✅

### 06_RESOLVER_EXERCICIO.gs
- **Anti-repeat**: usa janela `padraoCiclo.length`, ok para 3/4/5 dias. ✅
- **Score semântico**: usa `equipamento_categoria` e `grupo_principal` corretamente. ✅
- **Filtros**: mobilidade, core e repetição de subpadrão. ✅
- **Fallbacks locais**: isolados para evitar colisão com o fallback global. ✅

### 02_BASE_EXERCICIOS.gs
- **Leitura BANCO_PRO_V2**: colunas variantes toleradas. ✅
- **Normalização de grupos**: compatível com `normalizarEnfaseParaGrupo_`. ✅
- **Tokenização**: ok (`tokensFrom_`). ✅

### 03_ALIAS_CANON.gs
- **Aliases + cache**: ok, com `resetAliasesCache_`. ✅
- **Import do canon log**: ok. ✅
- **`resolverCanonicoIdOpenAI_`**: único no 03, sem colisões globais. ✅

### PLANNER_OPENAI.gs
- **`openaiChat_`**: robusto com erros HTTP (mas sem retry/backoff). ⚠️
- **Garantia “OpenAI só nomes crus”**: OK nas instruções do system prompt. ✅

### 09_HTTP_ENDPOINT.gs
- **GET/POST robustos**: retorna JSON sempre. ✅
- **mergePostParams_**: POST aceita `pedidoTexto` ou JSON direto. ✅
- **target/app**: painel já envia o target. ✅

### firestore-import.gs
- **Schema MaleFlow**: detecta `ciclo/diatreino` e usa path próprio. ✅
- **Limite 10 por dia**: aplicado. ✅
- **Risco**: validar se o formato `bloco_100_XX` está compatível com o app. ⚠️

---

## 6) Auditoria de comunicação/integração MaleFlow (E)

### Pontos onde `target/app` influencia
1) **HTTP endpoint** (`doGet` / `doPost`) — aplica `target` no import.
2) **Parser/Validador** — `parsePedido_` + `validarPedido_` definem defaults (destino `BASE_ABCDE`) quando `target=maleflow`.
3) **Firestore Import** — `getFirebaseProjectId_` e `getFirebaseServiceAccount_` escolhem projeto/credenciais.

### Onde o `target` é ignorado (risco)
- **painelpersonal.html**: ✅ resolvido (agora envia `target/app` em `collectParams`).
- **POST API**: payload direto é aceito; ainda depende de `target`/`ciclo` para ativar modo MaleFlow.

### Riscos de integração
- **CORS/HTML**: `runAction` abre nova aba se fetch falha. Se o web app responde HTML (login/captcha), o painel interpreta como erro genérico.
- **Endpoint/ação**: painel não expõe ações `gerarbase_male`/`full_male`.
- **Schema mismatch**: Front-end trabalha com `fase/dia`, MaleFlow exige `ciclo/diatreino`.
- **Headers/token**: Firestore usa OAuth2 correto; problema principal é *seleção de projeto* se `target` não for propagado.

---

## 7) Contratos críticos

| Contrato | Status | Observação |
|---|---|---|
| `07_GERAR_DIA` só monta o dia | ✅ | Não há lógica de treino além da montagem. |
| `09_HTTP_ENDPOINT` só interface HTTP | ✅ | Sem lógica de treino. |
| OpenAI só nomes crus | ✅ | Prompts limitam a nomes. |
| Compat FemFlow/MaleFlow via `ctx` | ✅ | `ctx` inclui campos e não há colisões globais. |

---

## 8) Checklist de implantação MaleFlow

**Antes de produção:**
1) Validar `docId`/path Firestore conforme spec `/blocos/bloco_100`.
2) Verificar `MALEFLOW_FIREBASE_*` e `FIREBASE_PROJECT_ID_MALEFLOW` em Script Properties.
3) Testar ações `gerarbase_male` e `full_male` via curl.

---

## 9) Apêndice

### 9.1 Funções ausentes/referenciadas
- **Nenhuma função totalmente ausente** encontrada; porém há **duplicações com override**, que atuam como “missing” dependendo da ordem de load.

### 9.2 Lista de assinaturas divergentes
- ✅ Resolvidas nesta revisão (nomes isolados e duplicatas removidas).

### 9.3 Sugestões de testes manuais

**GET (FemFlow):**
```bash
curl "<WEBAPP_URL>?action=gerarbase&nivel=iniciante&enfase=gluteos&padraoCiclo=abcde&destino=BASE_OVULATORIA"
```

**GET (MaleFlow):**
```bash
curl "<WEBAPP_URL>?action=gerarbase_male&nivel=iniciante&enfase=costas&padraoCiclo=abcde&destino=BASE_ABCDE&target=maleflow"
```

**POST JSON (payload direto):**
```bash
curl -X POST "<WEBAPP_URL>" \
  -H "Content-Type: application/json" \
  -d '{"action":"gerarbase_male","nivel":"iniciante","enfase":"costas","padraoCiclo":"abcde","destino":"BASE_ABCDE","target":"maleflow"}'
```

**Auth (login):**
```bash
curl -X POST "<WEBAPP_URL>?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com","senha":"123"}'
```

---

## 10) Próximo passo recomendado (ordem de conserto)

1) Validar `docId`/paths Firestore MaleFlow com o app consumidor.
2) Avaliar **OpenAI gate** no MaleFlow (dia 1..N vs janela 14–18).
3) Rodar smoke tests (GET/POST) e importação dirigida.
