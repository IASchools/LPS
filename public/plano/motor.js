/*
 * Motor do Plano de Ação IA Schools.
 *
 * GERADO a partir de `lib/action-plan.ts` do repositório ia-schools-apps, onde as regras vivem e
 * onde 732 testes as cobrem. NÃO EDITE AQUI: corrija lá e gere de novo com
 *   pnpm exec tsc lib/action-plan.ts --target es2022 --module es2022 --moduleResolution bundler
 * depois troque `export function` por `function` e mantenha o rodapé que expõe o global.
 * Editar este arquivo faz a correção se perder na próxima geração.
 *
 * O código usa lookbehind e propriedades Unicode em expressão regular. Navegador antigo demais
 * não consegue nem interpretar o arquivo, e a página cai no plano de reserva — que agora avisa
 * no console e marca `data-plano-motor="reserva"` no documento, em vez de trocar em silêncio.
 */
const CANONICAL_FORM_ID = "plano-de-acao-ia-schools-2026";
const CLOSING = "comece por uma dor, organize o processo, teste pequeno, meça, só então escale";
const CLOSING_DISPLAY = "Comece por uma dor. Organize o processo. Teste pequeno. Meça. Só então escale.";
const WORKSHOP_DATE = "Workshop de 17 de agosto de 2026";
function list(value) {
    if (!value)
        return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    }
    catch {
        return [];
    }
}
function record(value) {
    if (!value)
        return {};
    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            return {};
        return Object.fromEntries(Object.entries(parsed).filter((entry) => typeof entry[1] === "string"));
    }
    catch {
        return {};
    }
}
const NUMERAL = ["nenhuma", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito"];
function spell(quantidade) {
    return NUMERAL[quantidade] ?? String(quantidade);
}
/**
 * Lista com vírgulas e "e" antes do último item, como no texto de referência. Quando o
 * próprio item já contém "e", a vírgula antes do conectivo evita o encadeamento confuso
 * de "analisar dados e apontar padrões e comparar cenários".
 */
function listar(itens) {
    if (itens.length <= 1)
        return itens[0] ?? "";
    const conectivo = itens.length > 2 && itens.some((item) => / e /.test(item)) ? ", e " : " e ";
    return `${itens.slice(0, -1).join(", ")}${conectivo}${itens[itens.length - 1]}`;
}
function level(value) {
    const found = value?.match(/\d/);
    return found ? Number(found[0]) : 0;
}
function clean(value, fallback) {
    return value?.trim().replace(/\s+/g, " ") || fallback;
}
/** Primeira letra em maiúscula, para começar frase com um trecho citado. */
function capitalizar(value) {
    return value ? `${value.charAt(0).toLocaleUpperCase("pt-BR")}${value.slice(1)}` : value;
}
/**
 * Primeira letra em minúscula, para citar a resposta no meio ou depois de dois-pontos.
 *
 * Palavra inteiramente maiúscula fica intacta: rebaixá-la destruía sigla e algarismo romano
 * respondidos pela pessoa, e o documento imprimia "alguém de ti" e "fundamental ii".
 */
function lowerFirst(value) {
    const texto = String(value ?? "");
    const primeira = texto.trim().split(/\s+/u)[0] ?? "";
    if (primeira.length > 1 && primeira === primeira.toLocaleUpperCase("pt-BR"))
        return texto;
    return texto ? `${texto.charAt(0).toLocaleLowerCase("pt-BR")}${texto.slice(1)}` : texto;
}
/** Versão usada no meio de frase: sem pontuação final, que duplicaria a do texto. */
function inline(value, fallback) {
    return clean(value, fallback).replace(/[.;,:?!…]+$/u, "").trim() || fallback;
}
const TIMEZONE = "America/Sao_Paulo";
/**
 * A formatação usa o fuso de São Paulo, então a aritmética precisa usar o mesmo dia civil.
 * Com `setDate` no fuso do processo, um servidor em UTC gera o plano dizendo 17/08 e datando
 * o cronograma a partir de 18/08. O Brasil não tem horário de verão desde 2019, então meio-dia
 * em São Paulo é sempre 15h em UTC.
 */
function civilDate(base) {
    const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(base)
        .split("-")
        .map(Number);
    return { year, month, day };
}
function atNoon(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day, 15));
}
function dateAfter(base, days) {
    const { year, month, day } = civilDate(base);
    return atNoon(year, month, day + days);
}
function nextSemester(base) {
    const { year, month } = civilDate(base);
    return month <= 6 ? atNoon(year, 7, 1) : atNoon(year + 1, 1, 1);
}
function formatDate(value) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: TIMEZONE }).format(value);
}
function formatShortDate(value) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIMEZONE }).format(value);
}
function startDate(choice, now) {
    if (choice === "Em até 15 dias")
        return dateAfter(now, 15);
    if (choice === "No próximo mês")
        return dateAfter(now, 30);
    if (choice === "No início do próximo semestre")
        return nextSemester(now);
    return dateAfter(now, 0);
}
/** Regra 1 · a fase define o vocabulário e a ambição do plano. */
const PHASES = {
    1: {
        title: "Início da jornada",
        reading: "A escola está começando. O ganho vem de organizar o processo e definir critérios antes de automatizar qualquer coisa.",
        ambition: "organizar o processo e definir critérios",
        consolidation: "Escrever o critério de uso que a equipe vai seguir depois do piloto.",
        expansion: "Só então avaliar uma segunda tarefa, com o mesmo critério já escrito.",
        expansionTo: (proxima) => `Só então levar o mesmo método para ${proxima}, com o critério já escrito e a equipe já treinada.`,
    },
    2: {
        title: "Em movimento",
        reading: "A escola já usa IA em pontos isolados. O ganho vem de padronizar o que funciona e formar quem multiplica.",
        ambition: "padronizar o que já funciona e formar multiplicadores",
        consolidation: "Transformar o que funcionou em um padrão escrito e escolher quem vai multiplicá-lo.",
        expansion: "Só então avaliar a segunda equipe que recebe o mesmo padrão.",
        expansionTo: (proxima) => `Só então levar o padrão para ${proxima}, com a equipe já treinada e um multiplicador nomeado.`,
    },
    3: {
        title: "Estruturada",
        reading: "A escola já tem estrutura. O ganho vem de conectar indicadores de áreas diferentes e antecipar decisão.",
        ambition: "conectar indicadores de áreas diferentes e antecipar decisão",
        consolidation: "Cruzar o indicador do piloto com um indicador de outra área e registrar o que a combinação antecipa.",
        expansion: "Só então avaliar a expansão para a área cujo indicador conversa com este.",
        expansionTo: (proxima) => `Só então levar o método para ${proxima}, cruzando o indicador dela com o deste piloto.`,
        // Regra 9: com todas as demais áreas recusadas, nem a leitura da fase pode mandar atravessar.
        alone: {
            reading: "A escola já tem estrutura. Com uma única área em jogo, o ganho vem de cruzar indicadores dentro dela e antecipar decisão.",
            ambition: "cruzar indicadores dentro da própria área e antecipar decisão",
        },
    },
    4: {
        title: "Referência",
        reading: "A escola já opera com método. O ganho vem de governar, auditar e escalar apenas o que comprovou valor.",
        ambition: "governar, auditar e escalar só o que comprovou valor",
        consolidation: "Auditar o piloto contra a política vigente e registrar o critério de encerramento.",
        expansion: "Só então escalar o que comprovou valor, com auditoria e data de revisão definidas.",
        expansionTo: (proxima) => `Só então escalar o que comprovou valor para ${proxima}, com auditoria e data de revisão definidas.`,
    },
};
/** Regra 2 · o perfil define o que o líder precisa desenvolver. */
const PROFILES = {
    1: {
        title: "Explorador",
        reading: "Você está formando repertório. O risco é decidir sobre IA sem ter usado o suficiente para julgar.",
        development: "Usar IA de forma intencional em uma tarefa própria, todo dia útil, por trinta dias seguidos.",
        note: "Um alerta que vem do seu perfil. Como Explorador, a sua tendência é decidir a partir do que ouviu, não do que usou. Trinta dias de uso próprio mudam a qualidade das suas decisões mais do que qualquer curso.",
    },
    2: {
        title: "Experimentador",
        reading: "Você já testa por conta própria. O risco é o resultado ficar preso em você, sem virar método.",
        development: "Registrar o método que você já usa e ensiná-lo a uma segunda pessoa dentro do ciclo.",
        note: "Um alerta que vem do seu perfil. Como Experimentador, a sua tendência é acumular achados sem registrá-los. O que não vira método escrito morre com a sua agenda.",
    },
    3: {
        title: "Mobilizador",
        reading: "Você já move outras pessoas. O risco é a operação passar a depender da sua presença.",
        development: "Distribuir a responsabilidade do piloto, com nome e prazo, para não ser o gargalo.",
        note: "Um alerta que vem do seu perfil. Como Mobilizador, a sua tendência é puxar a execução para si. Se o piloto só anda quando você está na sala, ele não sobrevive a 90 dias.",
    },
    4: {
        title: "Estrategista",
        reading: "Você já pensa em sistema, não em ferramenta. O risco é distanciar-se de quem executa.",
        development: "Definir o ciclo de revisão e os critérios de encerramento antes de o piloto começar.",
        note: "Um alerta que vem do seu perfil. Como Estrategista, a sua tendência é desenhar o sistema e delegar a execução. Apareça nas duas primeiras reuniões do piloto: o sinal de que a direção participa vale mais do que o documento.",
    },
};
const CYCLE_TITLES = {
    1: { second: "COLOCAR A IA NO PROCESSO", third: "PADRONIZAR OU ENCERRAR" },
    2: { second: "COLOCAR A IA NO PROCESSO", third: "PADRONIZAR OU ENCERRAR" },
    3: { second: "CONECTAR OS INDICADORES", third: "ANTECIPAR OU ENCERRAR" },
    4: { second: "TRANSFERIR E MULTIPLICAR", third: "CONSOLIDAR COMO PADRÃO" },
};
const PHASE_BANDS = [
    { phase: 1, min: 14, max: 24 },
    { phase: 2, min: 25, max: 35 },
    { phase: 3, min: 36, max: 46 },
    { phase: 4, min: 47, max: 56 },
];
const PROFILE_BANDS = [
    { profile: 1, min: 6, max: 10 },
    { profile: 2, min: 11, max: 15 },
    { profile: 3, min: 16, max: 20 },
    { profile: 4, min: 21, max: 24 },
];
function bandOf(score, bands) {
    return bands.findIndex((band) => score >= band.min && score <= band.max) + 1;
}
function scoreNote(score, bands, tier, label) {
    if (score === undefined)
        return undefined;
    // Pontuação que pertence a outra faixa contradiz a fase ou o perfil declarado: em vez de
    // esconder, o plano avisa, porque o participante digitou os dois valores.
    const banda = bandOf(score, bands);
    if (banda && banda !== tier)
        return `Atenção: essa pontuação pertence à faixa ${banda}, e não à ${tier} que você marcou. Confira o resultado antes de usar o plano como diagnóstico.`;
    const next = bands.find((band) => band.min > score);
    if (!next)
        return undefined;
    const distance = next.min - score;
    if (distance > 2)
        return undefined;
    return `${distance === 1 ? "Falta 1 ponto" : `Faltam ${distance} pontos`} para a faixa seguinte ${label}. Você está no topo da faixa ${tier}, não no meio dela.`;
}
/** Regra 4 · a pergunta 13 decide a estrutura dos 30 primeiros dias. */
const PROCESS = {
    "Não existe processo definido, cada um faz de um jeito": {
        opening: "Não existe processo definido hoje, então os primeiros 30 dias são de mapear e escrever. O piloto de IA entra a partir do dia 31.",
        state: "não existe processo definido hoje",
        cycleTitle: "MAPEAR E ESCREVER",
        pilotInFirstCycle: false,
        processWork: (area, operator) => [
            `Mapear com ${operator} as etapas, entradas, saídas e exceções da rotina de ${area}.`,
            "Escrever o processo em uma página, com o critério de exceção definido.",
        ],
        pilotWork: () => [],
        secondCycleLead: (team) => `A partir do dia 31, com o processo já escrito, executar o piloto com ${team}, em uma amostra pequena.`,
        cyclesIntro: "Você respondeu que não existe processo definido. Por isso o primeiro ciclo é de mapear e escrever, e a IA só entra depois. Automatizar o que ninguém sabe descrever multiplica a bagunça.",
    },
    "Existe processo, mas não está escrito": {
        opening: "O processo existe na prática, mas não está escrito. Escrever e pilotar andam em paralelo neste primeiro ciclo.",
        state: "o processo existe na prática, mas não está escrito",
        cycleTitle: "ESCREVER E TESTAR JUNTOS",
        pilotInFirstCycle: true,
        processWork: (area, operator) => [`Escrever o processo da área de ${area} como ele acontece hoje, com ${operator}, sem idealizar.`],
        pilotWork: (area, team) => [`Rodar o piloto em paralelo, com ${team}, numa amostra pequena da área de ${area}.`],
        secondCycleLead: () => "Ampliar o piloto para o volume real da tarefa, mantendo o mesmo critério de revisão.",
        cyclesIntro: "Você respondeu que o processo existe, mas não está escrito. Por isso escrever e pilotar acontecem em paralelo, e não em sequência. Escrever sozinho vira documento morto, pilotar sozinho vira improviso.",
    },
    "Está escrito, mas nem sempre é seguido": {
        opening: "O processo está escrito, mas nem sempre é seguido. O ciclo começa ajustando o que não se sustenta e pilotando sobre a versão corrigida.",
        state: "o processo está escrito, mas nem sempre é seguido",
        cycleTitle: "AJUSTAR E PILOTAR",
        pilotInFirstCycle: true,
        processWork: (area, operator) => [`Ajustar com ${operator} o que o processo escrito da área de ${area} promete e a rotina não sustenta.`],
        pilotWork: (area, team) => [`Pilotar sobre a versão corrigida, com ${team}, numa amostra pequena da área de ${area}.`],
        secondCycleLead: () => "Ampliar o piloto para o volume real da tarefa, mantendo o mesmo critério de revisão.",
        cyclesIntro: "Você respondeu que o processo está escrito, mas nem sempre é seguido. Os ciclos não servem para criar processo, servem para descobrir por que ele não se sustenta na rotina.",
    },
    "Está escrito, é seguido e acompanhado": {
        opening: "O processo está escrito, é seguido e acompanhado. O piloto pode começar já na primeira semana.",
        state: "o processo está escrito, é seguido e acompanhado",
        cycleTitle: "CONSOLIDAR E TRANSFERIR",
        pilotInFirstCycle: true,
        processWork: (area, operator) => [`Registrar com ${operator} o critério que a área de ${area} já segue, para poder auditá-lo depois.`],
        pilotWork: (area, team) => [`Executar o piloto já na primeira semana, com ${team}, numa amostra pequena da área de ${area}.`],
        secondCycleLead: () => "Transferir o padrão para uma segunda pessoa ou equipe, com material próprio.",
        cyclesIntro: "Você respondeu que o processo já está escrito e é seguido. Então os ciclos não servem para organizar, servem para consolidar e transferir.",
    },
};
/** A razão da pergunta 11 entra como oração, sem emendar duas frases por vírgula. */
const REASON_CLAUSE = {
    "Consome tempo demais da equipe": "porque consome tempo demais da equipe",
    "Gera retrabalho ou erro com frequência": "porque gera retrabalho ou erro com frequência",
    "Impacta diretamente matrícula ou receita": "porque impacta diretamente matrícula ou receita",
    "Afeta a experiência da família": "porque afeta a experiência da família",
    "Não temos visibilidade, faltam dados": "porque falta visibilidade e faltam dados para decidir",
    "Depende de uma única pessoa": "porque depende de uma única pessoa",
    "Envolve risco de conformidade ou de segurança": "porque envolve risco de conformidade ou de segurança",
    "Outro motivo": "por um motivo que você registrou como outro",
};
/** Rótulos curtos para citar o que a escola já tem sem estragar as siglas. */
const GOVERNANCE_SHORT = {
    "Política de uso de IA escrita e aprovada pela direção": "política de uso de IA",
    "Comitê de IA": "comitê de IA",
    "Lista de ferramentas aprovadas": "lista de ferramentas aprovadas",
    "Encarregado de dados (DPO) definido": "encarregado de dados (DPO)",
    "Cláusula de não-treinamento nos contratos com fornecedores": "cláusula de não-treinamento",
    "Posição escrita sobre o uso de IA pelos alunos": "posição sobre o uso pelos alunos",
};
const SIZE_PHRASE = {
    "Até 200 alunos": "até 200 alunos",
    "De 201 a 500 alunos": "201 a 500 alunos",
    "De 501 a 1.000 alunos": "501 a 1.000 alunos",
    "Mais de 1.000 alunos": "mais de 1.000 alunos",
    "Rede com mais de uma unidade": "uma rede de mais de uma unidade",
};
const TEAM = {
    "Só eu": "apenas você",
    "De 2 a 3": "um grupo de 2 a 3 pessoas",
    "De 4 a 8": "um grupo de 4 a 8 pessoas",
    "Mais de 8": "um grupo de mais de 8 pessoas",
};
const BASELINE_HOURS = {
    "Menos de 2 horas": "menos de 2 horas por semana",
    "De 2 a 5 horas": "de 2 a 5 horas por semana",
    "De 5 a 10 horas": "de 5 a 10 horas por semana",
    "Mais de 10 horas": "mais de 10 horas por semana",
};
/** Como a referência cita o obstáculo dentro da frase: "Você apontou o tempo da equipe." */
const OBSTACLE_LEAD = {
    "Tempo da equipe": "Você apontou o tempo da equipe.",
    "Resistência das pessoas": "Você apontou a resistência das pessoas.",
    "Falta de conhecimento técnico": "Você apontou a falta de conhecimento técnico.",
    Orçamento: "Você apontou o orçamento.",
    "Falta de dados organizados": "Você apontou a falta de dados organizados.",
    "Insegurança sobre o que pode ou não fazer": "Você apontou a insegurança sobre o que pode ou não fazer.",
    "Não vejo obstáculo evidente": "Você respondeu que não vê obstáculo evidente.",
};
/** Regra 8 · o obstáculo declarado vira seção própria, com duas contramedidas concretas. */
function obstaclePlan(label, ambienteContratado) {
    const plans = {
        "Tempo da equipe": {
            reading: "Tempo é o obstáculo mais honesto e o mais fatal. Ele não aparece como recusa, aparece como adiamento.",
            countermeasures: [
                { title: "Bloco fixo, não tempo sobrando", text: "Reserve um bloco curto e fixo na agenda, no mesmo dia da semana. Piloto que depende de sobra de agenda não acontece." },
                { title: "Menor teste útil", text: "Reduza o piloto à menor tarefa que ainda produza uma comparação honesta. Escopo grande é o que consome o tempo que você não tem." },
            ],
        },
        "Resistência das pessoas": {
            reading: "Resistência raramente é sobre tecnologia. É sobre não saber o que muda no próprio trabalho.",
            countermeasures: [
                { title: "Comece por quem já tem curiosidade", text: "Convide para desenhar o teste quem executa a tarefa e já demonstrou interesse. Quem ajuda a desenhar não precisa ser convencido depois." },
                { title: "Resultado antes do anúncio", text: "Mostre o antes e o depois de um caso real antes de anunciar mudança. Anúncio sem evidência gera defesa, não adesão." },
            ],
        },
        "Falta de conhecimento técnico": {
            reading: "Falta de repertório técnico atrasa o piloto de verdade, e o caminho mais curto não é curso: é roteiro curto, exemplo aprovado e alguém junto na primeira execução.",
            countermeasures: [
                { title: "Roteiro com exemplos", text: "Escreva um roteiro curto com dois exemplos aprovados e os critérios de revisão. Exemplo bom ensina mais rápido do que treinamento." },
                { title: "Primeira execução acompanhada", text: "Faça a primeira execução junto com o responsável pelo piloto, olhando a mesma tela." },
            ],
        },
        Orçamento: {
            reading: "Orçamento vira obstáculo quando a decisão de gastar vem antes da evidência de valor.",
            countermeasures: [
                ambienteContratado
                    ? { title: "Comece pelo que já está contratado", text: "Rode o piloto no ambiente que a escola já contratou e aprovou, sem nova compra." }
                    : { title: "Sem compra antes da evidência", text: "Rode o piloto no menor escopo possível, sem contratar nada, e só discuta investimento depois de ter a comparação na mão." },
                { title: "Defina o resultado mínimo antes", text: "Escreva qual resultado justificaria investir. Sem esse número escrito, qualquer proposta parece cara ou barata." },
            ],
        },
        "Falta de dados organizados": {
            reading: "Dado desorganizado compromete tanto o resultado quanto a comparação, então ele entra no plano como trabalho a fazer, não como detalhe.",
            countermeasures: [
                { title: "Amostra pequena e revisada", text: "Selecione uma amostra pequena e confira a qualidade dela antes de usar. Amostra ruim contamina a conclusão." },
                { title: "Padronize antes de acumular", text: "Padronize nomes, versões e responsáveis pelos arquivos do piloto antes de gerar volume novo." },
            ],
        },
        "Insegurança sobre o que pode ou não fazer": {
            reading: "A insegurança some quando existe um documento curto dizendo o que pode, o que não pode e quem decide a exceção.",
            countermeasures: [
                { title: "Escreva o permitido e o proibido", text: "Registre em uma página os usos permitidos, os proibidos e quem aprova exceções." },
                { title: "Valide antes do teste", text: "Confirme ambiente e informações com o responsável por dados antes da primeira execução." },
            ],
        },
        "Não vejo obstáculo evidente": {
            reading: "Não enxergar obstáculo é comum no início e é justamente quando o registro de riscos vale mais.",
            countermeasures: [
                { title: "Registre riscos antes de começar", text: "Anote riscos e dependências mesmo sem bloqueio aparente. O que não foi previsto aparece na segunda semana." },
                { title: "Revisão curta na primeira semana", text: "Marque uma revisão de quinze minutos após a primeira semana para capturar o obstáculo real." },
            ],
        },
    };
    return plans[label] ?? {
        reading: "O obstáculo declarado entra no plano como item com responsável, não como observação.",
        countermeasures: [
            { title: "Ação preventiva com dono", text: "Defina uma ação preventiva com responsável e prazo." },
            { title: "Revisão na primeira semana", text: "Revise o obstáculo após a primeira semana do piloto." },
        ],
    };
}
function indicatorInstruction(indicators) {
    const joined = indicators.length ? indicators.join(" e ").toLowerCase() : "o resultado escolhido";
    return `Registrar ${joined} com o mesmo critério antes e depois do piloto.`;
}
function isActionPlanForm(form) {
    return form.id === CANONICAL_FORM_ID || (form.questions.some((question) => question.id === "q28") && form.questions.length === 28);
}
function buildActionPlanReport(answers, now = new Date()) {
    const phaseTier = level(answers.q6) || 1;
    const profileTier = level(answers.q7) || 1;
    const phaseBase = PHASES[phaseTier] ?? PHASES[1];
    const profileInfo = PROFILES[profileTier] ?? PROFILES[1];
    const phase = clean(answers.q6, `Fase ${phaseTier}`);
    const profile = clean(answers.q7, `Perfil ${profileTier}`);
    const scores = record(answers.q8);
    const phaseScore = Number(scores.a ?? scores.blocoA ?? scores.A);
    const profileScore = Number(scores.b ?? scores.blocoB ?? scores.B);
    const phaseScoreValid = Number.isFinite(phaseScore) && phaseScore >= 14 && phaseScore <= 56 ? phaseScore : undefined;
    const profileScoreValid = Number.isFinite(profileScore) && profileScore >= 6 && profileScore <= 24 ? profileScore : undefined;
    /** Regra 3 · fase x perfil produz a leitura de abertura. */
    const gap = profileTier - phaseTier;
    const combinationTitle = "O que a combinação diz";
    const name = clean(answers.q1, "Participante");
    const firstName = name.split(" ")[0];
    const priorities = record(answers.q9);
    const nowAreas = Object.keys(priorities).filter((area) => priorities[area] === "Agora");
    const laterAreas = Object.keys(priorities).filter((area) => priorities[area] === "Depois");
    const excludedAreas = Object.keys(priorities).filter((area) => priorities[area] === "Deliberadamente não irei fazer agora");
    const area = clean(answers.q10, nowAreas[0] || "Área prioritária");
    // Regra 9: sem nenhuma área disponível, a leitura da fase não pode mandar atravessar a recusa.
    // A pergunta 10 só coleta a número um, então a ordem das outras não é ranking. As candidatas
    // são as que a pessoa marcou como Agora; sem elas, as adiadas. No máximo três, para não
    // transformar um plano de 90 dias numa lista de intenções.
    const outrasAgora = nowAreas.filter((item) => item !== area);
    const candidatas = outrasAgora.length ? outrasAgora : laterAreas;
    const proximasAreas = candidatas.slice(0, 3);
    const cortouCandidatas = candidatas.length > proximasAreas.length;
    const proximaArea = proximasAreas[0];
    const phaseInfo = !proximasAreas.length && phaseBase.alone ? { ...phaseBase, ...phaseBase.alone } : phaseBase;
    // A Regra 3 lê fase contra perfil. A maturidade da tarefa vem só da pergunta 13, então
    // nenhuma destas frases pode afirmar se o processo está escrito ou não.
    const combination = gap >= 2
        ? [
            `${firstName}, o seu repertório como líder está à frente da maturidade da instituição. Isso não é elogio nem crítica, é um dado de risco: a transformação tende a depender de você.`,
            "A pergunta que este plano responde não é o que testar. É como transferir o que você já sabe para uma estrutura que continue funcionando sem a sua presença.",
        ]
        : gap === 1
            ? [
                `${firstName}, o seu repertório está um passo à frente da maturidade da sua escola. Você já enxerga onde a IA gera valor, e a instituição ainda não acompanha esse ritmo. É uma combinação boa, porque a energia existe, e é uma combinação de risco, porque tudo tende a passar por você.`,
                `A pergunta que este plano responde não é por onde começar. É ${phaseInfo.ambition} antes que a prática dependa de uma pessoa só.`,
            ]
            : gap === -1
                ? [
                    `${firstName}, a sua escola está um passo à frente do repertório que você declarou. Ela já avançou mais do que o seu uso pessoal acompanha, e conduzir o que existe exige experiência de primeira mão.`,
                    `A pergunta que este plano responde não é o que criar. É ${phaseInfo.ambition} com você por dentro da prática, não só da decisão.`,
                ]
                : gap <= -2
                    ? [
                        `${firstName}, a sua escola já construiu mais do que o seu repertório atual alcança. Governar o que existe exige ter usado o suficiente para julgar.`,
                        "A pergunta que este plano responde não é o que criar. É o que você precisa praticar para conduzir com segurança o que a escola já opera.",
                    ]
                    : phaseTier <= 2
                        ? [
                            `${firstName}, a sua escola e você estão no mesmo ponto da jornada, e isso simplifica o plano: não há descompasso para compensar.`,
                            `A pergunta que este plano responde não é se vocês estão prontos. É ${phaseInfo.ambition} em uma frente só, com um recorte pequeno o bastante para caber em 90 dias.`,
                        ]
                        : [
                            `${firstName}, a sua escola e você estão no mesmo patamar. Quando fase e perfil coincidem, o plano deixa de ser sobre começar e passa a ser sobre não perder o que já foi construído.`,
                            `A pergunta que este plano responde não é por onde começar. É ${phaseInfo.ambition} neste ciclo, antes de abrir qualquer frente nova.`,
                        ];
    const indicators = list(answers.q23);
    const information = list(answers.q19);
    const aiTasks = list(answers.q17);
    const environment = clean(answers.q20, "Ambiente ainda não definido");
    /** Regra 5 · gatilho de segurança: dado sensível somado a ferramenta aberta trava o piloto. */
    const sensitive = information.some((item) => /identificáveis|colaboradores|financeiras|saúde|laudos|vulnerabilidade/i.test(item));
    // O gatilho é a ausência de contrato, não a palavra "aberta". Testar só por "Ferramenta aberta"
    // deixava quem respondeu "Ainda não sei" sem nenhum ponto de parada, ou seja, tratava o ambiente
    // desconhecido como mais seguro que a ferramenta aberta declarada. É o contrário: sem contrato
    // assinado não existe garantia escrita sobre onde o dado fica, e não saber onde roda é o caso em
    // que não há nem como verificar.
    const environmentUnknown = environment === "Ainda não sei" || environment === "Ambiente ainda não definido";
    const openEnvironment = !environment.startsWith("Ambiente contratado");
    const sensitiveItems = information.filter((item) => /identificáveis|colaboradores|financeiras|saúde|laudos|vulnerabilidade/i.test(item));
    // O alerta precisa falar do dado que a pessoa marcou. Anonimizar por nome e matrícula não
    // resolve informação financeira, e falar em aluno e família não cabe quando o dado é de
    // colaborador. A saúde não ganha saída de anonimização: ela sai do piloto.
    const temPessoal = sensitiveItems.some((item) => /identificáveis|colaboradores/i.test(item));
    const temFinanceiro = sensitiveItems.some((item) => /financeiras/i.test(item));
    const temSaude = sensitiveItems.some((item) => /saúde|laudos|vulnerabilidade/i.test(item));
    // A pergunta 19 é múltipla: ramificar por exclusão fazia a orientação financeira sumir quando
    // havia também dado de saúde. As orientações agora se somam, na ordem de severidade.
    // Lista plana de propósito: aninhar um `listar` dentro de outro gerava "dado de saúde, dado de
    // aluno e de família e dado de colaborador, e informação financeira", com um "e" solto no meio.
    const responsavelPartes = [
        ...(temSaude ? ["dado de saúde e de situação de vulnerabilidade"] : []),
        ...sensitiveItems
            .filter((item) => /identificáveis|colaboradores/i.test(item))
            .map((item) => (/identificáveis/i.test(item) ? "dado de aluno e de família" : "dado de colaborador")),
        ...(temFinanceiro ? ["informação financeira"] : []),
    ];
    const reduzirPartes = [
        ...(temSaude ? ["Tire o dado de saúde do piloto por completo: ele não entra em ferramenta sem contrato, nem anonimizado."] : []),
        ...(temPessoal ? ["Construa o piloto apenas com informação institucional, sem identificar pessoas."] : []),
        ...(temFinanceiro ? ["Trabalhe com totais e faixas, nunca com valor por pessoa ou por família."] : []),
    ];
    const anonimizarPartes = [
        ...(temPessoal ? ["O primeiro nome vira iniciais, e qualquer matrícula ou registro vira código."] : []),
        ...(temFinanceiro ? ["Agregue os valores por turma, segmento ou período, sem linha individual."] : []),
    ];
    // A saída de anonimização não pode contradizer a primeira saída, que tira a saúde do piloto
    // inclusive anonimizada. Se só há dado de saúde, a segunda saída deixa de ser anonimizar.
    const saidaAnonimizar = anonimizarPartes.length > 0
        ? `Anonimize na origem, se em algum momento precisar analisar histórico. ${anonimizarPartes.join(" ")}${temSaude ? " Isso vale para o restante da informação: o dado de saúde continua fora do piloto, mesmo anonimizado." : ""}`
        : "Adie a etapa que depende desse dado e comece pela frente que não toca nele, se o piloto tiver mais de uma etapa. O histórico de saúde só volta à mesa depois de contrato assinado e base legal definida pela escola.";
    const tipoDeDado = {
        responsavelPor: `por ${listar(responsavelPartes)}`,
        reduzir: reduzirPartes.join(" "),
        anonimizar: saidaAnonimizar,
    };
    const safetyAlert = sensitive && openEnvironment
        ? {
            // A referência trata isto como seção numerada do plano, logo depois da prioridade,
            // com um cabeçalho de bloqueio e três saídas ordenadas pela recomendação.
            sectionTitle: "Antes de começar, um ponto de parada",
            title: "Este piloto não deve começar do jeito que foi descrito",
            subtitle: `Você marcou ${listar(sensitiveItems).toLowerCase()}, e ${environmentUnknown ? "ainda não sabe onde o piloto vai rodar" : environment.toLowerCase()}`,
            reading: `${environmentUnknown ? "Dado sensível sem ambiente definido é risco em aberto, e definir o ambiente deixa de ser tarefa de organização para virar condição de partida." : "Essas duas respostas juntas criam um risco que não é aceitável, mesmo em teste."} Sem contrato assinado pela escola, não existe garantia escrita sobre onde o dado fica, por quanto tempo, quem acessa nem se o conteúdo será usado para treinar o modelo. E quem responde ${tipoDeDado.responsavelPor} é a instituição, não quem usou a ferramenta.`,
            exitsIntro: "Você tem três saídas, e todas mantêm o piloto de pé:",
            exits: [
                `Reduza o escopo. É a saída recomendada. ${tipoDeDado.reduzir}`,
                tipoDeDado.anonimizar,
                "Troque de ambiente e contrate uma licença corporativa com cláusula de não-treinamento, se quiser tratar caso individual. Isso custa dinheiro e tempo, e não é necessário para começar.",
            ],
        }
        : undefined;
    const measurementMissing = answers.q24 === "Não, preciso criar a medição";
    const environmentMissing = answers.q20 === "Ainda não sei" || Boolean(safetyAlert);
    const processInfo = PROCESS[answers.q13 ?? ""] ?? PROCESS["Existe processo, mas não está escrito"];
    const processMissing = answers.q13 === "Não existe processo definido, cada um faz de um jeito";
    const start = startDate(answers.q26, now);
    const responsibleMissing = !answers.q22 || answers.q22 === "Ainda não sei quem";
    const responsible = responsibleMissing
        ? "Ainda não definido"
        : answers.q22 === "Eu mesmo(a)"
            ? "Você mesmo(a)"
            : clean(answers.q22, "Responsável a definir");
    // "Professores" é cargo válido, "a" não é. O piso é de caracteres, não de palavras: o texto
    // insere esta resposta no meio da frase ("Mapear com a as etapas...") e uma letra solta a
    // deixa agramatical. Abaixo do piso, o termo genérico é preferível ao ruído.
    const operatorBruto = inline(answers.q15, "equipe responsável");
    const operator = operatorBruto.trim().length < 3 ? "equipe responsável" : operatorBruto;
    const frequency = inline(answers.q14, "frequência não informada").toLowerCase();
    const declaredHuman = inline(answers.q18, "");
    // "Nenhuma", vazio ou uma resposta que entrega a decisão à IA contrariam a proibição do
    // prompt: o plano não pode registrar isso como garantia de revisão humana.
    // A pergunta 18 pede quem continua decidindo. Em vez de tentar interpretar verbos e
    // negações, o teste é direto: a resposta precisa nomear uma pessoa ou equipe. Uma frase
    // que só descreve automatismo, sem gente, é pendência, porque o prompt proíbe endossar
    // decisão automatizada sobre pessoa, nota, retenção, contratação ou permanência.
    const atorHumano = /(?<!\p{L})(eu|nós|pessoa|pessoas|equipe|time|professor\p{L}*|coordena\p{L}*|dire[çc]\p{L}*|diretor\p{L}*|gestor\p{L}*|secretaria|mantenedor\p{L}*|respons[áa]vel|analista|assistente\p{L}*|supervisor\p{L}*|comit[êe]|conselho|humano\p{L}*|revisor\p{L}*)(?!\p{L})/iu;
    const automatismo = /(?<!\p{L})(ia|i\.a\.|intelig[êe]ncia artificial|algoritmo\p{L}*|modelo|sistema|rob[ôo]|bot|chatbot|automaticamente|automatizad\p{L}*|sozinh[oa]s?|sem revis[ãa]o|sem interven[çc][ãa]o)(?!\p{L})/iu;
    // Domínio que o prompt proíbe automatizar. Citar a pessoa que "apenas executa" o que a
    // máquina recomendou não torna a decisão humana, então aqui o ator humano não absolve.
    const dominioSensivel = /(?<!\p{L})(contrata\p{L}*|demiss\p{L}*|demite|demitir|notas?|reten[çc]\p{L}*|permanênc\p{L}*|reprova\p{L}*|desligamento|matrícula do aluno)(?!\p{L})/iu;
    const negaAutomatismo = /(?<!\p{L})(não|nao|nunca|jamais)\s+(?:\p{L}+\s+){0,2}(decide|decidir|define|definir|escolhe|escolher|atribui|atribuir|aprova|aprovar|determina|determinar)(?!\p{L})/iu;
    // Citar um humano não basta se quem decide é a máquina. O critério deixou de ser recortar a
    // frase em orações, que perdia o sujeito em "a plataforma organiza e escolhe": agora a busca é
    // pela sequência sujeito máquina seguido de verbo de decisão, sem que apareça no meio uma
    // negação do verbo nem outro ator humano assumindo a ação.
    const MAQUINA = "ia|i\\.a\\.|intelig[êe]ncia artificial|algoritmo\\p{L}*|modelo|sistema|rob[ôo]|bot|chatbot|ferramenta|software|plataforma|aplicativo|app|automa[çc][ãa]o|automatiza[çc][ãa]o";
    const HUMANO = "eu|nós|pessoa|pessoas|equipe|time|professor\\p{L}*|coordena\\p{L}*|dire[çc]\\p{L}*|diretor\\p{L}*|gestor\\p{L}*|secretaria|mantenedor\\p{L}*|respons[áa]vel|analista|assistente\\p{L}*|supervisor\\p{L}*|comit[êe]|conselho|humano\\p{L}*|revisor\\p{L}*";
    const DECISAO = "decide|decidir|escolhe|escolher|seleciona|selecionar|define|definir|determina|determinar|atribui|atribuir|classifica|classificar|aprova|aprovar|reprova|reprovar";
    // Parar no primeiro termo humano era errado: em "a IA consulta a equipe e decide", a equipe é
    // objeto, não sujeito. O humano só assume a decisão quando aparece imediatamente antes do
    // verbo, sem um "e" no meio, que indicaria predicado coordenado com o sujeito anterior.
    const maquinaDecideSemNegacao = (() => {
        const maquina = new RegExp(`(?<!\\p{L})(?:${MAQUINA})(?!\\p{L})`, "giu");
        const verbo = new RegExp(`(?<!\\p{L})(?:${DECISAO})(?!\\p{L})`, "giu");
        const humano = new RegExp(`(?<!\\p{L})(?:${HUMANO})(?!\\p{L})`, "giu");
        // "não apenas" e "não só" são aditivos, não negam a decisão que vem depois.
        const negacao = /(?<!\p{L})(não|nao|nunca|jamais)(?!\p{L})(?!\s+(?:apenas|só|somente)(?!\p{L}))/iu;
        // Enumerar o que pode aparecer entre o humano e o verbo foi um jogo perdido, nos dois
        // sentidos: conectivos escapavam e complementos legítimos como "responsável pela matrícula"
        // eram barrados. O que decide é a última palavra antes do verbo. Se for conjunção ou
        // preposição, o sujeito não é o humano; se for nome, adjetivo ou advérbio, é.
        // "antes", "depois" e "após" ficam de fora: sozinhos são advérbios do próprio verbo, e na
        // forma preposicional a última palavra passa a ser "de", que está na lista.
        const rompeOSujeito = /(?<!\p{L})(e|ou|mas|porém|porem|contudo|entretanto|todavia|para|por|ao|à|a|de|do|da|em|no|na|com|até|sem|sobre)(?!\p{L})\s*$/iu;
        const verboNoMeio = new RegExp(`(?<!\\p{L})(?:${DECISAO})(?!\\p{L})`, "iu");
        const humanoSujeito = (trecho) => trecho.length <= 40 && !rompeOSujeito.test(trecho) && !verboNoMeio.test(trecho);
        for (const encontro of declaredHuman.matchAll(maquina)) {
            const inicio = (encontro.index ?? 0) + encontro[0].length;
            const oracao = declaredHuman.slice(inicio).split(/[;.!?]/u)[0] ?? "";
            // Todos os verbos de decisão da oração, não só o primeiro: negar o primeiro não absolve
            // os seguintes, como em "a IA não decide o formato, mas escolhe quem recebe bolsa".
            for (const acao of oracao.matchAll(verbo)) {
                if (acao.index === undefined)
                    continue;
                const meio = oracao.slice(0, acao.index);
                const desdeOVerboAnterior = meio.split(/(?<!\p{L})(?:mas|porém|porem|contudo|entretanto|todavia)(?!\p{L})/iu).at(-1) ?? meio;
                if (negacao.test(desdeOVerboAnterior))
                    continue;
                const humanos = [...meio.matchAll(humano)];
                const ultimo = humanos.at(-1);
                const depoisDoHumano = ultimo ? meio.slice((ultimo.index ?? 0) + ultimo[0].length) : "";
                if (ultimo && humanoSujeito(depoisDoHumano))
                    continue;
                return true;
            }
        }
        return false;
    })();
    const humanDecisionMissing = !declaredHuman
        // Uma decisão humana declarada precisa dizer o que é decidido e por quem. "a" passava, e o
        // plano garantia revisão humana em cima de uma letra. Duas palavras e doze caracteres é o
        // piso: aceita "Coordenação aprova" e recusa resposta de preenchimento.
        || declaredHuman.trim().split(/\s+/u).length < 2
        || declaredHuman.trim().length < 12
        || /^(nenhum[ao]?s?|ningu[ée]m|nada|n\/a|nao|não)(?!\p{L})/iu.test(declaredHuman)
        || (automatismo.test(declaredHuman) && !atorHumano.test(declaredHuman))
        || (automatismo.test(declaredHuman) && dominioSensivel.test(declaredHuman) && !negaAutomatismo.test(declaredHuman))
        || maquinaDecideSemNegacao;
    const humanDecision = humanDecisionMissing
        ? "Ainda não definido. Antes do piloto, escreva qual decisão continua sendo de uma pessoa; sem isso o piloto não começa."
        : lowerFirst(declaredHuman);
    const hours = BASELINE_HOURS[answers.q16 ?? ""];
    /** Regra 7 · sem linha de base, medir é a primeira ação dos 7 dias. Regra 5 vem antes dela. */
    // Cada bloqueio vira uma ação própria: reduzir os dois a um liberava o piloto com a decisão
    // humana ainda indefinida.
    const bloqueiosPossiveis = [
        { ativo: environmentMissing, acao: "Definir e aprovar o ambiente seguro e quais informações podem ser usadas.", resumo: "onde o piloto roda" },
        { ativo: humanDecisionMissing, acao: "Escrever qual decisão continua sendo de uma pessoa nessa tarefa, e quem a assina.", resumo: "quem decide" },
        { ativo: responsibleMissing, acao: "Nomear quem responde pela implantação, com nome e prazo, antes de qualquer teste.", resumo: "quem responde pela implantação" },
    ].filter((item) => item.ativo);
    const bloqueios = bloqueiosPossiveis.map((item) => item.acao);
    // Os textos precisam concordar com quantos bloqueios existem de fato, e nomear quais são.
    const quantosBloqueios = bloqueios.length === 1 ? "o bloqueio" : bloqueios.length === 2 ? "os dois bloqueios" : "os três bloqueios";
    const bloqueiosResolvidos = bloqueios.length === 1 ? "resolvido o bloqueio" : bloqueios.length === 2 ? "resolvidos os dois bloqueios" : "resolvidos os três bloqueios";
    const firstAction = bloqueios.length > 0
        ? bloqueios[0]
        : measurementMissing
            ? `Criar a linha de base para ${indicators.join(" e ").toLowerCase() || "o indicador escolhido"}.`
            : processMissing
                ? `Descrever com ${lowerFirst(operator)} como a tarefa é feita hoje, do início ao fim.`
                : `Registrar a linha de base e preparar uma amostra pequena da área de ${area}.`;
    const firstActionRationale = bloqueios.length > 1
        ? `São ${bloqueios.length === 2 ? "dois" : "três"} bloqueios, e ${bloqueios.length === 2 ? "os dois precedem" : "todos precedem"} qualquer teste: ${listar(bloqueiosPossiveis.map((item) => item.resumo))}. Resolvidos, o resto do plano segue como está escrito.`
        : responsibleMissing && !humanDecisionMissing && !environmentMissing
            ? "Um piloto sem dono não anda. Nomeie a pessoa e o prazo antes de qualquer teste, mesmo que seja você."
            : humanDecisionMissing
                ? "Enquanto não estiver escrito quem decide, o piloto não tem freio. Uma frase basta, desde que diga o que a pessoa decide e quem assina."
                : environmentMissing
                    ? "Sem ambiente aprovado e sem regra de dados escrita, qualquer teste vira risco institucional. Uma reunião curta com quem responde por dados resolve, e o resto do plano só faz sentido depois dela."
                    : measurementMissing
                        ? "Sem sofisticação: registre por cinco dias, do jeito mais simples que funcionar. Esse número é o que vai dar sentido à comparação de 90 dias; sem ele, qualquer resultado vira opinião."
                        : processMissing
                            ? "Sente com quem executa e descreva a tarefa como ela acontece de verdade, com exceções e retrabalho. O que aparece nessa conversa costuma ser o próprio plano."
                            : "Comece pequeno e comparável. Uma amostra pequena, com a linha de base registrada, mostra em semanas o que uma implantação grande levaria meses para revelar.";
    const teamPhrase = TEAM[answers.q25 ?? ""] ?? "um grupo pequeno";
    // A mesma expressão entra no meio de frase, em minúscula, e sozinha num campo, capitalizada.
    const participants = `${teamPhrase.charAt(0).toUpperCase()}${teamPhrase.slice(1)}`;
    /** Regra 10 · o porte calibra a escala da governança. */
    const size = clean(answers.q5, "Porte não informado");
    const network = size === "Rede com mais de uma unidade";
    const small = size === "Até 200 alunos" || size === "De 201 a 500 alunos";
    const sizePhrase = SIZE_PHRASE[size] ?? "o porte informado";
    const sizeNote = network
        ? "Sobre a governança: em rede, o risco não é a unidade que testa, é a unidade que copia sem o mesmo critério. Padronize acesso, revisão e medição entre unidades antes de ampliar."
        : small
            ? `Sobre o comitê: numa escola de ${sizePhrase}, comitê não governa, atrasa. Um responsável e um suplente sustentam este ciclo.`
            // Recomendar a criação de um comitê a quem marcou na 21 que já tem comitê fazia o plano
            // mandar montar exatamente o que a escola declarou existir. Com comitê, a orientação muda
            // de formar para fazer funcionar.
            : list(answers.q21).includes("Comitê de IA")
                ? `Sobre o comitê: você marcou que a escola já tem comitê de IA. Numa escola de ${sizePhrase}, o que decide não é existir, é a cadência. Garanta três a quatro pessoas de áreas distintas, mandato de um ano e uma reunião com pauta e registro por ciclo deste plano.`
                : `Sobre o comitê: numa escola de ${sizePhrase}, um responsável só não sustenta. Um comitê pequeno, de três a quatro pessoas com áreas distintas e mandato de um ano, é o formato que funciona no seu porte.`;
    /** Regra 6 · cada item não marcado na 21 vira uma linha com prazo. */
    const governanceAvailable = list(answers.q21);
    const none = governanceAvailable.includes("Nenhum dos anteriores");
    const missing = (item) => none || !governanceAvailable.includes(item);
    // Escola mais madura tem cadência mais curta: a Regra 6 manda variar o prazo pela fase.
    const cadence = phaseTier >= 3 ? { early: 15, late: 30, urgent: 7 } : { early: 30, late: 60, urgent: 15 };
    const earlyDeadline = `Até ${formatShortDate(dateAfter(start, cadence.early))}`;
    const lateDeadline = `Até ${formatShortDate(dateAfter(start, cadence.late))}`;
    const beforePilot = `Até ${formatShortDate(dateAfter(start, cadence.urgent))}`;
    const nextCycle = "Próximo ciclo";
    const governance = [];
    if (missing("Política de uso de IA escrita e aprovada pela direção")) {
        governance.push({
            item: none ? "Política de uso de IA em uma página, primeira entrega dos 30 dias" : "Política curta de uso de IA, com usos permitidos e proibidos",
            deadline: none ? beforePilot : earlyDeadline,
            note: none ? "Use o Mini-guia, página 11, como base. Uma página aprovada vale mais do que um documento longo em revisão." : undefined,
        });
    }
    if (missing("Comitê de IA")) {
        governance.push({
            item: small ? "Um responsável e um suplente pelo acompanhamento do piloto" : network ? "Grupo de governança com uma pessoa por unidade participante" : "Comitê pequeno de IA, de três a quatro pessoas com áreas distintas",
            deadline: lateDeadline,
        });
    }
    if (missing("Lista de ferramentas aprovadas")) {
        governance.push({
            item: "Lista de ambientes aprovados para o piloto, separando os abertos dos contratados e o que cada um pode receber",
            deadline: beforePilot,
            note: "Sem essa lista, cada pessoa escolhe onde rodar, e é assim que dado sai por engano.",
        });
    }
    if (missing("Encarregado de dados (DPO) definido")) {
        governance.push({
            item: "Responsável por dúvidas de dados e privacidade, conhecido por quem participa do piloto",
            deadline: earlyDeadline,
            note: "Uma pessoa nomeada e conhecida por quem participa do piloto basta para começar.",
        });
    }
    if (missing("Cláusula de não-treinamento nos contratos com fornecedores")) {
        governance.push({
            item: "Cláusula de não-treinamento nos contratos, a partir da próxima renovação de qualquer fornecedor de software",
            deadline: lateDeadline,
        });
    }
    if (missing("Posição escrita sobre o uso de IA pelos alunos")) {
        governance.push({
            item: "Posição escrita sobre o uso de IA pelos alunos, por segmento",
            deadline: nextCycle,
            note: "Não é urgente para este piloto, mas será cobrada pelas famílias antes do que se imagina.",
        });
    }
    governance.push({
        item: "Rotina de revisão anual da política, com data no calendário institucional",
        deadline: `Até ${formatShortDate(dateAfter(start, 90))}`,
        note: "Política sem data de revisão envelhece sem que ninguém perceba.",
    });
    // Prazo fora de ordem faz a seção parecer lista solta. "Próximo ciclo" não tem data e fecha.
    const ordemDoPrazo = (deadline) => {
        const data = deadline.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        return data ? Number(`${data[3]}${data[2]}${data[1]}`) : Number.MAX_SAFE_INTEGER;
    };
    // A introdução diz que a rotina de revisão fecha a seção, então ela fica por último de fato,
    // depois até dos itens sem data. O resto sai em ordem cronológica.
    const revisaoAnual = governance.pop();
    governance.sort((a, b) => ordemDoPrazo(a.deadline) - ordemDoPrazo(b.deadline));
    if (revisaoAnual)
        governance.push(revisaoAnual);
    const existing = governanceAvailable.filter((item) => item !== "Nenhum dos anteriores");
    const pending = governance.length - 1;
    const governanceIntro = none || existing.length === 0
        ? `Você marcou que a escola ainda não tem nenhum dos itens da lista. Faltam ${pending} itens, com prazo abaixo, mais a rotina de revisão que fecha a seção. Os três primeiros são os que mais rápido evitam problema, não burocracia.`
        : pending === 0
            ? `Você marcou que a escola já tem ${listar(existing.map((item) => GOVERNANCE_SHORT[item] ?? item))}. Nada da lista está faltando. Resta apenas manter isso vivo, com a rotina de revisão abaixo.`
            : `Você marcou que a escola já tem ${listar(existing.map((item) => GOVERNANCE_SHORT[item] ?? item))}. ${pending === 1 ? "Falta um item da lista, com o prazo abaixo, mais a rotina de revisão que fecha a seção." : `Faltam ${pending} itens da lista, com prazo abaixo, mais a rotina de revisão que fecha a seção.`}`;
    const cycleTitles = CYCLE_TITLES[phaseTier] ?? CYCLE_TITLES[1];
    const equipePiloto = TEAM[answers.q25 ?? ""] ?? "um grupo pequeno";
    // Ambiente por aprovar, gatilho de segurança disparado ou decisão humana não declarada são
    // bloqueios: o piloto não pode ser agendado para o primeiro ciclo enquanto existirem.
    // Qualquer bloqueio da lista adia o piloto: ambiente, decisão humana ou responsável sem nome.
    const pilotoBloqueado = bloqueios.length > 0;
    const pilotaNoPrimeiroCiclo = processInfo.pilotInFirstCycle && !pilotoBloqueado;
    const primeiroCicloBruto = [
        // A primeira ação abre o ciclo de 0 a 30 dias de propósito: quando há bloqueio, é ele que
        // precisa constar dos 90 dias, e a suíte cobre isso. A repetição com a seção acima é
        // deliberada, não defeito de geração.
        firstAction,
        ...bloqueios.slice(1),
        // Regra 7: quem precisa criar a medição recebe essa ação mesmo quando um bloqueio ocupou
        // o lugar da primeira ação. Antes ela simplesmente desaparecia dos 90 dias.
        ...(measurementMissing && bloqueios.length > 0
            ? [`Criar a linha de base para ${indicators.join(" e ").toLowerCase() || "o indicador escolhido"}, antes de qualquer teste.`]
            : []),
        ...processInfo.processWork(area, lowerFirst(operator)),
        // A ação de desenvolvimento do líder pode declarar-se anterior ao piloto, então ela vem antes.
        ...(pilotaNoPrimeiroCiclo ? [profileInfo.development] : []),
        ...(pilotaNoPrimeiroCiclo ? processInfo.pilotWork(area, equipePiloto) : []),
        answers.q16 === "Não sei estimar"
            ? `${indicatorInstruction(indicators).replace(/\.$/u, "")}, e medir por uma semana quanto tempo a rotina de ${area} consome hoje.`
            : indicatorInstruction(indicators),
    ];
    const segundoCicloBruto = [
        ...(pilotaNoPrimeiroCiclo ? [] : [profileInfo.development]),
        pilotaNoPrimeiroCiclo
            ? processInfo.secondCycleLead(equipePiloto)
            : pilotoBloqueado
                ? `Somente depois de ${bloqueiosResolvidos} do primeiro ciclo, executar o piloto com ${equipePiloto}, numa amostra pequena.`
                : processInfo.secondCycleLead(equipePiloto),
        humanDecisionMissing
            ? "Submeter cada resultado à revisão da pessoa definida como responsável pela decisão, registrando o que precisou mudar."
            : `Submeter cada resultado à revisão humana que você declarou: ${lowerFirst(declaredHuman.replace(/\.$/u, ""))}.`,
        "Registrar erros, retrabalho, exceções e ajustes necessários.",
        "Comparar o indicador com a linha de base usando o mesmo critério.",
    ];
    // Com dois ou mais bloqueios, o piloto só começa no segundo ciclo, e prometer levar o método a
    // outra área até o dia 90 seria over-promise. A orientação vira restrição da consolidação, e não
    // uma ação a mais: era esse item extra que empurrava o terceiro ciclo para seis ações.
    const semFrenteNova = bloqueios.length >= 2;
    const terceiroCicloBruto = [
        semFrenteNova
            ? `Consolidar o que funcionou, o que falhou e o que deve ser interrompido, sem abrir frente nova: com ${bloqueios.length === 2 ? "dois bloqueios" : "três bloqueios"} resolvidos só no primeiro ciclo, os 90 dias servem para deixar esta área firme. A expansão entra no plano seguinte, e ${proximasAreas.length > 1 ? `a área natural para isso é uma entre ${listar(proximasAreas)}` : proximaArea ? `a área natural para isso é ${proximaArea}` : "sem outra área disponível, o método vira padrão da própria área"}.`
            : "Consolidar o que funcionou, o que falhou e o que deve ser interrompido.",
        // Regra 9: sem área disponível, nem a consolidação pode apontar para outra área.
        !proximaArea && /outra área/i.test(phaseInfo.consolidation)
            ? "Cruzar o indicador do piloto com um segundo indicador da própria área e registrar o que a combinação antecipa."
            : phaseInfo.consolidation,
        "Revisar acessos, informações usadas e decisões que continuam humanas.",
        ...(semFrenteNova ? [] : [proximasAreas.length > 1
                ? phaseInfo.expansionTo(`uma entre ${listar(proximasAreas)}${cortouCandidatas ? ", ou outra que você tenha marcado" : ""}`)
                : proximaArea
                    ? phaseInfo.expansionTo(proximaArea)
                    : "Só então decidir se este método vira padrão da própria área, sem abrir frente nova, já que as demais foram recusadas por decisão sua."]),
    ];
    // A Parte 3 limita cada ciclo a cinco ações. O excedente desce em cascata, sem sumir do plano;
    // o último ciclo é o único que pode ficar mais cheio, e a suíte verifica esse limite.
    const LIMITE_POR_CICLO = 5;
    const primeiroCiclo = primeiroCicloBruto.slice(0, LIMITE_POR_CICLO);
    const segundoCiclo = [...primeiroCicloBruto.slice(LIMITE_POR_CICLO), ...segundoCicloBruto].slice(0, LIMITE_POR_CICLO);
    // O terceiro ciclo não corta: cortar aqui apagava em silêncio a ação que nomeia a próxima
    // área, prometida em outra seção do documento. Se sobrar excedente, ele aparece aqui.
    const terceiroCiclo = [
        ...[...primeiroCicloBruto.slice(LIMITE_POR_CICLO), ...segundoCicloBruto].slice(LIMITE_POR_CICLO),
        ...terceiroCicloBruto,
    ];
    const cycles = [
        { label: "0 a 30 dias", title: processInfo.cycleTitle, deadline: `até ${formatShortDate(dateAfter(start, 30))}`, actions: primeiroCiclo },
        { label: "31 a 60 dias", title: cycleTitles.second, deadline: `até ${formatShortDate(dateAfter(start, 60))}`, actions: segundoCiclo },
        { label: "61 a 90 dias", title: cycleTitles.third, deadline: `até ${formatShortDate(dateAfter(start, 90))}`, actions: terceiroCiclo },
    ];
    /** Regra 9 · a recusa deliberada também informa. */
    const focusNote = excludedAreas.length >= 5
        ? "Você deixou cinco ou mais áreas fora deste ciclo. Foco assim é raro e é o que protege o plano; o documento não sugere nada para elas."
        : excludedAreas.length === 0
            ? "Você não descartou nenhuma área. Vale responder por que nada foi descartado: plano sem recorte não sobrevive a 90 dias."
            : "As áreas recusadas são decisão sua e o plano não sugere nada para elas neste ciclo.";
    const reasonClause = REASON_CLAUSE[answers.q11 ?? ""] ?? "por um motivo que você registrou como outro";
    // A referência escreve o número por extenso e nomeia as áreas escolhidas.
    const chosenAreas = nowAreas.length === 0
        ? "Você não marcou nenhuma área como Agora"
        : nowAreas.length === 1
            ? `Você marcou uma única área como Agora, ${nowAreas[0]},`
            : `Você marcou ${spell(nowAreas.length)} áreas como Agora, ${listar(nowAreas)},`;
    const solidity = nowAreas.length === 0
        ? "Esta escolha ainda não se sustenta: você não marcou nenhuma área como Agora. Antes de executar o plano, volte à matriz e confirme a prioridade número um."
        : `Por que essa escolha se sustenta: ${lowerFirst(chosenAreas)} e elegeu ${area} como número um, ${reasonClause}. O plano inteiro se organiza em torno dela.`;
    const plan = {
        participant: {
            name, school: clean(answers.q2, "Escola"), role: clean(answers.q4, "Função não informada"),
            size, phase, profile,
            workshopDate: WORKSHOP_DATE,
            generatedAt: `Plano gerado em ${formatShortDate(now)}`,
        },
        phaseCard: {
            label: "A sua escola · Bloco A",
            title: phaseInfo.title,
            detail: phaseScoreValid ? `Fase ${phaseTier} · ${phaseScoreValid} de 56 pontos` : `Fase ${phaseTier}`,
            reading: phaseInfo.reading,
            edge: scoreNote(phaseScoreValid, PHASE_BANDS, phaseTier, "do diagnóstico da escola"),
        },
        profileCard: {
            label: "Você como líder · Bloco B",
            title: profileInfo.title,
            detail: profileScoreValid ? `Perfil ${profileTier} · ${profileScoreValid} de 24 pontos` : `Perfil ${profileTier}`,
            reading: profileInfo.reading,
            edge: scoreNote(profileScoreValid, PROFILE_BANDS, profileTier, "do perfil de liderança"),
        },
        combinationTitle,
        combination,
        opening: combination[0],
        workshopInsight: answers.q28?.trim() || undefined,
        priority: {
            area, reason: clean(answers.q11, "Motivo não informado"), problem: clean(answers.q12, "Problema não informado"),
            now: nowAreas, otherNow: nowAreas.filter((item) => item !== area), later: laterAreas, excluded: excludedAreas,
            focusNote, solidity,
        },
        pilot: {
            summary: `${aiTasks.length ? `A IA vai ${listar(aiTasks).toLowerCase()}` : "A IA vai apoiar"} na área de ${area}, que acontece ${frequency}. O piloto roda com ${teamPhrase}${responsibleMissing ? " e ainda precisa de alguém nomeado para conduzir" : ` e a condução é de ${lowerFirst(responsible)}`}.${humanDecisionMissing ? " Falta declarar qual decisão continua humana, e isso precede o teste." : ` A revisão humana é exatamente a que você declarou nesta seção, e ela não muda ao longo dos 90 dias.`}`,
            aiTasks, humanDecision, humanDecisionMissing, information, environment, reviewer: responsible,
            safetyAlert,
            maturityNote: pilotoBloqueado
                ? `${capitalizar(processInfo.state)}. ${`Mesmo assim, o piloto não começa antes de resolver ${quantosBloqueios} que este plano aponta, e ${bloqueios.length > 1 ? "eles entram" : "ele entra"} no primeiro ciclo.`}`
                : processInfo.opening,
            conductor: responsible,
            operator,
            frequencyNote: `A tarefa acontece ${frequency} e é executada hoje por ${lowerFirst(operator)}.`,
        },
        measurement: {
            indicators,
            baseline: measurementMissing ? "Criar a medição antes do primeiro teste." : answers.q24 === "Consigo estimar" ? "Registrar a estimativa e o critério usado antes do primeiro teste." : "Registrar o número existente e sua fonte antes do primeiro teste.",
            comparison: "Comparar antes e depois com a mesma amostra e o mesmo critério, sem prometer resultado antecipado.",
            // O tempo declarado na pergunta 16 só é "o número a reencontrar" quando tempo é de fato um
            // dos indicadores escolhidos na 23. Fora disso ele é ponto de partida, e mandar reencontrá-lo
            // contradizia o indicador que a própria pessoa marcou.
            effort: hours
                ? measurementMissing
                    ? `Hoje a tarefa consome ${hours}, somando a equipe. É o único número que este plano tem por enquanto, e ele não substitui a linha de base: registre-o como ponto de partida enquanto cria a medição.`
                    : indicators.some((item) => /tempo/i.test(item))
                        ? `Hoje a tarefa consome ${hours}, somando a equipe. Esse é o número que a comparação de 90 dias precisa reencontrar.`
                        : `Hoje a tarefa consome ${hours}, somando a equipe. Esse número não é o seu indicador, e serve de contexto: registre-o junto do que você escolheu medir, para saber a que custo o resultado veio.`
                : "Você não soube estimar o tempo consumido hoje, então medir vem antes de comparar.",
        },
        // O prazo conta 7 dias a partir do início que a pessoa escolheu na pergunta 26, não da data
        // em que o plano foi gerado. Sem dizer isso, o rótulo "em 7 dias" e uma data a um mês de
        // distância se contradiziam dentro do mesmo bloco.
        firstAction: {
            action: firstAction,
            rationale: firstActionRationale,
            responsible,
            date: formatDate(dateAfter(start, 7)),
            participants,
            startNote: formatShortDate(start) === formatShortDate(now)
                ? undefined
                : `Você respondeu que começa ${(answers.q26 ?? "").toLowerCase()}, então os 7 dias contam a partir de ${formatShortDate(start)}.`,
        },
        cyclesIntro: pilotoBloqueado
            ? `Você respondeu que ${processInfo.state}. Ainda assim, o primeiro ciclo é de destravar: o piloto só entra depois que ${bloqueios.length > 1 ? "os bloqueios listados neste plano estiverem resolvidos" : "o bloqueio listado neste plano estiver resolvido"}.`
            : processInfo.cyclesIntro,
        governanceIntro,
        cycles, governance,
        leaderNote: profileInfo.note,
        sizeNote,
        obstacle: {
            label: clean(answers.q27, "Obstáculo não informado"),
            lead: OBSTACLE_LEAD[answers.q27 ?? ""] ?? "Você apontou o obstáculo que previu para este ciclo.",
            ...obstaclePlan(clean(answers.q27, ""), answers.q20 === "Ambiente contratado pela escola, com contrato assinado"),
        },
        reviewDate: formatDate(dateAfter(start, 90)),
        reviewDateShort: formatShortDate(dateAfter(start, 90)),
        progressSignal: `O mesmo resultado sai com o mesmo critério, sem ninguém precisar perguntar como se faz, e você consegue comparar ${indicators.join(" e ").toLowerCase() || "o indicador escolhido"} com a linha de base.`,
        closing: CLOSING,
        closingDisplay: CLOSING_DISPLAY,
    };
    return {
        title: `Plano de ação de ${plan.participant.name}`,
        executiveSummary: plan.opening,
        signals: [
            { label: "Prioridade", value: area, tone: "attention" },
            { label: "Fase da escola", value: phase, tone: "neutral" },
            { label: "Perfil de liderança", value: profile, tone: "positive" },
        ],
        // A Regra 9 tem três notas de foco: só a de reconhecimento é força. As outras duas são
        // advertência, e listá-las como ponto forte inverte o sentido do que o plano diz.
        strengths: [
            ...(plan.priority.focusNote.includes("Foco assim é raro") ? [plan.priority.focusNote] : []),
            ...(humanDecisionMissing ? [] : ["Reafirmar por escrito, no registro do ciclo, qual decisão continua sendo de uma pessoa."]),
            `A prioridade está declarada: ${area}.`,
        ],
        opportunities: [plan.priority.problem, plan.measurement.baseline],
        actions: cycles.map((cycle, index) => ({ title: cycle.label, detail: cycle.actions.join(" "), priority: index === 0 ? "Agora" : index === 1 ? "Próximos 30 dias" : "Acompanhar" })),
        closing: CLOSING,
        engine: "resilient",
        actionPlan: plan,
    };
}


// A página carrega scripts clássicos, sem bundler: o motor se expõe num global.
window.IASchoolsPlano = { buildActionPlanReport, isActionPlanForm };
