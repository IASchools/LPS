/**
 * Preserva o restante de iaschools.com.br e encaminha somente /universidade.
 *
 * Este Worker ja existe como `universidade-rota`. O arquivo e a fonte versionada
 * para recuperacao; a conexao GitHub descrita em CLOUDFLARE-GITHUB.md publica
 * apenas o Worker de conteudo `universidade-static`.
 */
const ORIGEM = 'https://universidade-static.iaschools-dev.workers.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/universidade')) {
      return fetch(request);
    }

    if (url.pathname === '/universidade') {
      return Response.redirect(url.origin + '/universidade/' + url.search, 308);
    }

    const caminho = url.pathname.replace(/^\/universidade/, '') || '/';

    const resposta = await fetch(ORIGEM + caminho + url.search, {
      headers: request.headers,
      redirect: 'manual',
    });

    const headers = new Headers(resposta.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');

    return new Response(resposta.body, {
      status: resposta.status,
      statusText: resposta.statusText,
      headers,
    });
  },
};
