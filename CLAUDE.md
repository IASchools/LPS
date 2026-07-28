# CLAUDE.md — publicação web IA Schools

Central de **landing pages plug-and-play** do iaschools. Cada LP é uma pasta em `public/`;
push no GitHub → a Cloudflare publica em `https://lp.iaschools.com.br/<slug>/`.

> ⚠️ **Escopo:** `public/` é SÓ a fábrica de LPs em `lp.iaschools.com.br`.
> NÃO é o M60, nem o IA101, nem o site raiz `iaschools.com.br`.
>
> **Exceção permanente:** a Universidade está no mesmo GitHub institucional, mas como
> aplicação independente em `apps/universidade/`. Ela nunca pode entrar em
> `public/universidade` nem ser publicada pelo Worker `lps`. `workshop` continua sendo
> uma LP normal em `public/workshop`.

## Fatos canônicos
- **Repo institucional:** `IASchools/LPS`. Nunca usar `giugiu-a11y` nem `matheustomoto`
  para Workshop ou Universidade.
- **Cloudflare:** Worker `lps` na conta **`iaschools-dev`** (conta dos devs, dona da zona `iaschools.com.br`).
  Git integration conectada a este repo → deploy a cada push (`npx wrangler deploy`).
- **Domínio:** Custom Domain `lp.iaschools.com.br` (subdomínio; a raiz é dos devs).
- **Este Mac:** push via deploy key SSH `~/.ssh/iaschools_lps_deploy` (alias `github-iaschools-lps`, escopo só LPS).

## Universidade — aplicação separada

- **Fonte:** `apps/universidade/public/`.
- **Config:** `apps/universidade/wrangler.jsonc`.
- **Worker de conteúdo:** `universidade-static`.
- **Worker de rota preservado:** `universidade-rota`.
- **Rota exclusiva:** `iaschools.com.br/universidade*`.
- **Build Root Directory:** `/apps/universidade`.
- **Build watch path:** `apps/universidade/*`.

Uma alteração em `apps/universidade/` não pode publicar nem sobrescrever `public/`.
Uma alteração de LP não deve disparar a publicação da Universidade.

## Publicar uma LP
`Publicar-LP.command` → arrasta a pasta/zip → digita o slug → ele copia pra `public/<slug>`, commita e dá push.
Molde em `public/_exemplo/`.

O publicador e o hook `pre-push` chamam o guard fail-closed
`/Users/visitante/.codex/scripts/project_infra_guard.py`. Divergência de projeto, GitHub,
conta Cloudflare, Worker, rota ou slug reservado bloqueia a operação.

## Regras de cada LP
- HTML/CSS/JS puro (sem React/Vite/npm/build).
- Assets **relativos**: `./assets/...` (nunca `/assets/...`).
- `og:image` e `og:url` em **URL absoluta** (senão a prévia no WhatsApp quebra).

## GUARDRAILS — não quebrar o site dos devs
`iaschools.com.br` (raiz), `www`, `/login`, `/universidade` são DOS DEVS, em produção. `lp.` é subdomínio separado.
Ao mexer, provar: `lp.iaschools.com.br/<slug>/` → 200 **E** raiz/www/universidade/login continuam 200.
