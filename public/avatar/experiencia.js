/**
 * A experiência: ouvir, decidir, falar e mostrar o que está sendo feito.
 *
 * Não existe campo de digitação e não existe parágrafo de resposta na tela. O
 * canal é a voz: ela ouve pelo microfone, o cérebro decide a ferramenta, ela
 * fala o resultado, e o painel mostra a ATIVIDADE — qual agente entrou, o que
 * está executando e que evidência ficou. Texto na tela aqui é telemetria, nunca
 * a resposta.
 */

import { criarAvatar } from "./avatar.js";
import { explicarFalhaDeMicrofone, falhaEmPortugues, motivoDoBilheteEmPortugues, motivoDoCerebroEmPortugues } from "./lib/confirmacao.js";
import { aberturaDaLetra, larguraDaLetra } from "./lib/movimento.js";
import { CARACTERES_POR_SEGUNDO, prepararParaVoz } from "./lib/voz.js";

const palco = document.querySelector(".palco");
const MODO_AVATAR = document.documentElement.dataset.modo === "avatar";
if (MODO_AVATAR) {
  document.documentElement.dataset.modo = "avatar";
  document.body.dataset.modo = "avatar";
  palco.dataset.modo = "avatar";
}

/**
 * A LP é estática. Conversa real só é ligada quando existe a rota `/avatar`
 * na própria origem HTTPS, conforme o contrato em `docs/AVATAR_ROUTE.md`.
 * Sem isso, o desenho continua vivo e a página não simula um cérebro local.
 */
const API_BASE_URL = (() => {
  const configurada = globalThis.JARVIS_CONFIG?.apiBaseUrl;
  if (typeof configurada !== "string" || !configurada.trim()) return null;
  try {
    const url = new URL(configurada, location.href);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    const caminho = url.pathname.replace(/\/+$/, "") || "/";
    if (url.origin !== location.origin) return null;
    if (url.protocol !== "https:" && !loopback) return null;
    if (caminho !== "/avatar" || url.search || url.hash) return null;
    return `${url.origin}${caminho}`;
  } catch {
    return null;
  }
})();

const ORIGENS_PAIS_PERMITIDAS = (() => {
  const configuradas = globalThis.JARVIS_CONFIG?.allowedParentOrigins;
  if (!Array.isArray(configuradas)) return new Set();
  return new Set(configuradas.flatMap((origem) => {
    try {
      const url = new URL(String(origem));
      return url.origin === String(origem).replace(/\/$/, "") ? [url.origin] : [];
    } catch {
      return [];
    }
  }));
})();

function endpointDaApi(caminho) {
  if (!API_BASE_URL) throw new Error("backend HTTPS da conversa não configurado");
  return `${API_BASE_URL}${caminho}`;
}
const campoEstado = document.getElementById("estado");
const campoIdentidade = document.getElementById("identidade");
const campoCronometro = document.getElementById("cronometro");
const campoMotor = document.getElementById("motor");
const listaAtividade = document.getElementById("atividade");
const listaEvidencias = document.getElementById("evidencias");
const listaMedidas = document.getElementById("medidas");
const onda = document.getElementById("onda");
const botao = document.getElementById("microfone");
const CONVERSA_DISPONIVEL = Boolean(API_BASE_URL);
if (!CONVERSA_DISPONIVEL) {
  botao.disabled = true;
  botao.inert = true;
  botao.setAttribute("inert", "");
  botao.setAttribute("aria-disabled", "true");
  botao.setAttribute("aria-pressed", "false");
  botao.setAttribute("aria-label", "Conversa indisponível");
}
const avatar = criarAvatar(document.getElementById("avatar"), {
  // O PNG tem mais transparência à esquerda da figura. Nesta superfície, em
  // que não existe HUD para compensar o enquadramento, corrigimos a caixa de
  // tinta da personagem sem alterar a composição da Central.
  deslocamentoHorizontal: MODO_AVATAR ? -0.046 : 0,
  // Abre o enquadramento no standalone e conserva a aproximação por estado sem
  // deixar a personagem ocupar a tela inteira durante a resposta.
  zoomBase: MODO_AVATAR ? 0.92 : 1,
  respostaDoZoom: MODO_AVATAR ? 0.5 : 1,
  // ⚠️ Ver a cicatriz em `avatar.js`: sem isto, arte que não carrega deixa a
  // tela vazia e muda. A personagem É a interface deste produto.
  aoFalharAArte: (endereco) => {
    void mostrarFalha(`a arte da personagem não carregou (${String(endereco).split("/").pop()})`,
      "Não consegui carregar a minha imagem. O resto continua funcionando: pode falar comigo.");
  },
});

const listaSistema = document.getElementById("sistema");

const blocos = {
  sistema: document.getElementById("bloco-sistema"),
  dicas: document.getElementById("dicas"),
  passos: document.getElementById("bloco-passos"),
  medidas: document.getElementById("bloco-medidas"),
  fontes: document.getElementById("bloco-fontes"),
};
const barrasDaOnda = [...onda.querySelectorAll("i")];

/**
 * Separa o que é número medido do que é fonte consultada.
 *
 * As evidências chegam como frases, e jogá-las todas na mesma lista devolve o
 * amontoado de cartões cinza que a primeira versão tinha. "carga do processador:
 * 21.69" é um número e pertence a uma tabela; "Censo Escolar — gov.br/inep" é
 * uma fonte e pertence a um cartão com o domínio destacado.
 */
export function classificarEvidencia(texto) {
  const bruto = String(texto ?? "").trim();

  // ⚠️ Ressalva: o executor marca com "⚠" o que RETIRA valor do que vem depois.
  // Sem um tipo próprio ela caía como nota em MEDIÇÕES — cinza, pequena, longe
  // do cartão de fonte que ela existe para qualificar.
  if (bruto.startsWith("⚠")) return { tipo: "ressalva", texto: bruto.replace(/^⚠\s*/, "") };

  // Procedência declarada pelo executor. Vem primeiro porque é a única forma
  // que não depende de adivinhar onde o título acaba.
  const comFonte = bruto.match(/^(.+?)\s·\sfonte:\s(.+)$/);
  if (comFonte) return { tipo: "fonte", titulo: comFonte[1].trim(), origem: comFonte[2].trim() };

  // O travessão que separa título de domínio é o ÚLTIMO: títulos de resultado
  // de busca costumam trazer travessões próprios ("Enem — Instituto ... — gov"),
  // e cortar no primeiro jogava a fonte inteira na tabela de números.
  const corte = bruto.lastIndexOf(" — ");
  if (corte > 0) {
    const origem = bruto.slice(corte + 3).trim();
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(origem)) {
      return { tipo: "fonte", titulo: bruto.slice(0, corte).trim(), origem };
    }
  }

  const comDoisPontos = bruto.match(/^(.+?):\s*(.+)$/);
  if (comDoisPontos && comDoisPontos[2].length <= 48) {
    return { tipo: "medida", rotulo: comDoisPontos[1].trim(), valor: comDoisPontos[2].trim() };
  }

  // Frase sem par rótulo/valor — "5 resultados · os termos saíram da máquina".
  // Vira uma nota, não uma linha de tabela com valor vazio.
  return { tipo: "nota", texto: bruto };
}

