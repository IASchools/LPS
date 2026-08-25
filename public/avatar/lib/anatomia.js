/**
 * Onde ficam as partes dela na arte recortada.
 *
 * Tudo normalizado (0 a 1) sobre `public/assets/personagem.png`, que tem
 * 1254x1144 depois do recorte do fundo e do corte de rodapé. Guardar em fração
 * e não em pixel é o que permite ela ocupar qualquer tamanho de tela sem que as
 * regiões escorreguem do lugar.
 *
 * ⚠️ As medidas de rosto vieram da arte ORIGINAL, de 1254x1254. O recorte tirou
 * 110 px do rodapé, então todo Y precisou ser reescalado por 1254/1144. Ignorar
 * isso desloca a boca para o queixo — a primeira versão animou a região errada
 * justamente por misturar dois sistemas de coordenadas.
 */

const ALTURA_ORIGINAL = 1254;
const ALTURA_RECORTADA = 1144;
const FATOR_Y = ALTURA_ORIGINAL / ALTURA_RECORTADA;

function reescalarY(fracaoNaArteOriginal) {
  return fracaoNaArteOriginal * FATOR_Y;
}

function regiao(centroX, centroYOriginal, raioX, raioYOriginal) {
  return {
    centroX,
    centroY: reescalarY(centroYOriginal),
    raioX,
    raioY: reescalarY(raioYOriginal),
  };
}

export const ROSTO = {
  boca: regiao(0.4661, 0.3158, 0.0460, 0.0240),
  olhoEsquerdo: regiao(0.4394, 0.2329, 0.0300, 0.0230),
  olhoDireito: regiao(0.5231, 0.2432, 0.0350, 0.0260),
  sobrancelhaEsquerda: regiao(0.4394, 0.2010, 0.0330, 0.0130),
  sobrancelhaDireita: regiao(0.5245, 0.2090, 0.0370, 0.0140),
};

/**
 * Como o movimento se distribui ao longo do corpo.
 *
 * ⚠️ A primeira versão fatiava o corpo em quatro faixas com deslocamento
 * próprio. Em tela grande isso abriu uma costura reta atravessando o rosto
 * dela, na emenda entre cabeça e ombros — visível na captura de 22/08/2026 e o
 * defeito mais grave que a tela já teve.
 *
 * A correção é não ter emenda: o corpo é redesenhado em muitas fatias finas e o
 * arrasto de cada uma vem de uma CURVA CONTÍNUA da altura. Fatias vizinhas
 * diferem por frações de pixel, então não há degrau onde uma linha possa
 * aparecer.
 */
/**
 * A inclinação da linha dos lábios, em pixels de queda por pixel de largura.
 *
 * ⚠️ Medida em 23/08/2026 no canvas RENDIDO, numa janela apertada em torno do
 * centro conhecido da boca — janela larga pega cabelo e sombra de pescoço e
 * devolve lixo, que foi o primeiro resultado. Regressão linear sobre o pixel
 * mais escuro de cada coluna com a boca fechada: +0,0533, ou +3,05°.
 *
 * Existe porque a fenda da boca era desenhada HORIZONTAL e, pior, o medidor
 * acusava −3,53° no que estava desenhado: a boca cruzava a linha dos lábios em
 * diagonal, com uma ponta caindo fora do canto, sobre a pele. Duas auditorias
 * visuais independentes descreveram a mesma coisa — "barra quase reta com a
 * ponta esquerda quadrada fora do canto".
 */
export const INCLINACAO_DOS_LABIOS = 0.0533;

export const CORPO = {
  /** Quantas fatias horizontais. Mais fatias, transição mais macia. */
  fatias: 256,
  /** Ponto em torno do qual o corpo pivota: os pés, fora da arte. */
  pivoY: 1.28,
};

/**
 * Arrasto na altura `y` (0 no topo, 1 na base).
 *
 * A cabeça leva o movimento inteiro e o quadril quase nada, com a queda
 * acontecendo de forma suave no meio do tronco. É a cadeia de atraso de um
 * corpo com massa: a cabeça inicia, o tronco acompanha, a base fica.
 */
export function arrastoNaAltura(y) {
  const t = Math.max(0, Math.min(1, y));
  // Cosseno elevado: começa em 1, termina perto de 0,08, sem quina no caminho.
  return 0.08 + 0.92 * Math.pow((1 + Math.cos(t * Math.PI)) / 2, 1.35);
}
