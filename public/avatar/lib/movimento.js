/**
 * A física do movimento dela.
 *
 * Funções puras, sem DOM e sem canvas, para que o comportamento seja testável
 * sem navegador. Quem desenha é `public/avatar.js`; quem decide o quanto e para
 * onde é este arquivo.
 */

/**
 * Oscilação suave e sem repetição perceptível, somando senos de períodos que
 * não são múltiplos entre si. Um seno só denuncia o laço em poucos segundos, e
 * corpo que repete o mesmo balanço parece um boneco de vitrine.
 */
export function oscilacao(tempoMs, periodoMs) {
  const t = tempoMs / periodoMs;
  return Math.sin(t * Math.PI * 2) * 0.65 + Math.sin(t * Math.PI * 2 * 0.37 + 1.1) * 0.35;
}

/** Aproximação com desaceleração: rápido no início, assentando no fim. */
export function aproximar(atual, alvo, fator = 0.12) {
  return atual + (alvo - atual) * fator;
}

/**
 * Deslocamento de peso de uma perna para a outra.
 *
 * É o movimento que mais convence numa pessoa em pé: ninguém fica parado com o
 * peso dividido. O ciclo é longo de propósito — trocar de apoio a cada segundo
 * pareceria impaciência.
 */
export function deslocamentoDePeso(tempoMs) {
  return oscilacao(tempoMs, 11_000);
}

/** Respiração: sobe e desce o tronco. Ciclo humano em repouso. */
export function respiracao(tempoMs) {
  return Math.sin((tempoMs / 3_800) * Math.PI * 2);
}

export const ESTADOS = Object.freeze([
  "parada",
  "ouvindo",
  "pensando",
  "falando",
  "executando",
  "sucesso",
  "erro",
]);

/**
 * Sequência corporal usada somente enquanto a personagem fala.
 *
 * Cada pose permanece tempo suficiente para ser lida como intenção, não como
 * um quadro piscando. Há um único repouso curto ao começar a fala; depois ela
 * alterna explicação e ênfase em durações irregulares. O fim e o começo do
 * ciclo usam a mesma pose, então não há uma troca artificial na emenda.
 */
const INTRO_GESTOS_DA_FALA_MS = 360;
const CICLO_GESTOS_DA_FALA = Object.freeze([
  Object.freeze({ gesto: "explicacao", duracaoMs: 2_150 }),
  Object.freeze({ gesto: "enfase", duracaoMs: 1_200 }),
  Object.freeze({ gesto: "explicacao", duracaoMs: 2_750 }),
  Object.freeze({ gesto: "enfase", duracaoMs: 1_050 }),
  Object.freeze({ gesto: "explicacao", duracaoMs: 1_900 }),
  Object.freeze({ gesto: "enfase", duracaoMs: 1_450 }),
  Object.freeze({ gesto: "explicacao", duracaoMs: 2_400 }),
]);

const DURACAO_CICLO_GESTOS_DA_FALA = CICLO_GESTOS_DA_FALA.reduce(
  (total, trecho) => total + trecho.duracaoMs,
  0,
);

export function gestoCorporalDaFala(decorridoMs) {
  const tempoSeguro = Number.isFinite(decorridoMs) ? Math.max(0, decorridoMs) : 0;
  if (tempoSeguro < INTRO_GESTOS_DA_FALA_MS) return "repouso";
  let cursor = (tempoSeguro - INTRO_GESTOS_DA_FALA_MS) % DURACAO_CICLO_GESTOS_DA_FALA;
  for (const trecho of CICLO_GESTOS_DA_FALA) {
    if (cursor < trecho.duracaoMs) return trecho.gesto;
    cursor -= trecho.duracaoMs;
  }
  return "explicacao";
}

function interpolarChaves(progresso, chaves) {
  const p = limitar(numeroOu(progresso, 0), 0, 1);
  for (let i = 1; i < chaves.length; i += 1) {
    const anterior = chaves[i - 1];
    const seguinte = chaves[i];
    if (p > seguinte[0]) continue;
    const intervalo = seguinte[0] - anterior[0];
    const local = intervalo > 0 ? (p - anterior[0]) / intervalo : 1;
    const suave = local * local * (3 - 2 * local);
    return anterior[1] + (seguinte[1] - anterior[1]) * suave;
  }
  return chaves.at(-1)[1];
}

