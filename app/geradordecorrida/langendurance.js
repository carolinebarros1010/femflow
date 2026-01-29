(() => {
  const dictionary = {
    pt: {
      page_title: "Endurance FemFlow",
      topbar_title: "🏃‍♀️ Endurance FemFlow",
      language_label: "Idioma",
      language_pt: "Português",
      language_en: "English",
      language_fr: "Français",
      flowcenter_title: "Voltar para o FlowCenter",
      flowcenter_button: "🏠 FLOWCENTER",
      header_title: "Endurance <span style=\"color:var(--accent)\">FemFlow</span>",
      intro_text: "Escolha perfil, distância da prova e disponibilidade. O sistema monta um mesociclo de 30 dias com velocidade, resistência e velocidade pura, ajusta volume/intensidade pelo ciclo e gera PDF e cards.",
      inputs_title: "Entradas",
      test_title: "Teste",
      test_info_aria: "Informações do teste",
      test_help: "Realize um teste de 12 min sem parar na modalidade pretendida e insira as informações abaixo (distância em metros e PSE 0 a 10).",
      cooper_distance_label: "Distância no teste Cooper (12 min, em metros)",
      test_modality_label: "Modalidade do teste",
      modality_corrida: "Corrida",
      modality_bike: "Ciclismo",
      modality_remo: "Remo ergômetro",
      modality_natacao: "Natação (piscina)",
      modality_natacao_aberta: "Natação em águas abertas",
      modality_eliptico: "Elíptico",
      modality_caminhada: "Caminhada",
      modality_trilha: "Trail/Trilha",
      modality_aqua_run: "Aqua run",
      modality_esqui: "Esqui ergômetro",
      test_zone_label: "Zona do teste / PSE principal",
      test_pse_label: "PSE do teste Cooper (0–10)",
      goal_title: "Prova objetivo",
      profile_label: "Perfil",
      race_distance_label: "Distância da prova (km)",
      days_label: "Dias da semana",
      days_placeholder: "Ex.: ter,qui,sab,dom",
      sessions_per_week_label: "Treinos por semana",
      start_label: "Início",
      generate_button: "Gerar mesociclo (30 dias)",
      test_modal_title: "Como realizar o teste",
      close_modal_aria: "Fechar",
      test_modal_body: "Faça 12 minutos contínuos na modalidade escolhida, mantendo o melhor ritmo sustentável. Ao final, registre a distância em metros e a percepção de esforço (PSE 0–10).",
      endurance_modal_title: "Como funciona o Endurance",
      endurance_modal_body: "Gere seu treino de endurance com apenas um clique e tenha 30 dias de treino periodizado. Preencha as informações nos respectivos campos, escolha a quantidade de treinos e os dias disponíveis e acompanhe semana a semana os treinos.",
      plan_title: "Plano 30 dias",
      week_1: "Semana 1",
      week_2: "Semana 2",
      week_3: "Semana 3",
      week_4: "Semana 4",
      week_5: "Semana 5",
      weekly_summary_title: "Resumo semanal",
      export_pdf_button: "📄 Exportar PDF",
      generate_cards_button: "🖼️ Gerar Cards",
      reset_button: "🔁 Resetar",
      toast_field_missing: "Erro: campo não encontrado no formulário.",
      toast_max_sessions: "Máximo de 5 treinos por semana para respeitar a recuperação.",
      toast_invalid_cooper: "Informe a distância do teste Cooper (12 min).",
      toast_plan_generated: "Mesociclo gerado com sucesso!",
      toast_tests_failed: "❌ Testes falharam: ",
      toast_tests_ok: "✅ Testes OK",
      toast_pdf_exported: "📄 PDF exportado (simulado)",
      toast_card_generated: "📸 Card gerado (simulado)",
      toast_reset_done: "🗑️ Tudo limpo",
      label_warmup: "Aquecimento",
      label_main: "Parte principal",
      label_cooldown: "Desaquecimento",
      label_type: "Tipo",
      label_modality: "Modalidade",
      label_total_time: "Tempo total",
      label_zone: "Zona/PSE",
      label_estimated_distance: "Distância estimada",
      label_estimated_suffix: "(estimado)",
      label_resistance: "resistência",
      label_speed: "velocidade",
      label_speed_pure: "velocidade pura",
      label_base_pace_running: "Ritmo base (corrida):",
      label_base_pace_bike: "Ritmo base (ciclismo):",
      label_base_pace_row: "Ritmo base (remo):",
      label_base_pace_swim: "Ritmo base (natação):",
      label_base_pace_open_swim: "Ritmo base (natação em águas abertas):",
      label_base_pace_elliptical: "Ritmo base (elíptico):",
      label_base_pace_walk: "Ritmo base (caminhada):",
      label_base_pace_trail: "Ritmo base (trilha):",
      label_base_pace_aqua: "Ritmo base (aqua run):",
      label_base_pace_ski: "Ritmo base (esqui ergômetro):",
      unit_base_pace_elliptical: "tempo / PSE / RPM",
      unit_base_pace_aqua: "tempo / PSE",
      unit_base_pace_trail: "min/km + PSE",
      level_beginner: "Iniciante",
      level_intermediate: "Intermediária",
      level_advanced: "Avançada",
      phase_follicular: "Folicular",
      phase_ovulatory: "Ovulatória",
      phase_luteal: "Lútea",
      phase_menstrual: "Menstrual",
      label_day: "Dia",
      default_student_name: "Aluna"
    },
    en: {
      page_title: "FemFlow Endurance",
      topbar_title: "🏃‍♀️ FemFlow Endurance",
      language_label: "Language",
      language_pt: "Português",
      language_en: "English",
      language_fr: "Français",
      flowcenter_title: "Back to FlowCenter",
      flowcenter_button: "🏠 FLOWCENTER",
      header_title: "Endurance <span style=\"color:var(--accent)\">FemFlow</span>",
      intro_text: "Choose your profile, race distance, and availability. The system builds a 30-day mesocycle with speed, endurance, and pure speed, adjusts volume/intensity by cycle, and generates PDFs and cards.",
      inputs_title: "Inputs",
      test_title: "Test",
      test_info_aria: "Test information",
      test_help: "Perform a 12-minute test without stopping in the chosen modality and fill in the information below (distance in meters and RPE 0 to 10).",
      cooper_distance_label: "Cooper test distance (12 min, in meters)",
      test_modality_label: "Test modality",
      modality_corrida: "Running",
      modality_bike: "Cycling",
      modality_remo: "Rowing ergometer",
      modality_natacao: "Swimming (pool)",
      modality_natacao_aberta: "Open water swimming",
      modality_eliptico: "Elliptical",
      modality_caminhada: "Walking",
      modality_trilha: "Trail",
      modality_aqua_run: "Aqua run",
      modality_esqui: "Ski ergometer",
      test_zone_label: "Test zone / main RPE",
      test_pse_label: "Cooper test RPE (0–10)",
      goal_title: "Target race",
      profile_label: "Profile",
      race_distance_label: "Race distance (km)",
      days_label: "Days of the week",
      days_placeholder: "E.g. tue,thu,sat,sun",
      sessions_per_week_label: "Sessions per week",
      start_label: "Start",
      generate_button: "Generate mesocycle (30 days)",
      test_modal_title: "How to perform the test",
      close_modal_aria: "Close",
      test_modal_body: "Do 12 continuous minutes in the chosen modality, keeping your best sustainable pace. At the end, record the distance in meters and perceived exertion (RPE 0–10).",
      endurance_modal_title: "How Endurance works",
      endurance_modal_body: "Generate your endurance training with one click and get 30 days of periodized training. Fill in the fields, choose the number of sessions and available days, and follow the week-by-week plan.",
      plan_title: "30-day plan",
      week_1: "Week 1",
      week_2: "Week 2",
      week_3: "Week 3",
      week_4: "Week 4",
      week_5: "Week 5",
      weekly_summary_title: "Weekly summary",
      export_pdf_button: "📄 Export PDF",
      generate_cards_button: "🖼️ Generate Cards",
      reset_button: "🔁 Reset",
      toast_field_missing: "Error: form field not found.",
      toast_max_sessions: "Maximum of 5 sessions per week to respect recovery.",
      toast_invalid_cooper: "Enter the Cooper test distance (12 min).",
      toast_plan_generated: "Mesocycle generated successfully!",
      toast_tests_failed: "❌ Tests failed: ",
      toast_tests_ok: "✅ Tests OK",
      toast_pdf_exported: "📄 PDF exported (simulated)",
      toast_card_generated: "📸 Card generated (simulated)",
      toast_reset_done: "🗑️ All cleared",
      label_warmup: "Warm-up",
      label_main: "Main set",
      label_cooldown: "Cool-down",
      label_type: "Type",
      label_modality: "Modality",
      label_total_time: "Total time",
      label_zone: "Zone/RPE",
      label_estimated_distance: "Estimated distance",
      label_estimated_suffix: "(estimated)",
      label_resistance: "endurance",
      label_speed: "speed",
      label_speed_pure: "pure speed",
      label_base_pace_running: "Base pace (running):",
      label_base_pace_bike: "Base pace (cycling):",
      label_base_pace_row: "Base pace (rowing):",
      label_base_pace_swim: "Base pace (swimming):",
      label_base_pace_open_swim: "Base pace (open water swimming):",
      label_base_pace_elliptical: "Base pace (elliptical):",
      label_base_pace_walk: "Base pace (walking):",
      label_base_pace_trail: "Base pace (trail):",
      label_base_pace_aqua: "Base pace (aqua run):",
      label_base_pace_ski: "Base pace (ski ergometer):",
      unit_base_pace_elliptical: "time / RPE / RPM",
      unit_base_pace_aqua: "time / RPE",
      unit_base_pace_trail: "min/km + RPE",
      level_beginner: "Beginner",
      level_intermediate: "Intermediate",
      level_advanced: "Advanced",
      phase_follicular: "Follicular",
      phase_ovulatory: "Ovulatory",
      phase_luteal: "Luteal",
      phase_menstrual: "Menstrual",
      label_day: "Day",
      default_student_name: "Athlete"
    },
    fr: {
      page_title: "FemFlow Endurance",
      topbar_title: "🏃‍♀️ FemFlow Endurance",
      language_label: "Langue",
      language_pt: "Português",
      language_en: "English",
      language_fr: "Français",
      flowcenter_title: "Retour au FlowCenter",
      flowcenter_button: "🏠 FLOWCENTER",
      header_title: "Endurance <span style=\"color:var(--accent)\">FemFlow</span>",
      intro_text: "Choisissez le profil, la distance de course et la disponibilité. Le système crée un mésocycle de 30 jours avec vitesse, endurance et vitesse pure, ajuste le volume/l'intensité par cycle et génère des PDF et des cartes.",
      inputs_title: "Entrées",
      test_title: "Test",
      test_info_aria: "Informations sur le test",
      test_help: "Réalisez un test de 12 min sans arrêt dans la modalité choisie et renseignez les informations ci-dessous (distance en mètres et RPE 0 à 10).",
      cooper_distance_label: "Distance du test de Cooper (12 min, en mètres)",
      test_modality_label: "Modalité du test",
      modality_corrida: "Course à pied",
      modality_bike: "Cyclisme",
      modality_remo: "Rameur",
      modality_natacao: "Natation (piscine)",
      modality_natacao_aberta: "Natation en eau libre",
      modality_eliptico: "Elliptique",
      modality_caminhada: "Marche",
      modality_trilha: "Trail",
      modality_aqua_run: "Aqua run",
      modality_esqui: "Ergomètre de ski",
      test_zone_label: "Zone du test / RPE principal",
      test_pse_label: "RPE du test de Cooper (0–10)",
      goal_title: "Course objectif",
      profile_label: "Profil",
      race_distance_label: "Distance de la course (km)",
      days_label: "Jours de la semaine",
      days_placeholder: "Ex. mar,jeu,sam,dim",
      sessions_per_week_label: "Séances par semaine",
      start_label: "Début",
      generate_button: "Générer le mésocycle (30 jours)",
      test_modal_title: "Comment réaliser le test",
      close_modal_aria: "Fermer",
      test_modal_body: "Faites 12 minutes en continu dans la modalité choisie, en gardant votre meilleur rythme soutenable. À la fin, notez la distance en mètres et la perception de l'effort (RPE 0–10).",
      endurance_modal_title: "Comment fonctionne Endurance",
      endurance_modal_body: "Générez votre entraînement d'endurance en un clic et obtenez 30 jours d'entraînement périodisé. Renseignez les champs, choisissez le nombre de séances et les jours disponibles, et suivez le plan semaine par semaine.",
      plan_title: "Plan sur 30 jours",
      week_1: "Semaine 1",
      week_2: "Semaine 2",
      week_3: "Semaine 3",
      week_4: "Semaine 4",
      week_5: "Semaine 5",
      weekly_summary_title: "Résumé hebdomadaire",
      export_pdf_button: "📄 Exporter PDF",
      generate_cards_button: "🖼️ Générer des cartes",
      reset_button: "🔁 Réinitialiser",
      toast_field_missing: "Erreur : champ du formulaire introuvable.",
      toast_max_sessions: "Maximum de 5 séances par semaine pour respecter la récupération.",
      toast_invalid_cooper: "Indiquez la distance du test de Cooper (12 min).",
      toast_plan_generated: "Mésocycle généré avec succès !",
      toast_tests_failed: "❌ Tests échoués : ",
      toast_tests_ok: "✅ Tests OK",
      toast_pdf_exported: "📄 PDF exporté (simulé)",
      toast_card_generated: "📸 Carte générée (simulée)",
      toast_reset_done: "🗑️ Tout effacé",
      label_warmup: "Échauffement",
      label_main: "Partie principale",
      label_cooldown: "Retour au calme",
      label_type: "Type",
      label_modality: "Modalité",
      label_total_time: "Temps total",
      label_zone: "Zone/RPE",
      label_estimated_distance: "Distance estimée",
      label_estimated_suffix: "(estimée)",
      label_resistance: "endurance",
      label_speed: "vitesse",
      label_speed_pure: "vitesse pure",
      label_base_pace_running: "Allure de base (course) :",
      label_base_pace_bike: "Allure de base (cyclisme) :",
      label_base_pace_row: "Allure de base (rameur) :",
      label_base_pace_swim: "Allure de base (natation) :",
      label_base_pace_open_swim: "Allure de base (eau libre) :",
      label_base_pace_elliptical: "Allure de base (elliptique) :",
      label_base_pace_walk: "Allure de base (marche) :",
      label_base_pace_trail: "Allure de base (trail) :",
      label_base_pace_aqua: "Allure de base (aqua run) :",
      label_base_pace_ski: "Allure de base (ergomètre de ski) :",
      unit_base_pace_elliptical: "temps / RPE / RPM",
      unit_base_pace_aqua: "temps / RPE",
      unit_base_pace_trail: "min/km + RPE",
      level_beginner: "Débutante",
      level_intermediate: "Intermédiaire",
      level_advanced: "Avancée",
      phase_follicular: "Folliculaire",
      phase_ovulatory: "Ovulatoire",
      phase_luteal: "Lutéale",
      phase_menstrual: "Menstruelle",
      label_day: "Jour",
      default_student_name: "Athlète"
    }
  };

  const normalizeLanguage = (lang) => {
    const raw = String(lang || "").toLowerCase();
    if (raw.startsWith("en")) return "en";
    if (raw.startsWith("fr")) return "fr";
    return "pt";
  };

  const getLanguage = () => {
    return normalizeLanguage(
      localStorage.getItem("femflow_lang_endurance") ||
      document.documentElement.lang ||
      navigator.language
    );
  };

  const setLanguage = (lang) => {
    const normalized = normalizeLanguage(lang);
    localStorage.setItem("femflow_lang_endurance", normalized);
    document.documentElement.lang = normalized === "pt" ? "pt-BR" : normalized;
    applyTranslations();
    return normalized;
  };

  const t = (key) => {
    const lang = getLanguage();
    return dictionary[lang]?.[key] ?? dictionary.pt?.[key] ?? key;
  };

  const applyTranslations = () => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-value]").forEach((el) => {
      el.value = t(el.dataset.i18nValue);
    });
    if (typeof window.refreshEnduranceUI === "function") {
      window.refreshEnduranceUI();
    }
  };

  window.EnduranceI18n = {
    dictionary,
    t,
    getLanguage,
    setLanguage,
    applyTranslations
  };

  document.addEventListener("DOMContentLoaded", () => {
    const langSelect = document.getElementById("langSelect");
    const initialLang = getLanguage();
    setLanguage(initialLang);
    if (langSelect) {
      langSelect.value = initialLang;
      langSelect.addEventListener("change", (event) => {
        setLanguage(event.target.value);
      });
    }
  });
})();
