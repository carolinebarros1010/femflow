📘 README OFICIAL — PLANILHA DE TREINOS FEMFLOW
1️⃣ Objetivo da Planilha

Esta planilha é a fonte estrutural dos treinos do FemFlow, utilizada para alimentar o sistema (Firebase + App) com treinos organizados por:

fase do ciclo hormonal

dia do ciclo

nível da aluna

ênfase muscular

A planilha não executa lógica.
Toda a lógica de ordenação, intercalamento e renderização é feita pelo treino-engine.js.

2️⃣ Estrutura das Colunas (Padrão Oficial)
Coluna	Obrigatória	Descrição
tipo	✅	Tipo do bloco (aquecimento, treino, hiit, cardio_final, resfriamento)
box	✅	Agrupador lógico do bloco (número + sufixo opcional)
ordem	✅	Ordem interna dentro do box
enfase	✅	Ênfase principal do treino (ex: gluteo)
fase	✅	Fase do ciclo (menstrual, folicular, ovulatoria, lutea)
dia	✅	Dia do ciclo (1–30)
titulo_pt	⚠️	Nome do exercício (português)
titulo_en	⚠️	Nome do exercício (inglês)
titulo_fr	⚠️	Nome do exercício (francês)
link	⚠️	Link do exercício (YouTube Shorts)
series	⚠️	Número de séries
reps	⚠️	Repetições
tempo	⚠️	Tempo (em segundos)
intervalo	⚠️	Intervalo (em segundos)
forte	⚠️	Tempo forte do HIIT
leve	⚠️	Tempo leve do HIIT
ciclos	⚠️	Número de ciclos do HIIT

🔹 Campos marcados como ⚠️ são usados apenas quando o tipo exige.

3️⃣ Tipos de Bloco e Regras
🔹 Aquecimento
tipo = aquecimento
box = 0


Séries, reps, tempo e intervalo não são utilizados

O app converte automaticamente para o Aquecimento Premium FemFlow

🔹 Treino (Exercícios)
tipo = treino
box = 1, 2, 3...


Pode usar letras no box (1T, 2AE, 3S)

O número define a ordem

A letra define série especial (visual e pedagógica)

🔹 HIIT
tipo = hiit


Regras obrigatórias:

Se vinculado a um box → box = número do box

Se HIIT solto → box = 0

ordem ≥ 90 (padrão oficial)

🔹 Cardio Final
tipo = cardio_final
box = 900


Sempre após o treino

Usa apenas a coluna tempo

🔹 Resfriamento
tipo = resfriamento
box = 999   ✅ PADRÃO OFICIAL


Séries, reps e tempo não são utilizados

Convertido automaticamente para Resfriamento Premium FemFlow

4️⃣ Séries Especiais (Resumo)
Código	Nome	Observação
B	Biset	2 exercícios seguidos
T	Triset	3 exercícios seguidos
Q	Quadriset	4 exercícios seguidos
C	Cluster	Reps divididas
D	Dropset	Redução de carga
RP	Rest-Pause	Falha + redução
I	Isometria	Contração mantida
CC	Cadência Controlada	Excêntrica lenta
AE	Advanced Effort	Indicador de alta exigência
SM SubMAX

📌 O engine não calcula carga.
As séries especiais são guias de execução.

📅 DIA MODELO — INICIANTE • GLÚTEO

Fase: Folicular
Dia: 6

tipo            box   ordem  enfase   fase       dia  titulo_pt
aquecimento     0     1      gluteo   folicular  6    Aquecimento inicial

treino          1     1      gluteo   folicular  6    Agachamento com halter
treino          1     2      gluteo   folicular  6    Afundo alternado
treino          1     3      gluteo   folicular  6    Elevação pélvica
treino          2     1     gluteo   folicular  6    Abdutor máquina
treino          2     2      gluteo   folicular  6    Supino maquina
treino          3T     1      gluteo   folicular  6    triceps Testa
treino          3T     2      gluteo   folicular  6    triceps corda
treino          3T     3     gluteo   folicular  6    triceps paralela
treino          4RP     1      gluteo   folicular  6    Agachamento Smith
treino          5C    1      gluteo   folicular  6    Cadeira Extensora


hiit            1     99     gluteo   folicular  6    HIIT curto 20/30

cardio_final    900   1      gluteo   folicular  6    Cardio leve

resfriamento    999   1      gluteo   folicular  6    Resfriamento final

🧠 O que o engine fará automaticamente:

Renderizar Aquecimento Premium

Agrupar os 4 exercícios no Box 1

Inserir o HIIT ao final do box

Inserir o Cardio Final

Renderizar Resfriamento Premium

Garantir que aquecimento e resfriamento apareçam apenas uma vez

5️⃣ Princípios FemFlow (regra de ouro)

A planilha não pensa

O engine não ensina

O método educa o corpo

📌 Se a planilha estiver limpa e coerente,
📌 o app sempre mostrará o treino certo, no dia certo, para o corpo certo.