/**
 * Coreografia curta para esconder a troca inevitável entre PNGs completos.
 *
 * O desenho atual não tem braços separados. Portanto, em vez de fingir uma
 * articulação que abriria buracos no ombro, fazemos a dinâmica clássica de um
 * gesto: pequena antecipação, golpe rápido, overshoot e acomodação. No quadro
 * do corte há movimento e blur máximos, mas continua existindo somente uma
 * personagem — nunca dois pares de braços sobrepostos.
 */
export function atuacaoDaTransicaoCorporal(progresso, direcao = 1) {
  const p = limitar(numeroOu(progresso, 0), 0, 1);
  const sinal = direcao < 0 ? -1 : 1;
  const deslocamento = interpolarChaves(p, [
    [0, 0],
    [0.18, -0.18],
    [0.46, 1],
    [0.66, 0.18],
    [0.82, -0.07],
    [1, 0],
  ]);
  const elevacao = interpolarChaves(p, [
    [0, 0],
    [0.18, 0.10],
    [0.46, -0.34],
    [0.68, 0.08],
    [1, 0],
  ]);
  const torcao = interpolarChaves(p, [
    [0, 0],
    [0.18, -0.26],
    [0.46, 1],
    [0.68, -0.18],
    [1, 0],
  ]);
  const impacto = p <= 0 || p >= 1
    ? 0
    : Math.pow(Math.max(0, Math.sin(Math.PI * p)), 6);
  return {
    progresso: p,
    ativa: p > 0 && p < 1,
    mostrarDestino: p >= 0.46,
    deslocamentoX: sinal * deslocamento,
    deslocamentoY: elevacao,
    rotacao: sinal * torcao,
    impacto,
  };
}

/**
 * Direção de atuação por intenção.
 *
 * Os valores são deliberadamente pequenos: a arte é bidimensional e não tem
 * um rig facial. Aqui, profissional significa comunicar estado com
 * microexpressões coordenadas, sem tentar simular uma cabeça 3D nem deformar a
 * identidade da personagem.
 */
const PERFIS = Object.freeze({
  parada: Object.freeze({
    inclinacao: 0, sobrancelha: 0, assimetriaSobrancelha: 0,
    energia: 0.34, aproximar: 0, alcanceOlhar: 0.10,
    olharMinMs: 3_200, olharMaxMs: 6_500,
    piscarMinMs: 3_200, piscarMaxMs: 6_500, duracaoPiscarMs: 190,
    aberturaMaximaBoca: 0.16, respiracao: 0.55, balanco: 0.28, transicaoMs: 300,
  }),
  ouvindo: Object.freeze({
    inclinacao: 0.15, sobrancelha: 0.14, assimetriaSobrancelha: 0.025,
    energia: 0.42, aproximar: 0.08, alcanceOlhar: 0.05,
    olharMinMs: 4_200, olharMaxMs: 7_000,
    piscarMinMs: 4_000, piscarMaxMs: 7_000, duracaoPiscarMs: 185,
    aberturaMaximaBoca: 0.22, respiracao: 0.45, balanco: 0.18, transicaoMs: 360,
  }),
  pensando: Object.freeze({
    inclinacao: -0.13, sobrancelha: -0.11, assimetriaSobrancelha: 0.055,
    energia: 0.28, aproximar: -0.03, alcanceOlhar: 0.18,
    olharMinMs: 3_500, olharMaxMs: 6_500,
    piscarMinMs: 2_800, piscarMaxMs: 5_000, duracaoPiscarMs: 200,
    aberturaMaximaBoca: 0.16, respiracao: 0.42, balanco: 0.16, transicaoMs: 420,
  }),
  executando: Object.freeze({
    inclinacao: 0.05, sobrancelha: -0.04, assimetriaSobrancelha: 0.015,
    energia: 0.36, aproximar: 0.02, alcanceOlhar: 0.04,
    olharMinMs: 5_000, olharMaxMs: 8_000,
    piscarMinMs: 4_200, piscarMaxMs: 7_200, duracaoPiscarMs: 180,
    aberturaMaximaBoca: 0.16, respiracao: 0.34, balanco: 0.10, transicaoMs: 260,
  }),
  falando: Object.freeze({
    inclinacao: 0.025, sobrancelha: 0.05, assimetriaSobrancelha: 0.02,
    energia: 0.46, aproximar: 0.07, alcanceOlhar: 0.04,
    olharMinMs: 5_000, olharMaxMs: 8_000,
    piscarMinMs: 4_200, piscarMaxMs: 7_200, duracaoPiscarMs: 175,
    aberturaMaximaBoca: 0.76, respiracao: 0.35, balanco: 0.14, transicaoMs: 220,
  }),
  sucesso: Object.freeze({
    inclinacao: 0.055, sobrancelha: 0.11, assimetriaSobrancelha: 0.02,
    energia: 0.43, aproximar: 0.06, alcanceOlhar: 0.03,
    olharMinMs: 5_000, olharMaxMs: 8_000,
    piscarMinMs: 4_500, piscarMaxMs: 7_500, duracaoPiscarMs: 205,
    aberturaMaximaBoca: 0.20, respiracao: 0.40, balanco: 0.12, transicaoMs: 520,
  }),
  erro: Object.freeze({
    inclinacao: -0.055, sobrancelha: -0.14, assimetriaSobrancelha: -0.02,
    energia: 0.24, aproximar: -0.05, alcanceOlhar: 0.01,
    olharMinMs: 6_000, olharMaxMs: 9_000,
    piscarMinMs: 3_200, piscarMaxMs: 5_200, duracaoPiscarMs: 210,
    aberturaMaximaBoca: 0.62, respiracao: 0.30, balanco: 0.05, transicaoMs: 420,
  }),
});

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function numeroOu(valor, alternativa) {
  return Number.isFinite(valor) ? valor : alternativa;
}

