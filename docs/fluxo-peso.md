# Fluxo do input de peso (ff-ex-peso)

Este documento descreve o comportamento do input de peso renderizado com a classe `.ff-ex-peso` (ex.: `data-ex="Agachamento Hack"`) na área de treinos do FemFlow.

## 1) Renderização do input

O input de peso é criado no `renderExercicio` (treino.js). Ele recebe:

- `class="ff-ex-peso"`
- `type="number"`
- `placeholder="kg"`
- `data-ex="${ex.titulo}"`

Isso significa que o nome oficial do exercício (por exemplo, **Agachamento Hack**) é usado como identificador do exercício para salvar e recuperar a evolução.

## 2) Salvar peso automaticamente (change)

Após renderizar os exercícios, o front chama `initPeso()` e adiciona um listener `change` em todos os `.ff-ex-peso`.

Quando a aluna altera o valor:

1. O código lê o exercício a partir de `data-ex` e o peso digitado.
2. Captura séries e reps do card atual.
3. Determina o treino (personal x ênfase) com base no ciclo.
4. Envia para o backend via `FEMFLOW.post` com `action: "salvarevolucao"`.

## 3) Prefill do último peso

Após renderizar os exercícios, o front também chama `initPesoPrefill()`.

Esse método:

1. Itera todos os inputs `.ff-ex-peso`.
2. Se o input estiver vazio, chama `getUltimoPeso(id, exercicio)`.
3. Se houver retorno, preenche o valor no input.

`getUltimoPeso()` realiza `FEMFLOW.post` com `action: "getultimopeso"` usando o nome do exercício (o mesmo `data-ex`).

## Conclusão

O fluxo atual garante que:

- **Todo exercício renderizado** com `.ff-ex-peso` faz **salvamento automático** ao alterar o valor.
- **Todo exercício renderizado** tenta **buscar e preencher** o último peso registrado no backend, desde que o input esteja vazio.

