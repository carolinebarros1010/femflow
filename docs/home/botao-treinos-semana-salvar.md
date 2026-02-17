# Botão: Salvar treinos por semana (`#treinosSemanaSalvar`)

## Contexto
Botão do modal “Quantos dias por semana você pretende treinar?”.

## O que faz
- Usa valor selecionado (1..7).
- Chama `salvarTreinosSemana(valor)`.
- Fecha modal.

## LocalStorage
- Grava `femflow_treinos_semana` com o valor escolhido.

## Backend
Se existir `femflow_id`, envia `POST` com:
- `action: "settreinossemana"`
- `id`
- `treinosSemana`

## Observação
Sem `id`, salva apenas localmente.
