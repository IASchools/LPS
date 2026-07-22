#!/bin/bash
# ================================================================
#  Publicar-LP.command
#  Arraste a pasta (ou o .zip) da LP, digite o nome, e publica.
#  valida index.html -> copia pra public/<nome> -> commit -> push
#  -> a Cloudflare deploya sozinha em segundos.
# ================================================================
set -uo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR" || { echo "Não achei a pasta do repositório."; exit 1; }

# Ajustar se o domínio final for outro:
BASE_URL="https://lp.iaschools.com.br"

echo "==============================================="
echo "   Publicar LP · iaschools"
echo "==============================================="
echo

# 1) origem: drag&drop no argumento, ou pergunta
SRC="${1:-}"
if [ -z "$SRC" ]; then
  read -r -p "Arraste a PASTA (ou o .zip) da LP aqui e tecle Enter: " SRC
fi
SRC="${SRC%\"}"; SRC="${SRC#\"}"
SRC="$(printf '%s' "$SRC" | sed 's/^ *//; s/ *$//')"
[ -e "$SRC" ] || { echo "❌ Não encontrei: $SRC"; exit 1; }

# 2) se for zip, extrai num temporário
TMP=""
if [[ "$SRC" == *.zip ]]; then
  TMP="$(mktemp -d)"
  unzip -q "$SRC" -d "$TMP" || { echo "❌ Falha ao abrir o zip."; rm -rf "$TMP"; exit 1; }
  inner="$(find "$TMP" -maxdepth 1 -mindepth 1 -type d | head -1)"
  if   [ -f "$TMP/index.html" ]; then SRC="$TMP"
  elif [ -n "$inner" ] && [ -f "$inner/index.html" ]; then SRC="$inner"
  else echo "❌ O zip precisa ter index.html na raiz ou numa única pasta."; rm -rf "$TMP"; exit 1
  fi
fi

# 3) valida index.html
[ -f "$SRC/index.html" ] || { echo "❌ Falta index.html em: $SRC"; [ -n "$TMP" ] && rm -rf "$TMP"; exit 1; }

# 4) nome / slug (só minúsculas, números e hífen)
read -r -p "Nome da LP na URL (ex: mba, workshop, evento): " SLUG
SLUG="$(printf '%s' "$SLUG" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')"
[ -n "$SLUG" ] || { echo "❌ Nome inválido."; [ -n "$TMP" ] && rm -rf "$TMP"; exit 1; }

DEST="public/$SLUG"
if [ -d "$DEST" ]; then
  read -r -p "⚠️  '$SLUG' já existe. Substituir? (s/N): " OK
  case "$OK" in [sS]) rm -rf "$DEST" ;; *) echo "Cancelado."; [ -n "$TMP" ] && rm -rf "$TMP"; exit 0 ;; esac
fi

# 5) copia
mkdir -p "$DEST"
cp -R "$SRC"/. "$DEST"/
[ -n "$TMP" ] && rm -rf "$TMP"
find "$DEST" -name ".DS_Store" -delete 2>/dev/null || true
echo "✅ Copiada para $DEST"

# 6) git commit + push
git add "$DEST"
if git diff --cached --quiet; then
  echo "ℹ️  Nada mudou — já estava idêntica no ar. Fim."
  read -r -p "Enter para fechar." _; exit 0
fi
git commit -m "LP: publica /$SLUG" >/dev/null
echo "⬆️  Enviando para o GitHub..."
if git push; then
  echo
  echo "==============================================="
  echo "   No ar em segundos:"
  echo "   $BASE_URL/$SLUG/"
  echo "==============================================="
else
  echo "❌ O push falhou. Rode uma vez:  gh auth login"
fi
read -r -p "Enter para fechar." _
