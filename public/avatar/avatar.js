/**
 * Desenha e anima a personagem de corpo inteiro num canvas.
 *
 * Não há vídeo, modelo generativo nem chamada externa: a arte recortada é
 * redesenhada quadro a quadro e deformada por regiões. Tudo roda no navegador
 * de quem está olhando — nenhuma imagem, áudio ou quadro sai da máquina.
 *
 * O corpo inteiro e os remendos faciais compartilham uma única transformação
 * contínua. O cisalhamento e a escala sutis preservam a sensação de massa sem
 * recompor a imagem em faixas — e, portanto, sem criar emendas horizontais.
 */

import { CORPO, ROSTO, arrastoNaAltura } from "./lib/anatomia.js";
import { desenharBocaContinua } from "./lib/boca-continua.js";
import {
  aproximarComTempo,
  deslocamentoDePeso,
  fechamentoDaPalpebra,
  limitarAtuacaoFacial,
  oscilacao,
  posturaDoEstado,
  proximoAlvoDoOlhar,
  proximoInstanteDoOlhar,
  proximoPiscar,
  respiracao,
} from "./lib/movimento.js";

/**
 * Redesenha uma região da arte por cima dela mesma, deformada e com as bordas
 * dissolvidas. Sem a máscara radial aparece a costura retangular do recorte,
 * que é o que denuncia o truque.
 */
