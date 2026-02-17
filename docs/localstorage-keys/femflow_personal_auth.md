# femflow_personal_auth

## Resumo
Chave de estado `femflow_personal_auth` usada pelo app FemFlow para controle de fluxo, sessão e experiência da usuária.

## Valor de exemplo
```txt
{"timestamp":1770976837227,"user":{...}}
```

## Categoria
- Autenticação / sessão / segurança

## Uso típico
- Lida/escrita no `localStorage` no front-end para persistência entre telas e recargas.

## Sensibilidade
- **Sim** — contém dado sensível; mascarar em logs e nunca expor em prints públicos.