/** Sobe as barras da onda conforme a boca articula. */
function animarOnda(abertura) {
  for (const [i, barra] of barrasDaOnda.entries()) {
    // Cada barra tem seu próprio fator: onda uniforme parece um equalizador
    // de brinquedo, não uma voz.
    const fator = 0.35 + Math.abs(Math.sin(i * 1.7 + Date.now() / 190)) * 0.65;
    barra.style.scale = `1 ${Math.max(1, abertura * fator * 13)}`;
  }
}

function repousarOnda() {
  for (const barra of barrasDaOnda) barra.style.scale = "1 1";
}

/**
 * Quanto tempo a falha fica legível antes da tela voltar ao repouso.
 *
 * ⚠️ Medido em 22/08/2026: o estado "Algo travou" durava milissegundos. Os três
 * caminhos de falha chamavam `definirEstado("erro")` e, na linha seguinte à
 * fala, `definirEstado("parada")` — e `falar()` devolve na hora quando a trava
 * de silêncio está ligada. Numa tela sem texto de resposta, isso significa que
 * quem olha nunca via que alguma coisa quebrou: o rótulo já tinha voltado para
 * "Toque para falar comigo". A evidência marcada como falha sempre ficou no
 * painel; o que faltava era o estado durar o suficiente para ser lido.
 */
const ESPERA_NO_ERRO_MS = 4_000;


/**
 * Mostra uma falha: estado, evidência, o que ela diz e o tempo de leitura.
 *
 * Os três caminhos que podem falhar — cérebro fora do ar, microfone recusado e
 * reconhecimento mudo — passam por aqui, para nenhum deles voltar a piscar.
 */
async function mostrarFalha(evidencia, fala) {
  const marca = performance.now();
  definirEstado("erro");
  /**
   * ⚠️ O PAINEL DE SISTEMA PRECISA SAIR DE CENA AQUI TAMBÉM.
   *
   * `limparPainel()` esconde os blocos no começo de todo PEDIDO, e é ele que
   * tira a telemetria de cena enquanto ela trabalha. Mas falha que acontece
   * FORA de um pedido — a arte que não carrega, achada em 24/08/2026 — nunca
   * passou por ele: o bloco ficava visível com o rótulo "Sistema" e nada
   * embaixo, 28px de rótulo órfão, até o painel voltar ao repouso segundos
   * depois. Rótulo de seção sem conteúdo não é discrição, é tela quebrada — a
   * mesma regra que já valeu para o quadro embutido e para "EXPERIMENTE DIZER".
   */
  blocos.sistema.hidden = true;
  registrarEvidencia(evidencia, "falhou");
  if (fala) await falar(fala, { assumirEstado: false });
  const resta = ESPERA_NO_ERRO_MS - (performance.now() - marca);
  if (resta > 0) await new Promise((seguir) => setTimeout(seguir, resta));
  // Se a pessoa já tocou no microfone durante a espera, quem manda é ela.
  if (estadoAtual !== "erro") return;
  definirEstado("parada");
  // ⚠️ E o painel volta a respirar. Medido na captura de 22/08/2026: depois de
  // uma falha, `limparPainel()` tinha escondido as dicas e a telemetria, e só o
  // caminho de sucesso as trazia de volta — a coluna ficava com três linhas no
  // topo e setecentos pixels de vazio até o rodapé, para sempre, até alguém
  // falar de novo. Tela vazia depois de um erro parece assistente desligada.
  blocos.dicas.hidden = false;
  void atualizarSistema();
}

const LEGENDAS = {
  parada: "Toque para falar comigo",
  ouvindo: "Ouvindo você",
  pensando: "Pensando",
  falando: "Respondendo",
  executando: "Executando",
  sucesso: "Concluído",
  erro: "Algo travou",
};

let estadoAtual = "parada";
let reconhecimento = null;
let intervaloDaBoca = null;
let limiteDeEscuta = null;
let resultadoDaEscutaConsumido = false;
let turnoEmCurso = null;

/**
 * Bilhete de identidade, entregue pelo produto que embutiu a assistente.
 *
 * Chega por `postMessage` e não pela URL: query string entra em histórico, em
 * log de servidor e no `Referer` de qualquer requisição seguinte. Rodando
 * sozinha na bancada ele fica vazio e o servidor usa a identidade local.
 */
let bilhete = "";
/** Este produto não pode ver a medição da máquina — não adianta insistir. */
let sistemaNegado = false;
const embutido = new URLSearchParams(location.search).has("embutido");
/**
 * A tela está dentro de outra?
 *
 * O parâmetro é o que o hospedeiro declara; estar num quadro é fato. Vale
 * qualquer um dos dois: um hospedeiro que esqueceu o parâmetro não pode ganhar
 * acesso à informação de bancada por descuido.
 */
const ehEmbutido = () => embutido || window.parent !== window;

window.addEventListener("message", (evento) => {
  // ⚠️ Só da janela que embutiu o quadro. O comentário aqui sempre prometeu
  // essa checagem e o código NÃO a fazia: qualquer janela com uma referência a
  // esta — outro iframe, um `window.open` — conseguia trocar a identidade da
  // sessão por um bilhete legítimo de outro produto. A origem não pode ser
  // exigida como "a mesma", porque o hospedeiro é de outra origem por
  // natureza; o que dá para exigir é que a mensagem venha do pai.
  if (evento.source !== window.parent || window.parent === window) return;
  const origemPermitida = evento.origin === location.origin || ORIGENS_PAIS_PERMITIDAS.has(evento.origin);
  if (!origemPermitida) return;
  if (evento.data?.tipo !== "jarvis:bilhete") return;
  if (typeof evento.data.bilhete !== "string") return;
  bilhete = evento.data.bilhete;
  if (estadoAtual === "parada") campoEstado.textContent = LEGENDAS.parada;
  // Agora existe identidade: a medição pode ser pedida, e o servidor decide se
  // este produto tem direito a ela.
  void atualizarSistema();
});

