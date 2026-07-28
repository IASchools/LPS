# Ligar a Universidade ao GitHub da IA Schools

## Resultado

O Worker `universidade-static` passa a publicar automaticamente somente os
arquivos de `apps/universidade/` a cada alteração nessa pasta. A fábrica de LPs
continua separada no Worker `lps`. O Worker `universidade-rota` e sua rota
`iaschools.com.br/universidade*` permanecem intactos.

## Configuração única no Cloudflare

Na conta `iaschools-dev`:

1. Abrir **Workers & Pages → universidade-static → Settings → Builds**.
2. Clicar em **Connect** e escolher GitHub.
3. Autorizar a organização `IASchools` e selecionar o repositório
   `IASchools/LPS`.
4. Definir **Root directory** como `/apps/universidade`.
5. Definir **Deploy command** como `npx wrangler deploy`.
6. Em **Build watch paths**, incluir `apps/universidade/*`.
7. Salvar e iniciar o primeiro deploy.

No Worker `lps`, manter a raiz `/` e excluir `apps/universidade/*` dos Build
watch paths. Assim, uma mudança na Universidade não republica LPs.

## O que não mudar

- Não criar `public/universidade`.
- Não apontar `universidade-static` para a raiz do repositório.
- Não alterar a rota de `universidade-rota`.
- Não conectar o repositório pessoal `giugiu-a11y/ia-rose`.

## Infra paga

- Funil atendido: matrícula na Universidade IA.
- Dono do custo: IA Schools.
- Teto: plano GitHub/Cloudflare já existente; nenhum serviço recorrente novo.
- Desligamento: desconectar Builds de `universidade-static` e preservar o Worker
  manual anterior como rollback.