/**
 * Postura de repouso de cada estado.
 *
 * Não é enfeite: é como alguém sabe, sem ler nada, se ela está ouvindo,
 * pensando ou trabalhando. Numa interface sem texto, a postura é a mensagem.
 */
export function posturaDoEstado(estado) {
  return { ...(PERFIS[estado] ?? PERFIS.parada) };
}

/**
 * Contém qualquer entrada — inclusive uma vinda de integração externa — na
 * envoltória aprovada para esta arte. Sempre devolve um objeto novo.
 */
export function limitarAtuacaoFacial(perfil, reduzirMovimento = false) {
  const base = PERFIS.parada;
  const limitado = {
    inclinacao: limitar(numeroOu(perfil?.inclinacao, base.inclinacao), -0.15, 0.15),
    sobrancelha: limitar(numeroOu(perfil?.sobrancelha, base.sobrancelha), -0.14, 0.14),
    assimetriaSobrancelha: limitar(
      numeroOu(perfil?.assimetriaSobrancelha, base.assimetriaSobrancelha),
      -0.06,
      0.06,
    ),
    energia: limitar(numeroOu(perfil?.energia, base.energia), 0.20, 0.50),
    aproximar: limitar(numeroOu(perfil?.aproximar, base.aproximar), -0.08, 0.08),
    alcanceOlhar: limitar(numeroOu(perfil?.alcanceOlhar, base.alcanceOlhar), 0, 0.18),
    olharMinMs: limitar(numeroOu(perfil?.olharMinMs, base.olharMinMs), 3_000, 9_000),
    olharMaxMs: limitar(numeroOu(perfil?.olharMaxMs, base.olharMaxMs), 3_000, 9_000),
    piscarMinMs: limitar(numeroOu(perfil?.piscarMinMs, base.piscarMinMs), 2_800, 7_500),
    piscarMaxMs: limitar(numeroOu(perfil?.piscarMaxMs, base.piscarMaxMs), 2_800, 7_500),
    duracaoPiscarMs: limitar(numeroOu(perfil?.duracaoPiscarMs, base.duracaoPiscarMs), 175, 210),
    aberturaMaximaBoca: limitar(
      numeroOu(perfil?.aberturaMaximaBoca, base.aberturaMaximaBoca),
      0,
      0.76,
    ),
    respiracao: limitar(numeroOu(perfil?.respiracao, base.respiracao), 0, 0.55),
    balanco: limitar(numeroOu(perfil?.balanco, base.balanco), 0, 0.28),
    transicaoMs: limitar(numeroOu(perfil?.transicaoMs, base.transicaoMs), 0, 520),
  };

  limitado.olharMaxMs = Math.max(limitado.olharMinMs, limitado.olharMaxMs);
  limitado.piscarMaxMs = Math.max(limitado.piscarMinMs, limitado.piscarMaxMs);

  if (!reduzirMovimento) return limitado;
  return {
    ...limitado,
    inclinacao: 0,
    sobrancelha: 0,
    assimetriaSobrancelha: 0,
    energia: Math.min(limitado.energia, 0.24),
    aproximar: 0,
    alcanceOlhar: 0,
    aberturaMaximaBoca: Math.min(limitado.aberturaMaximaBoca, 0.28),
    respiracao: 0,
    balanco: 0,
    transicaoMs: 0,
  };
}