function definirEstado(estado) {
  estadoAtual = estado;
  palco.dataset.estado = estado;
  campoEstado.textContent = LEGENDAS[estado] ?? estado;
  avatar.definirEstado(estado);
  const ouvindo = estado === "ouvindo";
  botao.dataset.ativo = ouvindo ? "sim" : "nao";
  // ⚠️ `data-ativo` pinta o botão e não diz nada a um leitor de tela. Num
  // controle que alterna entre começar e parar a escuta, isso deixa quem não vê
  // a cor sem saber em que estado apertou.
  botao.setAttribute("aria-pressed", ouvindo ? "true" : "false");
}

let cronometroTimer = null;

function iniciarCronometro() {
  const inicio = performance.now();
  clearInterval(cronometroTimer);
  cronometroTimer = setInterval(() => {
    campoCronometro.textContent = `${((performance.now() - inicio) / 1000).toFixed(1)}s`;
  }, 100);
}

function pararCronometro() {
  clearInterval(cronometroTimer);
  cronometroTimer = null;
  // Cronômetro parado ao lado de "toque para falar" conta um tempo que não
  // corresponde a nada: some junto com o trabalho.
  campoCronometro.textContent = "";
}

function limparPainel() {
  listaAtividade.replaceChildren();
  listaEvidencias.replaceChildren();
  listaMedidas.replaceChildren();
  // O painel de sistema é do repouso e sai de cena enquanto ela trabalha: com
  // ele aberto, cinco linhas de telemetria disputavam a coluna com a execução,
  // e quem olhava não sabia onde procurar o que estava acontecendo agora.
  for (const bloco of Object.values(blocos)) bloco.hidden = true;
}

/**
 * O painel acompanha o que acaba de acontecer.
 *
 * ⚠️ Medido em 22/08/2026, com os estados de trabalho capturados em 390x844
 * pela primeira vez: durante a execução o painel transborda 200 px e o bloco
 * de EVIDÊNCIAS e o rodapé ficam fora da vista. É a procedência da resposta —
 * a norma, a fonte — que some no aparelho em que um gestor mais vai usar isto.
 *
 * Segue apenas ENQUANTO ela trabalha. Terminado o pedido, o painel para onde
 * está e quem lê rola à vontade — puxar a tela debaixo de quem está lendo é
 * pior do que não seguir.
 *
 * ⚠️ A primeira versão condicionava a "já estar acompanhando o fim", e nunca
 * seguia: no começo do pedido o painel ainda não transborda, então a condição
 * era falsa; depois que o conteúdo cresce, `scrollTop` continua em zero e a
 * condição segue falsa para sempre. O transbordo medido continuou em 200 px e o
 * bloco de evidências continuou fora da vista — a correção não corrigia nada.
 */
