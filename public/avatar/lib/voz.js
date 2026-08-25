/**
 * O texto que sai pela voz.
 *
 * Numa interface só voz, a fala É o produto: o que está escrito para ser lido
 * não serve dito. Medido em 22/08/2026, com as respostas reais da base de
 * educação passando pela limpeza do cliente, o que chegava à síntese ainda
 * trazia "20/12/1996", "nº", "arts." e "§" — que o sintetizador lê como barra,
 * "ene ó" e letra solta.
 *
 * ⚠️ Isto normaliza a FORMA, nunca o conteúdo. Nenhuma regra aqui pode remover
 * um número, uma data ou o nome de uma norma: a tela não mostra parágrafo de
 * resposta, então a voz é o único canal — o que ela não disser, ninguém recebe.
 */

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Marcação some: ela fala, não escreve. */
function semMarcacao(bruto) {
  return String(bruto ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/** O que a voz tropeça vira o que ela diz certo. */
function paraSerDito(texto) {
  return texto
    // Data por extenso: "20/12/2017" lido como barra é ruído.
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (todo, d, m, a) => {
      const mes = MESES[Number(m) - 1];
      return mes ? `${Number(d)} de ${mes} de ${a}` : todo;
    })
    // ⚠️ NÃO existe regra de "mês/ano sem dia". Ela foi escrita e removida na
    // mesma rodada: "Resolução CNE/CP nº 2/2017" virou "número fevereiro de
    // 2017" — o NÚMERO da resolução lido como data. Transformar o
    // identificador de uma norma em outra coisa é exatamente o que esta
    // camada não pode fazer.
    .replace(/\bnº\s*/gi, "número ")
    .replace(/\bn\.º\s*/gi, "número ")
    .replace(/§\s*(\d+)/g, "parágrafo $1")
    .replace(/§/g, "parágrafo")
    .replace(/\barts\.\s*/gi, "artigos ")
    .replace(/\bart\.\s*/gi, "artigo ")
    .replace(/\bincs?\.\s*/gi, "inciso ")
    .replace(/\balín\.\s*/gi, "alínea ")
    // "CNE/CP" e "CNE/CEB" são ditos com a barra; vira "barra" falado ou nada.
    .replace(/\b([A-Z]{2,})\/([A-Z]{2,})\b/g, "$1 $2")
    // Número de norma seguido do ano: a barra ali quer dizer "de". Só neste
    // contexto — em qualquer outro, mexer numa barra é arriscar o sentido.
    .replace(/\b(número|Lei|Decreto|Resolução|Portaria|Emenda|LDB|EC)\s+([\d.]+)\/(\d{4})\b/gi,
      (todo, rotulo, num, ano) => `${rotulo} ${num}, de ${ano}`)
    // Parênteses viram pausa: a voz não os pronuncia e a frase fica emendada.
    .replace(/\s*\(([^)]+)\)/g, ", $1,")
    .replace(/,\s*,/g, ",")
    // O parêntese vira vírgula e, no fim da frase, deixa ",." — que a voz lê
    // como duas pausas coladas.
    .replace(/,\s*([.;:!?])/g, "$1")
    .replace(/\s+([.,])/g, "$1");
}

/** Prepara o texto para ser dito, não lido. */
export function prepararParaVoz(bruto) {
  return paraSerDito(semMarcacao(bruto)).replace(/\s+/g, " ").trim();
}

/**
 * Quantos segundos essa fala leva.
 *
 * O ritmo não é chute: medido em 22/08/2026 com a voz Luciana (pt-BR), 102
 * caracteres em 7,7 s.
 */
export const CARACTERES_POR_SEGUNDO = 102 / 7.7;
export function segundosDeFala(texto) {
  return prepararParaVoz(texto).length / CARACTERES_POR_SEGUNDO;
}
