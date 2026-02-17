# femflow_smart_push_state

## Resumo
Chave de estado `femflow_smart_push_state` usada pelo app FemFlow para controle de fluxo, sessão e experiência da usuária.

## Valor de exemplo
```txt
{"lastPhase":"ovulatoria",...}
```

## Categoria
- Notificações / push

## Uso típico
- Lida/escrita no `localStorage` no front-end para persistência entre telas e recargas.

## Sensibilidade
- Não crítico; ainda assim evite exposição desnecessária em logs públicos.
