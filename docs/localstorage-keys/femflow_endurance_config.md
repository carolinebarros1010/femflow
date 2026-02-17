# femflow_endurance_config

## Resumo
Chave de estado `femflow_endurance_config` usada pelo app FemFlow para controle de fluxo, sessão e experiência da usuária.

## Valor de exemplo
```txt
{"modalidade":"corrida","treinosSemana":3,"diasSemana":["segunda","quarta","domingo"],"ritmo":"5:20"}
```

## Categoria
- Endurance

## Uso típico
- Lida/escrita no `localStorage` no front-end para persistência entre telas e recargas.

## Sensibilidade
- Não crítico; ainda assim evite exposição desnecessária em logs públicos.
