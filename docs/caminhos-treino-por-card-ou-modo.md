# Caminhos de treino por card ou por modo (FemFlow)

Este documento resume os fluxos de navegação e estado para os caminhos de treino solicitados:

- Modo Personal
- Monte seu treino
- Card de treino (cards normais)
- Planilha de corrida
- Treino extra

## 1) Modo Personal

**Origem:** card `personal` na Home.

**Fluxo:**
1. Usuária clica no card **Treino Personalizado** (`enfase === "personal"`).
2. A Home ativa `femflow_mode_personal = "true"`.
3. Redireciona para `flowcenter.html`.
4. No Flow Center, o modo personal só é válido quando `hasPersonal && modePersonal`.
5. Ao clicar em **Iniciar treino**, abre o modal de **Caminhos** (não vai direto para treino).
6. Após escolher caminho, abre `treino.html?caminho=<n>`.

**Regras importantes:**
- Se a usuária não tiver direito de personal (`femflow_has_personal !== "true"`), o modo personal não fica ativo.
- Modo personal é uma combinação de **acesso** + **modo ativo**, não apenas um dos dois.

## 2) Monte seu treino

**Origem:** card `monte_seu_treino` na Home.

**Fluxo:**
1. Usuária clica no card **Monte seu treino**.
2. A Home força `femflow_mode_personal = "false"`.
3. Abre modal de confirmação.
4. Ao confirmar, abre modal de montagem do treino (aquecimento, até 3 músculos, resfriamento).
5. Ao salvar:
   - `femflow_custom_treino = "true"`
   - `femflow_custom_blocos = [...]`
   - `femflow_diaPrograma = "1"`
6. Redireciona para `flowcenter.html`.

**Comportamento no Flow Center:**
- Com custom ativo, os botões de treino normal/extra exibem aviso de que **Monte seu treino está ativo**.
- O treino custom passa a ser o caminho principal até ser limpo/finalizado.

## 3) Card de treino (cards normais)

**Origem:** cards de treino comuns (ênfases como glúteo, quadríceps, etc.).

**Fluxo:**
1. Usuária clica em um card desbloqueado.
2. A Home exige/garante `femflow_treinos_semana` (1..7).
3. A Home desativa personal: `femflow_mode_personal = "false"`.
4. Se ciclo não estiver configurado, redireciona para fluxo de ciclo.
5. Se estiver ok, abre modal **iniciar novo programa**.
6. Ao confirmar:
   - salva `femflow_enfase`
   - reinicia `femflow_diaPrograma = "1"` e `femflow_dia_treino = "1"`
   - sincroniza backend (`setenfase` + reset do dia de programa)
   - envia para `flowcenter`.
7. No Flow Center, **Iniciar treino** abre modal de **Caminhos** e então `treino.html?caminho=<n>`.

## 4) Planilha de corrida

**Origem:** cards `planilha_corrida_5k`, `planilha_corrida_10k`, `planilha_corrida_15k`.

**Fluxo:**
1. Usuária clica na planilha.
2. Home marca intenção pública de endurance:
   - `femflow_endurance_public_intent = "true"`
   - `femflow_endurance_public_enabled = "true"`
   - `femflow_endurance_modalidade = "corrida_5k|10k|15k"`
3. Mostra toast e envia para `flowcenter`.
4. No Flow Center, usuária configura Endurance (modalidade, treinos/semana, dias, ritmo).
5. Ao salvar configuração:
   - persiste `femflow_endurance_config`
   - marca setup done
   - define semana/dia/estímulo atuais
6. O início do treino endurance segue para `treino.html?endurance=1`.

**Observação:**
- Esse caminho permite funcionamento em modo público de endurance mesmo sem personal, quando a intenção pública está ativa.

## 5) Treino extra

**Origem:** botão **Treino extra** no Flow Center (abre modal com botões `data-extra-enfase`).

**Fluxo:**
1. Usuária abre modal de extra e escolhe uma ênfase extra (`extra_superior`, `extra_gluteo`, etc.).
2. Se houver ênfase base não-extra, o app guarda em `femflow_enfase_base`.
3. Define:
   - `femflow_treino_extra = "true"`
   - `femflow_enfase = "extra_*"`
4. Fecha modal e abre `treino.html?extra=extra_*`.

**Regras importantes:**
- Se `femflow_custom_treino` estiver ativo, o treino extra não inicia (mostra aviso).
- O treino extra usa ênfases com prefixo `extra_` e segue fluxo dedicado no motor de treino.

---

## Resumo rápido por origem

- **Home > personal** → ativa modo personal → Flow Center → modal Caminhos → treino.
- **Home > monte seu treino** → cria treino custom via modal → Flow Center (custom ativo).
- **Home > card normal** → seleciona ênfase e reinicia programa → Flow Center → modal Caminhos → treino.
- **Home > planilha corrida** → ativa intenção endurance pública → Flow Center (setup) → treino endurance.
- **Flow Center > treino extra** → escolhe `extra_*` → treino extra imediato.
