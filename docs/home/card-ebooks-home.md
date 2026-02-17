# Cards de eBooks (rail de eBooks)

## Origem
- Carrega `ebooks/ebooks.json`.
- Usa cache local (`femflow_ebooks_cache_v1`) por TTL.

## Comportamento de clique
- Se card tiver `data-destino`, faz `window.location.href` para o link resolvido.

## LocalStorage
- Pode ler/gravar somente cache de eBooks:
  - `femflow_ebooks_cache_v1`

## Backend
- Não usa backend principal de treino (`FEMFLOW.SCRIPT_URL`) no clique dos eBooks.
