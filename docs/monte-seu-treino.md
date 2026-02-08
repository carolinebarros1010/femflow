# Monte seu treino — fluxo

Este documento descreve o fluxo completo da funcionalidade **Monte seu treino**, incluindo UI, persistência e execução do treino.

## 1) Home — card e modais

- Um novo card **“Monte seu treino”** aparece ao lado do card Personal na Home.
- Ao clicar no card:
  1. Abre um modal de confirmação com o texto **“Deseja montar um novo treino? Isso irá zerar o dia do programa.”**
  2. Se confirmar, abre o modal principal com 5 selects na ordem fixa:
     - Aquecimento
     - Músculo 1
     - Músculo 2
     - Músculo 3
     - Resfriamento

## 2) Modal principal — opções

### Aquecimento (select 1)
- Labels exibidos:
  - `aquecimento_superiores`
  - `aquecimento_inferiores`
- Valores salvos:
  - `extra_aquecimento_superiores`
  - `extra_aquecimento_inferiores`

### Músculos (selects 2, 3, 4)
- Mesmas opções nas 3 caixas:
  - `extra_mobilidade`
  - `extra_biceps`
  - `extra_triceps`
  - `extra_ombro`
  - `extra_quadriceps`
  - `extra_posterior`
  - `extra_peito`
  - `extra_costas`
  - `extra_gluteo`

### Resfriamento (select 5)
- Labels exibidos:
  - `resfriamento_superiores`
  - `resfriamento_inferiores`
- Valores salvos:
  - `extra_resfriamento_superiores`
  - `extra_resfriamento_inferiores`

## 3) Persistência no localStorage

Ao confirmar o modal principal:

```js
localStorage.setItem("femflow_custom_treino", "true");
localStorage.setItem(
  "femflow_custom_blocos",
  JSON.stringify([
    "extra_aquecimento_superiores",
    "extra_costas",
    "extra_biceps",
    "extra_ombro",
    "extra_resfriamento_superiores"
  ])
);
// zerar programa
localStorage.setItem("femflow_diaPrograma", "1");
```

Após salvar, a navegação é feita para:

```js
location.href = "treino.html";
```

**Importante:** não usar `femflow_treino_extra`. Este treino **não** é classificado como extra.

## 4) Treino.js — detecção do modo custom

No `treino.js`, o modo custom é detectado com:

```js
const isCustomTreino =
  localStorage.getItem("femflow_custom_treino") === "true";
```

Quando `isCustomTreino === true`:
- Ignora ênfase padrão
- Ignora `isExtraEnfase`
- Ignora lógica automática por dia/fase
- Monta o treino via engine em modo custom

Exemplo de chamada:

```js
lista = await FEMFLOW.engineTreino.montarTreinoCustomizado({
  id,
  diaCiclo,
  diaPrograma
});
```

## 5) Treino-engine.js — montagem do treino custom

A função `montarTreinoCustomizado()`:

1. Lê os blocos selecionados:

```js
const blocosSelecionados =
  JSON.parse(localStorage.getItem("femflow_custom_blocos") || "[]");
```

2. Para cada item, busca no Firebase:

```
/exercicios_extra/{docId}/blocos
```

Exemplo:

```
/exercicios_extra/extra_ombro/blocos/bloco_1
```

3. Concatena todos os blocos mantendo a ordem fisiológica:

- Aquecimento
- Treino (1)
- Treino (2)
- Treino (3)
- Resfriamento

4. Converte usando `converterParaFront()` e retorna a lista final para renderização no `treino.js`.

## 6) Evolução / histórico

- O treino conta como treino normal (considera `diaPrograma`).
- A evolução é salva normalmente.
- **Não** usar `type: "extra"`.
- Opcionalmente, para identificação:

```js
type: "custom"
source: "monte_seu_treino"
```

## 7) Limpeza de estado (obrigatório)

Após salvar o treino **ou** sair da tela:

```js
localStorage.removeItem("femflow_custom_treino");
localStorage.removeItem("femflow_custom_blocos");
```

## Resultado esperado

- Card “Monte seu treino” funcional na Home
- Modal guiado com 5 escolhas
- Treino montado exclusivamente via `exercicios_extra`
- Ordem fisiológica correta
- Treino conta como treino normal
- Evolução salva corretamente
- Nenhum conflito com Treino Extra existente
