/*
 * Rig 2D contínuo para a personagem original.
 *
 * Uma única textura é deformada por uma malha contínua; não existem recortes
 * ou membros sobrepostos. O rosto (y < 620 px) é rígido. Este módulo é
 * fail-closed: qualquer incompatibilidade ou falha WebGL devolve o controle ao
 * raster original no chamador e não tenta restaurar contexto silenciosamente.
 */

export const DIMENSOES_ARTE = Object.freeze({ largura: 1254, altura: 1144 });

export const GEOMETRIA_BRACOS = Object.freeze({
  telaEsquerda: Object.freeze({
    ombro: Object.freeze([405, 716]),
    punho: Object.freeze([357, 1128]),
    raioOmbro: 78,
    raioPunho: 58,
  }),
  telaDireita: Object.freeze({
    ombro: Object.freeze([838, 704]),
    cotovelo: Object.freeze([1025, 866]),
    punho: Object.freeze([807, 1018]),
    raioSuperior: 94,
    raioInferior: 88,
  }),
  zonaRigidaDoRosto: Object.freeze({ yMax: 620 }),
});

export const POSES_BRACOS = Object.freeze({
  repouso: Object.freeze({
    distalEsquerdo: Object.freeze([0, 0]),
    cotoveloDireito: Object.freeze([0, 0]),
  }),
  respiracao: Object.freeze({
    distalEsquerdo: Object.freeze([-13, -2]),
    cotoveloDireito: Object.freeze([-6, -4]),
  }),
  enfase: Object.freeze({
    distalEsquerdo: Object.freeze([9, -5]),
    cotoveloDireito: Object.freeze([13, -8]),
  }),
});

export function misturarPoseBracos(a, b, t) {
  const n = Math.max(0, Math.min(1, Number(t) || 0));
  return {
    distalEsquerdo: [
      a.distalEsquerdo[0] + (b.distalEsquerdo[0] - a.distalEsquerdo[0]) * n,
      a.distalEsquerdo[1] + (b.distalEsquerdo[1] - a.distalEsquerdo[1]) * n,
    ],
    cotoveloDireito: [
      a.cotoveloDireito[0] + (b.cotoveloDireito[0] - a.cotoveloDireito[0]) * n,
      a.cotoveloDireito[1] + (b.cotoveloDireito[1] - a.cotoveloDireito[1]) * n,
    ],
  };
}

const limitar = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const suave = (a, b, n) => {
  const t = limitar((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function pesoDoTubo(x, y, a, b, raioA, raioB) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const t = limitar(((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy));
  const cx = a[0] + vx * t;
  const cy = a[1] + vy * t;
  const distancia = Math.hypot(x - cx, y - cy);
  const raio = raioA + (raioB - raioA) * t;
  return { t, peso: 1 - suave(raio * 0.25, raio, distancia) };
}

export function deslocamentoDaMalha(x, y, pose = POSES_BRACOS.repouso) {
  if (y < GEOMETRIA_BRACOS.zonaRigidaDoRosto.yMax) return [0, 0];

  const e = GEOMETRIA_BRACOS.telaEsquerda;
  const tuboE = pesoDoTubo(x, y, e.ombro, e.punho, e.raioOmbro, e.raioPunho);
  const ancoraE = Math.pow(suave(0.04, 0.98, tuboE.t), 1.16);
  const janelaE = 1 - suave(500, 555, x);
  const pesoE = tuboE.peso * ancoraE * janelaE;

  const d = GEOMETRIA_BRACOS.telaDireita;
  const superior = pesoDoTubo(x, y, d.ombro, d.cotovelo, d.raioSuperior, d.raioSuperior);
  const inferior = pesoDoTubo(x, y, d.cotovelo, d.punho, d.raioInferior, d.raioInferior * 0.78);
  const arcoSuperior = Math.sin(superior.t * Math.PI * 0.5) * superior.peso;
  const arcoInferior = Math.cos(inferior.t * Math.PI * 0.5) * inferior.peso;
  const janelaD = suave(735, 795, x);
  const pesoD = Math.max(arcoSuperior, arcoInferior) * janelaD;

  return [
    pose.distalEsquerdo[0] * pesoE + pose.cotoveloDireito[0] * pesoD,
    pose.distalEsquerdo[1] * pesoE + pose.cotoveloDireito[1] * pesoD,
  ];
}

const VERTICE = `
attribute vec2 a_destino;
attribute vec2 a_origem;
uniform vec2 u_resolucao;
varying vec2 v_uv;
void main() {
  vec2 zeroAUm = a_destino / u_resolucao;
  vec2 clip = zeroAUm * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = a_origem / u_resolucao;
}`;

const FRAGMENTO = `
precision mediump float;
uniform sampler2D u_imagem;
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_imagem, v_uv);
}`;

function contextoWebGlUtilizavel(gl) {
  if (!gl || typeof gl.isContextLost !== "function") return false;
  try {
    return gl.isContextLost() === false;
  } catch {
    return false;
  }
}

function compilar(gl, tipo, fonte) {
  const shader = gl.createShader(tipo);
  if (!shader) throw new Error("WebGL não criou o shader");
  gl.shaderSource(shader, fonte);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detalhe = gl.getShaderInfoLog(shader) || "shader inválido";
    if (contextoWebGlUtilizavel(gl)) gl.deleteShader(shader);
    throw new Error(detalhe);
  }
  return shader;
}

function criarPrograma(gl) {
  let vertice = null;
  let fragmento = null;
  let programa = null;
  try {
    vertice = compilar(gl, gl.VERTEX_SHADER, VERTICE);
    fragmento = compilar(gl, gl.FRAGMENT_SHADER, FRAGMENTO);
    programa = gl.createProgram();
    if (!programa) throw new Error("WebGL não criou o programa");
    gl.attachShader(programa, vertice);
    gl.attachShader(programa, fragmento);
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(programa) || "programa WebGL inválido");
    }
    return { programa, shaders: [vertice, fragmento] };
  } catch (erro) {
    if (programa && contextoWebGlUtilizavel(gl)) gl.deleteProgram(programa);
    if (vertice && contextoWebGlUtilizavel(gl)) gl.deleteShader(vertice);
    if (fragmento && contextoWebGlUtilizavel(gl)) gl.deleteShader(fragmento);
    throw erro;
  }
}

