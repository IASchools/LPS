/*
 * Renderizador do plano nas nove seções da Parte 3.
 *
 * Por que existe: a página gerava seis seções próprias, com um parágrafo por ciclo e governança
 * genérica. O documento combinado tem nove seções numeradas, de três a cinco ações por ciclo e
 * uma linha com prazo para cada item de governança que a escola não marcou. Essas regras já
 * existem, testadas, em `motor.js` — este arquivo só traduz as respostas para o formato que o
 * motor espera e transforma o resultado em HTML, sem reimplementar nenhuma regra.
 */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  /**
   * O motor recebe cada resposta como texto: múltipla escolha, grade e pontuação chegam como
   * JSON. A página guarda array e objeto nativos, então a conversão acontece aqui, num lugar só.
   */
  function paraFormatoDoMotor(answers) {
    const saida = {};
    Object.keys(answers || {}).forEach((id) => {
      const valor = answers[id];
      if (valor === undefined || valor === null) return;
      if (Array.isArray(valor)) { saida[id] = JSON.stringify(valor); return; }
      if (typeof valor === "object") {
        // A pontuação chega como {a, b} e o motor espera {A, B}.
        if ("a" in valor || "b" in valor) {
          const a = String(valor.a ?? "").trim();
          const b = String(valor.b ?? "").trim();
          saida[id] = a || b ? JSON.stringify({ A: a, B: b }) : "";
          return;
        }
        saida[id] = JSON.stringify(valor);
        return;
      }
      saida[id] = String(valor);
    });
    return saida;
  }

  const lista = (itens) => `<ul>${(itens || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

  function secao(numero, titulo, corpo) {
    return `<section class="report-section"><span class="section-label">${String(numero).padStart(2, "0")} · ${escapeHtml(titulo)}</span>${corpo}</section>`;
  }

  function fichaDoPiloto(pilot) {
    const linhas = [
      ["O que a IA faz", lista(pilot.aiTasks)],
      ["O que continua humano", `<p>${pilot.humanDecisionMissing ? escapeHtml(pilot.humanDecision) : `Nas suas palavras: ${escapeHtml(pilot.humanDecision)}`}</p>`],
      ["Que informações usa", lista(pilot.information)],
      ["Onde vai rodar", `<p>${escapeHtml(pilot.environment)}</p>`],
      ["Quem conduz a implantação", `<p>${escapeHtml(pilot.conductor)}</p>`],
      ["Quem executa a tarefa hoje", `<p>${escapeHtml(pilot.operator)}</p>`],
    ];
    return `<div class="plano-ficha">${linhas.map(([rotulo, conteudo]) => `<div><small>${escapeHtml(rotulo)}</small>${conteudo}</div>`).join("")}</div>`;
  }

  function blocoDeParada(numero, alerta) {
    // No documento de referência o ponto de parada é uma seção numerada e desloca as seguintes:
    // ele não é um aviso lateral, é uma etapa do plano.
    return `<section class="report-section"><div class="safety"><span class="section-label">${String(numero).padStart(2, "0")} · ${escapeHtml(alerta.sectionTitle)}</span><h2>${escapeHtml(alerta.title)}</h2><p><strong>${escapeHtml(alerta.subtitle)}</strong></p><p>${escapeHtml(alerta.reading)}</p><p>${escapeHtml(alerta.exitsIntro)}</p><ol>${alerta.exits.map((saida) => `<li>${escapeHtml(saida)}</li>`).join("")}</ol></div></section>`;
  }

  function montarHtml(plano) {
    const p = plano;
    const partes = [];
    let n = 0;
    const proximo = () => (n += 1);

    partes.push(`<header class="report-cover">
      <span class="report-kicker">IA Schools · Plano de ação de 90 dias</span>
      <h1>${escapeHtml(p.participant.name)}</h1>
      <p class="report-subtitle">${escapeHtml(p.participant.school)} · ${escapeHtml(p.participant.role)} · ${escapeHtml(p.participant.size)}</p>
      <div class="report-meta">
        <div><small>A sua escola</small><strong>${escapeHtml(p.phaseCard.title)}</strong></div>
        <div><small>Você como líder</small><strong>${escapeHtml(p.profileCard.title)}</strong></div>
        <div><small>Documento</small><strong>${escapeHtml(p.participant.workshopDate)}</strong><span class="plano-detalhe">${escapeHtml(p.participant.generatedAt)}</span></div>
      </div>
    </header>`);

    partes.push(`<section class="report-section"><div class="plano-duo">
      <article><small>${escapeHtml(p.phaseCard.label)}</small><h3>${escapeHtml(p.phaseCard.title)}</h3><span class="plano-detalhe">${escapeHtml(p.phaseCard.detail)}</span><p>${escapeHtml(p.phaseCard.reading)}</p>${p.phaseCard.edge ? `<p class="plano-borda">${escapeHtml(p.phaseCard.edge)}</p>` : ""}</article>
      <article><small>${escapeHtml(p.profileCard.label)}</small><h3>${escapeHtml(p.profileCard.title)}</h3><span class="plano-detalhe">${escapeHtml(p.profileCard.detail)}</span><p>${escapeHtml(p.profileCard.reading)}</p>${p.profileCard.edge ? `<p class="plano-borda">${escapeHtml(p.profileCard.edge)}</p>` : ""}</article>
    </div></section>`);

    partes.push(secao(proximo(), p.combinationTitle,
      `${p.combination.map((paragrafo) => `<p>${escapeHtml(paragrafo)}</p>`).join("")}${p.leaderNote ? `<p class="plano-nota">${escapeHtml(p.leaderNote)}</p>` : ""}${p.workshopInsight ? `<blockquote class="plano-citacao">“${escapeHtml(p.workshopInsight)}”</blockquote>` : ""}`));

    partes.push(secao(proximo(), "A prioridade que você escolheu",
      `<p>${escapeHtml(p.priority.solidity)}</p><div class="plano-duo">
        <article><small>O problema, nas suas palavras</small><p>“${escapeHtml(p.priority.problem)}”</p></article>
        <article><small>O que fica de fora agora</small>${p.priority.otherNow.length ? `<p>${escapeHtml(p.priority.otherNow.length > 1 ? `${p.priority.otherNow.slice(0, -1).join(", ")} e ${p.priority.otherNow[p.priority.otherNow.length - 1]}` : p.priority.otherNow[0])} ${p.priority.otherNow.length > 1 ? "continuam relevantes" : "continua relevante"} e ${p.priority.otherNow.length > 1 ? "entram" : "entra"} depois desta prioridade.</p>` : ""}<p>${p.priority.later.length ? `Ficam para depois: ${escapeHtml(p.priority.later.join(", "))}.` : p.priority.otherNow.length ? "Nenhuma outra área foi marcada como ‘Depois’: as que sobram já estão citadas acima." : "Nada foi adiado para o ciclo seguinte."}</p><p>${p.priority.excluded.length ? `Ficam fora deste plano, por decisão sua: ${escapeHtml(p.priority.excluded.join(", "))}.` : "Nenhuma área foi recusada deliberadamente."}</p></article>
      </div><p class="plano-nota">${escapeHtml(p.priority.focusNote)}</p>`));

    if (p.pilot.safetyAlert) partes.push(blocoDeParada(proximo(), p.pilot.safetyAlert));

    partes.push(secao(proximo(), "O seu piloto", `<p>${escapeHtml(p.pilot.summary)}</p><p>${escapeHtml(p.pilot.maturityNote)}</p>${fichaDoPiloto(p.pilot)}<p class="plano-nota">${escapeHtml(p.pilot.frequencyNote)}</p>`));

    partes.push(secao(proximo(), "Como você vai medir",
      `<div class="plano-duo">
        <article><small>Indicadores</small>${lista(p.measurement.indicators)}</article>
        <article><small>Linha de base</small><p>${escapeHtml(p.measurement.baseline)}</p></article>
      </div><p>${escapeHtml(p.measurement.effort)}</p><p>${escapeHtml(p.measurement.comparison)}</p>`));

    partes.push(secao(proximo(), "A primeira ação em 7 dias",
      `<div class="highlight"><strong>${escapeHtml(p.firstAction.action)}</strong><p>${escapeHtml(p.firstAction.rationale)}</p>${p.firstAction.startNote ? `<p class="plano-nota">${escapeHtml(p.firstAction.startNote)}</p>` : ""}<div class="plano-ficha plano-ficha-tres"><div><small>Responsável</small><p>${escapeHtml(p.firstAction.responsible)}</p></div><div><small>Prazo</small><p>Até ${escapeHtml(p.firstAction.date)}</p></div><div><small>Quem participa</small><p>${escapeHtml(p.firstAction.participants)}</p></div></div></div>`));

    partes.push(secao(proximo(), "Plano de 30, 60 e 90 dias",
      `<p>${escapeHtml(p.cyclesIntro)}</p><div class="cycles">${p.cycles.map((ciclo) => `<div class="cycle"><b>${escapeHtml(ciclo.label)} · ${escapeHtml(ciclo.deadline)}</b><h3>${escapeHtml(ciclo.title)}</h3>${lista(ciclo.actions)}</div>`).join("")}</div>`));

    partes.push(secao(proximo(), "O que falta na sua governança",
      `<p>${escapeHtml(p.governanceIntro)}</p><div class="plano-lista">${p.governance.map((item) => `<div class="plano-linha"><span>${escapeHtml(item.deadline)}</span><p>${escapeHtml(item.item)}${item.note ? `<em>${escapeHtml(item.note)}</em>` : ""}</p></div>`).join("")}</div><p class="plano-nota">${escapeHtml(p.sizeNote)}</p>`));

    partes.push(secao(proximo(), "O obstáculo que você previu",
      `<p><strong>${escapeHtml(p.obstacle.label)}.</strong> ${escapeHtml(p.obstacle.lead)} ${escapeHtml(p.obstacle.reading)}</p><div class="plano-duo">${p.obstacle.countermeasures.map((medida) => `<article><small>${escapeHtml(medida.title)}</small><p>${escapeHtml(medida.text)}</p></article>`).join("")}</div>`));

    partes.push(`<section class="report-section"><div class="plano-duo">
      <article><small>Revisão do plano</small><p>${escapeHtml(p.reviewDate)}</p></article>
      <article><small>Sinal de que está funcionando</small><p>${escapeHtml(p.progressSignal)}</p></article>
    </div><p class="report-signoff">${escapeHtml(p.closingDisplay || p.closing)}</p></section>`);

    partes.push(`<p class="report-disclaimer">Este documento é um apoio orientativo, gerado a partir das respostas fornecidas. A escola deve revisar o plano e validar aspectos pedagógicos, jurídicos, contratuais, de privacidade e de segurança antes da implantação. Nenhuma resposta foi enviada automaticamente à IA Schools.</p>`);

    return partes.join("");
  }

  window.IASchoolsRelatorio = {
    montar(answers, agora) {
      const motor = window.IASchoolsPlano;
      if (!motor) return null;
      const resultado = motor.buildActionPlanReport(paraFormatoDoMotor(answers), agora || new Date());
      return resultado && resultado.actionPlan ? montarHtml(resultado.actionPlan) : null;
    },
  };
})();
