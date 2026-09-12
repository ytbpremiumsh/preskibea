#!/usr/bin/env bash
# Update script untuk VPS — pull, install, build, sync ke webroot.
# Jalankan dari root proyek:
#     bash deploy/update.sh
#
# Atau via SSH dari mesin lain:
#     ssh user@server "cd /path/to/repo && bash deploy/update.sh"
#
# Asumsi:
#   - Repo Git ada di direktori kerja
#   - Node 20+ + npm tersedia
#   - Webroot: /www/wwwroot/kejarprestasi.id (sesuaikan kalau beda)
#   - User punya izin tulis ke webroot

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEBROOT="${WEBROOT:-/www/wwwroot/kejarprestasi.id}"
BRANCH="${BRANCH:-main}"

cd "$ROOT_DIR"

echo "==> [1/4] git pull origin $BRANCH"
git fetch --quiet origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> [2/4] npm install"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo "==> [3/4] npm run build (SPA → dist/)"
npm run build

echo "==> [4/4] sync dist/ ke $WEBROOT"
mkdir -p "$WEBROOT"
rsync -a --delete \
  --exclude='.well-known' \
  dist/ "$WEBROOT/"

echo "==> Selesai. Tidak perlu reload nginx (cuma file statis)."
echo "    Akses: https://kejarprestasi.id"