function criarTopologia(largura, altura, passo) {
  const colunas = Math.ceil(largura / passo) + 1;
  const linhas = Math.ceil(altura / passo) + 1;
  const origens = [];
  for (let j = 0; j < linhas; j += 1) {
    const y = j === linhas - 1 ? altura : Math.min(altura, j * passo);
    for (let i = 0; i < colunas; i += 1) {
      const x = i === colunas - 1 ? largura : Math.min(largura, i * passo);
      origens.push([x, y]);
    }
  }
  const indices = [];
  for (let j = 0; j < linhas - 1; j += 1) {
    for (let i = 0; i < colunas - 1; i += 1) {
      const a = j * colunas + i;
      const b = a + 1;
      const c = a + colunas;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { origens, indices: new Uint16Array(indices) };
}

function area(a, b, c) {
  return ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) * 0.5;
}

export function analisarMalha(largura, altura, pose, passo = 16) {
  const topologia = criarTopologia(largura, altura, passo);
  const destinos = topologia.origens.map(([x, y]) => {
    const [dx, dy] = deslocamentoDaMalha(x, y, pose);
    return [x + dx, y + dy];
  });
  let menorRazao = Infinity;
  let maiorDeslocamentoRosto = 0;
  for (let i = 0; i < topologia.indices.length; i += 3) {
    const ia = topologia.indices[i];
    const ib = topologia.indices[i + 1];
    const ic = topologia.indices[i + 2];
    const original = area(topologia.origens[ia], topologia.origens[ib], topologia.origens[ic]);
    const deformada = area(destinos[ia], destinos[ib], destinos[ic]);
    menorRazao = Math.min(menorRazao, deformada / original);
  }
  topologia.origens.forEach(([x, y]) => {
    if (y >= GEOMETRIA_BRACOS.zonaRigidaDoRosto.yMax) return;
    const [dx, dy] = deslocamentoDaMalha(x, y, pose);
    maiorDeslocamentoRosto = Math.max(maiorDeslocamentoRosto, Math.hypot(dx, dy));
  });
  return { menorRazaoDeArea: menorRazao, maiorDeslocamentoRosto };
}

function normalizarErro(erro, fallback) {
  if (erro instanceof Error) return erro;
  return new Error(String(erro || fallback));
}

function exigirGlSemErro(gl, etapa) {
  if (typeof gl.isContextLost !== "function" || gl.isContextLost()) {
    throw new Error(`contexto WebGL indisponível durante ${etapa}`);
  }
  const codigo = gl.getError();
  if (codigo !== gl.NO_ERROR) {
    throw new Error(`erro WebGL 0x${codigo.toString(16)} durante ${etapa}`);
  }
}

export function criarRigBracos(canvas, imagem, { passo = 16 } = {}) {
  const largura = imagem.naturalWidth;
  const altura = imagem.naturalHeight;
  if (largura !== DIMENSOES_ARTE.largura || altura !== DIMENSOES_ARTE.altura) {
    throw new RangeError(
      `arte incompatível: ${largura}x${altura}; esperado ${DIMENSOES_ARTE.largura}x${DIMENSOES_ARTE.altura}`,
    );
  }
  if (!Number.isInteger(passo) || passo < 8 || passo > 32) {
    throw new RangeError("passo da malha deve ser inteiro entre 8 e 32");
  }

  let canvasAlvo = canvas;
  canvasAlvo.width = largura;
  canvasAlvo.height = altura;
  let gl = canvasAlvo.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL indisponível");

  let disponivel = false;
  let falha = null;
  let listenerRegistrado = false;
  let programa = null;
  let shaders = [];
  let topologia = null;
  let dados = null;
  let bufferVertices = null;
  let bufferIndices = null;
  let textura = null;

  function liberarRecursos() {
    const contexto = gl;
    try {
      if (listenerRegistrado && canvasAlvo) {
        try {
          canvasAlvo.removeEventListener("webglcontextlost", aoPerderContexto);
        } catch {
          // O descarte de referências abaixo não pode depender do EventTarget.
        }
      }

      // Após context loss, comandos de exclusão não são confiáveis. As
      // referências JS ainda são descartadas no finally abaixo.
      if (contextoWebGlUtilizavel(contexto)) {
        contexto.useProgram(null);
        for (const shader of shaders) {
          if (programa) contexto.detachShader(programa, shader);
          contexto.deleteShader(shader);
        }
        if (bufferVertices) contexto.deleteBuffer(bufferVertices);
        if (bufferIndices) contexto.deleteBuffer(bufferIndices);
        if (textura) contexto.deleteTexture(textura);
        if (programa) contexto.deleteProgram(programa);
      }
    } catch {
      // Cleanup é best effort na GPU, mas o descarte de referências é sempre
      // executado para impedir reutilização de estado parcial.
    } finally {
      disponivel = false;
      listenerRegistrado = false;
      programa = null;
      shaders = [];
      topologia = null;
      dados = null;
      bufferVertices = null;
      bufferIndices = null;
      textura = null;
      gl = null;
      canvasAlvo = null;
    }
  }

  function aoPerderContexto() {
    falha = new Error("contexto WebGL perdido; rig desativado até recriação explícita");
    // Não há `preventDefault` nem handler de `webglcontextrestored`: este rig
    // é abandonado de propósito. Restaurar silenciosamente arriscaria usar
    // recursos parciais; o chamador mantém o raster original.
    liberarRecursos();
  }

  canvasAlvo.addEventListener("webglcontextlost", aoPerderContexto);
  listenerRegistrado = true;

  try {
    const compilado = criarPrograma(gl);
    programa = compilado.programa;
    shaders = compilado.shaders;
    topologia = criarTopologia(largura, altura, passo);
    dados = new Float32Array(topologia.origens.length * 4);

    bufferVertices = gl.createBuffer();
    bufferIndices = gl.createBuffer();
    textura = gl.createTexture();
    if (!bufferVertices || !bufferIndices || !textura) {
      throw new Error("WebGL não criou todos os recursos do rig");
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferIndices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, topologia.indices, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagem);

    gl.useProgram(programa);
    const resolucao = gl.getUniformLocation(programa, "u_resolucao");
    const imagemUniform = gl.getUniformLocation(programa, "u_imagem");
    const destino = gl.getAttribLocation(programa, "a_destino");
    const origem = gl.getAttribLocation(programa, "a_origem");
    if (resolucao === null || imagemUniform === null || destino < 0 || origem < 0) {
      throw new Error("atributos ou uniforms obrigatórios não foram vinculados");
    }
    gl.uniform2f(resolucao, largura, altura);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.uniform1i(imagemUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
    gl.enableVertexAttribArray(destino);
    gl.vertexAttribPointer(destino, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(origem);
    gl.vertexAttribPointer(origem, 2, gl.FLOAT, false, 16, 8);
    gl.viewport(0, 0, largura, altura);
    gl.disable(gl.BLEND);
    exigirGlSemErro(gl, "inicialização e upload");
    disponivel = true;
  } catch (erro) {
    falha = normalizarErro(erro, "falha ao inicializar rig WebGL");
    liberarRecursos();
    throw falha;
  }

  function desenhar(pose = POSES_BRACOS.repouso) {
    if (!disponivel || !gl || !topologia || !dados) {
      throw falha || new Error("rig WebGL indisponível");
    }
    try {
      topologia.origens.forEach(([x, y], i) => {
        const [dx, dy] = deslocamentoDaMalha(x, y, pose);
        dados[i * 4] = x + dx;
        dados[i * 4 + 1] = y + dy;
        dados[i * 4 + 2] = x;
        dados[i * 4 + 3] = y;
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferVertices);
      gl.bufferData(gl.ARRAY_BUFFER, dados, gl.DYNAMIC_DRAW);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, topologia.indices.length, gl.UNSIGNED_SHORT, 0);
      // WebGL normalmente registra falhas sem lançar JavaScript. Consultar o
      // estado em todo draw é o que garante fallback raster também se a falha
      // surgir depois do primeiro quadro. O custo precisa ser medido no teste
      // temporal antes da promoção.
      exigirGlSemErro(gl, "upload dinâmico e draw");
    } catch (erro) {
      falha = normalizarErro(erro, "falha ao desenhar rig WebGL");
      liberarRecursos();
      throw falha;
    }
  }

  function destruir() {
    liberarRecursos();
  }

  return {
    desenhar,
    destruir,
    estaDisponivel: () => disponivel,
    obterFalha: () => falha,
    largura,
    altura,
    passo,
  };
}
