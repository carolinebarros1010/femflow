# Card: Treino Personalizado (`enfase: personal`)

## Comportamento
- Se bloqueado: mostra CTA comercial de Personal e abre link externo.
- Se desbloqueado: ativa modo personal e vai para `flowcenter.html`.

## LocalStorage
Quando desbloqueado:
- `femflow_mode_personal = "true"`

## Backend
- Não chama backend no clique do card.
- Backend entra depois no Flow Center (validação/sincronização).
