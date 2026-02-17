# femflow_free_access

## Resumo
Chave de estado `femflow_free_access` usada pelo app FemFlow para controle de fluxo, sessão e experiência da usuária.

## Valor de exemplo
```txt
{"enabled":false,"enfases":[],"until":null}
```

## Categoria
- Perfil / estado geral

## Uso típico
- Lida/escrita no `localStorage` no front-end para persistência entre telas e recargas.

## Sensibilidade
- Não crítico; ainda assim evite exposição desnecessária em logs públicos.
