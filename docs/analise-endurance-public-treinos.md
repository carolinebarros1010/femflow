# Análise das regras do `endurance_public` por quantidade de treinos

Este documento resume como o Flow Center define o **estímulo ativo** do modo público de Endurance (`endurance_public`) para 2, 3, 4 e 5 treinos por semana.

## Fonte das regras

No `flowcenter.js`, a regra-base é:

- Lista fixa de estímulos (ordem):
  - `volume`
  - `ritmo`
  - `vel_pura`
  - `res_vel`
  - `limiar`
- Para `n` treinos/semana, os estímulos ativos são os **`n` primeiros** itens da lista.
- `n` é limitado entre **2 e 5** (`clamp`).

## Regras por quantidade de treinos

### 2 treinos/semana

Estímulos ativos:

1. `volume`
2. `ritmo`

### 3 treinos/semana

Estímulos ativos:

1. `volume`
2. `ritmo`
3. `vel_pura`

### 4 treinos/semana

Estímulos ativos:

1. `volume`
2. `ritmo`
3. `vel_pura`
4. `res_vel`

### 5 treinos/semana

Estímulos ativos:

1. `volume`
2. `ritmo`
3. `vel_pura`
4. `res_vel`
5. `limiar`

## Como o dia selecionado vira estímulo

A associação **dia -> estímulo** segue o índice do dia na configuração:

1. `diasSemana` é normalizado e ordenado de segunda a domingo.
2. O app encontra `idx = diasSemana.indexOf(diaSelecionado)`.
3. O estímulo final vira `estimulosAtivos[idx]`.

Exemplo com 4 treinos e dias `[segunda, quarta, sexta, domingo]`:

- segunda (`idx=0`) -> `volume`
- quarta (`idx=1`) -> `ritmo`
- sexta (`idx=2`) -> `vel_pura`
- domingo (`idx=3`) -> `res_vel`

## Regra especial (override) de fim de semana

Se a configuração tiver **sábado e domingo** e a pessoa selecionar **sábado**, o sistema força:

- `estimuloSelecionado = "volume"`

Isso sobrescreve o mapeamento padrão por índice.

## Observações de validação e limites

- O modo público é habilitado quando há intenção pública (`femflow_endurance_public_intent`) ou quando não existe personal ativo.
- Ao salvar configuração, se `treinosSemana` for maior que os dias escolhidos, o valor é reduzido para o total de dias disponíveis.
- Em seguida, há novo `clamp(2, 5)`; portanto, o sistema nunca trabalha com menos de 2 nem mais de 5 treinos na regra de estímulos.
