# iaschools-lps

Repositório único de landing pages. Cada LP é uma pasta em `public/`.
Push no GitHub → a Cloudflare publica sozinha.

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
```

## Regras de cada LP (o molde `_exemplo` já segue)

- **Assets sempre relativos:** `./assets/foto.jpg` (nunca `/assets/...`).
- **`og:image` e `og:url` em URL absoluta** — senão a prévia do link no WhatsApp quebra.
- HTML/CSS/JS puro. Sem React, sem build, sem npm.

## Setup (uma vez só) — ver conversa com o Claude

- Repositório **privado** no GitHub.
- Worker de assets na Cloudflare conectado a este repo (deploy por push).
- Domínio `lp.iaschools.com.br` apontado pro Worker.
