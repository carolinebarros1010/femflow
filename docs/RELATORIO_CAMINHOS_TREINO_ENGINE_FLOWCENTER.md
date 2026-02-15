# Relatório técnico — funcionamento dos Caminhos em `flowcenter`, `treino` e `treino-engine`

## Objetivo
Descrever como o recurso **Caminhos (1..5)** é escolhido na Home (`flowcenter`), transportado para a tela de treino (`treino`) e resolvido em consultas de dados no Firebase (`treino-engine`).

---

## 1) Camada de regras de Caminhos (`app/js/treino-caminhos.js`)

Este módulo é o tradutor oficial entre:
- **fase do método/UI** (`faseMetodo`), e
- **fase efetiva de leitura no Firestore** (`faseFirestore`).

### 1.1 Sequência de dias por fase
Cada fase mapeia os Caminhos 1..5 para dias reais do ciclo:
- menstrual → `[1,2,3,4,5]`
- follicular → `[6,7,8,9,10]`
- ovulatory → `[14,15,16,17,18]`
- luteal → `[19,20,21,22,23]`

### 1.2 Regra crítica de transição
Após descobrir o **dia real** pelo caminho, a fase de consulta é recalculada por faixa de dia:
- 1..5 => menstrual
- 6..13 => follicular
- 14..17 => ovulatory
- 18+ => luteal

Exemplo crítico implementado no código:
- `faseMetodo=ovulatory`, `caminho=5` => `diaUsado=18` => `faseFirestore=luteal`.

> Resultado: a UI pode continuar com “fase ovulatória”, mas a busca no Firebase ocorre em `luteal/dia_18`.

### 1.3 Persistência do último caminho
O último caminho usado é salvo em `localStorage` na chave `femflow_last_caminho`, com:
- `faseMetodo`,
- `caminho`,
- `updatedAt`.

Isso permite sugerir o próximo caminho no `flowcenter`.

---

## 2) Orquestração de entrada (`app/js/flowcenter.js`)

O `flowcenter` é a camada de **decisão da navegação** para treino.

### 2.1 Seleção de caminho
Ao clicar em “Treino”, o sistema abre o modal de caminhos (quando aplicável), usando `FEMFLOW.treinoCaminhos`.

Fluxo:
1. Lê último caminho salvo.
2. Sugere próximo com rotação cíclica (`1..5`).
3. Permite pré-visualizar exercícios do caminho selecionado.
4. Ao confirmar, navega para:
   - `treino.html?caminho=<n>`

### 2.2 Prévia no modal
Na prévia:
- resolve contexto pelo caminho (`diaUsado` + `faseFirestore`),
- chama `engineTreino.listarExerciciosDia(...)` com esse contexto,
- lista nomes dos exercícios para o usuário validar antes de iniciar.

### 2.3 Outras rotas que convivem com caminhos
Além do fluxo padrão de caminhos, `flowcenter` também direciona para:
- treino extra: `treino.html?extra=<enfase_extra>`
- endurance: `treino.html?endurance=1`
- followme: `followme/<enfase>.html`
- custom: `treino.html` (sem parâmetro de caminho)

Ou seja, “Caminhos” é o fluxo central do treino normal/personal, mas existem fluxos paralelos por query param.

---

## 3) Resolução de contexto na tela de treino (`app/js/treino.js`)

A tela `treino.js` interpreta query params e decide **qual builder de treino** do engine será usado.

### 3.1 Leitura de parâmetros
No carregamento, lê:
- `caminho` (1..5)
- `extra`
- `endurance`

E liga/desliga flags de sessão no `localStorage`.

### 3.2 Aplicação do caminho no contexto
Quando `caminho` é válido:
1. normaliza `faseMetodo` do perfil;
2. resolve `ctx = resolverContextoDeBusca(faseMetodo, caminho)`;
3. grava `contextoCaminhoSelecionado` com:
   - `caminho`
   - `diaUsado`
   - `faseFirestore`
4. usa:
   - `faseFirestoreFinal = ctx.faseFirestore`
   - `diaUsadoFinal = ctx.diaUsado`

Esses dois campos são os que entram no carregamento real do treino.

### 3.3 Seleção do pipeline de montagem
Prioridade de montagem:
1. Endurance ativo → `montarTreinoEndurance*`
2. Custom ativo → `montarTreinoCustomizado`
3. Caso contrário → `montarTreinoFinal({ fase: faseFirestoreFinal, diaCiclo: diaUsadoFinal, ... })`

Também salva o caminho usado novamente ao final da carga.

---

## 4) Acesso a dados no Firebase (`app/js/treino-engine.js`)

O `treino-engine` encapsula os paths reais do Firestore por tipo de treino.

### 4.1 Treino normal
`carregarBlocosNormais({ nivel, enfase, fase, diaCiclo })`

Path:
`/exercicios/{nivel}_{enfase}/fases/{fase}/dias/dia_{diaCiclo}/blocos`

### 4.2 Treino personal
`carregarBlocosPersonal({ id, fase, diaCiclo })`

Path:
`/personal_trainings/{id}/personal/{fase}/dias/dia_{diaCiclo}/blocos`

### 4.3 Treino extra
`carregarBlocosExtras({ enfase })`

Path principal:
`/exercicios_extra/{enfase}/blocos`

(fallback por query plana em `exercicios_extra` quando necessário)

### 4.4 Endurance
- Personal endurance:
  `/personal_trainings/{id}/endurance/{enfase}/treinos/base/semana/{semana}/dias/{dia}/blocos`
- Endurance público por estímulo:
  `/endurance_public/{modalidade}/treinos/base/semana/{semana}/estimulos/{estimulo}/blocos`

### 4.5 Builder final
`montarTreinoFinal(...)` decide a origem:
- extra → `exercicios_extra`
- personal → `personal_trainings`
- normal → `exercicios`

Depois aplica organização/intercalação e converte para formato front.

---

## 5) Encadeamento fim-a-fim dos Caminhos

1. Usuária escolhe caminho no `flowcenter`.
2. `flowcenter` resolve prévia e navega para `treino.html?caminho=n`.
3. `treino.js` transforma caminho em (`faseFirestoreFinal`, `diaUsadoFinal`).
4. `treino.js` chama `engineTreino.montarTreinoFinal(...)` com esses valores.
5. `treino-engine` monta path Firebase correspondente e busca blocos.
6. Front renderiza os cards do treino.

---

## 6) Pontos importantes de arquitetura

- **Separação de responsabilidade clara**:
  - `treino-caminhos`: regra hormonal/caminhos
  - `flowcenter`: UX e roteamento
  - `treino`: contexto de execução
  - `treino-engine`: acesso e montagem de dados

- **Caminho não é path direto**: ele primeiro vira dia real/fase de leitura.

- **Compatibilidade com transições de fase**: evita erro de buscar fase errada em dias de borda (ex.: dia 18).

- **Persistência de continuidade**: último caminho permite sugestão inteligente no próximo acesso.