function desenharRegiao(ctx, auxiliar, imagem, cena, regiao, opcoes) {
  const { esticarY, esticarX = 1, fonteAcima = 0, empurrarY = 0, empurrarX = 0, focoDaMascara = 0.5,
    dissolverCorte = false, mascaraElipse = false, fonteAltura = 1 } = opcoes;
  const sw = regiao.raioX * 2 * cena.naturalW;
  const sh = regiao.raioY * 2 * cena.naturalH;
  const sx = regiao.centroX * cena.naturalW - sw / 2;
  const sy = regiao.centroY * cena.naturalH - sh / 2 - sh * fonteAcima;
  if (sw < 2 || sh < 2) return;

  const dw = Math.max(2, Math.round(sw * cena.escala));
  const dh = Math.max(2, Math.round(sh * cena.escala));
  const dx = cena.x + regiao.centroX * cena.largura - dw / 2;
  const dy = cena.y + regiao.centroY * cena.altura - dh / 2;

  const alvo = auxiliar.getContext("2d");
  if (!alvo) return;
  auxiliar.width = dw;
  auxiliar.height = dh;
  alvo.clearRect(0, 0, dw, dh);
  // Estica a partir da borda de cima e do centro horizontal: numa boca que
  // abre, o lábio superior fica onde está e só o inferior desce, enquanto os
  // cantos se afastam em torno do mesmo eixo.
  const larguraFinal = dw * esticarX;
  // ⚠️ `fonteAltura` encolhe a BANDA DE ORIGEM sem encolher o destino. Existe
  // porque a pálpebra precisa de pele lisa e, no rosto dela, a faixa livre
  // entre a base do olho (0,2805 da arte) e o topo da boca (0,3199) tem 0,0394
  // de altura — MENOS do que a altura da região do olho, 0,0504. Com a banda
  // inteira não havia onde pousar sem pegar o olho por cima ou a boca por
  // baixo. Pele lisa esticada não denuncia nada; olho duplicado denuncia tudo.
  alvo.drawImage(imagem, sx, sy, sw, sh * fonteAltura, (dw - larguraFinal) / 2, 0, larguraFinal, dh * esticarY);

  // ⚠️ Quando `esticarY` é menor que 1, a borda DE BAIXO do que foi desenhado é
  // um corte reto no meio da região — e a máscara radial só dissolve o
  // perímetro, não esse corte interno. Na pálpebra descendo isso aparecia como
  // uma barra clara de aresta reta atravessando o olho, medido em 23/08/2026.
  // Aqui a faixa logo acima do corte é dissolvida, para a pálpebra terminar em
  // degradê como termina uma pálpebra.
  // ⚠️ Vale TAMBÉM em `esticarY == 1`. Era `< 1`, e por isso a pálpebra
  // totalmente fechada — o caso mais frequente, porque toda piscada passa por
  // ele — terminava numa aresta reta: a máscara circular ainda está ~0,11
  // opaca na borda de baixo de um remendo de 60x46, e isso lê como retângulo
  // colado no rosto. Medido em 23/08/2026 na escada de `definirPiscar`.
  if (dissolverCorte) {
    const corte = dh * Math.min(1, esticarY);
    const faixa = Math.max(2, dh * 0.28);
    const dissolver = alvo.createLinearGradient(0, corte - faixa, 0, corte);
    dissolver.addColorStop(0, "rgba(0,0,0,0)");
    dissolver.addColorStop(1, "rgba(0,0,0,1)");
    alvo.globalCompositeOperation = "destination-out";
    alvo.fillStyle = dissolver;
    alvo.fillRect(0, corte - faixa, dw, faixa);
    alvo.globalCompositeOperation = "source-over";
  }

  /**
   * ⚠️ A MÁSCARA PRECISA SER ELIPSE, NÃO CÍRCULO.
   *
   * Ela era um círculo de raio `max(dw, dh) / 2` com núcleo opaco até 0,55 do
   * raio. Numa região larga e baixa isso NÃO dissolve as bordas de cima e de
   * baixo: a sobrancelha desenha 66x26px de destino, o raio vira 33 e o núcleo
   * opaco vai até 18 — mas do centro até a borda de cima há só 13. As duas
   * bordas horizontais ficavam DENTRO do núcleo, isto é, corte reto.
   *
   * Medido em 23/08/2026 pelo degrau COERENTE — a média com sinal do salto de
   * uma linha para a seguinte, com a tendência local removida, só nas colunas
   * da testa. Costura tem amplitude baixa e coerência alta: o que o olho vê é a
   * reta, não o contraste. Com máscara circular: 5,42 em "pensando" e 4,37 em
   * "ouvindo", e em "pensando" sempre na MESMA linha — y 192 a 194 num canvas
   * de 920, que é o topo da região da sobrancelha (0,206 da arte) depois do
   * empurrão. Com elipse: 2,49 e 2,32, e a pior linha passa a espalhar (208 a
   * 223), isto é, deixou de haver aresta.
   *
   * ⚠️ CORREÇÃO DE UM ERRO MEU DE INSTRUMENTAÇÃO, escrito aqui para não se
   * repetir: cheguei a esta linha primeiro lendo o campo `naLinha` de
   * `medir-costura`, que é a linha do CISALHAMENTO e não a do excesso. O
   * número batia por coincidência. Com o campo certo, o pico de excesso local
   * daquela prova está em 0,465 da altura — gola e colar do polo, o falso
   * positivo de arte que a própria prova já documenta —, e não tem relação com
   * a sobrancelha.
   *
   * Escalando o eixo Y antes de criar o gradiente, o mesmo círculo vira uma
   * elipse com a proporção da região, e a dissolução chega às quatro bordas.
   *
   * ⚠️ E É OPCIONAL, porque aplicá-la a TUDO regrediu a boca — conferido na
   * escada 0→1 em recorte 5x, lado a lado: com elipse, o lábio de baixo perdeu
   * o rosa e o realce, porque a máscara cai rápido no eixo curto e o desenho
   * fica translúcido justamente onde precisa ser opaco. A boca e a pálpebra têm
   * proporção perto de 1 (60x46 e 93x48) e foram aprovadas OLHANDO com o
   * círculo; quem é larga e baixa de verdade é a sobrancelha, 66x26. A correção
   * vai onde o defeito foi medido, e não onde é elegante.
   */
  alvo.globalCompositeOperation = "destination-in";
  alvo.save();
  if (mascaraElipse) {
    alvo.translate(dw / 2, dh * focoDaMascara);
    alvo.scale(1, dh / dw);
    const mascara = alvo.createRadialGradient(0, 0, 0, 0, 0, dw / 2);
    mascara.addColorStop(0, "rgba(0,0,0,1)");
    mascara.addColorStop(0.55, "rgba(0,0,0,1)");
    mascara.addColorStop(1, "rgba(0,0,0,0)");
    alvo.fillStyle = mascara;
    // Generoso de propósito: no espaço escalado o retângulo precisa cobrir o
    // canvas inteiro, senão `destination-in` apaga o que ficou de fora.
    alvo.fillRect(-dw, -dw * 4, dw * 2, dw * 8);
  } else {
    const raio = Math.max(dw, dh) / 2;
    const mascara = alvo.createRadialGradient(dw / 2, dh * focoDaMascara, 0, dw / 2, dh * focoDaMascara, raio);
    mascara.addColorStop(0, "rgba(0,0,0,1)");
    mascara.addColorStop(0.55, "rgba(0,0,0,1)");
    mascara.addColorStop(1, "rgba(0,0,0,0)");
    alvo.fillStyle = mascara;
    alvo.fillRect(0, 0, dw, dh);
  }
  alvo.restore();

  ctx.drawImage(auxiliar, dx + empurrarX, dy + empurrarY);
}

