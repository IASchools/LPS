/**
 * Boca contínua derivada apenas da personagem original.
 *
 * Em repouso, o recorte é byte a byte igual à arte base. Durante a fala,
 * somente os pixels abaixo da linha real dos lábios são deslocados; a pele
 * volta gradualmente à geometria original antes do fim do pequeno recorte.
 */

export const GEOMETRIA_BOCA_CONTINUA = Object.freeze({
  imagem: Object.freeze({ largura: 1254, altura: 1144 }),
  patch: Object.freeze({ x: 528, y: 358, largura: 120, altura: 96 }),
  cantoEsquerdo: 540,
  cantoDireito: 635,
  aberturaMaximaPx: 12,
  recuperacaoPelePx: 44,
  dissolucaoBordaPx: 8,
  linhaDosLabios: Object.freeze([
    [540, 376], [545, 381], [550, 386], [555, 389], [560, 392],
    [565, 394], [570, 397], [575, 398], [580, 398], [585, 398],
    [590, 399], [595, 399], [600, 400], [605, 400], [610, 400],
    [615, 400], [620, 399], [625, 397], [630, 396], [635, 388],
  ]),
});

const cachePorImagem = new WeakMap();

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function suavizar01(t) {
  const x = limitar(t, 0, 1);
  return x * x * (3 - 2 * x);
}

// A dissolução é invariável: só os pixels do anel externo têm alpha diferente
// de 1. Prepará-los uma vez evita recalcular distância e curva para os 11.520
// pixels do patch a cada nova pose, sem mudar nenhum byte renderizado.
const DISSOLUCAO_DA_BORDA = (() => {
  const { largura, altura } = GEOMETRIA_BOCA_CONTINUA.patch;
  const borda = GEOMETRIA_BOCA_CONTINUA.dissolucaoBordaPx;
  const indices = [];
  const alphas = [];

  for (let y = 0; y < altura; y += 1) {
    for (let x = 0; x < largura; x += 1) {
      const distancia = Math.min(x, y, largura - 1 - x, altura - 1 - y);
      if (distancia >= borda) continue;
      indices.push((y * largura + x) * 4 + 3);
      alphas.push(suavizar01(distancia / borda));
    }
  }

  return Object.freeze({ indices, alphas });
})();

function interpolarLinhaDosLabios(x) {
  const pontos = GEOMETRIA_BOCA_CONTINUA.linhaDosLabios;
  if (x <= pontos[0][0]) return pontos[0][1];
  if (x >= pontos[pontos.length - 1][0]) return pontos[pontos.length - 1][1];

  let indice = 0;
  while (indice + 1 < pontos.length && x > pontos[indice + 1][0]) indice += 1;

  const p0 = pontos[Math.max(0, indice - 1)][1];
  const p1 = pontos[indice][1];
  const p2 = pontos[indice + 1][1];
  const p3 = pontos[Math.min(pontos.length - 1, indice + 2)][1];
  const t = (x - pontos[indice][0]) / (pontos[indice + 1][0] - pontos[indice][0]);
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    2 * p1
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function perfilHorizontal(x, larguraDaFala) {
  const { cantoEsquerdo, cantoDireito } = GEOMETRIA_BOCA_CONTINUA;
  const u = (x - cantoEsquerdo) / (cantoDireito - cantoEsquerdo);
  if (u <= 0 || u >= 1) return 0;

  const largura = limitar(larguraDaFala, 0.88, 1.10);
  const expoente = 1.28 - (largura - 1) * 2.4;
  return Math.pow(Math.sin(Math.PI * u), expoente);
}

function percentil(valores, fracao) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.round((ordenados.length - 1) * fracao)];
}

function corDaCavidadeDerivadaDaArte(pixels) {
  const { patch, linhaDosLabios } = GEOMETRIA_BOCA_CONTINUA;
  const canais = [[], [], []];

  for (const [xAbsoluto, yAbsoluto] of linhaDosLabios.slice(2, -2)) {
    const x = limitar(Math.round(xAbsoluto - patch.x), 0, patch.largura - 1);
    const y = limitar(Math.round(yAbsoluto - patch.y), 0, patch.altura - 1);
    const i = (y * patch.largura + x) * 4;
    canais[0].push(pixels[i]);
    canais[1].push(pixels[i + 1]);
    canais[2].push(pixels[i + 2]);
  }

  return [
    limitar(Math.round(percentil(canais[0], 0.35) * 0.72), 92, 116),
    limitar(Math.round(percentil(canais[1], 0.35) * 0.78 + 9), 32, 43),
    limitar(Math.round(percentil(canais[2], 0.35) * 0.55 + 30), 30, 38),
  ];
}

