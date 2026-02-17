# Card: FollowMe Karoline Bombeira (`enfase: followme_karoline`)

## Comportamento
Mesmo fluxo do FollowMe:
- Bloqueado: mensagem “Em breve”.
- Desbloqueado + confirmação: aplica coach, reinicia programa e abre Flow Center.

## LocalStorage
- `femflow_mode_personal = "false"`
- `femflow_enfase = "followme_karoline"`
- `femflow_dia_treino = "1"`
- `femflow_diaPrograma = "1"`

## Backend
- `action: "setenfase"`
- `action: "setDiaPrograma"` (reinício).
