#!/usr/bin/env bash
# Corrige o docroot do notes.gvvcapital.com para o dist real (evita Permission denied
# porque www-data não pode atravessar /home/admin com chmod 750).
#
# Uso no servidor (Hetzner):
#   sudo bash scripts/fix-notes-nginx-root.sh
#
set -euo pipefail
SITE="/etc/nginx/sites-available/notes.gvvcapital.com"
DIST='/data/drive/Workspaces/4. Code/market-notes-haven/dist'

if [[ ! -f "$SITE" ]]; then
  echo "Ficheiro não encontrado: $SITE" >&2
  exit 1
fi
if [[ ! -f "$DIST/index.html" ]]; then
  echo "Corre primeiro: npm run build (falta $DIST/index.html)" >&2
  exit 1
fi

# root com aspas por causa do espaço em "4. Code"
sed -i 's|^[[:space:]]*root[[:space:]].*|    root "'"$DIST"'";|' "$SITE"

nginx -t
systemctl reload nginx
echo "OK: nginx recarregado. root -> $DIST"