function seguirNoPainel(elemento) {
  const painel = document.querySelector(".hud");
  if (!painel || !elemento || estadoAtual === "parada") return;
  if (painel.scrollHeight - painel.clientHeight <= 1) return;
  elemento.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function registrarAtividade(texto, opcoes = {}) {
  blocos.passos.hidden = false;
  const item = document.createElement("li");
  if (opcoes.ativo) item.dataset.ativo = "sim";
  if (opcoes.fora) item.dataset.fora = "sim";
  item.textContent = texto;
  listaAtividade.append(item);
  seguirNoPainel(item);
  return item;
}

function registrarEvidencia(texto, estado = "ok") {
  const classificada = classificarEvidencia(texto);
  // A ressalva vale mais que a fonte que ela qualifica, então vem ANTES dela na
  // lista e com peso visual próprio. Quem lê "não tenho esse número" no topo
  // não confunde o verbete do assunto com a resposta da pergunta.
  if (classificada.tipo === "ressalva") {
    blocos.fontes.hidden = false;
    const item = document.createElement("li");
    item.dataset.ressalva = "sim";
    item.textContent = classificada.texto;
    listaEvidencias.prepend(item);
    seguirNoPainel(item);
    return;
  }
  if (classificada.tipo === "fonte") {
    blocos.fontes.hidden = false;
    const item = document.createElement("li");
    const titulo = document.createElement("b");
    titulo.textContent = classificada.titulo;
    const origem = document.createElement("span");
    origem.textContent = classificada.origem;
    item.append(titulo, origem);
    listaEvidencias.append(item);
    seguirNoPainel(item);
    return;
  }
  // ⚠️ Uma frase de falha não é medição. Nas capturas de 22/08/2026 o painel
  // trazia "o servidor da assistente não respondeu" e "não liberada para
  // imperix" debaixo do rótulo MEDIÇÕES — o rótulo mentia, e o motivo da
  // recusa ficava longe da lista de passos, que é onde o olho procura o que
  // aconteceu. Frase de falha vira passo vermelho na execução; par
  // rótulo/valor continua na tabela mesmo quando falha, porque "oal: HTTP 404"
  // é medida de verdade.
  // ⚠️ E o mesmo caminho vale para a ESPERA. A confirmação pendente emite duas
  // notas — o que vai ser gravado e o aviso de que nada foi ainda — e elas
  // precisam aparecer junto dos passos, que é onde o olho procura o que está
  // acontecendo agora. Sem esta linha as duas caíam na tabela de MEDIÇÕES, que
  // fica escondida durante o trabalho, e a tela simplesmente não as mostrava:
  // medido em 22/08/2026, `evidencias: []` e nenhum passo novo.
  if (classificada.tipo === "nota" && (estado === "falhou" || estado === "aguardando" || estado === "encerrado")) {
    const passo = registrarAtividade(classificada.texto);
    passo.dataset.estado = estado;
    return;
  }

  blocos.medidas.hidden = false;
  if (classificada.tipo === "nota") {
    // Ocupa a linha inteira: forçar uma frase na coluna de rótulo espremeria o
    // texto e deixaria um travessão solto na coluna do valor.
    const nota = document.createElement("dt");
    nota.className = "nota";
    nota.textContent = classificada.texto;
    if (estado === "falhou") nota.dataset.estado = "falhou";
    listaMedidas.append(nota);
    seguirNoPainel(nota);
    return;
  }
  const rotulo = document.createElement("dt");
  rotulo.textContent = classificada.rotulo;
  const valor = document.createElement("dd");
  valor.textContent = classificada.valor;
  if (estado === "falhou") valor.dataset.estado = "falhou";
  listaMedidas.append(rotulo, valor);
  seguirNoPainel(valor);
}

/**
 * Prepara o texto para ser dito, não lido.
 *
 * ⚠️ A limpeza mora em `lib/voz.js` desde 22/08/2026, para poder ser medida no
 * Node: aqui ela só tirava marcação, e o que chegava à síntese ainda trazia
 * "20/12/1996", "nº", "arts." e "§" — que a voz lê como barra, "ene ó" e letra
 * solta. Duplicar a regra no navegador criaria duas verdades sobre o mesmo
 * texto, e a que ninguém mede é a que apodrece.
 */
export const textoParaFala = prepararParaVoz;

function escolherVoz() {
  const vozes = window.speechSynthesis?.getVoices?.() ?? [];
  const portuguesas = vozes.filter((v) => v.lang?.toLowerCase().startsWith("pt"));
  return portuguesas.find((v) => v.lang?.toLowerCase().replace("_", "-") === "pt-br") ?? portuguesas[0];
}

function pararFala() {
  if (intervaloDaBoca) { clearInterval(intervaloDaBoca); intervaloDaBoca = null; }
  window.speechSynthesis?.cancel?.();
  avatar.definirBoca(0, 1);
  repousarOnda();
}

/**
 * Trava de silêncio.
 *
 * Existe porque a assistente fala em voz alta assim que responde, e uma prova
 * automatizada rodando em segundo plano vira som saindo do alto-falante no meio
 * de uma reunião. `?silencio=1` desliga a voz sem mexer no resto: a boca
 * continua articulando e o teste continua válido.
 *
 * ⚠️ Esta última frase era falsa até 22/08/2026. `falar()` devolvia na primeira
 * linha quando a trava estava ligada, então em silêncio não havia articulação,
 * não havia onda e o estado "falando" NUNCA acontecia — o estado mais visível
 * da experiência era justamente o único que nenhuma prova conseguia capturar.
 * Agora a trava desliga só a síntese: a boca articula pelo tempo que a fala
 * levaria, e nada sai do alto-falante.
 */
const SILENCIO = new URLSearchParams(location.search).has("silencio");

// O ritmo da voz vem de `lib/voz.js`, junto da preparação do texto: medir a
// duração e limpar o texto são a mesma conta.

/**
 * A boca e a onda acompanhando o texto.
 *
 * A síntese não entrega fonemas, só onde a voz está. O intervalo mantém a
 * articulação viva mesmo nas vozes que não emitem `boundary` — boca parada
 * durante a fala é pior do que boca aproximada. Devolve um jeito de a síntese
 * corrigir a posição quando ela informa onde chegou.
 */
function articular(limpo, assumirEstado) {
  let posicao = 0;
  let aberturaVisual = 0;
  let larguraVisual = 1;
  const intervaloMs = 60;
  const avanco = CARACTERES_POR_SEGUNDO * intervaloMs / 1_000;

  const semVoz = (letra) => !letra
    || /\s/u.test(letra)
    || ".,!?;:…—–()[]{}\"'“”‘’".includes(letra);
  const aberturaNatural = (letra) => semVoz(letra)
    ? 0
    : Math.min(0.76, aberturaDaLetra(letra));
  const larguraNatural = (letra) => semVoz(letra) ? 1 : larguraDaLetra(letra);

  const atualizarArticulacao = () => {
    const limite = Math.max(0, limpo.length - 1);
    const indice = Math.min(limite, Math.floor(posicao));
    const fracao = posicao - indice;
    const letra = limpo[indice] ?? " ";
    const proxima = limpo[Math.min(limite, indice + 1)] ?? letra;

    // Misturar o fonema atual ao próximo evita o abre/fecha aleatório que fazia
    // a boca "bater" sem relação com o ritmo da frase. O pulso é pequeno e
    // determinístico: dá vida à articulação sem transformar fala em tremor.
    const mistura = Math.min(0.25, fracao * 0.34);
    const aberturaAlvo = aberturaNatural(letra)
      + (aberturaNatural(proxima) - aberturaNatural(letra)) * mistura;
    const larguraAlvo = larguraNatural(letra)
      + (larguraNatural(proxima) - larguraNatural(letra)) * mistura;
    const pulso = semVoz(letra) ? 1 : 0.996 + Math.sin(posicao * 1.7) * 0.004;
    const alvoComPulso = Math.max(0, Math.min(0.76, aberturaAlvo * pulso));

    aberturaVisual += (alvoComPulso - aberturaVisual) * (alvoComPulso > aberturaVisual ? 0.68 : 0.46);
    larguraVisual += (larguraAlvo - larguraVisual) * 0.42;
    avatar.definirBoca(aberturaVisual, larguraVisual);
    animarOnda(aberturaVisual);
    posicao = Math.min(limite, posicao + avanco);
  };

  // ⚠️ Quem manda no estado é o chamador. Assumir "falando" aqui apagava o
  // estado de FALHA: `mostrarFalha` põe "erro" e em seguida fala a explicação,
  // e a articulação trocava o rótulo na linha seguinte. Medido em 22/08/2026,
  // logo depois de a fala simulada passar a existir — a captura do erro parou
  // de encontrar a tela em `data-estado="erro"`.
  if (assumirEstado) definirEstado("falando");
  atualizarArticulacao();
  intervaloDaBoca = setInterval(atualizarArticulacao, intervaloMs);
  return (onde) => {
    if (Number.isFinite(onde)) posicao = Math.max(0, Math.min(limpo.length - 1, onde));
  };
}

/**
 * Ela fala. `assumirEstado: false` articula sem tomar o estado da tela — é o
 * que o caminho de falha precisa, para o rótulo continuar dizendo o que houve.
 */
function falar(texto, { assumirEstado = true } = {}) {
  return new Promise((resolver) => {
    const limpo = textoParaFala(texto);
    if (!limpo) return resolver(false);

    const duracaoEstimadaMs = Math.max(
      320,
      Math.round((limpo.length / CARACTERES_POR_SEGUNDO) * 1_000),
    );

    // Com a trava ligada ela continua "falando" na tela, pelo tempo que a fala
    // levaria — só não sai som.
    if (SILENCIO
      || !("speechSynthesis" in window)
      || typeof SpeechSynthesisUtterance !== "function") {
      articular(limpo, assumirEstado);
      setTimeout(() => { pararFala(); resolver(true); }, duracaoEstimadaMs);
      return;
    }

    const fala = new SpeechSynthesisUtterance(limpo);
    fala.lang = "pt-BR";
    fala.rate = 1.02;
    fala.pitch = 1.05;
    const voz = escolherVoz();
    if (voz) fala.voice = voz;

    let corrigirPosicao = null;
    let encerrada = false;
    let limiteDaSintese = null;
    const iniciarArticulacao = () => {
      // Safari/Chrome podem aceitar `speak()` e atrasar ou omitir `onstart`.
      // A personagem começa a responder visualmente assim que a fala fica
      // pronta; o boundary da voz real continua corrigindo a posição depois.
      corrigirPosicao ??= articular(limpo, assumirEstado);
    };
    const encerrar = (sucesso) => {
      if (encerrada) return;
      encerrada = true;
      clearTimeout(limiteDaSintese);
      pararFala();
      resolver(sucesso);
    };
    fala.onboundary = (evento) => corrigirPosicao?.(evento.charIndex);
    fala.onstart = iniciarArticulacao;
    fala.onend = () => encerrar(true);
    fala.onerror = () => encerrar(false);
    window.speechSynthesis.cancel();
    iniciarArticulacao();
    try {
      window.speechSynthesis.speak(fala);
    } catch {
      encerrar(false);
      return;
    }

    // Alguns motores não disparam `end` nem `error`. Sem esta saída o turno
    // fica preso em "Respondendo" e o microfone nunca volta. O limite é folgado
    // para não cortar uma voz válida e limitado para não criar espera infinita.
    limiteDaSintese = setTimeout(
      () => encerrar(false),
      Math.min(120_000, Math.max(4_000, duracaoEstimadaMs * 2 + 1_500)),
    );
  });
}

/**
 * Lê o fluxo de eventos do servidor.
 *
 * `EventSource` não serve aqui porque só faz GET, e o pedido leva bilhete e
 * fala no corpo. O protocolo é o mesmo, então basta interpretar o texto
 * conforme ele chega — que é justamente o ponto: reagir enquanto acontece.
 */
function interpretarBlocoSse(bloco) {
  const linhas = String(bloco).replace(/\r\n?/g, "\n").split("\n");
  const linhaDoTipo = linhas.find((linha) => linha.startsWith("event:"));
  const linhasDeDados = linhas
    .filter((linha) => linha.startsWith("data:"))
    .map((linha) => linha.slice(5).replace(/^ /, ""));
  if (!linhaDoTipo || !linhasDeDados.length) return null;

  const tipo = linhaDoTipo.slice(6).trim();
  if (!tipo) return null;
  try {
    return { tipo, dados: JSON.parse(linhasDeDados.join("\n")) };
  } catch {
    return null;
  }
}

async function* lerEventos(resposta, aoReceberDados = () => {}) {
  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  let resto = "";
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      aoReceberDados();
      resto += decodificador.decode(value, { stream: true });
      const blocos = resto.split(/\r?\n\r?\n/);
      resto = blocos.pop() ?? "";
      for (const bloco of blocos) {
        const evento = interpretarBlocoSse(bloco);
        if (evento) yield evento;
      }
    }
    resto += decodificador.decode();
    const eventoFinal = interpretarBlocoSse(resto);
    if (eventoFinal) yield eventoFinal;
  } finally {
    leitor.releaseLock();
  }
}