function amostrarVertical(pixels, x, y, amostra) {
  const { largura, altura } = GEOMETRIA_BOCA_CONTINUA.patch;
  const xInteiro = limitar(Math.round(x), 0, largura - 1);
  const yLimitado = limitar(y, 0, altura - 1);
  const y0 = Math.floor(yLimitado);
  const y1 = Math.min(altura - 1, y0 + 1);
  const mistura = yLimitado - y0;
  const i0 = (y0 * largura + xInteiro) * 4;
  const i1 = (y1 * largura + xInteiro) * 4;
  amostra[0] = pixels[i0] + (pixels[i1] - pixels[i0]) * mistura;
  amostra[1] = pixels[i0 + 1] + (pixels[i1 + 1] - pixels[i0 + 1]) * mistura;
  amostra[2] = pixels[i0 + 2] + (pixels[i1 + 2] - pixels[i0 + 2]) * mistura;
  amostra[3] = pixels[i0 + 3] + (pixels[i1 + 3] - pixels[i0 + 3]) * mistura;
  return amostra;
}

function destinoDaFonte(yFonte, linha, aberturaPx, recuperacaoPx) {
  const q = limitar((yFonte - linha) / recuperacaoPx, 0, 1);
  return yFonte + aberturaPx * (1 - suavizar01(q));
}

function fonteDoDestino(yDestino, linha, aberturaPx, recuperacaoPx) {
  let inferior = linha;
  let superior = linha + recuperacaoPx;
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const meio = (inferior + superior) / 2;
    if (destinoDaFonte(meio, linha, aberturaPx, recuperacaoPx) < yDestino) {
      inferior = meio;
    } else {
      superior = meio;
    }
  }
  return (inferior + superior) / 2;
}

