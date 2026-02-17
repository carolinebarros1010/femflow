# Botão: Sim, iniciar (`#novoProgramaConfirmar`)

## Contexto
Confirma abertura de um novo programa ao clicar em cards que mudam treino/coach/planilha.

## O que faz
- Executa `confirmarNovoPrograma()`.
- Se houver ação customizada (ex.: planilha corrida), executa essa ação.
- Caso contrário:
  - Se categoria for `followme`, chama `selecionarCoach(enfase)`.
  - Senão chama `selecionarEnfase(enfase)`.

## LocalStorage
Pode alterar, dependendo do tipo:
- `femflow_enfase`
- `femflow_diaPrograma = "1"`
- `femflow_dia_treino = "1"`
- `femflow_mode_personal` (em certos fluxos)

## Backend
Pode chamar:
- `action: "setenfase"`
- `action: "setDiaPrograma"` (via `FEMFLOW.reiniciarDiaPrograma()`).
