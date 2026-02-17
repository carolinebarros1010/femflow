# Card: Planilha Corrida 5K (`enfase: planilha_corrida_5k`)

## Comportamento
- Abre modal de “novo programa”.
- Ao confirmar, executa `iniciarPlanilhaCorrida`.
- Vai para Flow Center para configurar planilha.

## LocalStorage
- `femflow_mode_personal = "false"`
- Remove caches endurance (`femflow_endurance_*` relevantes)
- `femflow_endurance_public_intent = "true"`
- `femflow_endurance_public_enabled = "true"`
- `femflow_endurance_modalidade = "corrida_5k"`

## Backend
- Sem chamada direta no clique.
