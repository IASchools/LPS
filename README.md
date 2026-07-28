# Publicação web — IA Schools

Repositório institucional `IASchools/LPS` com duas superfícies independentes:

- `public/`: fábrica de LPs em `lp.iaschools.com.br`;
- `apps/universidade/`: aplicação separada de
  `iaschools.com.br/universidade/`.

As duas usam o mesmo GitHub da IA Schools, mas têm Workers, diretórios de build e
publicações Cloudflare separados. A Universidade **não é uma LP** e nunca entra em
`public/universidade`.

## Publicar uma LP (time)

1. Duplo-clique em **`Publicar-LP.command`**
2. Arraste a pasta (ou o `.zip`) que o Claude entregou
3. Digite o nome da URL (ex: `mba`)
4. Pronto — no ar em segundos em `https://lp.iaschools.com.br/mba/`

## Estrutura

```
public/
├── index.html      ← índice interno (nada público)
├── _exemplo/       ← molde: copie e renomeie
│   ├── index.html
│   └── assets/
└── mba/            ← cada LP isolada na própria pasta
    ├── index.html
    └── assets/

apps/
└── universidade/   ← aplicação separada, publicada pelo Worker universidade-static
    ├── wrangler.jsonc
    └── public/
        ├── index.html
        └── og-certificacao.png
```

## Regras de cada LP (o molde `_exemplo` já segue)

- **Assets sempre relativos:** `./assets/foto.jpg` (nunca `/assets/...`).
- **`og:image` e `og:url` em URL absoluta** — senão a prévia do link no WhatsApp quebra.
- HTML/CSS/JS puro. Sem React, sem build, sem npm.

## Publicação Cloudflare

- Worker `lps`: raiz do projeto `/`, publica apenas `public/`.
- Worker `universidade-static`: raiz do projeto `/apps/universidade`, publica
  apenas a Universidade.
- Worker `universidade-rota`: mantém exclusivamente a rota
  `iaschools.com.br/universidade*` apontada para `universidade-static`.

O passo único para ligar a Universidade ao GitHub está documentado em
`apps/universidade/CLOUDFLARE-GITHUB.md`.