async function executarTurno(falaDaPessoa) {
  limparPainel();
  registrarAtividade(`Você disse: ${falaDaPessoa}`);
  definirEstado("pensando");
  iniciarCronometro();

  const inicio = performance.now();
  let itemDoCerebro = registrarAtividade("Consultando o cérebro", { ativo: true });
  let itemDaFerramenta = null;
  let final = null;

  // O fluxo precisa poder durar o suficiente para uma consulta real, mas nunca
  // pode deixar a personagem eternamente "pensando" se a conexão ficar muda.
  const controlador = new AbortController();
  let limiteDeInatividade = null;
  const interromper = (mensagem) => {
    if (!controlador.signal.aborted) controlador.abort(new DOMException(mensagem, "TimeoutError"));
  };
  const rearmarInatividade = () => {
    clearTimeout(limiteDeInatividade);
    limiteDeInatividade = setTimeout(() => interromper("timeout de inatividade do cérebro"), 20_000);
  };
  const limiteTotal = setTimeout(() => interromper("timeout total do cérebro"), 60_000);

  try {
    rearmarInatividade();
    const resposta = await fetch(endpointDaApi("/api/fluxo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fala: falaDaPessoa, bilhete }),
      signal: controlador.signal,
    });
    if (!resposta.ok || !resposta.body) throw new Error("o cérebro não respondeu");

    for await (const { tipo, dados } of lerEventos(resposta, rearmarInatividade)) {
      if (tipo === "identidade") {
        campoIdentidade.textContent = dados.bancada
          ? "assistente pedagógica"
          : (dados.papel || "assistente pedagógica");
      } else if (tipo === "cerebro") {
        delete itemDoCerebro.dataset.ativo;
        itemDoCerebro.dataset.estado = "ok";
        campoMotor.textContent = `${dados.runtime} · ${dados.modelo} · ${Math.round(performance.now() - inicio)} ms${dados.contingencia ? " · contingência" : ""}`;
      } else if (tipo === "plano") {
        itemDaFerramenta = registrarAtividade(dados.rotulo, { ativo: true, fora: dados.saiDaMaquina });
        // O plano movimenta o avatar, mas não é falado. Falar o plano e depois
        // o resultado fazia uma pergunta parecer duas respostas e atrasava a
        // fala final.
      } else if (tipo === "executando") {
        definirEstado("executando");
      } else if (tipo === "evidencia") {
        registrarEvidencia(dados.texto, dados.estado);
      } else if (tipo === "final") {
        // Um proxy pode retransmitir o último frame ao fechar a conexão. O
        // primeiro `final` é canônico e só pode produzir uma resposta falada.
        if (final === null) final = dados;
      } else if (tipo === "erro") {
        // ⚠️ O servidor manda `motivo` junto e o cliente jogava fora: a tela
        // dizia só "cérebro indisponível", sem o porquê. Medido em 22/08/2026
        // com a cadeia posta como inválida de propósito. O motivo é
        // identificador de código; vai para a tela em português.
        const traduzir = /identidade/.test(dados.erro ?? "") ? motivoDoBilheteEmPortugues : motivoDoCerebroEmPortugues;
        const motivo = dados.motivo ? ` — ${traduzir(dados.motivo)}` : "";
        throw new Error(`${dados.erro ?? "algo travou"}${motivo}`);
      }
    }
  } catch (erro) {
    pararCronometro();
    // O passo que quebrou precisa ficar marcado: sem isto, a lista de execução
    // mostrava dois passos de aparência idêntica e nenhuma pista de qual deles
    // falhou. E o rodapé continuava dizendo "cérebro em espera" depois de o
    // cérebro ter caído, que é informação errada na tela.
    delete itemDoCerebro.dataset.ativo;
    itemDoCerebro.dataset.estado = "falhou";
    campoMotor.textContent = "cérebro fora do ar";
    await mostrarFalha(falhaEmPortugues(erro), "Não consegui falar com o cérebro agora.");
    return;
  } finally {
    clearTimeout(limiteDeInatividade);
    clearTimeout(limiteTotal);
  }

  pararCronometro();
  if (!final) { definirEstado("parada"); return; }

  // ⚠️ As evidências do `final` nunca chegavam à tela. Elas só existem nos três
  // caminhos de RECUSA — produto sem a ferramenta liberada, papel sem alçada
  // para confirmar e a pessoa dizendo que não —, e é justamente aí que o painel
  // ficava mudo: ela falava "não posso fazer isso em Imperix" e a tela não
  // mostrava nada. Quem chega depois, ou quem tem o som desligado, não tinha
  // como saber o motivo. No caminho normal a lista vem vazia e nada duplica,
  // porque lá as evidências viajam em eventos próprios.
  // ⚠️ O servidor DIZ qual foi o desfecho; o cliente não adivinha mais pela
  // ausência de execução. `executou: false` cobre falha de verdade, recusa do
  // sistema e a pessoa decidindo que não — e as três saíam vermelhas. Quando o
  // servidor não diz nada, a regra antiga continua valendo.
  const desfecho = final.desfecho ?? (final.executou ? "ok" : "falhou");
  for (const evidencia of final.evidencias ?? []) {
    registrarEvidencia(evidencia, desfecho);
  }

  // ⚠️ O passo se resolve ANTES da fala, não depois. O trabalho já terminou
  // quando o `final` chega — as evidências estão na tela e a resposta está
  // pronta —, e ela leva vários segundos lendo em voz alta. Medido em
  // 23/08/2026 no estado "Respondendo": durante a fala inteira o passo
  // "Consultando o conhecimento da educação" continuava com o ponto de
  // ATIVO, ao lado das próprias fontes que aquela consulta já tinha trazido.
  // A tela dizia que a ferramenta ainda estava rodando enquanto ela lia o
  // resultado dela.
  if (itemDaFerramenta) {
    delete itemDaFerramenta.dataset.ativo;
    // A confirmação pendente não terminou nada: fica armada, esperando o sim.
    itemDaFerramenta.dataset.estado = final.confirmacaoPendente ? "aguardando" : desfecho;
  }
  await falar(final.fala);

  if (final.confirmacaoPendente) {
    // Nada foi feito e o plano continua armado: reabrir o microfone é o caminho
    // mais curto entre a pergunta dela e o "sim" de quem decide.
    // O passo já ficou "aguardando" antes da fala, junto com os demais.
    definirEstado("ouvindo");
    try {
      const instancia = (reconhecimento ??= prepararMicrofone());
      if (!instancia) { definirEstado("parada"); return; }
      iniciarEscuta(instancia);
    } catch { definirEstado("parada"); }
    return;
  }
  if (desfecho === "ok") {
    definirEstado("sucesso");
    await new Promise((seguir) => setTimeout(seguir, 650));
    // Um novo toque durante a breve confirmação já assumiu a interface.
    if (estadoAtual !== "sucesso") return;
  }
  definirEstado("parada");
  // De volta ao repouso, a telemetria reaparece — é o que mantém a tela viva
  // enquanto ela espera.
  blocos.dicas.hidden = false;
  void atualizarSistema();
}

