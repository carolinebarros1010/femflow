# Relatório técnico — Debug de bloqueio/liberação na Home

## 1) Resumo executivo

- O estado final de bloqueio (`data-locked`) na Home **não depende apenas do free_access**: ele é calculado por `avaliarAcessoCard`, que libera o card se **produto/licença** (`podeAcessar`) **ou** `free_access` (`isFreeValid`) retornarem `true`.
- O caso “`free_access.until` vencido e card ainda liberado” é possível e esperado quando `podeAcessarProduto === true` (ex.: `produto=acesso_app` com `ativa=true` para categorias permitidas como `esportes`, onde entram `planilha_*`).
- Havia inconsistência prática na Home: cards simbólicos de `bodyinsight` e cards de `planilha_*` (rail 30 dias) eram renderizados com `locked` hardcoded, sem passar obrigatoriamente por `avaliarAcessoCard`.
- Foi implementado debug opcional na Home (`window.__FF_DEBUG_ACCESS__ === true` ou `?debugAccess=1`) para mostrar **por card** o motivo exato de liberação/bloqueio.
- Impacto: agora é possível responder de forma rastreável “esse card liberou por produto/licença” vs “liberou por free válido”, reduzindo falso diagnóstico de problema no `FreeUntil`.

## 2) Política esperada (matriz)

| Produto | `ativa` | Categoria (Home) | `free_access` válido para card? | Resultado esperado |
|---|---:|---|---:|---|
| `vip` | qualquer | qualquer | qualquer | Liberado (via produto) |
| `acesso_app` | `true` | `muscular`/`esportes`/`casa`/`custom` | `false` | Liberado (via produto) |
| `acesso_app` | `false` | qualquer | `true` | Liberado (via free) |
| `acesso_app` | `false` | qualquer | `false` | Bloqueado |
| `trial_app` | `true` | `muscular`/`esportes`/`casa` | `false` | Liberado (via produto) |
| `trial_app` | `true` | `custom` (ex.: `monte_seu_treino`) | `false` | Bloqueado (pode abrir só via free) |
| `trial_app` | `false` | qualquer | `true` | Liberado (via free) |
| `followme_*` | `true` | `followme` correspondente | `false` | Liberado (via produto específico) |

> Regra de decisão na Home: `locked = !(podeAcessarProduto || podeAcessarFree)`.

## 3) Como o app decide na Home

Fluxo principal de decisão por card:

1. `inferirCategoria(enfase)` classifica o card (`followme`, `personal`, `custom`, `esportes`, `casa`, `muscular`).
2. `podeAcessar(enfase, perfil)` valida acesso por produto/licença (`vip`, `acesso_app`, `trial_app`, `followme_*`, personal).
3. `isFreeValid(perfil, enfase)` valida acesso gratuito (`free_access.enabled`, `free_access.until`, match de `free_access.enfases`).
4. `avaliarAcessoCard(enfase, perfil)` combina as duas regras e define `locked` final.

Pontos importantes observados:

- `planilha_*` cai em `esportes`; portanto, para `acesso_app` ativo (`ativa=true`) fica liberado por produto, mesmo com free vencido.
- `normKey` remove prefixo `planilha_`, então `planilha_corrida_5k` compara corretamente com `corrida_5k` em `FreeEnfases`.
- `parseFreeUntil` aceita ISO (`yyyy-mm-dd`) e BR (`dd/mm/yyyy`), convertendo para fim do dia local.
- Após o patch, os cards simbólicos `bodyinsight` e todos os cards de `CARDS_PLANILHAS_30_DIAS` também passam por `avaliarAcessoCard` na renderização da Home.

## 4) Como o app decide no FlowCenter (comparação)

Sem alterar FlowCenter, a comparação mostra:

- O FlowCenter também normaliza `free_access`, mas usa outra forma para data (`parseFreeUntil` retorna string normalizada) e depois faz `new Date(freeAccess.until)` no cálculo local.
- Na Home, `parseFreeUntil` já retorna `Date` com fechamento no fim do dia (`23:59:59.999`) para formatos ISO/BR.
- O FlowCenter calcula `treinoAcessoOk = personal || acessoAtivo || freeOkUI`, conceito análogo ao “produto OU free”, porém com foco na ação central do treino e não no catálogo completo de cards.

Conclusão da comparação: a divergência observada na Home não exigia mudança no FlowCenter; o ponto crítico era garantir que cards simbólicos relevantes usassem a mesma função de avaliação da Home.

## 5) Checklist de dados de estado

Conferir sempre os seguintes dados:

- `localStorage.femflow_produto`
- `localStorage.femflow_ativa`
- `localStorage.femflow_has_personal`
- `localStorage.femflow_free_access` (JSON)

Origem desses dados:

- Home chama backend com `action=validar`.
- `persistPerfil` grava `produto`, `ativa`, `has_personal` e `free_access` normalizado no localStorage.
- `normalizarFreeAccess` aceita variações (`FreeEnabled`, `FreeEnfases`, `FreeUntil`, snake_case/camelCase).

Validações de consistência:

- `vip` força `ativa=true` no front (comportamento explícito).
- `free_access.until` deve ser checado no formato efetivo salvo e no parse.
- `planilha_*` deve ser comparado em forma normalizada sem prefixo para bater com `FreeEnfases`.

