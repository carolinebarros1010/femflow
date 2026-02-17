# Card: Monte seu treino (`enfase: monte_seu_treino`)

## Comportamento
- Garante seleção de treinos/semana (se faltando, abre modal).
- Desativa modo personal.
- Abre modal de confirmação custom.

## LocalStorage
No clique:
- `femflow_mode_personal = "false"`

Na confirmação final do modal custom:
- `femflow_custom_treino`
- `femflow_custom_blocos`
- `femflow_diaPrograma = "1"`

## Backend
- Não chama backend no clique/confirm custom.
