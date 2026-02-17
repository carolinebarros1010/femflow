# Card: FollowMe Lívia Rapaci (`enfase: followme_livia_rapaci`)

## Comportamento
- Se bloqueado: mostra mensagem de “Em breve”.
- Se desbloqueado e confirmado no modal de novo programa:
  - Define coach como ênfase.
  - Reinicia dia do programa.
  - Navega para Flow Center.

## LocalStorage
No fluxo desbloqueado/confirmado:
- `femflow_mode_personal = "false"`
- `femflow_enfase = "followme_livia_rapaci"`
- `femflow_dia_treino = "1"`
- `femflow_diaPrograma = "1"`

## Backend
- `action: "setenfase"`
- `action: "setDiaPrograma"` via reinício do dia programa.
