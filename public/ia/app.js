/* ============================================================
   Conselheiro IA Schools — lógica do front (sem dependências)
   ============================================================ */
(function () {
  'use strict';

  // ---------- configuração do backend ----------
  var API_BASE = (window.CONSELHEIRO_API || '').replace(/\/+$/, '');
  var ENDPOINT = API_BASE + '/api/chat';

  // ---------- sessão ----------
  var sessionId = null;
  try { sessionId = sessionStorage.getItem('conselheiro_sessao'); } catch (e) {}
  if (!sessionId) {
    sessionId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    try { sessionStorage.setItem('conselheiro_sessao', sessionId); } catch (e) {}
  }

  // ---------- elementos ----------
  var $ = function (id) { return document.getElementById(id); };
  var app = $('app'), chat = $('chat'), mensagens = $('mensagens'), chips = $('chips');
  var form = $('form'), entrada = $('entrada'), botaoEnviar = $('enviar');
  var overlay = $('overlay'), toastEl = $('toast'), canvas = $('canvasCartao');

  var HORIZONTES = ['Agora', 'Próximos 30 dias', 'Acompanhar'];
  var ultimaArea = null;
  var RODAPE_CARTAO = 'Workshop IA Schools · 17 de agosto de 2026';

  // ---------- modo telão (?telao=1): fonte 2x, coluna 900px ----------
  try {
    if (new URLSearchParams(location.search).get('telao') === '1') {
      document.documentElement.classList.add('telao');
    }
  } catch (e) {}

  // ---------- teclado mobile: visualViewport → --vvh ----------
  var vv = window.visualViewport;
  function ajustarViewport() {
    if (!vv) return;
    document.documentElement.style.setProperty('--vvh', Math.round(vv.height) + 'px');
    window.scrollTo(0, 0);
    rolarParaFim(true);
  }
  if (vv) {
    vv.addEventListener('resize', ajustarViewport);
    vv.addEventListener('scroll', ajustarViewport);
    ajustarViewport();
  }
  entrada.addEventListener('focus', function () {
    setTimeout(function () { rolarParaFim(true); }, 320);
  });

  // ---------- auto-scroll suave (só se o leitor está perto do fim) ----------
  var rolagemAgendada = false;
  function rolarParaFim(forcar) {
    if (rolagemAgendada) return;
    rolagemAgendada = true;
    requestAnimationFrame(function () {
      rolagemAgendada = false;
      var perto = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 160;
      if (forcar || perto) {
        chat.scrollTo({ top: chat.scrollHeight, behavior: forcar ? 'auto' : 'smooth' });
      }
    });
  }

  // ---------- utilitários de texto ----------
  function escaparHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // markdown-lite: **negrito**, listas "- ", parágrafos
  function formatar(texto) {
    var linhas = escaparHtml(texto).split(/\n/);
    var html = '', lista = false, paragrafo = [];
    function fechaParagrafo() {
      if (paragrafo.length) { html += '<p>' + paragrafo.join('<br>') + '</p>'; paragrafo = []; }
    }
    function fechaLista() { if (lista) { html += '</ul>'; lista = false; } }
    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i].trim();
      if (!l) { fechaParagrafo(); fechaLista(); continue; }
      var mLista = l.match(/^[-•]\s+(.*)$/);
      if (mLista) {
        fechaParagrafo();
        if (!lista) { html += '<ul>'; lista = true; }
        html += '<li>' + mLista[1] + '</li>';
      } else {
        fechaLista();
        paragrafo.push(l);
      }
    }
    fechaParagrafo(); fechaLista();
    return html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // ---------- parser do bloco [[CARTAO]] ----------
  function dividirItem(valor) {
    var sep = valor.indexOf('::');
    if (sep < 0 && valor.indexOf('|') > 0) {
      var pipe = valor.indexOf('|');
      return { titulo: valor.slice(0, pipe).trim(), desc: valor.slice(pipe + 1).trim() };
    }
    if (sep < 0) {
      var m = valor.match(/^(.{6,90}?)\s+[—–]\s+(.+)$/);
      if (m) return { titulo: m[1].trim(), desc: m[2].trim() };
      return { titulo: valor.trim(), desc: '' };
    }
    return { titulo: valor.slice(0, sep).trim(), desc: valor.slice(sep + 2).trim() };
  }

  function parseCartao(bruto) {
    var dados = { escola: '', titulo: '', itens: [null, null, null], nota: '' };
    var soltos = [];
    bruto.split(/\n/).forEach(function (linha) {
      var l = linha.replace(/^[\s>*-]*/, '').trim();
      if (!l) return;
      var kv = l.match(/^([A-Za-zÀ-ú0-9 ]{2,28})\s*:\s*(.+)$/);
      if (kv) {
        var chave = kv[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        var valor = kv[2].trim();
        if (/escola|colegio|instituic/.test(chave)) { dados.escola = valor; return; }
        if (/titulo|tema|plano/.test(chave))        { dados.titulo = valor; return; }
        if (/nota|callout|dica|lembrete|fecho|frase/.test(chave)) { dados.nota = valor; return; }
        if (/^agora/.test(chave))                   { dados.itens[0] = dividirItem(valor); return; }
        if (/30|proxim|mes/.test(chave))            { dados.itens[1] = dividirItem(valor); return; }
        if (/acompanhar|depois|medir|seguir/.test(chave)) { dados.itens[2] = dividirItem(valor); return; }
      }
      var num = l.match(/^(\d)[.)]\s+(.*)$/);
      if (num) { soltos.push(dividirItem(num[2])); return; }
      if (!kv) soltos.push(null); // linha de texto livre: ignora
    });
    // fallback: itens numerados 1./2./3. preenchem horizontes vazios em ordem
    var livres = soltos.filter(Boolean);
    for (var i = 0; i < 3; i++) {
      if (!dados.itens[i] && livres.length) dados.itens[i] = livres.shift();
      if (!dados.itens[i]) dados.itens[i] = { titulo: '', desc: '' };
    }
    if (!dados.escola) dados.escola = 'sua escola';
    if (!dados.titulo) dados.titulo = 'Três passos para começar com segurança';
    if (!dados.nota) dados.nota = 'Comece pelo passo "Agora" ainda esta semana — e volte a medir antes de ampliar.';
    return dados;
  }

  function fraseEscola(escola) {
    var artigoO = /^(o\s|col[eé]gio|instituto|centro|liceu|educand[aá]rio|externato)/i.test(escola.trim());
    return 'Conselho para ' + (artigoO ? 'o ' : 'a ') + escola.trim().replace(/^[oa]\s+/i, '');
  }

  // ---------- construção das bolhas ----------
  function addUser(texto) {
    var linha = document.createElement('div');
    linha.className = 'msg user';
    var balao = document.createElement('div');
    balao.className = 'balao';
    balao.textContent = texto;
    linha.appendChild(balao);
    mensagens.appendChild(linha);
  }

  function addBot() {
    var linha = document.createElement('div');
    linha.className = 'msg bot pensando-vazio streaming';
    linha.innerHTML =
      '<span class="avatar pensando" aria-hidden="true"></span>' +
      '<div class="balao"><div class="areas"></div>' +
      '<div class="digitando" aria-hidden="true"><span class="dg-pontos"><i></i><i></i><i></i></span>' +
      '<span class="dg-txt"></span></div>' +
      '<div class="conteudo"></div><div class="acoes"></div></div>';
    mensagens.appendChild(linha);
    var txtEl = linha.querySelector('.dg-txt');
    var frases = ['lendo a sua situação', 'cruzando com o método IA Schools',
                  'montando o primeiro passo', 'checando o que não se pode prometer'];
    var fi = 0;
    if (txtEl) txtEl.textContent = frases[0];
    var girar = setInterval(function () {
      fi = (fi + 1) % frases.length;
      if (txtEl) { txtEl.style.opacity = 0; setTimeout(function () {
        txtEl.textContent = frases[fi]; txtEl.style.opacity = 1; }, 180); }
    }, 2600);
    return {
      linha: linha,
      girar: girar,
      avatar: linha.querySelector('.avatar'),
      areasEl: linha.querySelector('.areas'),
      conteudoEl: linha.querySelector('.conteudo'),
      acoesEl: linha.querySelector('.acoes'),
      bruto: '',
      cartao: null,
      areas: [],
      erro: false
    };
  }

  var RX_CARTAO = /\[\[\s*CART[AÃ]O\s*\]\]([\s\S]*?)\[\[\s*\/\s*CART[AÃ]O\s*\]\]/i;
  var RX_CARTAO_ABRE = /\[\[\s*CART[AÃ]O\s*\]\]/i;
  var RX_AREA = /\[\[\s*AREA\s*:\s*([^\]]+?)\s*\]\]/gi;

  function renderBot(m) {
    var t = m.bruto;

    var mc = t.match(RX_CARTAO);
    if (mc) {
      if (!m.cartao) m.cartao = parseCartao(mc[1]);
      t = t.replace(RX_CARTAO, '');
    } else {
      var abre = t.search(RX_CARTAO_ABRE);
      if (abre >= 0) t = t.slice(0, abre); // bloco ainda chegando: segura
    }

    m.areas = [];
    t = t.replace(RX_AREA, function (_tudo, nome) { m.areas.push(nome.trim()); return ''; });

    // defesa em profundidade: nenhum marcador interno pode chegar à tela
    t = t.replace(/\[\[\s*LEAD[\s\S]*?\]\]/gi, '');
    t = t.replace(/\[\[\s*LEAD[\s\S]*$/i, '');
    t = t.replace(/\[\[\s*\/?\s*(CART[AÃ]O|AREA|LEAD)[^\]]*\]\]/gi, '');

    // marcador parcial no fim do stream: não mostrar "[[AR…"
    var lb = t.lastIndexOf('[[');
    if (lb >= 0 && t.indexOf(']]', lb) < 0) t = t.slice(0, lb);

    t = t.trim();
    if (t) m.linha.classList.remove('pensando-vazio');
    m.conteudoEl.innerHTML = formatar(t);

    var chipsHtml = '';
    for (var i = 0; i < m.areas.length; i++) {
      var nome = m.areas[i];
      if (nome === ultimaArea) continue;      // não repetir a mesma área em sequência
      ultimaArea = nome;
      chipsHtml += '<span class="area-pill">' + escaparHtml(nome) + '</span>';
    }
    if (chipsHtml) m.areasEl.innerHTML = chipsHtml;
  }

  function finalizarBot(m) {
    m.avatar.classList.remove('pensando');
    m.linha.classList.remove('streaming');
    if (m.girar) clearInterval(m.girar);
    if (m.erro && !m.bruto.trim()) {
      m.linha.classList.remove('pensando-vazio');
      m.conteudoEl.innerHTML =
        '<p class="msg-erro">O Conselheiro está sendo religado.</p>' +
        '<p>Isso costuma levar menos de um minuto — toca em <b>enviar</b> de novo e a ' +
        'conversa continua daqui. Se persistir, chama alguém da equipe IA Schools aqui ' +
        'no evento: eles têm o mesmo conteúdo na mão.</p>';
    }
    renderBot(m);
    if (!m.erro && m.bruto.trim()) { trocasBot++; talvezConvidar(); }
    if (!m.erro && m.bruto.trim() && !m.cartao && m.pergunta) adicionarComparador(m);
    if (m.cartao) {
      if (convite) { convite.remove(); convite = null; }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-cartao';
      b.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.5c.9 4.6 3 6.7 7.6 7.6-4.6.9-6.7 3-7.6 7.6-.9-4.6-3-6.7-7.6-7.6C7 8.2 9.1 6.1 10 1.5Z"/></svg> Ver cartão-resumo';
      b.addEventListener('click', function () { abrirCartao(m.cartao); });
      m.acoesEl.appendChild(b);
      abrirCartao(m.cartao);
    }
    rolarParaFim(false);
  }

  // ---------- consumo do stream (SSE ou chunks crus) ----------
  function extrairToken(data) {
    if (data === '[DONE]' || data === '[FIM]') return null;
    try {
      var obj = JSON.parse(data);
      if (obj && obj.type === 'lead') { pintarFicha(obj.dados); return ''; }
      if (typeof obj === 'string') return obj;
      var v = obj.token != null ? obj.token
            : obj.delta != null ? obj.delta
            : obj.text  != null ? obj.text
            : obj.content != null ? obj.content
            : null;
      if (typeof v === 'string') return v;
      if (obj.done) return null;
      return '';
    } catch (e) {
      return data;
    }
  }

  var ocupado = false;

  function setOcupado(v) {
    ocupado = v;
    botaoEnviar.disabled = v;
  }

  async function conversar(texto) {
    texto = (texto || '').trim();
    if (!texto || ocupado) return;
    setOcupado(true);

    app.classList.remove('estado-entrada');
    app.classList.add('estado-conversa');
    chips.hidden = true;

    addUser(texto);
    var m = addBot();
    m.pergunta = texto;
    rolarParaFim(true);

    try {
      var res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: texto })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (!res.body) { // fallback raríssimo: sem streaming
        m.bruto = await res.text();
        renderBot(m);
      } else {
        var ct = (res.headers.get('content-type') || '').toLowerCase();
        var modoSse = ct.indexOf('event-stream') >= 0;
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var buf = '';
        for (;;) {
          var passo = await reader.read();
          if (passo.done) break;
          buf += dec.decode(passo.value, { stream: true }).replace(/\r\n/g, '\n');
          if (modoSse) {
            var corte;
            while ((corte = buf.indexOf('\n\n')) >= 0) {
              var bloco = buf.slice(0, corte);
              buf = buf.slice(corte + 2);
              var linhas = bloco.split('\n');
              for (var i = 0; i < linhas.length; i++) {
                var mm = linhas[i].match(/^data:\s?(.*)$/);
                if (!mm) continue;
                var tk = extrairToken(mm[1]);
                if (tk) m.bruto += tk;
              }
            }
          } else {
            m.bruto += buf;
            buf = '';
          }
          renderBot(m);
          rolarParaFim(false);
        }
        if (!modoSse && buf) { m.bruto += buf; renderBot(m); }
      }
    } catch (e) {
      m.erro = true;
    }
    finalizarBot(m);
    setOcupado(false);
  }

  // ---------- entrada ----------
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var t = entrada.value;
    entrada.value = '';
    autoAltura();
    conversar(t);
  });
  entrada.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });
  function autoAltura() {
    entrada.style.height = 'auto';
    entrada.style.height = Math.min(entrada.scrollHeight, 115) + 'px';
  }
  entrada.addEventListener('input', autoAltura);

  chips.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('.chip');
    if (alvo) conversar(alvo.getAttribute('data-msg'));
  });

  // atalhos das 8 áreas (mesma mecânica dos chips)
  var areasAtalho = document.getElementById('areasAtalho');
  if (areasAtalho) {
    areasAtalho.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('.area-btn');
      if (alvo) conversar(alvo.getAttribute('data-msg'));
    });
  }

  // ---------- recomeçar conversa ----------
  var btnRecomecar = document.getElementById('recomecar');
  if (btnRecomecar) {
    btnRecomecar.addEventListener('click', function () {
      if (ocupado) return;
      mensagens.innerHTML = '';
      chips.hidden = false;
      app.classList.remove('estado-conversa');
      app.classList.add('estado-entrada');
      if (fichaEl) { fichaEl.hidden = true; fichaEl.innerHTML = ''; }
      fichaDados = {};
      ultimaArea = null;
      comparadorOferecido = false;
      trocasBot = 0;
      if (convite) { convite.remove(); convite = null; }
      sessionId = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      try { sessionStorage.setItem('conselheiro_sessao', sessionId); } catch (e) {}
      entrada.value = '';
      entrada.focus();
      chat.scrollTop = 0;
    });
  }

  // ---------- ficha da escola no cabecalho (prova de que ele escutou) ----------
  var fichaEl = document.getElementById('ficha');
  var fichaDados = {};
  function pintarFicha(d) {
    if (!fichaEl || !d) return;
    ['escola', 'cargo', 'alunos', 'cidade'].forEach(function (k) {
      if (d[k]) fichaDados[k] = d[k];
    });
    var partes = [];
    if (fichaDados.escola) partes.push('<b>' + escaparHtml(fichaDados.escola) + '</b>');
    if (fichaDados.alunos) {
      var al = String(fichaDados.alunos);
      partes.push(escaparHtml(al) + (/aluno/i.test(al) ? '' : ' alunos'));
    }
    if (fichaDados.cidade) partes.push(escaparHtml(fichaDados.cidade));
    if (!partes.length) return;
    fichaEl.innerHTML = '<span class="ficha-ic" aria-hidden="true">' +
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3.5 16.5h13M5.5 16.5V7l4.5-3 4.5 3v9.5M8.7 16.5v-3.6h2.6v3.6"/></svg></span>' +
      partes.join('<i class="ficha-sep">\u00b7</i>');
    fichaEl.hidden = false;
  }

  // ---------- comparador: o que uma IA genérica responderia ----------
  var comparadorOferecido = false;
  function adicionarComparador(m) {
    if (comparadorOferecido) return;
    comparadorOferecido = true;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-generico';
    b.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M7 4.5 3.5 8 7 11.5M13 8.5l3.5 3.5-3.5 3.5"/></svg>' +
      ' E uma IA genérica? Compare';
    b.addEventListener('click', async function () {
      b.disabled = true;
      b.innerHTML = 'perguntando à IA genérica…';
      var caixa = document.createElement('div');
      caixa.className = 'comparador';
      caixa.innerHTML =
        '<p class="cmp-tit">Uma IA genérica, sem a sua escola dentro, responderia assim:</p>' +
        '<div class="cmp-texto"></div>' +
        '<p class="cmp-nota" hidden>Repare no que falta: nenhuma fonte citada, nenhum primeiro passo ' +
        'com data, ninguém nomeado para revisar — e nada que seja da <b>sua</b> escola.</p>';
      m.acoesEl.appendChild(caixa);
      var alvo = caixa.querySelector('.cmp-texto');
      rolarParaFim(false);
      try {
        var res = await fetch(API_BASE + '/api/generico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId + '-gen', message: m.pergunta })
        });
        var reader = res.body.getReader(), dec = new TextDecoder(), buf = '', txt = '';
        while (true) {
          var r = await reader.read();
          if (r.done) break;
          buf += dec.decode(r.value, { stream: true });
          var partes = buf.split('\n\n');
          buf = partes.pop();
          for (var i = 0; i < partes.length; i++) {
            var linhas = partes[i].split('\n');
            for (var j = 0; j < linhas.length; j++) {
              var ln = linhas[j].trim();
              if (ln.indexOf('data:') !== 0) continue;
              var tk = extrairToken(ln.slice(5).trim());
              if (tk) { txt += tk; alvo.textContent = txt; rolarParaFim(false); }
            }
          }
        }
        caixa.querySelector('.cmp-nota').hidden = false;
        b.remove();
      } catch (e) {
        alvo.textContent = 'não deu para consultar agora.';
        b.disabled = false;
        b.innerHTML = 'tentar de novo';
      }
    });
    m.acoesEl.appendChild(b);
  }

  // ---------- convite ao cartão (garante o momento, mesmo se o modelo não oferecer) ----------
  var trocasBot = 0, convite = null;
  function talvezConvidar() {
    if (convite || trocasBot < 3) return;
    convite = document.createElement('button');
    convite.type = 'button';
    convite.className = 'convite-cartao';
    convite.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<path d="M10 1.5c.9 4.6 3 6.7 7.6 7.6-4.6.9-6.7 3-7.6 7.6-.9-4.6-3-6.7-7.6-7.6C7 8.2 9.1 6.1 10 1.5Z"/></svg>' +
      ' Fechar meu cartão com 3 ações';
    convite.addEventListener('click', function () {
      convite.remove(); convite = null;
      conversar('me fecha o cartão com as 3 ações, por favor');
    });
    document.querySelector('.composer').insertBefore(convite, document.querySelector('.composer form'));
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('visivel'); }, 3200);
  }

  // ============================================================
  // CARTÃO-RESUMO — overlay + canvas 1080×1920
  // ============================================================
  var cartaoAtual = null;
  var focoAnterior = null;

  function abrirCartao(dados) {
    cartaoAtual = dados;
    $('cTitulo').textContent = fraseEscola(dados.escola);
    $('cTema').textContent = dados.titulo;
    for (var i = 0; i < 3; i++) {
      $('cT' + (i + 1)).textContent = dados.itens[i].titulo;
      $('cD' + (i + 1)).textContent = dados.itens[i].desc;
      $('cD' + (i + 1)).style.display = dados.itens[i].desc ? '' : 'none';
    }
    $('cNota').textContent = dados.nota;
    focoAnterior = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('aberta');
    $('fecharX').focus({ preventScroll: true });
  }

  function fecharCartao() {
    overlay.classList.remove('aberta');
    overlay.hidden = true;
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus({ preventScroll: true });
    entrada.focus({ preventScroll: true });
  }
  $('fecharX').addEventListener('click', fecharCartao);
  $('btnVoltar').addEventListener('click', fecharCartao);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !overlay.hidden) fecharCartao();
  });

  // ---------- desenho manual em canvas ----------
  var logoImg = new Image();
  var logoPronto = false;
  logoImg.onload = function () { logoPronto = true; };
  logoImg.src = './logo.png';

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function quebrar(ctx, texto, maxW, maxLinhas) {
    var palavras = (texto || '').split(/\s+/).filter(Boolean);
    var linhas = [], atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var tent = atual ? atual + ' ' + palavras[i] : palavras[i];
      if (ctx.measureText(tent).width <= maxW || !atual) {
        atual = tent;
      } else {
        linhas.push(atual);
        atual = palavras[i];
      }
    }
    if (atual) linhas.push(atual);
    if (linhas.length > maxLinhas) {
      linhas = linhas.slice(0, maxLinhas);
      var ult = linhas[maxLinhas - 1];
      while (ctx.measureText(ult + '…').width > maxW && ult.length > 1) {
        ult = ult.slice(0, -1).replace(/\s+$/, '');
      }
      linhas[maxLinhas - 1] = ult + '…';
    }
    return linhas;
  }

  function desenharLuz(ctx, cx, cy, base) {
    var g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 4.2);
    g1.addColorStop(0, 'rgba(124,74,255,0.50)');
    g1.addColorStop(0.45, 'rgba(109,53,251,0.16)');
    g1.addColorStop(1, 'rgba(109,53,251,0)');
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(cx, cy, base * 4.2, 0, Math.PI * 2); ctx.fill();

    var g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 2.1);
    g2.addColorStop(0, 'rgba(155,123,255,0.55)');
    g2.addColorStop(0.55, 'rgba(109,53,251,0.22)');
    g2.addColorStop(1, 'rgba(109,53,251,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(cx, cy, base * 2.1, 0, Math.PI * 2); ctx.fill();

    var g3 = ctx.createRadialGradient(cx, cy - base * 0.18, 0, cx, cy, base);
    g3.addColorStop(0, '#FFFFFF');
    g3.addColorStop(0.28, '#EFE6FF');
    g3.addColorStop(0.62, '#B893FF');
    g3.addColorStop(1, '#6D35FB');
    ctx.fillStyle = g3;
    ctx.beginPath(); ctx.arc(cx, cy, base, 0, Math.PI * 2); ctx.fill();
  }

  function desenharFaisca(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r);
    ctx.closePath();
    ctx.fill();
  }

  function fontePeso(peso, tam) {
    return peso + ' ' + tam + 'px ' + 'ui-rounded, -apple-system, "SF Pro Rounded", "Segoe UI", Arial, sans-serif';
  }

  // desenha tudo; s = fator de escala do corpo (reduzido se não couber)
  function desenharCartao(dados) {
    var ctx = canvas.getContext('2d');
    var W = 1080, H = 1920;
    ctx.clearRect(0, 0, W, H);

    // fundo branco + blobs suaves
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#E1DCF2';
    ctx.beginPath(); ctx.arc(1080, 1900, 250, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#EBDBDE';
    ctx.beginPath(); ctx.arc(-40, 1780, 180, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    try { ctx.letterSpacing = '0px'; } catch (e) {}

    // ----- medidas do cabeçalho -----
    var M = 40, HX = M + 56; // margem interna do header
    ctx.font = fontePeso('800', 68);
    var linhasTitulo = quebrar(ctx, fraseEscola(dados.escola), 700, 3);
    ctx.font = fontePeso('400', 34);
    var linhasTema = quebrar(ctx, dados.titulo, 800, 2);
    var headerH = 56 + 44 + 36 + linhasTitulo.length * 80 + 16 + linhasTema.length * 46 + 52;

    // ----- medidas do corpo (com redução se necessário) -----
    var s = 1.0, medidas = null;
    function medirCorpo(fator) {
      var itens = [], total = 0;
      for (var i = 0; i < 3; i++) {
        ctx.font = fontePeso('700', Math.round(42 * fator));
        var lt = quebrar(ctx, dados.itens[i].titulo || HORIZONTES[i], 860, 2);
        ctx.font = fontePeso('400', Math.round(32 * fator));
        var ld = dados.itens[i].desc ? quebrar(ctx, dados.itens[i].desc, 860, 2) : [];
        var h = Math.round((40 + 52 + 24) * fator) + lt.length * Math.round(52 * fator) +
                (ld.length ? 8 + ld.length * Math.round(44 * fator) : 0) + Math.round(40 * fator);
        itens.push({ lt: lt, ld: ld, h: h });
        total += h;
      }
      ctx.font = fontePeso('400', Math.round(32 * fator));
      var ln = quebrar(ctx, dados.nota, 700, 3);
      var hNota = Math.max(Math.round(110 * fator), ln.length * Math.round(44 * fator) + Math.round(56 * fator));
      total += hNota + 24 * 2 + 36;
      return { itens: itens, ln: ln, hNota: hNota, total: total };
    }
    var topoCorpo = M + headerH + 36;
    var limite = H - 190; // acima da zona do rodapé
    for (var tent = 0; tent < 6; tent++) {
      medidas = medirCorpo(s);
      if (topoCorpo + medidas.total <= limite) break;
      s -= 0.07;
    }
    // distribui a folga vertical (equivalente ao space-evenly do DOM)
    var sobra = Math.max(0, limite - (topoCorpo + medidas.total));
    var gExtra = Math.min(60, sobra / 3.5);

    // ----- cabeçalho índigo com gradiente -----
    var grad = ctx.createLinearGradient(M, M, M + 1000, M + headerH);
    grad.addColorStop(0, '#2C2060');
    grad.addColorStop(0.58, '#1A1444');
    grad.addColorStop(1, '#231A52');
    rr(ctx, M, M, W - 2 * M, headerH, 44);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.save();
    rr(ctx, M, M, W - 2 * M, headerH, 44);
    ctx.clip();
    var brilho = ctx.createRadialGradient(W - 160, M - 60, 0, W - 160, M - 60, 520);
    brilho.addColorStop(0, 'rgba(124,74,255,0.42)');
    brilho.addColorStop(1, 'rgba(124,74,255,0)');
    ctx.fillStyle = brilho;
    ctx.fillRect(M, M, W - 2 * M, headerH);
    ctx.restore();

    // kicker + badge
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#A99BFF';
    ctx.font = fontePeso('700', 30);
    try { ctx.letterSpacing = '4px'; } catch (e) {}
    ctx.fillText('IA SCHOOLS · CONSELHEIRO', HX, M + 88);
    try { ctx.letterSpacing = '0px'; } catch (e) {}

    ctx.font = fontePeso('400', 27);
    var bTxt = 'demonstração';
    var bW = ctx.measureText(bTxt).width + 56;
    var bX = W - M - 56 - bW, bY = M + 52;
    rr(ctx, bX, bY, bW, 54, 27);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 2;
    rr(ctx, bX, bY, bW, 54, 27);
    ctx.stroke();
    ctx.fillStyle = '#E8E4F5';
    ctx.fillText(bTxt, bX + 28, bY + 37);

    // título + tema
    var y = M + 88 + 36 + 62;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = fontePeso('800', 68);
    for (var i = 0; i < linhasTitulo.length; i++) {
      ctx.fillText(linhasTitulo[i], HX, y);
      y += 80;
    }
    y += -80 + 16 + 46;
    ctx.fillStyle = '#C9C4DC';
    ctx.font = fontePeso('400', 34);
    for (i = 0; i < linhasTema.length; i++) {
      ctx.fillText(linhasTema[i], HX, y);
      y += 46;
    }

    // ----- os três passos -----
    y = topoCorpo + gExtra * 0.5;
    for (i = 0; i < 3; i++) {
      var it = medidas.itens[i];
      ctx.save();
      ctx.shadowColor = 'rgba(27,22,64,0.07)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      rr(ctx, 64, y, W - 128, it.h, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
      rr(ctx, 64, y, W - 128, it.h, 30);
      ctx.strokeStyle = '#EFEAE0';
      ctx.lineWidth = 2;
      ctx.stroke();

      var px = 64 + 44, py = y + Math.round(40 * s);
      // pill do horizonte
      ctx.font = fontePeso('700', Math.round(27 * s));
      var pTxt = HORIZONTES[i];
      var pW = ctx.measureText(pTxt).width + Math.round(52 * s);
      var pH = Math.round(52 * s);
      rr(ctx, px, py, pW, pH, pH / 2);
      ctx.fillStyle = '#EFE9FE';
      ctx.fill();
      ctx.fillStyle = '#6D35FB';
      ctx.fillText(pTxt, px + Math.round(26 * s), py + pH - Math.round(17 * s));

      var ty = py + pH + Math.round(24 * s) + Math.round(30 * s);
      ctx.fillStyle = '#1B1640';
      ctx.font = fontePeso('700', Math.round(42 * s));
      for (var j = 0; j < it.lt.length; j++) {
        ctx.fillText(it.lt[j], px, ty);
        ty += Math.round(52 * s);
      }
      if (it.ld.length) {
        ty += 8;
        ctx.fillStyle = '#58536E';
        ctx.font = fontePeso('400', Math.round(32 * s));
        for (j = 0; j < it.ld.length; j++) {
          ctx.fillText(it.ld[j], px, ty);
          ty += Math.round(44 * s);
        }
      }
      y += it.h + 24 + gExtra;
    }

    // ----- callout lavanda -----
    y += 12;
    var gc = ctx.createLinearGradient(64, y, W - 64, y + medidas.hNota);
    gc.addColorStop(0, '#F1EBFF');
    gc.addColorStop(1, '#E7DDFE');
    rr(ctx, 64, y, W - 128, medidas.hNota, 30);
    ctx.fillStyle = gc;
    ctx.fill();
    var icTam = Math.round(84 * s);
    var icY = y + (medidas.hNota - icTam) / 2;
    rr(ctx, 64 + 40, icY, icTam, icTam, Math.round(24 * s));
    ctx.fillStyle = '#7C3AFF';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    desenharFaisca(ctx, 64 + 40 + icTam / 2, icY + icTam / 2, icTam * 0.30);
    ctx.fillStyle = '#45356B';
    ctx.font = fontePeso('400', Math.round(32 * s));
    var nx = 64 + 40 + icTam + 36;
    var nBase = y + medidas.hNota / 2 - ((medidas.ln.length - 1) * Math.round(44 * s)) / 2 + Math.round(11 * s);
    for (i = 0; i < medidas.ln.length; i++) {
      ctx.fillText(medidas.ln[i], nx, nBase + i * Math.round(44 * s));
    }

    // ----- rodapé: logo + workshop -----
    if (logoPronto) {
      var lh = 52, lw = lh * (logoImg.naturalWidth / logoImg.naturalHeight);
      ctx.drawImage(logoImg, (W - lw) / 2, H - 158, lw, lh);
    } else {
      ctx.fillStyle = '#1B1640';
      ctx.font = fontePeso('800', 40);
      ctx.textAlign = 'center';
      ctx.fillText('IA Schools', W / 2, H - 118);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#6E6885';
    ctx.font = fontePeso('400', 28);
    ctx.textAlign = 'center';
    ctx.fillText(RODAPE_CARTAO, W / 2, H - 62);
    ctx.textAlign = 'left';

    return canvas;
  }

  function nomeArquivo(dados) {
    var slug = (dados.escola || 'escola').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'escola';
    return 'conselho-ia-schools-' + slug + '.png';
  }

  function gerarPng(dados) {
    return new Promise(function (resolver, rejeitar) {
      try {
        desenharCartao(dados);
        canvas.toBlob(function (blob) {
          if (blob) resolver(blob); else rejeitar(new Error('toBlob vazio'));
        }, 'image/png');
      } catch (e) { rejeitar(e); }
    });
  }

  function baixar(blob, nome) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  $('btnSalvar').addEventListener('click', function () {
    if (!cartaoAtual) return;
    gerarPng(cartaoAtual).then(function (blob) {
      baixar(blob, nomeArquivo(cartaoAtual));
      toast('Imagem salva — procure nos downloads do celular.');
    }).catch(function () {
      toast('Não consegui gerar a imagem neste aparelho.');
    });
  });

  $('btnCompartilhar').addEventListener('click', function () {
    if (!cartaoAtual) return;
    var dados = cartaoAtual;
    gerarPng(dados).then(function (blob) {
      var arquivo = null;
      try {
        arquivo = new File([blob], nomeArquivo(dados), { type: 'image/png' });
      } catch (e) {}
      if (arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] }) && navigator.share) {
        navigator.share({
          files: [arquivo],
          title: 'Conselho IA Schools',
          text: fraseEscola(dados.escola) + ' — Workshop IA Schools'
        }).catch(function (e) {
          if (!e || e.name !== 'AbortError') {
            baixar(blob, nomeArquivo(dados));
            toast('Compartilhamento indisponível — imagem baixada.');
          }
        });
      } else {
        baixar(blob, nomeArquivo(dados));
        toast('Compartilhamento indisponível aqui — imagem baixada.');
      }
    }).catch(function () {
      toast('Não consegui gerar a imagem neste aparelho.');
    });
  });

})();
