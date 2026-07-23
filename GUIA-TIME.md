# Guia do time — como subir uma LP

Central de landing pages do iaschools. Você sobe uma pasta, o site publica sozinho em
**`https://lp.iaschools.com.br/<slug>/`** em ~1-2 min.

> ⚠️ Isto é SÓ a fábrica de LPs em `lp.iaschools.com.br`. **Não** é o M60, nem a Universidade IA,
> nem o site raiz `iaschools.com.br` (esse é dos devs — você não consegue quebrar ele por aqui).

---

## Antes: acesso ao repositório
O repo `IASchools/LPS` é **privado**. Você precisa de acesso de escrita. Peça pro responsável te
adicionar em `Settings → Collaborators` com permissão **Write** (usando a sua conta do GitHub).

---

## Preparar a pasta da LP
- Nome da pasta = **slug** da URL: tudo **minúsculo, sem espaço e sem acento**
  (ex: `black-friday`, `evento-diretores`).
- Dentro: `index.html` + a pasta `assets/`.
- Regras que **não podem quebrar**:
  - Assets em caminho **relativo**: `./assets/...` (nunca `/assets/...`)
  - `og:image` e `og:url` em **URL absoluta**: `https://lp.iaschools.com.br/<slug>/...`
    (senão a prévia do link no WhatsApp/Instagram quebra)
- 💡 Copie a pasta `public/_exemplo/` como molde e edite por cima.

---

## Subir (pelo navegador — sem instalar nada)
1. Abra `github.com/IASchools/LPS`
2. Clique na pasta **`public`** (importante: o upload cai onde você está)
3. Botão **`Add file` → `Upload files`**
4. **Arraste a pasta inteira** da LP (ex: `black-friday/`) para a área de upload
5. Em "Commit changes", escreva algo como `sobe LP black-friday` e clique **`Commit changes`**
6. Pronto ✅ — em ~1-2 min a LP está no ar em `https://lp.iaschools.com.br/black-friday/`

**Atualizar uma LP:** mesmo caminho, entre em `public/<slug>/` e suba o arquivo novo por cima.

**Sobe LP toda semana?** Use o **GitHub Desktop**: clone o repo uma vez, arraste a pasta em
`public/`, `Commit` → `Push`. Mesmo efeito, mais confortável.

---

## Não faça
- Não edite `wrangler.jsonc`, `package.json` nem `Publicar-LP.command` (é a "encanação" que faz o deploy).
- Mexa só **dentro de `public/`**.
- Limite do upload pelo navegador: 25 MB por arquivo.

---

## Deu ruim?
- LP não aparece depois de 3 min → confira se subiu dentro de `public/<slug>/` (e não na raiz do repo).
- Imagens/fontes quebradas → quase sempre é caminho absoluto `/assets/`; troque por `./assets/`.
- Prévia do link sem imagem → `og:image`/`og:url` precisam ser URL **absoluta** com o slug certo.