function deformarPixelsNoDestino(origem, destino, abertura, larguraDaFala, corForcada) {
  const geometria = GEOMETRIA_BOCA_CONTINUA;
  const { patch } = geometria;
  const t = limitar(Number.isFinite(abertura) ? abertura : 0, 0, 1);
  const progresso = suavizar01(t);
  destino.set(origem);
  const corCavidade = corForcada ?? corDaCavidadeDerivadaDaArte(origem);

  // O único volume colorido adicional é a língua, derivada do mesmo vinho da
  // arte. Dentes sintetizados por faixa viram uma lâmina clara nas aberturas
  // médias e grandes; a arte-base não oferece geometria suficiente para eles.
  const corLingua = [
    limitar(corCavidade[0] * 1.30, 124, 148),
    limitar(corCavidade[1] * 1.36, 48, 62),
    limitar(corCavidade[2] * 1.55, 50, 66),
  ];
  const aberturaCentral = geometria.aberturaMaximaPx * progresso;
  const entradaLingua = suavizar01((aberturaCentral - 5.8) / 3.8);

  if (progresso === 0) return destino;
  const amostra = [0, 0, 0, 0];

  // Perfil, linha e centro horizontal dependem apenas da coluna. Percorrer as
  // colunas por fora evita refazer seno, potência e interpolação 96 vezes para
  // a mesma coordenada; cada pixel continua seguindo exatamente a mesma conta.
  for (let x = 0; x < patch.largura; x += 1) {
    const xAbsoluto = patch.x + x + 0.5;
    const perfil = perfilHorizontal(xAbsoluto, larguraDaFala);
    if (perfil <= 0) continue;

    const linha = interpolarLinhaDosLabios(xAbsoluto);
    const aberturaPx = geometria.aberturaMaximaPx * progresso * perfil;
    const fimDaRecuperacao = linha + geometria.recuperacaoPelePx;
    const u = limitar(
      (xAbsoluto - geometria.cantoEsquerdo)
        / (geometria.cantoDireito - geometria.cantoEsquerdo),
      0,
      1,
    );
    const centroHorizontal = Math.pow(Math.sin(Math.PI * u), 0.82);

    for (let y = 0; y < patch.altura; y += 1) {
      const yTopo = patch.y + y;
      const yCentro = yTopo + 0.5;
      if (yTopo + 1 <= linha || yTopo >= fimDaRecuperacao) continue;

      const fundoDaCavidade = linha + aberturaPx;
      const cobertura = limitar(
        Math.min(yTopo + 1, fundoDaCavidade) - Math.max(yTopo, linha),
        0,
        1,
      );

      let yFonte = yCentro;
      if (yCentro >= fundoDaCavidade && yCentro < fimDaRecuperacao) {
        yFonte = fonteDoDestino(yCentro, linha, aberturaPx, geometria.recuperacaoPelePx);
      } else if (yCentro > linha && yCentro < fundoDaCavidade) {
        yFonte = linha;
      }

      amostrarVertical(origem, x, yFonte - patch.y - 0.5, amostra);
      const i = (y * patch.largura + x) * 4;
      const profundidade = aberturaPx > 0
        ? limitar((yCentro - linha) / aberturaPx, 0, 1)
        : 0;
      // A cavidade precisa ter volume: mais escura nos cantos e no teto, com
      // um ganho suave de luz em direção ao centro e à parte inferior. O
      // preenchimento uniforme anterior virava uma faixa marrom plana.
      const luzInterna = 0.64 + centroHorizontal * 0.18 + profundidade * 0.10;
      let interiorR = corCavidade[0] * luzInterna;
      let interiorG = corCavidade[1] * luzInterna;
      let interiorB = corCavidade[2] * luzInterna;

      // A língua é só um volume quente e discreto no fundo, nunca uma elipse
      // desenhada por cima. Ela acompanha a curvatura da abertura e inexiste
      // nas consoantes e aberturas pequenas.
      const faixaLingua = suavizar01((profundidade - 0.52) / 0.34);
      const volumeLingua = entradaLingua
        * Math.pow(centroHorizontal, 1.55)
        * faixaLingua
        * 0.38;
      const pesoLingua = limitar(volumeLingua, 0, 1);
      interiorR += (corLingua[0] - interiorR) * pesoLingua;
      interiorG += (corLingua[1] - interiorG) * pesoLingua;
      interiorB += (corLingua[2] - interiorB) * pesoLingua;

      destino[i] = amostra[0] * (1 - cobertura) + interiorR * cobertura;
      destino[i + 1] = amostra[1] * (1 - cobertura) + interiorG * cobertura;
      destino[i + 2] = amostra[2] * (1 - cobertura) + interiorB * cobertura;
      destino[i + 3] = amostra[3];
    }
  }

  return destino;
}

/**
 * Função pura: recebe o RGBA do recorte 120x96 e devolve um novo bitmap.
 */
export function deformarPixelsDaBoca(origem, abertura, larguraDaFala = 1, corForcada = null) {
  const { patch } = GEOMETRIA_BOCA_CONTINUA;
  if (origem.length !== patch.largura * patch.altura * 4) {
    throw new RangeError(`patch RGBA deve ter ${patch.largura}x${patch.altura} pixels`);
  }

  return deformarPixelsNoDestino(
    origem,
    new Uint8ClampedArray(origem.length),
    abertura,
    larguraDaFala,
    corForcada,
  );
}

function criarCanvas(largura, altura) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  return canvas;
}

function prepararImagem(imagem) {
  const existente = cachePorImagem.get(imagem);
  if (existente) return existente;

  const { patch, imagem: dimensoesEsperadas } = GEOMETRIA_BOCA_CONTINUA;
  if (imagem.naturalWidth !== dimensoesEsperadas.largura
    || imagem.naturalHeight !== dimensoesEsperadas.altura) {
    throw new RangeError(
      `personagem inesperada: ${imagem.naturalWidth}x${imagem.naturalHeight}; esperado `
      + `${dimensoesEsperadas.largura}x${dimensoesEsperadas.altura}`,
    );
  }

  const origemCanvas = criarCanvas(patch.largura, patch.altura);
  const origemCtx = origemCanvas.getContext("2d", { willReadFrequently: true });
  origemCtx.drawImage(
    imagem,
    patch.x,
    patch.y,
    patch.largura,
    patch.altura,
    0,
    0,
    patch.largura,
    patch.altura,
  );
  const origem = origemCtx.getImageData(0, 0, patch.largura, patch.altura).data;
  const quadroCanvas = criarCanvas(patch.largura, patch.altura);
  const quadroCtx = quadroCanvas.getContext("2d");
  const estado = {
    origem,
    corCavidade: corDaCavidadeDerivadaDaArte(origem),
    quadroCanvas,
    quadroCtx,
    abertura: NaN,
    largura: NaN,
  };
  cachePorImagem.set(imagem, estado);
  return estado;
}

