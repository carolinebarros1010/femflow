# Botão: Confirmar (modal Monte seu treino) (`#customTreinoSalvar`)

## O que faz
Executa `confirmarCustomTreino()`:
1. Coleta blocos escolhidos nos selects.
2. Persiste seleção local.
3. Reinicia dia do programa.
4. Navega para `flowcenter.html`.

## LocalStorage
- `femflow_custom_treino = "true"`
- `femflow_custom_blocos = JSON.stringify([...])`
- `femflow_diaPrograma = "1"`

## Backend
- Não chama backend nesse clique.
