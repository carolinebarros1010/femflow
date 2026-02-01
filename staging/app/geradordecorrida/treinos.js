window.TREINOS_POR_MODALIDADE = {
  corrida: {
    resistencia: [
      { nome: "Contínuo progressivo", nome_en: "Progressive continuous", nome_fr: "Continu progressif", distKm: 5.0, desc: "10' leve + 20' ritmo estável + 5' leve", desc_en: "10' easy + 20' steady pace + 5' easy", desc_fr: "10' facile + 20' allure stable + 5' facile", tipo: "res_vel" },
      { nome: "Fartlek leve", nome_en: "Easy fartlek", nome_fr: "Fartlek léger", distKm: 4.5, desc: "6×(2' moderado/2' leve) + 10' leve", desc_en: "6×(2' moderate/2' easy) + 10' easy", desc_fr: "6×(2' modéré/2' facile) + 10' facile", tipo: "res_vel" },
      { nome: "Tempo run fracionado", nome_en: "Split tempo run", nome_fr: "Tempo fractionné", distKm: 5.2, desc: "3×6' forte/2' leve + 8' leve", desc_en: "3×6' hard/2' easy + 8' easy", desc_fr: "3×6' intense/2' facile + 8' facile", tipo: "res_vel" },
      { nome: "Intervalado 800m", nome_en: "800m intervals", nome_fr: "Intervalles 800m", distKm: 4.8, desc: "5×800m (85–90%) 2' leve + 10' leve", desc_en: "5×800m (85–90%) 2' easy + 10' easy", desc_fr: "5×800m (85–90%) 2' facile + 10' facile", tipo: "res_vel" },
      { nome: "Rodagem com técnica", nome_en: "Easy run with drills", nome_fr: "Footing avec technique", distKm: 4.0, desc: "20' leve + 6×60m técnica + 8' leve", desc_en: "20' easy + 6×60m drills + 8' easy", desc_fr: "20' facile + 6×60m technique + 8' facile", tipo: "res_vel" },
      { nome: "Intervalado 1000m", nome_en: "1000m intervals", nome_fr: "Intervalles 1000m", distKm: 5.0, desc: "4×1000m (85–90%) 2' leve + 8' leve", desc_en: "4×1000m (85–90%) 2' easy + 8' easy", desc_fr: "4×1000m (85–90%) 2' facile + 8' facile", tipo: "res_vel" },
      { nome: "Progressivo 30'", nome_en: "Progressive 30'", nome_fr: "Progressif 30'", distKm: 4.6, desc: "10' leve + 15' progressivo + 5' leve", desc_en: "10' easy + 15' progressive + 5' easy", desc_fr: "10' facile + 15' progressif + 5' facile", tipo: "res_vel" },
      { nome: "Base contínua", nome_en: "Steady base", nome_fr: "Base continue", distKm: 4.2, desc: "25' Z2 + 5' leve", desc_en: "25' Z2 + 5' easy", desc_fr: "25' Z2 + 5' facile", tipo: "res_vel" },
      { nome: "Fartlek 3/2", nome_en: "Fartlek 3/2", nome_fr: "Fartlek 3/2", distKm: 4.7, desc: "5×(3' moderado/2' leve) + 8' leve", desc_en: "5×(3' moderate/2' easy) + 8' easy", desc_fr: "5×(3' modéré/2' facile) + 8' facile", tipo: "res_vel" },
      { nome: "Tempo 2×8'", nome_en: "Tempo 2×8'", nome_fr: "Tempo 2×8'", distKm: 5.1, desc: "2×8' forte/3' leve + 8' leve", desc_en: "2×8' hard/3' easy + 8' easy", desc_fr: "2×8' intense/3' facile + 8' facile", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Ladeira curta", nome_en: "Short hill", nome_fr: "Côte courte", distKm: 2.4, desc: "10×80m subida + 10' leve", desc_en: "10×80m uphill + 10' easy", desc_fr: "10×80m montée + 10' facile", tipo: "potencia" },
      { nome: "Pliometria + sprint", nome_en: "Plyometrics + sprint", nome_fr: "Pliométrie + sprint", distKm: 2.0, desc: "3×(6 saltos + 60m forte)", desc_en: "3×(6 jumps + 60m hard)", desc_fr: "3×(6 sauts + 60m intense)", tipo: "potencia" },
      { nome: "Aceleração 30–60", nome_en: "Acceleration 30–60", nome_fr: "Accélération 30–60", distKm: 2.2, desc: "8×(30m + 60m) 90% + 8' leve", desc_en: "8×(30m + 60m) 90% + 8' easy", desc_fr: "8×(30m + 60m) 90% + 8' facile", tipo: "potencia" },
      { nome: "Circuito força corrida", nome_en: "Running strength circuit", nome_fr: "Circuit force course", distKm: 2.1, desc: "3×(agacho 6rep + 40m forte)", desc_en: "3×(squat 6 reps + 40m hard)", desc_fr: "3×(squat 6 reps + 40m intense)", tipo: "potencia" },
      { nome: "Sprint em escada", nome_en: "Stair sprints", nome_fr: "Sprints en escaliers", distKm: 2.0, desc: "6×(escada 20\" + 30m forte)", desc_en: "6×(stairs 20\" + 30m hard)", desc_fr: "6×(escaliers 20\" + 30m intense)", tipo: "potencia" },
      { nome: "Aceleração 6×100m", nome_en: "Acceleration 6×100m", nome_fr: "Accélération 6×100m", distKm: 2.3, desc: "6×100m forte/2' leve", desc_en: "6×100m hard/2' easy", desc_fr: "6×100m intense/2' facile", tipo: "potencia" },
      { nome: "Subida média", nome_en: "Medium hill", nome_fr: "Côte moyenne", distKm: 2.5, desc: "8×120m subida/2' leve", desc_en: "8×120m uphill/2' easy", desc_fr: "8×120m montée/2' facile", tipo: "potencia" },
      { nome: "Sprints 6×60m", nome_en: "Sprints 6×60m", nome_fr: "Sprints 6×60m", distKm: 1.9, desc: "6×60m forte/90\" leve + 10' leve", desc_en: "6×60m hard/90\" easy + 10' easy", desc_fr: "6×60m intense/90\" facile + 10' facile", tipo: "potencia" },
      { nome: "Circuito potência", nome_en: "Power circuit", nome_fr: "Circuit puissance", distKm: 2.2, desc: "4×(saltos 8 + 40m forte)", desc_en: "4×(8 jumps + 40m hard)", desc_fr: "4×(8 sauts + 40m intense)", tipo: "potencia" },
      { nome: "Arranques 12×30m", nome_en: "Starts 12×30m", nome_fr: "Départs 12×30m", distKm: 2.0, desc: "12×30m forte/60\" leve", desc_en: "12×30m hard/60\" easy", desc_fr: "12×30m intense/60\" facile", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprints 100m", nome_en: "100m sprints", nome_fr: "Sprints 100m", distKm: 2.0, desc: "12×100m (95%) 2' pausa + 10' leve", desc_en: "12×100m (95%) 2' rest + 10' easy", desc_fr: "12×100m (95%) 2' récup + 10' facile", tipo: "intensidade" },
      { nome: "Pirâmide 60–120", nome_en: "Pyramid 60–120", nome_fr: "Pyramide 60–120", distKm: 1.9, desc: "60–80–100–120–100–80–60 (95%)", desc_en: "60–80–100–120–100–80–60 (95%)", desc_fr: "60–80–100–120–100–80–60 (95%)", tipo: "intensidade" },
      { nome: "Sprint técnico", nome_en: "Technical sprint", nome_fr: "Sprint technique", distKm: 1.8, desc: "8×80m foco mecânica + 10' leve", desc_en: "8×80m technique focus + 10' easy", desc_fr: "8×80m focus technique + 10' facile", tipo: "intensidade" },
      { nome: "Intervalado 40/20", nome_en: "Intervals 40/20", nome_fr: "Intervalles 40/20", distKm: 2.6, desc: "3×(6×40\" forte/20\" leve)", desc_en: "3×(6×40\" hard/20\" easy)", desc_fr: "3×(6×40\" intense/20\" facile)", tipo: "intensidade" },
      { nome: "Saídas rápidas", nome_en: "Fast starts", nome_fr: "Départs rapides", distKm: 1.6, desc: "10×20m reação + 6×60m", desc_en: "10×20m reaction + 6×60m", desc_fr: "10×20m réaction + 6×60m", tipo: "intensidade" },
      { nome: "Sprint 6×150m", nome_en: "Sprint 6×150m", nome_fr: "Sprint 6×150m", distKm: 2.3, desc: "6×150m (90–95%) 3' pausa", desc_en: "6×150m (90–95%) 3' rest", desc_fr: "6×150m (90–95%) 3' récup", tipo: "intensidade" },
      { nome: "Blocos 30/30", nome_en: "Blocks 30/30", nome_fr: "Blocs 30/30", distKm: 2.4, desc: "2×(6×30\" forte/30\" leve)", desc_en: "2×(6×30\" hard/30\" easy)", desc_fr: "2×(6×30\" intense/30\" facile)", tipo: "intensidade" },
      { nome: "Sprint 10×60m", nome_en: "Sprint 10×60m", nome_fr: "Sprint 10×60m", distKm: 1.7, desc: "10×60m (90–95%) foco técnica", desc_en: "10×60m (90–95%) technique focus", desc_fr: "10×60m (90–95%) focus technique", tipo: "intensidade" },
      { nome: "Progressivo 80–120m", nome_en: "Progressive 80–120m", nome_fr: "Progressif 80–120m", distKm: 2.2, desc: "4×(80m/100m/120m) 2' pausa", desc_en: "4×(80m/100m/120m) 2' rest", desc_fr: "4×(80m/100m/120m) 2' récup", tipo: "intensidade" },
      { nome: "Sprint 8×120m", nome_en: "Sprint 8×120m", nome_fr: "Sprint 8×120m", distKm: 2.0, desc: "8×120m (90%) 2' pausa", desc_en: "8×120m (90%) 2' rest", desc_fr: "8×120m (90%) 2' récup", tipo: "intensidade" }
    ]
  },
  bike: {
    resistencia: [
      { nome: "Contínuo Z2", distKm: 18.0, desc: "40' Z2 + 10' leve", tipo: "res_vel" },
      { nome: "Tempo progressivo", distKm: 20.0, desc: "10' leve + 3×8' Z3/2' leve", tipo: "res_vel" },
      { nome: "Pirâmide Z3", distKm: 16.0, desc: "5-8-10-8-5' Z3 c/ 2' leve", tipo: "res_vel" },
      { nome: "Subida moderada", distKm: 14.0, desc: "6×3' subida Z3/3' leve", tipo: "res_vel" },
      { nome: "Endurance técnica", distKm: 15.0, desc: "30' Z2 + 6×30\" cadência alta", tipo: "res_vel" },
      { nome: "Base longa", distKm: 22.0, desc: "50' Z2 + 10' leve", tipo: "res_vel" },
      { nome: "Blocos 4×6'", distKm: 18.0, desc: "4×6' Z3/2' leve + 10' leve", tipo: "res_vel" },
      { nome: "Cadência sustentada", distKm: 17.0, desc: "3×10' cadência alta/3' leve", tipo: "res_vel" },
      { nome: "Tempo contínuo", distKm: 19.0, desc: "25' Z3 + 10' leve", tipo: "res_vel" },
      { nome: "Endurance em subida", distKm: 16.5, desc: "4×4' subida Z3/3' leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Arrancadas curtas", distKm: 10.0, desc: "8×20\" forte/2' leve", tipo: "potencia" },
      { nome: "Sprint em subida", distKm: 9.0, desc: "10×15\" subida forte/2' leve", tipo: "potencia" },
      { nome: "Pliometria na bike", distKm: 11.0, desc: "6×30\" sprint/3' leve", tipo: "potencia" },
      { nome: "Força específica", distKm: 12.0, desc: "6×2' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Sprints 10-20", distKm: 10.5, desc: "10×(10\"+20\") forte/2' leve", tipo: "potencia" },
      { nome: "Sprints 12×15\"", distKm: 9.5, desc: "12×15\" forte/90\" leve", tipo: "potencia" },
      { nome: "Força 5×3'", distKm: 12.5, desc: "5×3' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Arranque 6×30\"", distKm: 10.8, desc: "6×30\" forte/3' leve", tipo: "potencia" },
      { nome: "Sprints 8×40\"", distKm: 11.5, desc: "8×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Subida curta", distKm: 10.2, desc: "10×20\" subida/2' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×10", distKm: 9.0, desc: "10×10\" máxima/2' leve", tipo: "intensidade" },
      { nome: "VO2 curto", distKm: 12.0, desc: "8×30\" forte/1' leve", tipo: "intensidade" },
      { nome: "Explosão 15s", distKm: 9.5, desc: "12×15\" forte/90\" leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 11.0, desc: "3×(5×20\" forte/40\" leve)", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 10.0, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint 12×12\"", distKm: 9.2, desc: "12×12\" máximo/75\" leve", tipo: "intensidade" },
      { nome: "Bloco 4×3'", distKm: 12.5, desc: "4×3' forte/3' leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 11.8, desc: "6×1' forte/2' leve", tipo: "intensidade" },
      { nome: "Sprint 20×15\"", distKm: 10.5, desc: "20×15\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×20\"", distKm: 9.8, desc: "8×20\" máximo/90\" leve", tipo: "intensidade" }
    ]
  },
  remo: {
    resistencia: [
      { nome: "Contínuo 30'", distKm: 6.0, desc: "30' ritmo leve + 5' desaquec", tipo: "res_vel" },
      { nome: "Intervalos 4'", distKm: 5.5, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 5.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 20'", distKm: 5.0, desc: "20' progressivo Z2–Z3", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 4.8, desc: "15' base + 8×20\" técnica", tipo: "res_vel" },
      { nome: "Blocos 5×5'", distKm: 5.6, desc: "5×5' moderado/2' leve", tipo: "res_vel" },
      { nome: "Tempo 2×10'", distKm: 6.0, desc: "2×10' forte/3' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 5.2, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Base contínua", distKm: 5.1, desc: "25' Z2 + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 8×2'", distKm: 5.4, desc: "8×2' moderado/1' leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×20\"", distKm: 4.0, desc: "10×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×30\"", distKm: 4.2, desc: "6×30\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 3.8, desc: "8×15\" explosivo/90\" leve", tipo: "potencia" },
      { nome: "Força específica", distKm: 4.5, desc: "6×1' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 4.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" },
      { nome: "Sprint 12×15\"", distKm: 3.9, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Arranque 6×40\"", distKm: 4.3, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Potência 8×30\"", distKm: 4.0, desc: "8×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Força 5×2'", distKm: 4.6, desc: "5×2' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 4.4, desc: "6×60\" forte/2' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 8×100m", distKm: 3.5, desc: "8×100m máximo/1' leve", tipo: "intensidade" },
      { nome: "Explosão 12×15\"", distKm: 3.6, desc: "12×15\" forte/1'15\" leve", tipo: "intensidade" },
      { nome: "Intervalado curto", distKm: 4.0, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.8, desc: "6×20\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Reação rápida", distKm: 3.4, desc: "10×10\" forte/50\" leve", tipo: "intensidade" },
      { nome: "Sprint 10×200m", distKm: 4.0, desc: "10×200m forte/1' leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 3.9, desc: "8×45\" máximo/1'15\" leve", tipo: "intensidade" },
      { nome: "Intervalo 12×20\"", distKm: 3.7, desc: "12×20\" forte/40\" leve", tipo: "intensidade" },
      { nome: "Sprint 6×250m", distKm: 4.2, desc: "6×250m forte/90\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×30\"", distKm: 3.8, desc: "8×30\" máximo/60\" leve", tipo: "intensidade" }
    ]
  },
  natacao: {
    resistencia: [
      { nome: "Contínuo 1200m", distKm: 1.2, desc: "1200m ritmo constante", tipo: "res_vel" },
      { nome: "Série 6×200m", distKm: 1.2, desc: "6×200m moderado/30\" pausa", tipo: "res_vel" },
      { nome: "Tempo 3×300m", distKm: 0.9, desc: "3×300m forte/45\" pausa", tipo: "res_vel" },
      { nome: "Progressivo 800m", distKm: 0.8, desc: "800m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 0.9, desc: "6×50m técnica + 600m leve", tipo: "res_vel" },
      { nome: "Série 4×300m", distKm: 1.2, desc: "4×300m moderado/45\" pausa", tipo: "res_vel" },
      { nome: "Endurance 1500m", distKm: 1.5, desc: "1500m ritmo constante", tipo: "res_vel" },
      { nome: "Tempo 2×400m", distKm: 0.8, desc: "2×400m forte/1' pausa", tipo: "res_vel" },
      { nome: "Progressivo 1000m", distKm: 1.0, desc: "1000m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Base técnica longa", distKm: 1.1, desc: "8×50m técnica + 700m leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprint 12×25m", distKm: 0.6, desc: "12×25m forte/30\" pausa", tipo: "potencia" },
      { nome: "Explosão 8×50m", distKm: 0.4, desc: "8×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Potência 6×75m", distKm: 0.45, desc: "6×75m forte/45\" pausa", tipo: "potencia" },
      { nome: "Saídas rápidas", distKm: 0.5, desc: "10×25m saída/25m leve", tipo: "potencia" },
      { nome: "Pliometria água", distKm: 0.55, desc: "5×100m forte/1' pausa", tipo: "potencia" },
      { nome: "Sprint 10×50m", distKm: 0.5, desc: "10×50m forte/30\" pausa", tipo: "potencia" },
      { nome: "Explosão 12×25m", distKm: 0.3, desc: "12×25m forte/20\" pausa", tipo: "potencia" },
      { nome: "Potência 8×50m", distKm: 0.4, desc: "8×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Saídas 6×100m", distKm: 0.6, desc: "6×100m forte/1' pausa", tipo: "potencia" },
      { nome: "Velocidade técnica", distKm: 0.5, desc: "10×25m forte + 25m leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 16×25m", distKm: 0.4, desc: "16×25m máximo/20\" pausa", tipo: "intensidade" },
      { nome: "Explosão 10×50m", distKm: 0.5, desc: "10×50m máximo/30\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 20×25m", distKm: 0.5, desc: "20×25m forte/15\" pausa", tipo: "intensidade" },
      { nome: "Técnica rápida", distKm: 0.45, desc: "8×50m ritmo alto/30\" pausa", tipo: "intensidade" },
      { nome: "Sprint 6×100m", distKm: 0.6, desc: "6×100m máximo/45\" pausa", tipo: "intensidade" },
      { nome: "Sprint 12×50m", distKm: 0.6, desc: "12×50m máximo/25\" pausa", tipo: "intensidade" },
      { nome: "Explosão 8×75m", distKm: 0.6, desc: "8×75m máximo/40\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 6×150m", distKm: 0.9, desc: "6×150m forte/45\" pausa", tipo: "intensidade" },
      { nome: "Sprint 20×25m", distKm: 0.5, desc: "20×25m máximo/20\" pausa", tipo: "intensidade" },
      { nome: "Arranque 10×50m", distKm: 0.5, desc: "10×50m máximo/30\" pausa", tipo: "intensidade" }
    ]
  },
  natacao_aberta: {
    resistencia: [
      { nome: "Contínuo 1500m", distKm: 1.5, desc: "1500m ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 3×500m", distKm: 1.5, desc: "3×500m moderado/1' pausa", tipo: "res_vel" },
      { nome: "Tempo 2×800m", distKm: 1.6, desc: "2×800m forte/2' pausa", tipo: "res_vel" },
      { nome: "Progressivo 1200m", distKm: 1.2, desc: "1200m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 1.1, desc: "6×100m técnica + 500m leve", tipo: "res_vel" },
      { nome: "Contínuo 2000m", distKm: 2.0, desc: "2000m ritmo constante", tipo: "res_vel" },
      { nome: "Tempo 3×600m", distKm: 1.8, desc: "3×600m forte/1' pausa", tipo: "res_vel" },
      { nome: "Progressivo 1500m", distKm: 1.5, desc: "1500m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Intervalo 4×400m", distKm: 1.6, desc: "4×400m moderado/45\" pausa", tipo: "res_vel" },
      { nome: "Base técnica longa", distKm: 1.4, desc: "8×100m técnica + 600m leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprint 10×50m", distKm: 0.5, desc: "10×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Explosão 8×75m", distKm: 0.6, desc: "8×75m forte/45\" pausa", tipo: "potencia" },
      { nome: "Potência 6×100m", distKm: 0.6, desc: "6×100m forte/1' pausa", tipo: "potencia" },
      { nome: "Saídas rápidas", distKm: 0.7, desc: "10×25m saída/25m leve", tipo: "potencia" },
      { nome: "Pliometria água", distKm: 0.8, desc: "5×150m forte/1' pausa", tipo: "potencia" },
      { nome: "Sprint 12×50m", distKm: 0.6, desc: "12×50m forte/30\" pausa", tipo: "potencia" },
      { nome: "Explosão 6×100m", distKm: 0.6, desc: "6×100m forte/1' pausa", tipo: "potencia" },
      { nome: "Potência 8×75m", distKm: 0.6, desc: "8×75m forte/45\" pausa", tipo: "potencia" },
      { nome: "Saídas 8×50m", distKm: 0.4, desc: "8×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Velocidade técnica", distKm: 0.7, desc: "6×100m forte/1' pausa", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×50m", distKm: 0.6, desc: "12×50m máximo/30\" pausa", tipo: "intensidade" },
      { nome: "Explosão 8×100m", distKm: 0.8, desc: "8×100m máximo/45\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 16×25m", distKm: 0.4, desc: "16×25m forte/20\" pausa", tipo: "intensidade" },
      { nome: "Técnica rápida", distKm: 0.6, desc: "6×100m ritmo alto/30\" pausa", tipo: "intensidade" },
      { nome: "Sprint 4×200m", distKm: 0.8, desc: "4×200m máximo/1' pausa", tipo: "intensidade" },
      { nome: "Sprint 10×100m", distKm: 1.0, desc: "10×100m máximo/40\" pausa", tipo: "intensidade" },
      { nome: "Explosão 6×150m", distKm: 0.9, desc: "6×150m forte/45\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 20×25m", distKm: 0.5, desc: "20×25m máximo/20\" pausa", tipo: "intensidade" },
      { nome: "Arranque 8×50m", distKm: 0.4, desc: "8×50m máximo/30\" pausa", tipo: "intensidade" },
      { nome: "Sprint 6×300m", distKm: 1.8, desc: "6×300m forte/1' pausa", tipo: "intensidade" }
    ]
  },
  eliptico: {
    resistencia: [
      { nome: "Contínuo 35'", distKm: 5.0, desc: "35' Z2 + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 4.5, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 25'", distKm: 4.0, desc: "25' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 4.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 4.2, desc: "20' leve + 6×20\" cadência alta", tipo: "res_vel" },
      { nome: "Contínuo 45'", distKm: 5.4, desc: "45' Z2 + 5' leve", tipo: "res_vel" },
      { nome: "Blocos 4×5'", distKm: 4.9, desc: "4×5' moderado/2' leve", tipo: "res_vel" },
      { nome: "Tempo 2×8'", distKm: 5.0, desc: "2×8' forte/3' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 4.6, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Cadência sustentada", distKm: 4.7, desc: "3×7' cadência alta/2' leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 3.5, desc: "10×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 3.0, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 3.8, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 3.2, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 3.6, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" },
      { nome: "Sprint 12×15\"", distKm: 3.1, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Arranque 6×45\"", distKm: 3.7, desc: "6×45\" forte/2' leve", tipo: "potencia" },
      { nome: "Potência 8×30\"", distKm: 3.4, desc: "8×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Força 5×2'", distKm: 3.9, desc: "5×2' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 3.8, desc: "6×60\" forte/2' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 3.0, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 3.4, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 3.6, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.2, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 3.4, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" },
      { nome: "Sprint 10×30\"", distKm: 3.3, desc: "10×30\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 3.9, desc: "6×1' forte/2' leve", tipo: "intensidade" },
      { nome: "Intervalo 12×20\"", distKm: 3.1, desc: "12×20\" forte/40\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×40\"", distKm: 3.7, desc: "8×40\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Sprint 16×15\"", distKm: 3.2, desc: "16×15\" forte/45\" leve", tipo: "intensidade" }
    ]
  },
  caminhada: {
    resistencia: [
      { nome: "Contínuo 40'", distKm: 4.0, desc: "40' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 3.8, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 3.5, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 3.6, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 3.2, desc: "25' leve + 6×20\" passos longos", tipo: "res_vel" },
      { nome: "Contínuo 50'", distKm: 4.6, desc: "50' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 3.6, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 35'", distKm: 3.9, desc: "35' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 2×8'", distKm: 3.8, desc: "2×8' forte/3' leve", tipo: "res_vel" },
      { nome: "Base cadência", distKm: 3.4, desc: "20' leve + 8×30\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Subida curta", distKm: 2.8, desc: "8×60m subida/60m leve", tipo: "potencia" },
      { nome: "Acelera/recupera", distKm: 3.0, desc: "10×1' rápido/1' leve", tipo: "potencia" },
      { nome: "Sprints curtos", distKm: 2.6, desc: "12×20\" rápido/40\" leve", tipo: "potencia" },
      { nome: "Cadência alta", distKm: 2.9, desc: "6×2' rápido/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 3.1, desc: "3×(4×30\" rápido/30\" leve)", tipo: "potencia" },
      { nome: "Sprint 10×15\"", distKm: 2.5, desc: "10×15\" rápido/45\" leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 2.7, desc: "8×30\" rápido/90\" leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 3.0, desc: "6×60\" rápido/2' leve", tipo: "potencia" },
      { nome: "Subida média", distKm: 3.2, desc: "6×90m subida/90m leve", tipo: "potencia" },
      { nome: "Cadência forte", distKm: 2.8, desc: "8×1' rápido/1' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×30\"", distKm: 2.5, desc: "10×30\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 2.7, desc: "12×20\" rápido/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 2.8, desc: "8×45\" rápido/75\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 2.6, desc: "6×30\" rápido + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 2.7, desc: "3×(6×15\" rápido/45\" leve)", tipo: "intensidade" },
      { nome: "Sprint 12×20\"", distKm: 2.6, desc: "12×20\" máximo/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 3.0, desc: "6×1' rápido/2' leve", tipo: "intensidade" },
      { nome: "Intervalo 16×15\"", distKm: 2.4, desc: "16×15\" rápido/45\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×40\"", distKm: 2.9, desc: "8×40\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Sprint 20×10\"", distKm: 2.3, desc: "20×10\" máximo/30\" leve", tipo: "intensidade" }
    ]
  },
  trilha: {
    resistencia: [
      { nome: "Contínuo trilha", distKm: 6.0, desc: "40' ritmo constante em trilha", tipo: "res_vel" },
      { nome: "Intervalo subida", distKm: 5.5, desc: "6×2' subida/2' descida leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 5.2, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 5.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 5.0, desc: "25' leve + 6×20\" técnica", tipo: "res_vel" },
      { nome: "Contínuo 50'", distKm: 6.6, desc: "50' ritmo constante em trilha", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 5.7, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 35'", distKm: 5.6, desc: "35' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 2×8'", distKm: 6.0, desc: "2×8' forte/3' leve", tipo: "res_vel" },
      { nome: "Base cadência", distKm: 5.3, desc: "20' leve + 8×30\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Subida curta", distKm: 4.0, desc: "8×60m subida/60m leve", tipo: "potencia" },
      { nome: "Acelera/recupera", distKm: 4.5, desc: "10×1' rápido/1' leve", tipo: "potencia" },
      { nome: "Sprints curtos", distKm: 3.8, desc: "12×20\" rápido/40\" leve", tipo: "potencia" },
      { nome: "Cadência alta", distKm: 4.2, desc: "6×2' rápido/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 4.1, desc: "3×(4×30\" rápido/30\" leve)", tipo: "potencia" },
      { nome: "Sprint 10×15\"", distKm: 3.7, desc: "10×15\" rápido/45\" leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 4.0, desc: "8×30\" rápido/90\" leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 4.4, desc: "6×60\" rápido/2' leve", tipo: "potencia" },
      { nome: "Subida média", distKm: 4.6, desc: "6×90m subida/90m leve", tipo: "potencia" },
      { nome: "Cadência forte", distKm: 4.1, desc: "8×1' rápido/1' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×30\"", distKm: 3.6, desc: "10×30\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 3.8, desc: "12×20\" rápido/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 4.0, desc: "8×45\" rápido/75\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.7, desc: "6×30\" rápido + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 3.8, desc: "3×(6×15\" rápido/45\" leve)", tipo: "intensidade" },
      { nome: "Sprint 12×20\"", distKm: 3.7, desc: "12×20\" máximo/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 4.2, desc: "6×1' rápido/2' leve", tipo: "intensidade" },
      { nome: "Intervalo 16×15\"", distKm: 3.5, desc: "16×15\" rápido/45\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×40\"", distKm: 4.1, desc: "8×40\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Sprint 20×10\"", distKm: 3.4, desc: "20×10\" máximo/30\" leve", tipo: "intensidade" }
    ]
  },
  aqua_run: {
    resistencia: [
      { nome: "Contínuo 25'", distKm: 3.0, desc: "25' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 2.8, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 20'", distKm: 2.5, desc: "20' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×5'", distKm: 2.7, desc: "3×5' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 2.4, desc: "15' leve + 6×20\" técnica", tipo: "res_vel" },
      { nome: "Contínuo 35'", distKm: 3.3, desc: "35' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 3.0, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 25'", distKm: 2.9, desc: "25' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 2×8'", distKm: 3.1, desc: "2×8' forte/3' leve", tipo: "res_vel" },
      { nome: "Base cadência", distKm: 2.7, desc: "20' leve + 8×30\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 2.0, desc: "10×30\" forte/60\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 1.8, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 2.2, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 1.9, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 2.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" },
      { nome: "Sprint 10×15\"", distKm: 1.7, desc: "10×15\" forte/45\" leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 2.0, desc: "8×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 2.3, desc: "6×60\" forte/2' leve", tipo: "potencia" },
      { nome: "Subida média", distKm: 2.4, desc: "6×90\" forte/90\" leve", tipo: "potencia" },
      { nome: "Cadência forte", distKm: 2.0, desc: "8×1' forte/1' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 1.8, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 2.0, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 2.2, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 1.9, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 2.0, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" },
      { nome: "Sprint 12×20\"", distKm: 1.9, desc: "12×20\" máximo/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 2.4, desc: "6×1' forte/2' leve", tipo: "intensidade" },
      { nome: "Intervalo 16×15\"", distKm: 1.7, desc: "16×15\" forte/45\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×40\"", distKm: 2.3, desc: "8×40\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Sprint 20×10\"", distKm: 1.6, desc: "20×10\" máximo/30\" leve", tipo: "intensidade" }
    ]
  },
  esqui: {
    resistencia: [
      { nome: "Contínuo 35'", distKm: 7.0, desc: "35' ritmo constante + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 6.5, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 6.0, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 6.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 6.2, desc: "25' leve + 6×20\" cadência alta", tipo: "res_vel" },
      { nome: "Contínuo 50'", distKm: 7.4, desc: "50' ritmo constante + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 6.4, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 35'", distKm: 6.6, desc: "35' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 2×8'", distKm: 7.0, desc: "2×8' forte/3' leve", tipo: "res_vel" },
      { nome: "Base cadência", distKm: 6.5, desc: "20' leve + 8×30\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 5.0, desc: "10×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 4.6, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 5.2, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 4.8, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 5.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" },
      { nome: "Sprint 10×15\"", distKm: 4.7, desc: "10×15\" forte/45\" leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 5.0, desc: "8×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Sprints 6×60\"", distKm: 5.4, desc: "6×60\" forte/2' leve", tipo: "potencia" },
      { nome: "Subida média", distKm: 5.6, desc: "6×90\" forte/90\" leve", tipo: "potencia" },
      { nome: "Cadência forte", distKm: 5.1, desc: "8×1' forte/1' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 4.6, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 4.8, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 5.0, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 4.7, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 4.8, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" },
      { nome: "Sprint 12×20\"", distKm: 4.7, desc: "12×20\" máximo/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 6×1'", distKm: 5.2, desc: "6×1' forte/2' leve", tipo: "intensidade" },
      { nome: "Intervalo 16×15\"", distKm: 4.5, desc: "16×15\" forte/45\" leve", tipo: "intensidade" },
      { nome: "Arranque 8×40\"", distKm: 5.1, desc: "8×40\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Sprint 20×10\"", distKm: 4.4, desc: "20×10\" máximo/30\" leve", tipo: "intensidade" }
    ]
  }
};
