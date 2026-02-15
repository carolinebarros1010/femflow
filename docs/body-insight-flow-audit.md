# Auditoria do fluxo Body Insight (Frontend → GAS → Planilha)

## Escopo auditado
- Frontend: `app/js/body_insight.js`
- Backend GAS: `staging/GAS/Post.gs`, `staging/GAS/BodyInsightIA.gs`

## Roteamento da action
- `doPost` roteia `action: "body_insight_ia"` para `analisarBodyInsightIA_(pedido)`.

## Payload enviado pelo frontend
- O frontend envia para o GAS apenas:
  - `action`
  - `userId`
  - `photoFrontUrl`
  - `photoSideUrl`
- **Não envia** `email`.
- **Não envia** `tipoPlano`.

## Verificação de limite (backend)
- A função `verificarLimiteBodyInsight_(userId, tipoPlano)`:
  - abre a planilha via `SPREADSHEET_ID` (Script Properties)
  - lê aba `body_insight_usage`
  - calcula o mês/ano atuais via `new Date()`
  - conta apenas linhas do mesmo `userId`, com `status === "permitido"`, no mesmo mês/ano
  - aplica limite por plano com `obterLimiteBodyInsightPorPlano_`:
    - `free` = 1
    - `premium` = 10
- Como o frontend não envia `tipoPlano`, no backend cai no default `free`.

## Regra que retorna `limit_exceeded`
- Em `analisarBodyInsightIA_`:
  - executa `verificarLimiteBodyInsight_(userId, tipoPlano)`
  - se `!limiteInfo.permitido`, registra uso com status `limitado` e retorna:
    - `status: "limit_exceeded"`
    - `message: "Você já utilizou sua análise mensal gratuita."`

## Registro de uso na planilha
- `registrarUsoBodyInsight_(userId, tipoPlano, status)` grava na aba `body_insight_usage`.
- Se a aba não existir, cria com cabeçalho:
  - `userId | dataHora | ambiente | tipoPlano | status`
- Gravações ocorrem:
  - bloqueio por limite: status `limitado`
  - erro na IA/parsing: status `erro`
  - sucesso da IA: status `permitido`

## Momento do registro (antes ou depois da análise)
- O registro de **bloqueio** (`limitado`) ocorre **antes** de chamar OpenAI.
- O registro de **sucesso** (`permitido`) ocorre **depois** de receber e validar resposta da IA.
- Registros de **erro** ocorrem em falhas de API/parsing/exceção.

## Mecanismo de persistência usado para limite
- A regra usa **planilha** (`SpreadsheetApp`).
- Não usa `CacheService`.
- Não usa variável em memória para contador.
- Usa `PropertiesService` apenas para buscar `SPREADSHEET_ID` e `ENV` (configuração), não para persistir usos.
- Não usa Firestore para a limitação.

## Conclusão objetiva
- Chave de limitação: **por `userId`**.
- Janela: **mensal** (mês/ano correntes).
- Contagem considera só `status = permitido`.
- Limite efetivo atual do fluxo frontend: **1 uso/mês** (porque `tipoPlano` não é enviado e cai em `free`).
- A planilha **não armazena `email` separado nem `hora` separada**; armazena `dataHora` (timestamp único).

## Potenciais fontes de problema
1. Se houver divergência de `userId` entre frontend e identificação real da usuária, a regra pode bloquear/liberar indevidamente.
2. Fuso horário depende do projeto/planilha em Apps Script, pois usa `new Date()` sem timezone explícito.
3. Mensagem de limite é sempre "análise mensal gratuita" mesmo para `premium` (texto pode induzir interpretação errada).
4. Falha em abrir/lêr planilha faz `verificarLimite...` retornar `permitido: false` (fail-closed), podendo bloquear indevidamente.

## Sugestões de correção (sem alterar a lógica principal)
1. Enviar `tipoPlano` no payload do frontend para o GAS quando disponível.
2. Registrar também `email` (e opcionalmente separar `data`/`hora`) na planilha, se isso for requisito de auditoria.
3. Definir timezone explícito no GAS para comparação mensal consistente.
4. Ajustar texto de retorno para refletir plano quando aplicável.
