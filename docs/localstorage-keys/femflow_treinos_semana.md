# femflow_treinos_semana

## Resumo
Chave de estado `femflow_treinos_semana` usada para definir quantos treinos por semana a usuária pretende fazer (faixa válida: **1..7**). Esse valor impacta o fluxo de entrada em treinos e regras de ausência/descanso automático no backend.

## Valor de exemplo
```txt
3
```

## Fluxo (front-end -> backend)
1. Ao clicar em cards de treino na Home, o app chama `garantirTreinosSemana()` e **sempre abre o modal** antes de continuar o fluxo, usando o valor salvo atual apenas como pré-seleção.
2. Ao salvar no modal, o front grava `localStorage.setItem("femflow_treinos_semana", String(valor))`.
3. Em seguida, envia `POST` para o Apps Script com `action: "settreinossemana"`, `id` e `treinosSemana`.
4. No backend, `setTreinosSemana_` valida a faixa `1..7` e persiste na coluna `COL_TREINOS_SEMANA`.
5. Esse mesmo campo é usado no cálculo de ausência automática (`limiteAusenciaDias = max(0, 7 - treinosSemana)`).

## Comportamentos importantes
- Se o valor em `localStorage` for inválido (não numérico ou fora de `1..7`), a chave é removida antes de abrir o modal.
- O modal é exibido a cada clique em card de treino, permitindo ajustar a meta semanal ao iniciar um novo programa.
- Troca de usuária (mudança de `femflow_id`) limpa a chave para evitar herdar preferência de outra conta.
- Valor `"3"` é válido e representa **3 treinos/semana**.

## Categoria
- Perfil / estado geral

## Sensibilidade
- Não crítico; ainda assim evite exposição desnecessária em logs públicos.