## 6) Reprodução controlada

1. Abrir: `home.html?debugAccess=1`.
2. No console:
   ```js
   window.__FF_DEBUG_ACCESS__ = true;
   ```
3. Recarregar.
4. Simular estado no localStorage/perfil de teste.

### Cenário A — `until` vencido e ainda liberando (por produto)

- `produto=acesso_app`
- `ativa=true`
- `free_access.enabled=true`
- `free_access.enfases=['corrida_5k']`
- `free_access.until='2020-01-01'`
- Card: `planilha_corrida_5k`

Esperado: `free_valid=false`, porém `podeAcessarProduto=true`, então `lockedFinal=false`.

### Cenário B — `until` futuro liberando corretamente por free

- `produto=trial_app`
- `ativa=false`
- `free_access.enabled=true`
- `free_access.enfases=['corrida_5k']`
- `free_access.until='2099-12-31'`
- Card: `planilha_corrida_5k`

Esperado: `podeAcessarProduto=false`, `podeAcessarFree=true`, `lockedFinal=false`.

## 7) Evidências coletadas

Logs reais obtidos com o debug implementado:

### (a) `until` vencido e card liberando

```json
{
  "enfase": "planilha_corrida_5k",
  "categoria": "esportes",
  "produto": "acesso_app",
  "ativa": true,
  "hasPersonal": false,
  "free_access_raw": { "enabled": true, "enfases": ["corrida_5k"], "until": "2020-01-01" },
  "free_enabled": true,
  "free_until_raw": "2020-01-01",
  "free_until_parsed": "2020-01-01T23:59:59.999Z",
  "free_valid": false,
  "free_enfases_norm": ["corrida_5k"],
  "enfase_norm": "corrida_5k",
  "podeAcessarProduto": true,
  "podeAcessarFree": false,
  "lockedFinal": false
}
```

Diagnóstico: liberou por `podeAcessarProduto` (produto/licença), não por free.

### (b) `until` futuro liberando corretamente

```json
{
  "enfase": "planilha_corrida_5k",
  "categoria": "esportes",
  "produto": "trial_app",
  "ativa": false,
  "hasPersonal": false,
  "free_access_raw": { "enabled": true, "enfases": ["corrida_5k", "bodyinsight"], "until": "2099-12-31" },
  "free_enabled": true,
  "free_until_raw": "2099-12-31",
  "free_until_parsed": "2099-12-31T23:59:59.999Z",
  "free_valid": true,
  "free_enfases_norm": ["corrida_5k", "bodyinsight"],
  "enfase_norm": "corrida_5k",
  "podeAcessarProduto": false,
  "podeAcessarFree": true,
  "lockedFinal": false
}
```

Diagnóstico: liberou por free_access válido.

## 8) Causas-raiz

### Confirmadas

1. **Interpretação incorreta da regra final**: houve leitura de que “`until` vencido deveria bloquear sempre”, mas a regra real é “produto OU free”.
2. **Cards simbólicos fora da trilha única de decisão**: `bodyinsight` e rail de planilhas 30 dias tinham `locked` default/hardcoded na montagem, sem avaliação obrigatória por `avaliarAcessoCard`.

### Descartadas

1. “`normKey` não remove `planilha_`”: descartado (remove e normaliza corretamente).
2. “`isFreeValid` ignora data vencida”: descartado (retorna `false` quando `until` expirou).
3. “Somente backend resolve”: descartado para este bug específico; a divergência principal era de aplicação da regra na Home.

## 9) Recomendações de correção (priorizadas)

1. **Manter todos os cards da Home passando por `avaliarAcessoCard` (P0)**  
   - Impacto: alta consistência de bloqueio/liberação.  
   - Risco: baixo (mudança localizada).
2. **Manter debug gate para diagnóstico temporário (P1)**  
   - Impacto: acelera suporte e QA; identifica causa por card.  
   - Risco: baixo (só ativo quando ligado).
3. **Opcional: padronizar parse de `free_until` entre Home e FlowCenter (P2)**  
   - Impacto: reduz diferenças sutis de timezone/parse.  
   - Risco: médio-baixo (exige validação cruzada).

## 10) Plano de teste (mínimo 6 cenários)

1. `acesso_app + ativa=true + free vencido + planilha_*` → deve liberar por produto.
2. `acesso_app + ativa=false + free vencido + planilha_*` → deve bloquear.
3. `trial_app + ativa=true + monte_seu_treino` sem free → bloquear (trial não inclui `custom`).
4. `trial_app + ativa=false + free válido para monte_seu_treino` → liberar por free.
5. `vip + free vazio + bodyinsight` → liberar por produto.
6. `acesso_app + ativa=false + free válido (BR dd/mm/yyyy) + planilha_*` → liberar e validar parse BR.

---

## Como rodar o debug

- Abrir Home com `?debugAccess=1`.
- No console:
  ```js
  window.__FF_DEBUG_ACCESS__ = true;
  ```
- Recarregar e observar logs `[FF_ACCESS_DEBUG]` para `planilha_*`, `monte_seu_treino` e `bodyinsight`.
