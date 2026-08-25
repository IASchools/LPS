/**
 * O que conta como "sim" e como "não" numa conversa falada.
 *
 * Vive aqui, e não no servidor, porque é regra de linguagem e precisa ser
 * testável sem subir nada — importar o servidor para testar isto mantinha o
 * processo de teste vivo para sempre.
 *
 * A âncora no início da frase é deliberada: "simplesmente anote outra coisa"
 * contém "sim" e não pode autorizar nada. Confirmação é a primeira palavra de
 * quem responde a uma pergunta, não uma sílaba perdida no meio.
 */

function normalizar(fala) {
  return String(fala ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function ehConfirmacao(fala) {
  return /^(sim|confirmo|confirmado|pode|pode ir|isso|manda|manda ver|autorizo|ok)\b/.test(normalizar(fala));
}

export function ehRecusa(fala) {
  return /^(nao|cancela|cancelar|deixa|esquece|para)\b/.test(normalizar(fala));
}

/**
 * Palavras que existem só para dizer sim, dizer não, ou ligar as duas coisas.
 *
 * Não são conteúdo: se depois de tirá-las não sobrar nada, a fala não pediu
 * coisa alguma.
 */
const PALAVRAS_DE_RESPOSTA = new Set([
  "sim", "confirmo", "confirmado", "confirma", "pode", "podes", "isso", "manda",
  "ver", "autorizo", "ok", "claro", "certo", "beleza", "ta", "tudo", "bem",
  "vai", "va", "sim,", "registrar", "registra", "gravar", "grava", "anotar",
  "anota", "fazer", "faz", "por", "favor", "obrigado", "obrigada", "valeu",
  "nao", "cancela", "cancelar", "deixa", "esquece", "para", "pra", "la", "agora",
  "e", "eh", "ai", "entao", "o", "a", "isso.", "sim.", "nao.",
]);

/**
 * A fala é APENAS um sim ou um não, sem pedido nenhum dentro?
 *
 * ⚠️ `ehConfirmacao` e `ehRecusa` só são seguras quando JÁ EXISTE uma pergunta
 * pendente: ali, um "pode" inicial é inequívoco. Fora desse contexto elas são
 * largas demais — medido em 23/08/2026, elas capturavam "pode pesquisar na
 * internet o que é o censo escolar", "pode anotar a decisão de trocar o
 * calendário" e "não sei qual a carga horária mínima, me ajuda": seis de sete
 * pedidos legítimos. Usar aquelas funções como guarda quebraria o produto muito
 * mais do que o defeito que a guarda existe para fechar.
 *
 * Aqui o critério é outro e é estreito: tirando as palavras que só servem para
 * responder, não pode sobrar NENHUMA palavra de conteúdo.
 */
export function ehSoConfirmacaoOuRecusa(fala) {
  const texto = normalizar(fala);
  if (!texto) return false;
  if (!ehConfirmacao(texto) && !ehRecusa(texto)) return false;
  const palavras = texto
    .replace(/[.,!?;:]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (palavras.length === 0 || palavras.length > 6) return false;
  return palavras.every((palavra) => PALAVRAS_DE_RESPOSTA.has(palavra));
}

/**
 * O que dizer quando o microfone falha.
 *
 * ⚠️ Numa interface sem texto, erro silencioso é o pior defeito possível: quem
 * falou não tem onde ler o que houve, e conclui que ela travou. Cada motivo
 * vira uma frase que ela FALA.
 *
 * O caso `service-not-allowed` é o mais traiçoeiro e foi medido em 22/08/2026:
 * o Chromium de código aberto traz `webkitSpeechRecognition` no objeto global,
 * mas sem as chaves do serviço de reconhecimento. O microfone captura áudio
 * normalmente — pico de sinal 1 na medição — e o reconhecimento simplesmente
 * nunca emite evento nenhum. Só o Chrome de verdade transcreve.
 */
export function explicarFalhaDeMicrofone(motivo) {
  switch (String(motivo ?? "")) {
    case "not-allowed":
    case "permission-denied":
      return "Preciso da sua permissão para usar o microfone. Libere no cadeado ao lado do endereço e fale comigo de novo.";
    case "no-speech":
      return "Não ouvi nada. Toque no microfone e fale mais perto.";
    case "audio-capture":
      return "Não achei nenhum microfone nesta máquina.";
    case "network":
    case "service-not-allowed":
      return "Este navegador não transcreve voz. Abra no Google Chrome, que é onde o reconhecimento funciona.";
    case "aborted":
      return "";
    default:
      return "O microfone falhou aqui. Tente de novo, e se continuar, abra no Google Chrome.";
  }
}

/**
 * Traduz a falha para a língua de quem está olhando.
 *
 * ⚠️ Medido em 22/08/2026 na primeira captura do estado de falha: o painel
 * mostrava "Failed to fetch". Numa tela que fala com diretor de escola, texto
 * cru do navegador em inglês não informa nada e ainda parece defeito do
 * produto. O texto original só sobrevive quando não é uma falha conhecida —
 * engolir a mensagem seria pior do que mostrá-la em inglês.
 */
export function falhaEmPortugues(erro) {
  const bruto = String(erro?.message ?? erro ?? "").trim();
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(bruto)) {
    return "o servidor da assistente não respondeu";
  }
  if (/abort|timeout|timed out/i.test(bruto)) return "a resposta demorou demais e foi interrompida";
  return bruto || "falha desconhecida";
}

/**
 * Por que não há cérebro, em português.
 *
 * ⚠️ Mesmo defeito que uma antiga recusa de produto tinha: `resolverCerebro` devolve
 * identificadores de código — `modelo_sai_da_maquina`, `sem_runtime` — e eles
 * iam crus para o rodapé. O motivo bruto continua em `/api/saude`, para quem
 * depura; a tela recebe a frase.
 */
export function motivoDoCerebroEmPortugues(motivo) {
  const chave = String(motivo ?? "").trim();
  const dicionario = {
    modelo_sai_da_maquina: "o modelo configurado reencaminha o pedido para fora da máquina",
    endereco_fora_do_loopback: "o endereço configurado não é local",
    // ⚠️ "runtime" é palavra de quem opera as máquinas. Esta frase existe
    // justamente para não mostrar `runtime_nao_aprovado` na tela, e ainda
    // assim trocava um identificador de código por um jargão de código.
    runtime_nao_aprovado: "o motor pedido não está na lista aprovada",
    sem_runtime: "nenhum motor aprovado foi encontrado nesta máquina",
  };
  return dicionario[chave] ?? "o cérebro está indisponível por um motivo que esta tela ainda não sabe explicar";
}

/**
 * Por que a identidade foi recusada, em português.
 *
 * ⚠️ Mesma família das outras duas traduções: `verificarBilhete` devolve
 * identificadores — `assinatura_invalida`, `validade_longa_demais` — e eles iam
 * crus para a tela de um produto de terceiro. O motivo bruto continua na
 * resposta, para quem integra depurar; a tela recebe a frase.
 */
export function motivoDoBilheteEmPortugues(motivo) {
  const dicionario = {
    formato_invalido: "o bilhete não tem o formato esperado",
    assinatura_invalida: "a assinatura do bilhete não confere",
    conteudo_ilegivel: "o conteúdo do bilhete não pôde ser lido",
    versao_desconhecida: "o bilhete usa uma versão que esta camada não conhece",
    produto_desconhecido: "o bilhete é de um produto que esta camada não atende",
    expirado: "o bilhete venceu",
    validade_longa_demais: "o bilhete pede mais tempo do que a política permite",
    segredo_ausente: "esta instância não tem segredo configurado e não aceita bilhete",
    sem_bilhete: "nenhum bilhete foi apresentado",
  };
  const chave = String(motivo ?? "").trim();
  // ⚠️ Um motivo que ninguém traduziu ainda NÃO pode sair cru: a varredura de
  // 22/08/2026 apanhou `motivo_novo` chegando à tela em snake_case. Eu tinha
  // decidido mostrar o bruto para não engolir informação, e isso valia quando o
  // problema era legibilidade — não vale quando o problema é o que a tela
  // entrega. O identificador continua no campo `motivo` da resposta, que é onde
  // quem integra procura.
  return dicionario[chave] ?? "o bilhete foi recusado por um motivo que esta tela ainda não sabe explicar";
}
