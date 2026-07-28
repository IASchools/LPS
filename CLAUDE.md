# CLAUDE.md — iaschools-lps

Central de **landing pages plug-and-play** do iaschools. Cada LP é uma pasta em `public/`;
push no GitHub → a Cloudflare publica em `https://lp.iaschools.com.br/<slug>/`.

> ⚠️ **Escopo:** isto é SÓ a fábrica de LPs em `lp.iaschools.com.br`.
> NÃO é o M60, nem a "LP Universidade IA", nem o IA101, nem o site raiz `iaschools.com.br`.
>
> **Exceção permanente:** `universidade` nunca pode ser criada, copiada ou espelhada aqui.
> Sua fonte exclusiva é `giugiu-a11y/ia-rose` e seu endereço é
> `https://iaschools.com.br/universidade/`. `workshop` continua sendo uma LP normal deste repo.

## Fatos canônicos
- **Repo:** `IASchools/LPS` (privado). Conta GitHub `IASchools` (User). Nunca `matheustomoto`.
- **Cloudflare:** Worker `lps` na conta **`iaschools-dev`** (conta dos devs, dona da zona `iaschools.com.br`).
  Git integration conectada a este repo → deploy a cada push (`npx wrangler deploy`).
- **Domínio:** Custom Domain `lp.iaschools.com.br` (subdomínio; a raiz é dos devs).
- **Este Mac:** push via deploy key SSH `~/.ssh/iaschools_lps_deploy` (alias `github-iaschools-lps`, escopo só LPS).

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