/** Uma pergunta só pode ocupar o avatar uma vez por turno. */
function processar(falaDaPessoa) {
  const fala = String(falaDaPessoa ?? "").trim();
  if (!fala) return Promise.resolve(false);

  const chave = fala.normalize("NFKC").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
  if (turnoEmCurso) {
    return turnoEmCurso.chave === chave
      ? turnoEmCurso.promessa
      : Promise.resolve(false);
  }

  const registro = { chave, promessa: null };
  turnoEmCurso = registro;
  registro.promessa = executarTurno(fala).finally(() => {
    if (turnoEmCurso === registro) turnoEmCurso = null;
  });
  return registro.promessa;
}

function limparLimiteDeEscuta() {
  clearTimeout(limiteDeEscuta);
  limiteDeEscuta = null;
}

function iniciarEscuta(instancia) {
  limparLimiteDeEscuta();
  resultadoDaEscutaConsumido = false;
  instancia.start();
  limiteDeEscuta = setTimeout(async () => {
    if (estadoAtual !== "ouvindo") return;
    resultadoDaEscutaConsumido = true;
    try { instancia.stop(); } catch { /* já parou */ }
    await mostrarFalha("o reconhecimento não respondeu", explicarFalhaDeMicrofone("service-not-allowed"));
  }, 12_000);
}