/**
 * Suavização exponencial estável entre 30 e 120 FPS. Quadros retornando de uma
 * aba suspensa são limitados a 50 ms para não causar um salto de pose.
 */
export function aproximarComTempo(atual, alvo, deltaMs, tauMs) {
  if (deltaMs <= 0) return atual;
  if (tauMs <= 0) return alvo;
  const deltaSeguro = Math.min(deltaMs, 50);
  return atual + (alvo - atual) * (1 - Math.exp(-deltaSeguro / tauMs));
}

/**
 * Quanto a boca abre por caractere falado.
 *
 * A síntese do navegador não entrega fonemas, só a posição do caractere em que
 * a voz está. Vogais abrem mais que consoantes, e é essa diferença que faz o
 * rosto parecer que está dizendo aquilo, em vez de mastigando.
 */
export function aberturaDaLetra(letra) {
  const limpa = letra.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if ("aeo".includes(limpa)) return 1;
  if ("iu".includes(limpa)) return 0.55;
  if ("mbp".includes(limpa)) return 0.08;
  if ("fvsz".includes(limpa)) return 0.3;
  if (" ,.;:!?".includes(limpa)) return 0.05;
  return 0.42;
}

/**
 * Largura da boca em relação ao repouso, por caractere.
 *
 * Boca que só abre e fecha na vertical vira bico. Em "i" e "e" ela espalha; em
 * "o" e "u" arredonda e estreita.
 */
export function larguraDaLetra(letra) {
  const limpa = letra.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if ("ie".includes(limpa)) return 1.10;
  if ("ou".includes(limpa)) return 0.88;
  if (limpa === "a") return 1.03;
  return 1;
}

/**
 * Programação do piscar: a cada 2 a 6 segundos, às vezes duas vezes seguidas.
 * Intervalo fixo é a diferença entre parecer viva e parecer um relógio.
 */
export function proximoPiscar(agoraMs, estadoOuAleatorio = "parada", aleatorio = Math.random) {
  // Compatibilidade com o contrato anterior: `proximoPiscar(agora, random)`.
  if (typeof estadoOuAleatorio === "function") {
    const sorteio = estadoOuAleatorio;
    const base = 2_000 + sorteio() * 4_000;
    const duplo = sorteio() < 0.18 ? 260 : 0;
    return agoraMs + base + duplo;
  }
  const perfil = posturaDoEstado(estadoOuAleatorio);
  const base = perfil.piscarMinMs + aleatorio() * (perfil.piscarMaxMs - perfil.piscarMinMs);
  const duplo = aleatorio() < 0.10 ? 230 : 0;
  return agoraMs + base + duplo;
}

/** Fração fechada da pálpebra, de 0 (aberta) a 1 (fechada), durante um piscar. */
export function fechamentoDaPalpebra(msDesdeInicio, duracaoMs = 150) {
  if (msDesdeInicio < 0 || msDesdeInicio > duracaoMs) return 0;
  return Math.sin((msDesdeInicio / duracaoMs) * Math.PI);
}

/**
 * Para onde ela olha. Olhar fixo é o que mais denuncia um retrato animado: a
 * pessoa parece morta mesmo respirando.
 */
export function proximoAlvoDoOlhar(estado, aleatorio = Math.random) {
  const alcance = posturaDoEstado(estado).alcanceOlhar;
  return {
    x: (aleatorio() * 2 - 1) * alcance,
    y: (aleatorio() * 2 - 1) * alcance * 0.55,
  };
}

export function proximoInstanteDoOlhar(agoraMs, estadoOuAleatorio = "parada", aleatorio = Math.random) {
  // Compatibilidade com o contrato anterior: `proximoInstanteDoOlhar(agora, random)`.
  if (typeof estadoOuAleatorio === "function") {
    return agoraMs + 900 + estadoOuAleatorio() * 2_600;
  }
  const perfil = posturaDoEstado(estadoOuAleatorio);
  return agoraMs + perfil.olharMinMs + aleatorio() * (perfil.olharMaxMs - perfil.olharMinMs);
}