/** Camada de pálpebras registrada pixel a pixel sobre a arte inteira. */
function desenharPalpebras(ctx, imagemPalpebras, imagem, cena, fechamento) {
  const nivel = Math.max(0, Math.min(1, Number(fechamento) || 0));
  if (
    nivel <= 0.001
    || !imagemPalpebras?.complete
    || imagemPalpebras.naturalWidth !== imagem.naturalWidth
    || imagemPalpebras.naturalHeight !== imagem.naturalHeight
  ) return;

  const opacidade = nivel * nivel * (3 - 2 * nivel);
  ctx.save();
  ctx.globalAlpha = opacidade;
  ctx.drawImage(imagemPalpebras, cena.x, cena.y, cena.largura, cena.altura);
  ctx.restore();
}

export function criarAvatar(canvas, opcoes = {}) {
  const ctx = canvas.getContext("2d");
  const imagem = new Image();
  imagem.src = opcoes.imagem ?? "./assets/personagem.png";
  const imagemPalpebras = new Image();
  imagemPalpebras.src = opcoes.palpebras ?? "./assets/palpebras-overlay-v2.png";
  const auxiliar = document.createElement("canvas");
  const deslocamentoHorizontal = Number.isFinite(opcoes.deslocamentoHorizontal)
    ? Math.max(-0.12, Math.min(0.12, opcoes.deslocamentoHorizontal))
    : 0;
  const zoomBase = Number.isFinite(opcoes.zoomBase)
    ? Math.max(0.78, Math.min(1.08, opcoes.zoomBase))
    : 1;
  const respostaDoZoom = Number.isFinite(opcoes.respostaDoZoom)
    ? Math.max(0, Math.min(1, opcoes.respostaDoZoom))
    : 1;

  const entrada = { abertura: 0, largura: 1, estado: "parada", piscarForcado: null };
  const suave = {
    abertura: 0,
    largura: 1,
    inclinacao: 0,
    sobrancelha: 0,
    assimetriaSobrancelha: 0,
    energia: 0.34,
    aproximar: 0,
    respiracao: 0.55,
    balanco: 0.28,
  };
  const olhar = { x: 0, y: 0 };
  let olharAlvo = { x: 0, y: 0 };
  let olharTrocaEm = proximoInstanteDoOlhar(0);
  let piscarEm = proximoPiscar(0);
  let piscarIniciadoEm = -1;
  let carregada = false;
  let quadro = 0;
  let ultimoQuadro = null;
  let tempoAtual = 0;
  const inicio = performance.now();
  /**
   * ⚠️ A PREFERÊNCIA PODE MUDAR COM A PÁGINA ABERTA, e ela era lida uma vez só
   * na criação. Auditoria de 23/08/2026: trocando para `reduce` sem recarregar,
   * o canvas continuava animando — hashes consecutivos diferentes. Quem liga
   * movimento reduzido no meio de uma reunião não vai recarregar a página do
   * cliente para que a decisão valha.
   */
  const consultaDeMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
  let semMovimento = consultaDeMovimento?.matches ?? false;
  consultaDeMovimento?.addEventListener?.("change", (e) => {
    semMovimento = e.matches;
    if (semMovimento) olharAlvo = { x: 0, y: 0 };
  });

  imagem.onload = () => { carregada = true; };
  /**
   * ⚠️ A ARTE FALHAVA EM SILÊNCIO TOTAL. Achado por auditoria de resiliência em
   * 24/08/2026: só existia `onload`. Se o PNG não carregar — 404, disco, cache
   * corrompido, CSP do hospedeiro barrando a imagem —, `carregada` fica falso
   * para sempre, `desenhar` sai na primeira linha e a tela mostra um retângulo
   * VAZIO. Num produto cuja interface É a personagem, isso é falha total sem
   * uma palavra de aviso, que é o pior desfecho desta casa.
   *
   * O avatar não conhece a tela, então ele não decide o que mostrar: apenas
   * avisa quem o criou. Quem sabe falar com a pessoa é `experiencia.js`.
   */
  imagem.onerror = () => {
    carregada = false;
    opcoes.aoFalharAArte?.(imagem.src);
  };

  function ajustarTamanho() {
    const densidade = Math.min(window.devicePixelRatio || 1, 2);
    const largura = Math.round(canvas.clientWidth * densidade);
    const altura = Math.round(canvas.clientHeight * densidade);
    if (largura > 0 && canvas.width !== largura) canvas.width = largura;
    if (altura > 0 && canvas.height !== altura) canvas.height = altura;
  }

  /** Onde a arte inteira cabe no canvas, preservando a proporção. */
  function enquadrar(W, H, zoom) {
    const proporcao = imagem.naturalWidth / imagem.naturalHeight;
    // Ela é ancorada embaixo: o corte, quando falta espaço, tem de cair na
    // barra da calça e nunca na cabeça.
    let altura = H * zoom;
    let largura = altura * proporcao;
    if (largura > W * 1.35) { largura = W * 1.35; altura = largura / proporcao; }
    return {
      x: (W - largura) / 2 + largura * deslocamentoHorizontal,
      y: H - altura,
      largura,
      altura,
      escala: largura / imagem.naturalWidth,
      naturalW: imagem.naturalWidth,
      naturalH: imagem.naturalHeight,
    };
  }

  function desenhar(agora) {
    quadro = requestAnimationFrame(desenhar);
    if (!carregada) return;
    ajustarTamanho();
    const W = canvas.width;
    const H = canvas.height;
    if (W < 8 || H < 8) return;

    const t = agora - inicio;
    tempoAtual = t;
    const deltaMs = ultimoQuadro === null ? 16.67 : Math.max(0, agora - ultimoQuadro);
    ultimoQuadro = agora;
    const postura = limitarAtuacaoFacial(posturaDoEstado(entrada.estado), semMovimento);
    const tau = postura.transicaoMs;
    const aberturaAlvo = Math.min(entrada.abertura, postura.aberturaMaximaBoca);
    suave.abertura = aproximarComTempo(suave.abertura, aberturaAlvo, deltaMs, 55);
    suave.largura = aproximarComTempo(suave.largura, entrada.largura, deltaMs, 75);
    suave.inclinacao = aproximarComTempo(suave.inclinacao, postura.inclinacao, deltaMs, tau);
    suave.sobrancelha = aproximarComTempo(suave.sobrancelha, postura.sobrancelha, deltaMs, tau);
    suave.assimetriaSobrancelha = aproximarComTempo(
      suave.assimetriaSobrancelha,
      postura.assimetriaSobrancelha,
      deltaMs,
      tau,
    );
    suave.energia = aproximarComTempo(suave.energia, postura.energia, deltaMs, tau);
    suave.aproximar = aproximarComTempo(suave.aproximar, postura.aproximar, deltaMs, tau);
    suave.respiracao = aproximarComTempo(suave.respiracao, postura.respiracao, deltaMs, tau);
    suave.balanco = aproximarComTempo(suave.balanco, postura.balanco, deltaMs, tau);

    if (!semMovimento) {
      if (t >= olharTrocaEm) {
        olharAlvo = proximoAlvoDoOlhar(entrada.estado);
        olharTrocaEm = proximoInstanteDoOlhar(t, entrada.estado);
      }
    } else {
      olharAlvo = { x: 0, y: 0 };
    }
    olhar.x = aproximarComTempo(olhar.x, olharAlvo.x, deltaMs, semMovimento ? 0 : 180);
    olhar.y = aproximarComTempo(olhar.y, olharAlvo.y, deltaMs, semMovimento ? 0 : 180);

    const cena = enquadrar(W, H, zoomBase + suave.aproximar * respostaDoZoom);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const peso = semMovimento ? 0 : deslocamentoDePeso(t);
    const ar = semMovimento ? 0 : respiracao(t) * suave.respiracao;
    const balanco = semMovimento ? 0 : oscilacao(t, 7_300) * suave.balanco;

    /**
     * Uma única matriz move corpo e rosto.
     *
     * A versão anterior recompunha o PNG em 256 faixas sobrepostas. Mesmo com
     * os deslocamentos alinhados nos extremos, cada borda passava novamente
     * pelo antialiasing e pela composição alfa do canvas; o resultado eram
     * filetes horizontais periódicos no rosto, cabelo e braços. Um desenho
     * integral elimina essas bordas internas por construção.
     *
     * A matriz abaixo é a secante da curva original entre o centro da boca e a
     * base: preserva exatamente os dois pontos e interpola todo o corpo sem
     * criar uma borda de composição. Os remendos faciais permanecem registrados
     * porque são desenhados antes de restaurar esta mesma matriz.
     */
    const pivoY = cena.y + CORPO.pivoY * cena.altura;
    const energiaDoCorpo = 0.5 + suave.energia * 0.5;
    const deslocamentoHorizontalBase = (
      peso * 0.007 + balanco * 0.002 + olhar.x * 0.0012
    ) * cena.largura;
    const giroBase = peso * 0.004 + suave.inclinacao * 0.004;
    const deslocamentoVerticalBase = ar * 0.0018 + suave.inclinacao * 0.0025;
    const rostoY = cena.y + ROSTO.boca.centroY * cena.altura;
    const baseY = cena.y + cena.altura;
    const forcaDoRosto = arrastoNaAltura(ROSTO.boca.centroY) * energiaDoCorpo;
    const forcaDaBase = arrastoNaAltura(1) * energiaDoCorpo;
    const deslocamentoRostoX = forcaDoRosto * (
      deslocamentoHorizontalBase + giroBase * (pivoY - rostoY)
    );
    const deslocamentoBaseX = forcaDaBase * (
      deslocamentoHorizontalBase + giroBase * (pivoY - baseY)
    );
    const deslocamentoRostoY = forcaDoRosto * deslocamentoVerticalBase * cena.altura;
    const deslocamentoBaseY = forcaDaBase * deslocamentoVerticalBase * cena.altura;
    const distanciaVertical = baseY - rostoY;
    const cisalhamentoX = (deslocamentoBaseX - deslocamentoRostoX) / distanciaVertical;
    const escalaVerticalAdicional = (
      deslocamentoBaseY - deslocamentoRostoY
    ) / distanciaVertical;
    const translacaoX = deslocamentoRostoX - cisalhamentoX * rostoY;
    const translacaoY = deslocamentoRostoY - escalaVerticalAdicional * rostoY;

    ctx.save();
    ctx.transform(
      1,
      0,
      cisalhamentoX,
      1 + escalaVerticalAdicional,
      translacaoX,
      translacaoY,
    );
    ctx.drawImage(imagem, cena.x, cena.y, cena.largura, cena.altura);

    for (const cenho of [ROSTO.sobrancelhaEsquerda, ROSTO.sobrancelhaDireita]) {
      const direcao = cenho === ROSTO.sobrancelhaEsquerda ? 1 : -1;
      const movimento = suave.sobrancelha + suave.assimetriaSobrancelha * direcao;
      if (Math.abs(movimento) > 0.005) {
        desenharRegiao(ctx, auxiliar, imagem, cena, cenho, {
          esticarY: 1,
          empurrarY: -movimento * cena.altura * 0.006,
          // 66x26px de destino: a única região larga e baixa o bastante para o
          // círculo deixar as bordas de cima e de baixo dentro do núcleo opaco.
          mascaraElipse: true,
        });
      }
    }

    // O patch é redesenhado também no repouso: abertura zero é a própria arte
    // original, portanto não há a troca súbita que criava a boca "colada".
    desenharBocaContinua(ctx, imagem, cena, suave.abertura, suave.largura);

    // A pálpebra forçada existe para poder JULGAR a piscada. Na atuação ao vivo,
    // os perfis atuais usam 175–210 ms e intervalos irregulares de 2,8–9 s; uma
    // captura isolada ainda pode não pegá-la, por isso a escada determinística
    // continua disponível para a auditoria visual.
    const forcado = entrada.piscarForcado;
    if (forcado !== null && forcado !== undefined) {
      desenharPalpebras(ctx, imagemPalpebras, imagem, cena, forcado);
    } else {
      if (piscarIniciadoEm < 0 && t >= piscarEm) piscarIniciadoEm = t;
      if (piscarIniciadoEm >= 0) {
        const decorrido = t - piscarIniciadoEm;
        if (decorrido > postura.duracaoPiscarMs) {
          piscarIniciadoEm = -1;
          piscarEm = proximoPiscar(t, entrada.estado);
        } else {
          desenharPalpebras(
            ctx,
            imagemPalpebras,
            imagem,
            cena,
            fechamentoDaPalpebra(decorrido, postura.duracaoPiscarMs),
          );
        }
      }
    }
    ctx.restore();
  }

  quadro = requestAnimationFrame(desenhar);

  return {
    definirEstado(estado) {
      if (entrada.estado === estado) return;
      entrada.estado = estado;
      olharTrocaEm = tempoAtual;
      if (piscarIniciadoEm < 0) piscarEm = proximoPiscar(tempoAtual, estado);
    },
    definirPiscar(fechamento) {
      entrada.piscarForcado = fechamento === null || fechamento === undefined
        ? null
        : Math.max(0, Math.min(1, fechamento));
    },
    definirBoca(abertura, largura = 1) {
      entrada.abertura = Math.max(0, Math.min(1, abertura));
      entrada.largura = largura;
    },
    // Hotfix de apresentação: a arte inteira preserva braços e mangas sem
    // emendas. A interface continua compatível, mas não articula os braços.
    definirGestoBracos() {},
    diagnosticoRigBracos() {
      return {
        fonte: "arte-inteira-segura",
        modo: "seguro",
        gestoSolicitado: "repouso",
        gestoRenderizado: "repouso",
        callbacksFalha: 0,
      };
    },
    parar() { cancelAnimationFrame(quadro); },
  };
}
