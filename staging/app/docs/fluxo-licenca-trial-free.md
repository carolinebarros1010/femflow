# Fluxo de licença, trial_app e cards free (free_access)

Este documento descreve como o app decide liberar ou bloquear **Treino**, **Treino Extra** e **Próximo Treino** quando a licença está ativa/inativa, quando o produto é `trial_app` e quando existe um **card free** (`free_access`).

## 1) Conceitos e fontes de verdade

### 1.1 Produto (coluna Produto)
- `trial_app`: cadastro direto pelo app.
- `acesso_app`: compra via Hotmart.
- `vip`: definido manualmente na planilha.

### 1.2 Licença ativa (LicencaAtiva)
- Campo da planilha que determina se a usuária **pode acessar** o conteúdo premium.
- `true` → acesso liberado.
- `false` → acesso bloqueado (exceto quando existe `free_access` válido).

### 1.3 Free access (card free)
- Estrutura de promoção que libera **uma ou mais ênfases** sem depender da licença ativa.
- Exemplo de estrutura retornada pelo backend:

```json
{
  "enabled": true,
  "enfases": ["gluteos", "casa_core_gluteo"],
  "until": "2099-12-31"
}
```

## 2) Regras de liberação (FlowCenter)

No FlowCenter, a liberação de **Treino**, **Treino Extra** e **Próximo Treino** segue a regra:

```
treinoAcessoOk = acessoAtivo OU freeOkUI
```

Onde:
- `acessoAtivo` = `perfil.ativa === true` **ou** `vip`.
- `freeOkUI` = existe `free_access` válido e a ênfase atual (`femflow_enfase`) está dentro da lista de `enfases`.

### Resultado prático
- **Licença ativa** (`ativa = true`) → libera treino e treino extra.
- **Licença inativa** (`ativa = false`) → bloqueia treino.
- **Licença inativa + card free válido** → libera treino e treino extra.
- **Endurance** permanece restrito ao Personal (não é liberado por card free).

## 3) Regras na Home (cards)

Na Home, os cards só ficam desbloqueados quando:

- `LicencaAtiva = true` **ou** `vip`.
- **trial_app não contorna** a licença ativa (se `LicencaAtiva = false`, fica bloqueado).

## 4) Fluxo de bloqueio

Quando o acesso é bloqueado:
- O app mostra um toast informativo.
- Em seguida abre o checkout Hotmart (`LINK_ACESSO_APP`).

## 5) Exemplos

### Exemplo A — Trial cadastrado, licença false
- `produto = trial_app`
- `LicencaAtiva = false`
- Resultado: **bloqueado** (não acessa treino).

### Exemplo B — Licença ativa
- `LicencaAtiva = true`
- Resultado: **liberado** (treino e treino extra disponíveis).

### Exemplo C — Licença false + card free válido
- `LicencaAtiva = false`
- `free_access.enabled = true`
- `free_access.enfases` contém a ênfase atual
- Resultado: **liberado apenas para aquela ênfase**.

## 6) Onde isso é controlado

- **FlowCenter**: valida `acessoAtivo` e `free_access` para liberar treino/extra.
- **Home**: bloqueia cards se a licença estiver inativa.
- **Backend (GAS)**: define `LicencaAtiva` na criação e validação do perfil.

---

> Observação: se precisar mudar a política (ex.: liberar trial por 7 dias), isso deve ser ajustado no backend (GAS) ao definir `LicencaAtiva` e nas regras de bloqueio acima.
