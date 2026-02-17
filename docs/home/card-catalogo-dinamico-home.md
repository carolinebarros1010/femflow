# Cards dinâmicos da Home (muscular, esportes, casa e outros presets)

## Origem
Esses cards vêm de:
1. Firebase (catálogo dinâmico)
2. Presets locais (`CARDS_HOME_PRESETS`) para completar vitrine

## Clique (fluxo geral)
1. Valida bloqueio/acesso por produto.
2. Garante `treinos por semana` (modal se necessário).
3. Se card normal:
   - desativa modo personal;
   - valida ciclo configurado;
   - abre modal de novo programa;
   - ao confirmar, chama `selecionarEnfase(enfase)`.

## LocalStorage (fluxo normal confirmado)
- `femflow_enfase = <enfase clicada>`
- `femflow_diaPrograma = "1"`
- `femflow_dia_treino = "1"`
- `femflow_mode_personal = "false"`

## Backend (fluxo normal confirmado)
- `action: "setenfase"`
- `action: "setDiaPrograma"` via `reiniciarDiaPrograma()`.
