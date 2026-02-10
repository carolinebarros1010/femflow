# Migração — persistência de Último Caminho (Staging/GAS)

## Objetivo
Persistir no backend GAS o último caminho de treino selecionado pela aluna para suportar continuidade entre dispositivos.

## Estrutura de dados (aba `Alunas`)
Foram adicionadas 2 colunas no final do `HEADER_ALUNAS`:
- `UltimoCaminho` (inteiro 1..5)
- `UltimoCaminhoData` (Date do GAS)

> Posição proposta: ao final do header para evitar quebra de índices já usados no pipeline atual.

## Mudanças implementadas

### 1) `salvarTreino_(data)`
Arquivo: `staging/GAS/AuxLogica.gs`
- Novos campos aceitos no payload:
  - `faseMetodo` (opcional)
  - `caminhoMetodo` (opcional; default `hormonal`)
  - `caminhoNumero` (opcional)
- Compatibilidade:
  - fallback para `data.caminho` quando `caminhoNumero` não vem
- Validação:
  - só persiste quando `caminhoNumero` é inteiro entre 1 e 5
- Persistência:
  - salva em `COL_ULTIMO_CAMINHO` e `COL_ULTIMO_CAMINHO_DATA`

### 2) `_validarPerfil_(params)`
Arquivo: `staging/GAS/Get.gs`
- Retorna novos campos:
  - `ultimaFase`
  - `ultimoCaminho`
  - `ultimoCaminhoData`

### 3) Índices e header
Arquivo: `staging/GAS/Header.gs`
- Inclusão de colunas no `HEADER_ALUNAS`
- Inclusão de constantes:
  - `COL_ULTIMO_CAMINHO = 36`
  - `COL_ULTIMO_CAMINHO_DATA = 37`

## Passos de deploy/migração
1. Publicar nova versão do GAS staging.
2. Executar qualquer fluxo que chame `ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS)` para sincronizar o cabeçalho e criar as novas colunas automaticamente.
3. Validar com uma aluna de teste:
   - `salvarTreino` com `caminhoNumero=3`
   - `validar` deve retornar `ultimoCaminho=3` e `ultimoCaminhoData` preenchido.

## Rollback
- Se necessário rollback de código, as colunas novas podem permanecer na planilha sem impacto para versões antigas.