/**
 * Desenha no sistema de coordenadas já usado por avatar.js.
 * A chamada ocorre inclusive em abertura zero para não haver troca súbita.
 */
export function desenharBocaContinua(
  ctx,
  imagem,
  cena,
  abertura,
  larguraDaFala = 1,
  deslocX = 0,
  deslocY = 0,
) {
  const estado = prepararImagem(imagem);
  const aberturaLimitada = limitar(Number.isFinite(abertura) ? abertura : 0, 0, 1);
  const larguraLimitada = limitar(
    Number.isFinite(larguraDaFala) ? larguraDaFala : 1,
    0.88,
    1.10,
  );

  /**
   * ⚠️ O CACHE NUNCA ACERTAVA, E ISSO CUSTAVA UM QUADRO.
   *
   * A comparação era por igualdade exata, e `suave.abertura` converge de forma
   * ASSINTÓTICA: ela chega perto do alvo e continua mudando na quinta casa
   * decimal por dezenas de quadros. Ou seja, o cache praticamente nunca batia e
   * este bloco rodava quase todo quadro — cerca de 23 mil operações de pixel
   * (dois laços sobre 120x96) mais uma alocação de 46 KB de `ImageData`.
   *
   * Medido em 24/08/2026 por `medir-desempenho.mjs`, em 1600x1000: com o canvas
   * escondido a perda de quadro ia a ZERO, e com ele voltava a um quinto dos
   * quadros. O desenho é o custo dominante, e este era o pedaço caro dele.
   *
   * A chave passa a ser QUANTIZADA. O passo de 0,004 sobre uma abertura máxima
   * de 8px vale 0,032px na tela — abaixo de um pixel, e portanto invisível —,
   * enquanto a escada que `capturar-boca.mjs` percorre tem degraus de 0,01 para
   * cima e continua distinguível quadro a quadro. É o mesmo raciocínio do meio
   * pixel de sobreposição: o olho decide o limite, não a aritmética.
   */
  const PASSO_DO_CACHE = 0.004;
  const chaveAbertura = Math.round(aberturaLimitada / PASSO_DO_CACHE) * PASSO_DO_CACHE;
  const chaveLargura = Math.round(larguraLimitada / PASSO_DO_CACHE) * PASSO_DO_CACHE;

  if (estado.abertura !== chaveAbertura || estado.largura !== chaveLargura) {
    // ⚠️ O `ImageData` é reaproveitado: alocar 46 KB por quadro dá trabalho ao
    // coletor de lixo justamente durante a animação, e o coletor rodando é uma
    // pausa visível.
    const quadro = estado.quadroImagem ?? (estado.quadroImagem = estado.quadroCtx.createImageData(
      GEOMETRIA_BOCA_CONTINUA.patch.largura,
      GEOMETRIA_BOCA_CONTINUA.patch.altura,
    ));
    deformarPixelsNoDestino(
      estado.origem,
      quadro.data,
      chaveAbertura,
      chaveLargura,
      estado.corCavidade,
    );

    for (let j = 0; j < DISSOLUCAO_DA_BORDA.indices.length; j += 1) {
      const i = DISSOLUCAO_DA_BORDA.indices[j];
      quadro.data[i] = Math.round(quadro.data[i] * DISSOLUCAO_DA_BORDA.alphas[j]);
    }

    estado.quadroCtx.putImageData(quadro, 0, 0);
    estado.abertura = chaveAbertura;
    estado.largura = chaveLargura;
  }

  const patch = GEOMETRIA_BOCA_CONTINUA.patch;
  ctx.drawImage(
    estado.quadroCanvas,
    cena.x + patch.x * cena.escala + deslocX,
    cena.y + patch.y * cena.escala + deslocY,
    patch.largura * cena.escala,
    patch.altura * cena.escala,
  );
}
