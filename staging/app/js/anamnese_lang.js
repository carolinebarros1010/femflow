/* ============================================================
   🌸 FEMFLOW — ANAMNESE PREMIUM (PT • EN • FR)
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

FEMFLOW.anamneseLang = {
  pt: {
    nome: "Português",
    perguntas: [
      { gif: "strength_training.webp", texto: "Há quanto tempo você segue um treino estruturado?", pilar: "tecnico", opcoes: [
        { texto: "Ainda não sigo uma estrutura", v: 0 },
        { texto: "Comecei recentemente", v: 1 },
        { texto: "Já sigo com boa regularidade", v: 2 },
        { texto: "Tenho rotina estruturada há bastante tempo", v: 3 }
      ]},
      { gif: "mobility_flow.webp", texto: "Qual seu domínio dos exercícios básicos (agachar, empurrar, puxar)?", pilar: "tecnico", opcoes: [
        { texto: "Ainda tenho muita dificuldade", v: 0 },
        { texto: "Consigo com algumas correções", v: 1 },
        { texto: "Executo bem na maior parte do tempo", v: 2 },
        { texto: "Execução sólida e confiante", v: 3 }
      ]},
      { gif: "routine_cycle.webp", texto: "Qual sua experiência com progressão de carga?", pilar: "tecnico", opcoes: [
        { texto: "Nunca programei carga", v: 0 },
        { texto: "Já tentei, mas sem constância", v: 1 },
        { texto: "Aplico progressão com alguma consistência", v: 2 },
        { texto: "Faço progressão de forma planejada", v: 3 }
      ]},

      { gif: "routine_cycle.webp", texto: "Quantos dias por semana você treina atualmente?", pilar: "consistencia", opcoes: [
        { texto: "0–1 dia", v: 0 },
        { texto: "2 dias", v: 1 },
        { texto: "3–4 dias", v: 2 },
        { texto: "5+ dias", v: 3 }
      ]},
      { gif: "profile_form.webp", texto: "Nos últimos 3 meses, como foi sua constância?", pilar: "consistencia", opcoes: [
        { texto: "Muito irregular", v: 0 },
        { texto: "Consegui manter só em alguns períodos", v: 1 },
        { texto: "Fui consistente na maior parte", v: 2 },
        { texto: "Mantive constância praticamente total", v: 3 }
      ]},
      { gif: "menstrual_flow.webp", texto: "Mesmo com imprevistos, você consegue manter a rotina?", pilar: "consistencia", opcoes: [
        { texto: "Quase nunca", v: 0 },
        { texto: "Às vezes", v: 1 },
        { texto: "Na maioria das vezes", v: 2 },
        { texto: "Sim, com alta consistência", v: 3 }
      ]},

      { gif: "strength_training.webp", texto: "Com que frequência você treina próximo da falha muscular?", pilar: "intensidade", opcoes: [
        { texto: "Quase nunca", v: 0 },
        { texto: "Raramente", v: 1 },
        { texto: "Com boa frequência", v: 2 },
        { texto: "Com frequência alta e controle", v: 3 }
      ]},
      { gif: "hormonal_balance.webp", texto: "Quão confortável você está com cargas altas?", pilar: "intensidade", opcoes: [
        { texto: "Nada confortável", v: 0 },
        { texto: "Pouco confortável", v: 1 },
        { texto: "Confortável", v: 2 },
        { texto: "Muito confortável", v: 3 }
      ]},
      { gif: "breath_cycle.webp", texto: "Como você tolera treinos HIIT?", pilar: "intensidade", opcoes: [
        { texto: "Não tolero bem", v: 0 },
        { texto: "Tolero pouco", v: 1 },
        { texto: "Tolero moderadamente", v: 2 },
        { texto: "Tolero muito bem", v: 3 }
      ]},

      { gif: "hormonal_balance.webp", texto: "Quanto tempo você leva para recuperar após treinos intensos?", pilar: "recuperacao", opcoes: [
        { texto: "Mais de 72h", v: 0 },
        { texto: "48–72h", v: 1 },
        { texto: "24–48h", v: 2 },
        { texto: "Até 24h", v: 3 }
      ]},
      { gif: "breath_cycle.webp", texto: "Como está sua qualidade do sono?", pilar: "recuperacao", opcoes: [
        { texto: "Ruim na maior parte das noites", v: 0 },
        { texto: "Irregular", v: 1 },
        { texto: "Boa", v: 2 },
        { texto: "Excelente e estável", v: 3 }
      ]},
      { gif: "menstrual_flow.webp", texto: "Sua energia ao longo do mês costuma ser...", pilar: "recuperacao", opcoes: [
        { texto: "Muito instável", v: 0 },
        { texto: "Com oscilações relevantes", v: 1 },
        { texto: "Relativamente estável", v: 2 },
        { texto: "Bem estável", v: 3 }
      ]},

      { gif: "success_flow.webp", tipo: "objetivo", texto: "Qual seu objetivo principal agora?", opcoes: [
        { texto: "Iniciar com segurança", v: "iniciar" },
        { texto: "Emagrecimento", v: "emagrecimento" },
        { texto: "Definição", v: "definicao" },
        { texto: "Performance", v: "performance" }
      ]}
    ]
  },

  en: { nome: "English", perguntas: [] },
  fr: { nome: "Français", perguntas: [] }
};

FEMFLOW.anamneseLang.en.perguntas = JSON.parse(JSON.stringify(FEMFLOW.anamneseLang.pt.perguntas));
FEMFLOW.anamneseLang.fr.perguntas = JSON.parse(JSON.stringify(FEMFLOW.anamneseLang.pt.perguntas));