function prepararMicrofone() {
  const Reconhecimento = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Reconhecimento) {
    botao.disabled = true;
    campoEstado.textContent = "Este navegador não tem reconhecimento de voz";
    return null;
  }
  const instancia = new Reconhecimento();
  instancia.lang = "pt-BR";
  instancia.continuous = false;
  instancia.interimResults = false;
  instancia.onresult = (evento) => {
    if (resultadoDaEscutaConsumido) return;
    const indiceInicial = Number.isInteger(evento?.resultIndex) ? evento.resultIndex : 0;
    const resultadosFinais = Array.from(evento?.results ?? [])
      .slice(indiceInicial)
      .filter((resultado) => resultado?.isFinal !== false);
    const dito = resultadosFinais.map((resultado) => resultado[0]?.transcript ?? "").join(" ").trim();
    if (!dito) return;

    resultadoDaEscutaConsumido = true;
    limparLimiteDeEscuta();
    const turno = processar(dito);
    try { instancia.stop(); } catch { /* o navegador já encerrou */ }
    void turno;
  };
  instancia.onerror = async (evento) => {
    if (resultadoDaEscutaConsumido) {
      limparLimiteDeEscuta();
      return;
    }
    resultadoDaEscutaConsumido = true;
    limparLimiteDeEscuta();
    // Numa tela sem texto, ela precisa DIZER o que houve. Ficar muda depois de
    // um toque no microfone é indistinguível de ter travado.
    const explicacao = explicarFalhaDeMicrofone(evento?.error);
    await mostrarFalha(`microfone: ${evento?.error ?? "falha desconhecida"}`, explicacao);
  };
  instancia.onend = () => {
    limparLimiteDeEscuta();
    if (estadoAtual === "ouvindo") definirEstado("parada");
  };
  return instancia;
}

botao.addEventListener("click", () => {
  if (!CONVERSA_DISPONIVEL) return;
  if (!reconhecimento) reconhecimento = prepararMicrofone();
  if (!reconhecimento) return;
  if (estadoAtual === "ouvindo") {
    resultadoDaEscutaConsumido = true;
    limparLimiteDeEscuta();
    reconhecimento.stop();
    definirEstado("parada");
    return;
  }
  pararFala();
  definirEstado("ouvindo");
  try {
    iniciarEscuta(reconhecimento);
  } catch { definirEstado("parada"); }
});

document.addEventListener("keydown", (evento) => {
  if (!MODO_AVATAR || !CONVERSA_DISPONIVEL) return;
  if (evento.defaultPrevented || evento.repeat || evento.altKey || evento.ctrlKey || evento.metaKey) return;
  if (evento.key !== "Enter" && evento.key !== " ") return;
  if (evento.target?.closest?.("button, a, input, textarea, select, [contenteditable='true']")) return;
  evento.preventDefault();
  botao.click();
});

if (embutido) document.body.dataset.embutido = "sim";
definirEstado("parada");

// Deixa a experiência dirigível por quem valida a tela, sem abrir caminho para
// entrada por texto na interface: a única porta continua sendo o microfone.
// ⚠️ `definirBoca` entra aqui porque julgar a boca dependia de esperar um
// pedido inteiro — vinte segundos de modelo — e depois torcer para o quadro
// capturado cair num pico de abertura. Sem conseguir fixar a abertura, uma
// rodada declarou a boca boa olhando um recorte ampliado e ela estava lendo
// como mancha no tamanho real. Isto não abre entrada por texto: continua
// dirigindo o desenho, e a única porta da interface segue sendo o microfone.
window.__jarvis = {
  processar, falar, definirEstado, mostrarFalha,
  estado: () => estadoAtual,
  definirGestoBracos: (gesto) => avatar.definirGestoBracos(gesto),
  diagnosticoRigBracos: () => avatar.diagnosticoRigBracos(),
  definirBoca: (abertura, largura) => avatar.definirBoca(abertura, largura),
  // Mesmo motivo da boca: a piscada dura 150 ms e vem a cada 2 a 6 s. Sem poder
  // fixá-la, julgá-la dependia de sorte no instante da captura.
  definirPiscar: (fechamento) => avatar.definirPiscar(fechamento),
  // Gancho explícito de bancada: permite comparar a cadência do mesmo
  // documento com e sem o loop do renderer. A interface pública não o chama.
  pararRenderizacaoParaDiagnostico: () => avatar.parar(),
};


/**
 * Telemetria viva enquanto ela espera.
 *
 * Sem isto a tela em repouso mostra duas frases e um vazio enorme, e parece
 * desligada. São os mesmos números que ela fala quando alguém pergunta —
 * medidos no servidor, nunca decorativos. Só roda em repouso: durante o
 * trabalho o painel pertence à execução.
 */
