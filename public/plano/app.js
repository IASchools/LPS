(() => {
  "use strict";

  const areas = ["Marketing", "Comercial", "Atendimento e Secretaria", "Professores", "Coordenação", "Financeiro", "Pessoas", "Gestão"];
  const questions = [
    { id: "q1", title: "Nome completo", type: "short", required: true, maxLength: 120 },
    { id: "q2", title: "Escola", type: "short", required: true, maxLength: 160 },
    { id: "q3", title: "E-mail", description: "Contato sobre este plano de ação.", type: "email", required: true, maxLength: 160 },
    { id: "q4", title: "Sua função", type: "choice", required: true, options: ["Mantenedor(a)", "Diretor(a) geral", "Diretor(a) pedagógico(a)", "Coordenador(a)", "Gestão administrativa ou financeira", "Marketing ou Comercial", "Outra"] },
    { id: "q5", title: "Porte da escola", type: "choice", required: true, options: ["Até 200 alunos", "De 201 a 500 alunos", "De 501 a 1.000 alunos", "Mais de 1.000 alunos", "Rede com mais de uma unidade"] },
    { id: "q6", title: "A fase da sua escola", description: "Resultado do Bloco A.", type: "choice", required: true, options: ["Fase 1 · Início da jornada", "Fase 2 · Em movimento", "Fase 3 · Estruturada", "Fase 4 · Referência"] },
    { id: "q7", title: "O seu perfil como líder", description: "Resultado do Bloco B.", type: "choice", required: true, options: ["Perfil 1 · Explorador", "Perfil 2 · Experimentador", "Perfil 3 · Mobilizador", "Perfil 4 · Estrategista"] },
    { id: "q8", title: "Pontuação exata", description: "Opcional. Informe os pontos dos blocos A (14 a 56) e B (6 a 24).", type: "score-pair", required: false },
    { id: "q9", title: "Marque a prioridade de cada área", description: "Faça uma escolha para cada uma das oito áreas.", type: "grid", required: true, rows: areas, columns: ["Agora", "Depois", "Deliberadamente não irei fazer agora"] },
    { id: "q10", title: "Entre as que você marcou ‘Agora’, qual é a prioridade número um?", type: "choice", required: true, options: areas },
    { id: "q11", title: "Por que essa área merece atenção agora?", type: "choice", required: true, options: ["Consome tempo demais da equipe", "Gera retrabalho ou erro com frequência", "Impacta diretamente matrícula ou receita", "Afeta a experiência da família", "Não temos visibilidade, faltam dados", "Depende de uma única pessoa", "Envolve risco de conformidade ou de segurança", "Outro motivo"] },
    { id: "q12", title: "Descreva em uma frase o problema que você quer resolver", description: "Exemplo: a secretaria responde as mesmas dúvidas por WhatsApp o dia inteiro e cada pessoa responde de um jeito.", type: "short", required: true, maxLength: 200 },
    { id: "q13", title: "Como esse trabalho é feito hoje?", type: "choice", required: true, options: ["Não existe processo definido, cada um faz de um jeito", "Existe processo, mas não está escrito", "Está escrito, mas nem sempre é seguido", "Está escrito, é seguido e acompanhado"] },
    { id: "q14", title: "Com que frequência isso acontece?", type: "choice", required: true, options: ["Todo dia", "Toda semana", "Todo mês", "Por período ou campanha"] },
    { id: "q15", title: "Quem executa esse trabalho hoje?", description: "Informe o cargo, não o nome da pessoa.", type: "short", required: true, maxLength: 120 },
    { id: "q16", title: "Quanto tempo isso consome por semana, somando a equipe?", type: "choice", required: true, options: ["Menos de 2 horas", "De 2 a 5 horas", "De 5 a 10 horas", "Mais de 10 horas", "Não sei estimar"] },
    { id: "q17", title: "O que você quer que a IA faça nessa tarefa?", description: "Escolha no máximo duas opções.", type: "multiple", required: true, maxSelections: 2, options: ["Redigir ou rascunhar textos", "Resumir documentos e relatórios longos", "Organizar e padronizar informação", "Analisar dados e apontar padrões", "Responder dúvidas recorrentes", "Comparar cenários antes de uma decisão", "Adaptar um mesmo conteúdo para públicos diferentes"] },
    { id: "q18", title: "O que continua sendo decisão humana nessa tarefa?", type: "short", required: true, maxLength: 240 },
    { id: "q19", title: "Que informações a IA vai usar?", type: "multiple", required: true, options: ["Documentos e modelos internos, sem dado pessoal", "Textos públicos da escola, como site e comunicados", "Planilhas com dados agregados e anonimizados", "Dados identificáveis de alunos ou famílias", "Dados de colaboradores", "Informações financeiras", "Dados de saúde, laudos ou situações de vulnerabilidade"] },
    { id: "q20", title: "Onde isso vai rodar?", type: "choice", required: true, options: ["Ferramenta aberta, em conta pessoal ou gratuita", "Ferramenta aberta, em conta paga individual", "Ambiente contratado pela escola, com contrato assinado", "Ainda não sei"] },
    { id: "q21", title: "O que a sua escola já tem hoje?", type: "multiple", required: true, exclusive: "Nenhum dos anteriores", options: ["Política de uso de IA escrita e aprovada pela direção", "Comitê de IA", "Lista de ferramentas aprovadas", "Encarregado de dados (DPO) definido", "Cláusula de não-treinamento nos contratos com fornecedores", "Posição escrita sobre o uso de IA pelos alunos", "Nenhum dos anteriores"] },
    { id: "q22", title: "Quem pode assumir a responsabilidade por essa implantação?", type: "choice", required: true, options: ["Eu mesmo(a)", "Um coordenador ou gestor da área", "Alguém de TI", "Ainda não sei quem"] },
    { id: "q23", title: "Como você vai saber se melhorou?", description: "Escolha no máximo duas opções.", type: "multiple", required: true, maxSelections: 2, options: ["Tempo economizado", "Redução de retrabalho", "Redução de erros", "Qualidade percebida do resultado", "Velocidade de resposta à família", "Satisfação da equipe", "Conversão de matrícula", "Retenção de alunos", "Aprendizagem dos estudantes"] },
    { id: "q24", title: "Você consegue medir isso hoje, antes de começar?", type: "choice", required: true, options: ["Sim, tenho o número", "Consigo estimar", "Não, preciso criar a medição"] },
    { id: "q25", title: "Quantas pessoas participam do piloto?", type: "choice", required: true, options: ["Só eu", "De 2 a 3", "De 4 a 8", "Mais de 8"] },
    { id: "q26", title: "Quando você consegue começar?", type: "choice", required: true, options: ["Nesta semana", "Em até 15 dias", "No próximo mês", "No início do próximo semestre"] },
    { id: "q27", title: "Qual o maior obstáculo que você prevê?", type: "choice", required: true, options: ["Tempo da equipe", "Resistência das pessoas", "Falta de conhecimento técnico", "Orçamento", "Falta de dados organizados", "Insegurança sobre o que pode ou não fazer", "Não vejo obstáculo evidente"] },
    { id: "q28", title: "O que este workshop mais mudou na sua percepção?", type: "short", required: false, maxLength: 280 }
  ];

  const storageKey = "iaschools-plano-acao-v1";
  const $ = (selector) => document.querySelector(selector);
  const state = { step: 0, answers: {}, started: false };
  const intro = $("#intro");
  const formView = $("#form-view");
  const reportView = $("#report-view");
  const host = $("#question-host");
  const error = $("#form-error");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (saved && typeof saved === "object") {
        state.answers = saved.answers || {};
        state.step = Math.min(Math.max(Number(saved.step) || 0, 0), questions.length - 1);
        state.started = Boolean(saved.started);
      }
    } catch (_) { sessionStorage.removeItem(storageKey); }
  }

  function saveState() {
    sessionStorage.setItem(storageKey, JSON.stringify({ step: state.step, answers: state.answers, started: state.started }));
  }

  function optionMarkup(question, option, index, checked) {
    const type = question.type === "multiple" ? "checkbox" : "radio";
    return `<label class="option"><input type="${type}" name="${question.id}" value="${escapeHtml(option)}" ${checked ? "checked" : ""}><span class="option-key">${String.fromCharCode(65 + index)}</span><span class="option-text">${escapeHtml(option)}</span></label>`;
  }

  function renderField(question) {
    const answer = state.answers[question.id];
    if (question.type === "short" || question.type === "email") {
      return `<input class="field" id="${question.id}" name="${question.id}" type="${question.type === "email" ? "email" : "text"}" value="${escapeHtml(answer || "")}" maxlength="${question.maxLength}" placeholder="Digite sua resposta" autocomplete="${question.type === "email" ? "email" : question.id === "q1" ? "name" : "off"}"><p class="character-count"><span>${String(answer || "").length}</span>/${question.maxLength}</p>`;
    }
    if (question.type === "choice" || question.type === "multiple") {
      const selected = question.type === "multiple" ? (Array.isArray(answer) ? answer : []) : [answer];
      return `<div class="options">${question.options.map((option, index) => optionMarkup(question, option, index, selected.includes(option))).join("")}</div>`;
    }
    if (question.type === "score-pair") {
      const values = answer || {};
      return `<div class="score-pair"><label>Bloco A<input class="field" name="q8-a" type="number" min="14" max="56" inputmode="numeric" value="${escapeHtml(values.a || "")}" placeholder="14–56"></label><label>Bloco B<input class="field" name="q8-b" type="number" min="6" max="24" inputmode="numeric" value="${escapeHtml(values.b || "")}" placeholder="6–24"></label></div>`;
    }
    if (question.type === "grid") {
      const values = answer || {};
      return `<div class="grid-wrap"><table class="priority-grid"><thead><tr><th>Área</th>${question.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${question.rows.map((row, rowIndex) => `<tr><td class="grid-area">${escapeHtml(row)}</td>${question.columns.map((column) => `<td data-col="${escapeHtml(column)}"><label class="grid-cell"><input aria-label="${escapeHtml(row)}: ${escapeHtml(column)}" type="radio" name="grid-${rowIndex}" value="${escapeHtml(column)}" data-row="${escapeHtml(row)}" ${values[row] === column ? "checked" : ""}><span class="grid-cell-text">${escapeHtml(column)}</span></label></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return "";
  }

  function renderQuestion() {
    const question = questions[state.step];
    const percent = Math.round(((state.step + 1) / questions.length) * 100);
    $("#progress-label").textContent = `Pergunta ${state.step + 1} de ${questions.length}`;
    $("#progress-percent").textContent = `${percent}%`;
    $("#progress-bar").style.width = `${percent}%`;
    $("#back-button").disabled = false;
    $("#next-button").textContent = state.step === questions.length - 1 ? "Gerar meu plano →" : "Continuar →";
    error.textContent = "";
    host.innerHTML = `<p class="question-number">${state.step + 1}<span aria-hidden="true">→</span></p><h2 id="question-title">${escapeHtml(question.title)}</h2>${question.description ? `<p class="question-description">${escapeHtml(question.description)}</p>` : ""}<span class="required-label">${question.required ? "Resposta obrigatória" : "Opcional"}</span>${renderField(question)}`;
    host.setAttribute("aria-labelledby", "question-title");
    bindFieldEvents(question);
    requestAnimationFrame(() => {
      const target = host.querySelector("input:not([type=radio]):not([type=checkbox])") || host.querySelector("input");
      if (target) target.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function bindFieldEvents(question) {
    host.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        if (input.classList.contains("field") && question.maxLength) {
          const count = host.querySelector(".character-count span");
          if (count) count.textContent = input.value.length;
        }
        capture(question);
      });
      input.addEventListener("change", () => {
        if (question.type === "multiple") enforceMultipleRules(question, input);
        capture(question);
      });
    });
  }

  function enforceMultipleRules(question, changed) {
    const checked = [...host.querySelectorAll(`input[name="${question.id}"]:checked`)];
    if (question.exclusive && changed.checked) {
      if (changed.value === question.exclusive) checked.filter((item) => item !== changed).forEach((item) => { item.checked = false; });
      else host.querySelector(`input[value="${CSS.escape(question.exclusive)}"]`).checked = false;
    }
    const current = [...host.querySelectorAll(`input[name="${question.id}"]:checked`)];
    if (question.maxSelections && current.length > question.maxSelections) {
      changed.checked = false;
      error.textContent = `Escolha no máximo ${question.maxSelections} opções.`;
    } else error.textContent = "";
  }

  function capture(question) {
    if (question.type === "short" || question.type === "email") state.answers[question.id] = host.querySelector(`[name="${question.id}"]`).value.trim();
    else if (question.type === "choice") state.answers[question.id] = host.querySelector(`[name="${question.id}"]:checked`)?.value || "";
    else if (question.type === "multiple") state.answers[question.id] = [...host.querySelectorAll(`[name="${question.id}"]:checked`)].map((input) => input.value);
    else if (question.type === "score-pair") state.answers[question.id] = { a: host.querySelector('[name="q8-a"]').value, b: host.querySelector('[name="q8-b"]').value };
    else if (question.type === "grid") {
      state.answers[question.id] = Object.fromEntries([...host.querySelectorAll("[data-row]:checked")].map((input) => [input.dataset.row, input.value]));
    }
    saveState();
  }

  function validate(question) {
    capture(question);
    const answer = state.answers[question.id];
    if (question.type === "score-pair") {
      if (!answer.a && !answer.b) return true;
      const a = Number(answer.a), b = Number(answer.b);
      if (!answer.a || !answer.b || a < 14 || a > 56 || b < 6 || b > 24) return "Informe os dois blocos dentro dos intervalos indicados, ou deixe ambos vazios.";
      return true;
    }
    if (!question.required) return true;
    if (question.type === "grid") {
      if (Object.keys(answer || {}).length !== question.rows.length) return "Marque uma opção para cada uma das oito áreas.";
      if (!Object.values(answer).includes("Agora")) return "Marque pelo menos uma área como ‘Agora’.";
    } else if (question.type === "multiple" && (!Array.isArray(answer) || answer.length === 0)) return "Escolha pelo menos uma opção.";
    else if (!answer) return "Preencha esta resposta para continuar.";
    if (question.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) return "Informe um e-mail válido.";
    if (question.id === "q10" && state.answers.q9?.[answer] !== "Agora") return "Escolha uma área que você marcou como ‘Agora’ na pergunta anterior.";
    // A decisão humana da q18 vira o eixo de responsabilidade do plano e é citada em duas
    // seções. Uma palavra solta não sustenta isso, e o plano imprimia a garantia em cima dela.
    if (question.id === "q18" && String(answer).trim().length < 12) return "Descreva em uma frase qual decisão continua sendo de uma pessoa, e quem a assina.";
    if (question.id === "q12" && String(answer).trim().length < 12) return "Descreva o problema em uma frase, para o plano poder se organizar em torno dele.";
    return true;
  }

  function showForm() {
    intro.hidden = true; reportView.hidden = true; formView.hidden = false;
    state.started = true; saveState(); renderQuestion();
  }

  function showIntro() {
    formView.hidden = true; reportView.hidden = true; intro.hidden = false;
    state.started = false; saveState();
    document.title = "Plano de Ação · IA Schools";
    requestAnimationFrame(() => $("#start-button").focus({ preventScroll: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next(event) {
    event.preventDefault();
    const result = validate(questions[state.step]);
    if (result !== true) { error.textContent = result; return; }
    if (state.step < questions.length - 1) { state.step += 1; saveState(); renderQuestion(); }
    else showReport();
  }

  function daysFromStart(choice) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (choice === "Em até 15 dias") date.setDate(date.getDate() + 15);
    else if (choice === "No próximo mês") date.setMonth(date.getMonth() + 1);
    else if (choice === "No início do próximo semestre") {
      if (date.getMonth() < 6) date.setMonth(6, 1); else date.setFullYear(date.getFullYear() + 1, 0, 1);
    }
    return date;
  }

  function dateLabel(date) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date); }
  // Minusculizar a resposta inteira destruía siglas ("IA" virava "ia") e nomes próprios no meio
  // da frase. Só a primeira letra desce, e apenas quando a palavra não é toda maiúscula.
  // A resposta livre costuma vir com ponto final. Inserida antes de outro ponto, produzia
  // "antes do envio..". Tira a pontuação final antes de emendar.
  function semPontoFinal(value) {
    return String(value ?? "").trim().replace(/[.;,:]+$/u, "");
  }
  function lowerFirst(value) {
    const text = String(value ?? "").trim();
    if (!text) return text;
    const first = text.split(/\s+/)[0];
    if (first.length > 1 && first === first.toUpperCase()) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
  function addDays(date, amount) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
  function list(values, fallback = "o resultado escolhido") { const items = Array.isArray(values) ? values : []; return items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items.at(-1)}` : items[0] || fallback; }

  // Cada item desce de caixa por si. Rebaixar a lista inteira só afetava a primeira palavra e
  // deixava "tempo economizado e Conversão de matrícula" no meio da frase.
  function listaNaFrase(values, fallback = "o resultado escolhido") {
    const items = (Array.isArray(values) ? values : []).map((item) => lowerFirst(item));
    return items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items.at(-1)}` : items[0] || fallback;
  }

  // A manchete precisa concordar com a ambição declarada logo abaixo: dizer "pede foco antes de
  // escala" para uma escola Fase 4 nega a própria orientação de escalar que vem na sequência.
  const phaseHeadline = {
    "1": "Começar pequeno pede processo antes de ferramenta.",
    "2": "Padronizar o que já funciona vem antes de abrir frente nova.",
    "3": "Conectar o piloto aos indicadores é o passo que falta.",
    "4": "Escalar com auditoria é diferente de escalar por impulso.",
  };

  const phaseGuidance = {
    "1": ["Início da jornada", "organizar o processo e definir critérios antes de automatizar"],
    "2": ["Em movimento", "padronizar o que funciona e formar quem multiplica"],
    "3": ["Estruturada", "conectar o piloto a indicadores e antecipar decisões"],
    "4": ["Referência", "governar, auditar e escalar somente o que comprovar valor"]
  };
  const profileGuidance = {
    "1": "Use IA de forma intencional numa tarefa própria durante o ciclo, para decidir com experiência de primeira mão.",
    "2": "Registre o método que já usa e ensine-o a uma segunda pessoa, para o resultado não ficar preso em você.",
    "3": "Distribua responsabilidade com prazo e evidência, para o piloto não depender da sua presença.",
    "4": "Defina critérios de revisão e encerramento antes do piloto, mantendo contato com quem executa."
  };
  const obstacleGuidance = {
    "Tempo da equipe": ["Reserve um bloco curto e fixo na agenda; não dependa de tempo sobrando.", "Reduza o piloto à menor tarefa que ainda permita uma comparação honesta."],
    "Resistência das pessoas": ["Convide quem executa a tarefa e já demonstra curiosidade para desenhar o teste.", "Mostre um antes e depois real antes de anunciar uma mudança mais ampla."],
    "Falta de conhecimento técnico": ["Crie um roteiro curto com dois exemplos aprovados e critérios de revisão.", "Faça a primeira execução junto com o responsável, olhando a mesma tela."],
    "Orçamento": ["Comece no menor escopo possível e só discuta compra depois de obter evidência.", "Defina antes qual resultado mínimo justificaria investimento."],
    "Falta de dados organizados": ["Separe uma amostra pequena e confira sua qualidade antes de usar.", "Padronize nomes, versões e responsáveis pelos arquivos do piloto."],
    "Insegurança sobre o que pode ou não fazer": ["Registre numa página os usos permitidos, proibidos e quem aprova exceções.", "Valide ambiente e informações com o responsável por dados antes do teste."],
    "Não vejo obstáculo evidente": ["Registre riscos e dependências mesmo sem bloqueio aparente.", "Faça uma revisão de quinze minutos ao fim da primeira semana para capturar o obstáculo real."]
  };

  function buildReport() {
    const a = state.answers;
    const phaseNumber = String(a.q6 || "1").match(/\d/)?.[0] || "1";
    const profileNumber = String(a.q7 || "1").match(/\d/)?.[0] || "1";
    const phase = phaseGuidance[phaseNumber];
    const start = daysFromStart(a.q26);
    const metricsFrase = listaNaFrase(a.q23);
    const tasks = listaNaFrase(a.q17, "apoiar a tarefa escolhida");
    const data = Array.isArray(a.q19) ? a.q19 : [];
    const sensitive = data.filter((item) => /identificáveis|colaboradores|financeiras|saúde|laudos|vulnerabilidade/i.test(item));
    const open = String(a.q20).startsWith("Ferramenta aberta") || a.q20 === "Ainda não sei";
    const safety = sensitive.length && open;
    const governance = Array.isArray(a.q21) ? a.q21 : [];
    const governanceMissing = governance.includes("Nenhum dos anteriores");
    const obstacle = obstacleGuidance[a.q27] || ["Defina uma ação preventiva com responsável e prazo.", "Revise o obstáculo ao final da primeira semana."];
    const firstAction = a.q13 === "Não existe processo definido, cada um faz de um jeito"
      ? `Mapear com ${lowerFirst(a.q15)} como a tarefa acontece hoje, sem idealizar, e registrar entradas, decisões e saídas.`
      : a.q13 === "Existe processo, mas não está escrito"
        ? `Escrever com ${lowerFirst(a.q15)} o processo atual e escolher uma amostra pequena para o primeiro teste.`
        : a.q13 === "Está escrito, mas nem sempre é seguido"
          ? `Revisar com ${lowerFirst(a.q15)} por que o processo escrito não se sustenta e ajustar o trecho que será pilotado.`
          : `Registrar o critério já seguido pela equipe e executar uma primeira amostra controlada.`;
    const owner = a.q22 === "Eu mesmo(a)" ? a.q1 : a.q22 === "Ainda não sei quem" ? "ainda não definido, a nomear antes do início" : a.q22;
    const cicloUm = [
      firstAction,
      safety
        ? "Trocar o ambiente do piloto, ou retirar o dado sensível dele, antes de qualquer teste: enquanto isso não estiver resolvido, o piloto não começa."
        : a.q20 === "Ainda não sei"
          ? "Definir e aprovar com a direção onde o piloto vai rodar, antes de qualquer teste com conteúdo real."
          : `Registrar o que pode e o que não pode entrar no ambiente escolhido: ${lowerFirst(a.q20)}.`,
      a.q22 === "Ainda não sei quem"
        ? "Nomear quem responde pela implantação, com nome e prazo."
        : a.q22 === "Eu mesmo(a)"
          ? "Registrar por escrito que a condução é sua, com a cadência de acompanhamento que você vai manter."
          : `Combinar com ${lowerFirst(owner)} o papel de condução e a cadência de acompanhamento.`,
      a.q24 === "Não, preciso criar a medição"
        ? `Criar a medição do indicador escolhido, com o critério escrito antes do primeiro teste: ${metricsFrase}.`
        : `Registrar a linha de base, com a fonte e a data, para o indicador escolhido: ${metricsFrase}.`,
      "Executar uma amostra pequena, sem ampliar o escopo.",
    ];
    const cicloDois = [
      `Comparar com a linha de base, usando o mesmo critério de antes, o indicador escolhido: ${metricsFrase}.`,
      "Registrar erros, retrabalho, exceções e ajustes necessários.",
      `Manter a revisão humana declarada: ${semPontoFinal(a.q18) || "uma pessoa aprova cada resultado antes do uso"}.`,
      "Escrever o processo em uma página, com o critério de exceção definido.",
    ];
    const cicloTres = [
      safety
        ? "Consolidar o que funcionou e registrar por escrito se a pendência de dado e ambiente foi resolvida, ou se o piloto seguiu sem ela."
        : "Consolidar o que funcionou, o que falhou e o que deve ser interrompido.",
      "Transformar o que comprovou valor em um padrão escrito, com responsável nomeado.",
      "Revisar acessos, informações usadas e decisões que continuam humanas.",
      "Decidir e registrar: escalar, ajustar ou encerrar.",
    ];
    const itens = (lista) => lista.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const baseline = a.q24 === "Sim, tenho o número" ? "Registrar o número atual antes do primeiro teste." : a.q24 === "Consigo estimar" ? "Registrar uma estimativa explícita e o método usado para calculá-la." : "Criar uma medição simples antes de testar; sem linha de base não existe comparação.";
    return `
      <header class="report-cover">
        <span class="report-kicker">IA Schools · Plano de ação de 90 dias</span>
        <h1>${escapeHtml(a.q10)}: uma frente, um piloto, uma medida.</h1>
        <p class="report-subtitle">Plano orientativo construído a partir das respostas de ${escapeHtml(a.q1)} para enfrentar: “${escapeHtml(a.q12)}”</p>
        <div class="report-meta"><div><small>Escola</small><strong>${escapeHtml(a.q2)}</strong></div><div><small>Responsável</small><strong>${escapeHtml(owner)}</strong></div><div><small>Início previsto</small><strong>${escapeHtml(dateLabel(start))}</strong></div></div>
      </header>
      <section class="report-section"><span class="section-label">01 · Leitura do diagnóstico</span><h2>${escapeHtml(phaseHeadline[phaseNumber] || "Foco antes de escala.")}</h2><p>A sua escola se declarou em <strong>${escapeHtml(a.q6)}</strong>, e você, em <strong>${escapeHtml(a.q7)}</strong>. Neste ciclo, a ambição adequada é ${escapeHtml(phase[1])}. A prioridade é <strong>${escapeHtml(a.q10)}</strong>${/outro motivo/i.test(String(a.q11)) ? ", e o motivo não está entre as opções da lista" : `, porque ${escapeHtml(lowerFirst(a.q11))}`}.</p><div class="highlight"><strong>Desenvolvimento do líder:</strong> ${escapeHtml(profileGuidance[profileNumber])}</div></section>
      ${safety ? `<section class="report-section"><div class="safety"><span class="section-label">Ponto de parada</span><h2>O piloto não deve começar com dados reais no ambiente descrito.</h2><p>Você marcou ${escapeHtml(listaNaFrase(sensitive))} entre as informações usadas, e ${/ainda não sei/i.test(String(a.q20)) ? "ainda não definiu onde o piloto vai rodar" : `informou que o piloto roda em ${escapeHtml(lowerFirst(a.q20))}`}. Retire dados sensíveis e identificáveis do teste ou use dados fictícios/agregados. Caso individual só entra depois de ambiente contratado, cláusulas adequadas e validação da escola.</p></div></section>` : ""}
      <section class="report-section"><span class="section-label">02 · Resultado do ciclo</span><h2>Testar pequeno e comparar com o processo atual.</h2><p>Em 90 dias, o piloto deve usar IA para <strong>${escapeHtml(tasks)}</strong> na área de ${escapeHtml(a.q10)}, preservando como decisão humana: <strong>${escapeHtml(semPontoFinal(a.q18))}</strong>.</p><p>A evidência principal será ${escapeHtml(metricsFrase)}. ${escapeHtml(baseline)} ${/não sei estimar/i.test(String(a.q16)) ? "O tempo consumido hoje não é conhecido, então medir vem antes de comparar." : `Considere também o esforço atual declarado: ${escapeHtml(lowerFirst(a.q16))} por semana.`}</p></section>
      <section class="report-section"><span class="section-label">03 · Primeira ação</span><h2>Começar pelo processo, não pela ferramenta.</h2><p><strong>Ação:</strong> ${escapeHtml(firstAction)}</p><p><strong>Responsável:</strong> ${escapeHtml(owner)} · <strong>Equipe do piloto:</strong> ${escapeHtml(a.q25)} · <strong>Prazo:</strong> até ${escapeHtml(dateLabel(addDays(start, 7)))} (7 dias a partir do início previsto).</p></section>
      <section class="report-section"><span class="section-label">04 · Três ciclos</span><h2>90 dias com pontos claros de decisão.</h2><div class="cycles"><div class="cycle"><b>0–30 dias · até ${escapeHtml(dateLabel(addDays(start, 30)))}</b><h3>Organizar e pilotar</h3><ul>${itens(cicloUm)}</ul></div><div class="cycle"><b>31–60 dias · até ${escapeHtml(dateLabel(addDays(start, 60)))}</b><h3>Medir e ajustar</h3><ul>${itens(cicloDois)}</ul></div><div class="cycle"><b>61–90 dias · até ${escapeHtml(dateLabel(addDays(start, 90)))}</b><h3>Decidir</h3><ul>${itens(cicloTres)}</ul></div></div></section>
      <section class="report-section"><span class="section-label">05 · Governança mínima</span><h2>Escala só depois de segurança e responsabilidade.</h2><ul><li>${safety ? "Manter dados reais fora do piloto até a validação do ambiente e das regras de tratamento." : "Usar somente as informações necessárias, no ambiente declarado e aprovado pela escola."}</li><li>Registrar quem prepara, quem revisa e quem autoriza o resultado antes de qualquer uso.</li><li>${governanceMissing ? "Criar uma regra de uma página: usos permitidos, usos proibidos, ferramentas aprovadas e responsável por exceções." : `Usar como base o que a escola já declarou ter: ${escapeHtml(listaNaFrase(governance))}.`}</li><li>Agendar a revisão final para ${escapeHtml(dateLabel(addDays(start, 90)))} e registrar a decisão: escalar, ajustar ou encerrar.</li></ul></section>
      <section class="report-section"><span class="section-label">06 · Obstáculo previsto</span><h2>${escapeHtml(a.q27)}</h2><ul><li>${escapeHtml(obstacle[0])}</li><li>${escapeHtml(obstacle[1])}</li></ul></section>
      <p class="report-signoff">Comece por uma dor. Organize o processo. Teste pequeno. Meça. Só então escale.</p>
      <p class="report-disclaimer">Este documento é um apoio orientativo gerado localmente a partir das respostas fornecidas. A escola deve revisar o plano e validar aspectos pedagógicos, jurídicos, contratuais, de privacidade e de segurança antes da implantação. Nenhuma resposta foi enviada automaticamente à IA Schools.</p>`;
  }

  function showReport() {
    formView.hidden = true; intro.hidden = true; reportView.hidden = false;
    $("#report").innerHTML = buildReport();
    sessionStorage.setItem(`${storageKey}-complete`, "true");
    document.title = `Plano de Ação · ${state.answers.q2 || "IA Schools"}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function csvCell(value) {
    const normalized = Array.isArray(value) ? value.join(" | ") : value && typeof value === "object" ? Object.entries(value).map(([key, item]) => `${key}: ${item}`).join(" | ") : value || "";
    return `"${String(normalized).replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const headers = ["form_id", "data_geracao", ...questions.map((q) => q.id)];
    const row = ["plano-de-acao-ia-schools-2026", new Date().toISOString(), ...questions.map((q) => state.answers[q.id])];
    const blob = new Blob(["\ufeff" + headers.map(csvCell).join(";") + "\r\n" + row.map(csvCell).join(";") + "\r\n"], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `respostas-plano-${String(state.answers.q2 || "ia-schools").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.csv`;
    link.click(); URL.revokeObjectURL(link.href);
  }

  $("#start-button").addEventListener("click", showForm);
  $("#plan-form").addEventListener("submit", next);
  $("#back-button").addEventListener("click", (event) => {
    event.preventDefault();
    capture(questions[state.step]);
    if (state.step > 0) {
      state.step -= 1;
      saveState();
      renderQuestion();
    } else showIntro();
  });
  $("#print-button").addEventListener("click", () => window.print());
  $("#csv-button").addEventListener("click", downloadCsv);
  $("#edit-button").addEventListener("click", () => {
    sessionStorage.removeItem(`${storageKey}-complete`);
    reportView.hidden = true; formView.hidden = false;
    state.step = questions.length - 1; state.started = true; saveState(); renderQuestion();
  });
  $("#reset-button").addEventListener("click", () => { if (!window.confirm("Apagar as respostas desta aba e começar novamente?")) return; sessionStorage.removeItem(storageKey); sessionStorage.removeItem(`${storageKey}-complete`); state.step = 0; state.answers = {}; state.started = false; reportView.hidden = true; formView.hidden = true; intro.hidden = false; document.title = "Plano de Ação · IA Schools"; });
  document.addEventListener("keydown", (event) => { if (event.key === "Enter" && !formView.hidden && !event.shiftKey && !event.target.matches("button")) { event.preventDefault(); $("#plan-form").requestSubmit(); } });

  loadState();
  if (state.started) {
    if (sessionStorage.getItem(`${storageKey}-complete`) === "true" && questions.every((q) => !q.required || state.answers[q.id])) showReport();
    else showForm();
  }
})();