async function atualizarSistema() {
  if (estadoAtual !== "parada" || sistemaNegado) return;
  if (!API_BASE_URL) {
    blocos.sistema.hidden = true;
    return;
  }
  // ⚠️ CORRIDA. O bilhete chega por `postMessage` DEPOIS do carregamento, e
  // esta função dispara no arranque. Sem esta linha, o primeiro pedido de um
  // quadro embutido sai sem identidade — e fora de produção "sem bilhete" cai
  // na bancada, que é justamente quem vê os nomes de runtime. A tela do
  // cliente mostraria a topologia da casa por uma janela de milissegundos, e
  // depois a esconderia.
  if (ehEmbutido() && !bilhete) {
    // ⚠️ ESCONDER O BLOCO, não só desistir da medição.
    //
    // Medido em 23/08/2026 num hospedeiro de outra origem: o `return` seco
    // deixava a seção SISTEMA de pé com o rótulo e NADA embaixo — 22px de
    // "Sistema" sozinho, e um vão até as sugestões, dentro do site de uma
    // escola. É o estado PADRÃO de todo quadro embutido, porque o bilhete só
    // chega depois do `load`, e é o estado PERMANENTE de um hospedeiro que
    // esqueça o bilhete.
    //
    // É o mesmo defeito que "EXPERIMENTE DIZER" com nada embaixo já teve a
    // 390: rótulo de seção sem conteúdo não é discrição, é tela quebrada. O
    // bloco volta sozinho quando o bilhete chega — esta função roda de seis em
    // seis segundos e o fim dela reabre a seção assim que houver linha.
    blocos.sistema.hidden = true;
    return;
  }
  try {
    // ⚠️ POST com o bilhete no CORPO. Era um GET sem identidade nenhuma, e por
    // isso a tela em repouso mostrava carga, memória, disco e os runtimes da
    // máquina do dono mesmo num produto a quem `estado_do_sistema` é NEGADA na
    // tabela de permissão. Bilhete em query string também não serve: vira
    // histórico de navegador, log de proxy e referer.
    const resposta = await fetch(endpointDaApi("/api/telemetria"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bilhete }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!resposta.ok) return;
    const { evidencias, identidade, medicaoLiberada, alertas } = await resposta.json();
    // Quem é esta tela, dito pelo servidor que verificou o bilhete — não pelo
    // texto que veio no HTML nem pelo conteúdo do bilhete lido sem conferir.
    if (identidade?.nome) {
      // O topo identifica a experiência IA Schools, não a máquina que a serve.
      // Na execução local a audiência autenticada continua sendo bancada no
      // backend, mas o papel visual permanece o da própria assistente. Quando
      // há bilhete do produto, mostramos o papel escolar validado pelo servidor.
      campoIdentidade.textContent = identidade.bancada
        ? "assistente pedagógica"
        : (identidade.papel || "assistente pedagógica");
    }
    if (medicaoLiberada === false) {
      // Este produto não tem a medição. Esconder o bloco e parar de pedir — de
      // seis em seis segundos seria bater numa porta que já respondeu não.
      sistemaNegado = true;
      blocos.sistema.hidden = true;
      return;
    }
    if (estadoAtual !== "parada") return;

    const linhas = [];
    for (const bruto of evidencias ?? []) {
      const classificada = classificarEvidencia(bruto);
      if (classificada.tipo !== "medida") continue;
      linhas.push(classificada);
    }
    listaSistema.replaceChildren();
    const criticas = new Set(alertas ?? []);
    for (const { rotulo, valor } of linhas) {
      const dt = document.createElement("dt");
      dt.textContent = rotulo;
      const dd = document.createElement("dd");
      dd.textContent = valor;
      // "fora do ar" e "HTTP 404" são falha: precisam saltar aos olhos.
      // ⚠️ E o disco no fim também. O painel pintava de vermelho um runtime
      // caído e deixava "3 GB" em branco calmo — na véspera esta máquina
      // devolveu ENOSPC no meio das provas exatamente nesse estado. Quem decide
      // o que é crítico é quem mede, no servidor; aqui só se pinta.
      if (/fora do ar|sem resposta agora|HTTP [45]/i.test(valor)) dd.dataset.estado = "falhou";
      if (criticas.has(rotulo)) { dd.dataset.estado = "falhou"; dt.dataset.estado = "falhou"; }
      listaSistema.append(dt, dd);
    }
    blocos.sistema.hidden = linhas.length === 0;
  } catch {
    // Telemetria é enfeite informativo, não caminho crítico: falhar em silêncio
    // é melhor do que INTERROMPER quem está prestes a falar com ela.
    //
    // ⚠️ Mas silêncio não pode virar MENTIRA. Achado por auditoria em
    // 24/08/2026: o `catch` deixava os números anteriores na tela, e de seis em
    // seis segundos ninguém percebia que eles tinham parado de ser atualizados
    // — carga, memória e disco de dez minutos atrás apresentados como agora. É
    // o sexto caso do padrão desta casa: verdade literal, engano prático.
    // Não interromper continua valendo; manter número vencido, não.
    listaSistema.replaceChildren();
    const aviso = document.createElement("dd");
    aviso.textContent = "medição indisponível agora";
    aviso.dataset.estado = "falhou";
    aviso.classList.add("nota");
    listaSistema.append(aviso);
    blocos.sistema.hidden = false;
  }
}

/**
 * Quem vai pensar, dito antes de alguém falar.
 *
 * ⚠️ O rodapé nascia com "cérebro em espera" e ficava assim até a primeira
 * resposta. Duas coisas erradas nisso. A primeira: numa tela cujo assunto é
 * procedência, o dado mais importante — QUAL runtime e QUAL modelo vão pensar —
 * era o único que não aparecia. A segunda é pior: quando não há cérebro nenhum
 * de pé, "em espera" soa como normalidade, e quem olha só descobre o problema
 * ao falar e não ser respondido. `/api/saude` já sabe as duas coisas.
 */
async function anunciarCerebro() {
  if (!API_BASE_URL) {
    campoMotor.textContent = "";
    campoMotor.hidden = true;
    campoMotor.closest(".hud-rodape")?.setAttribute("hidden", "");
    return;
  }
  // ⚠️ E só na bancada. "cadeia: oal·openclaw → ollama·gpt-oss:20b" é a
  // resposta certa para quem opera os Macs e a topologia da casa entregue de
  // graça no rodapé de um produto embutido no site de uma escola. É o mesmo
  // defeito da tabela SISTEMA, no outro canto da tela: informação de máquina
  // sem audiência definida.
  if (ehEmbutido()) {
    campoMotor.textContent = "";
    campoMotor.hidden = true;
    // ⚠️ E o rodapé INTEIRO, não só o campo dentro dele. Medido em 23/08/2026:
    // escondendo apenas o `<span>`, o `<footer>` continuava ocupando 14px de
    // faixa vazia no fim do painel do cliente. Esconder o filho e deixar a
    // moldura é o mesmo meio-caminho da seção SISTEMA, logo acima.
    campoMotor.closest(".hud-rodape")?.setAttribute("hidden", "");
    return;
  }
  try {
    const resposta = await fetch(endpointDaApi("/api/saude"), { signal: AbortSignal.timeout(6_000) });
    if (!resposta.ok) return;
    const dados = await resposta.json();
    const { cerebro } = dados;
    // A rota pública informa só prontidão; detalhes da topologia pertencem à
    // bancada privilegiada. Consumimos os dois contratos sem inventar runtime.
    if (!cerebro && typeof dados?.pronto === "boolean") {
      campoMotor.textContent = dados.pronto ? "assistente conectada" : "assistente indisponível";
      campoMotor.dataset.estado = dados.pronto ? "ok" : "falhou";
      return;
    }
    if (cerebro?.indisponivel) {
      campoMotor.textContent = `sem cérebro: ${motivoDoCerebroEmPortugues(cerebro.indisponivel)}`;
      campoMotor.dataset.estado = "falhou";
      return;
    }
    if (!cerebro?.runtime) return;
    delete campoMotor.dataset.estado;
    // A ordem de tentativa, não uma promessa de que o primeiro responde: a
    // saúde resolve a cadeia sem sondar ninguém. Quando um pedido roda, este
    // mesmo campo é substituído por quem de fato atendeu, com o tempo — e aí
    // sim é medição.
    // Cada elo com o SEU modelo: "oal → ollama · gpt-oss:20b" sugeria que o
    // modelo era dos dois, e o do OAL é outro.
    const cadeia = (cerebro.cadeia ?? [cerebro]).map((c) => `${c.runtime}·${c.modelo}`).join(" → ");
    campoMotor.textContent = `cadeia: ${cadeia}`;
  } catch {
    // Se nem a saúde responde, o texto do HTML continua valendo: dizer menos é
    // melhor do que afirmar um runtime que não foi conferido.
  }
}

anunciarCerebro();
atualizarSistema();
setInterval(atualizarSistema, 6_000);
