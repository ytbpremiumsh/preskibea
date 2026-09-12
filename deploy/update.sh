#!/usr/bin/env bash
# Pembaruan atomik Prestasi Kita. Build gagal tidak merusak situs aktif.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBROOT="${WEBROOT:-/www/wwwroot/prestasikita.com}"
DOMAIN="${DOMAIN:-prestasikita.com}"
BRANCH="${BRANCH:-main}"
RELEASES_DIR="$WEBROOT/releases"
CURRENT_LINK="$WEBROOT/current"
LOCK_FILE="${LOCK_FILE:-/tmp/prestasikita-deploy.lock}"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
PREVIOUS_TARGET=""

log() { printf '==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v flock >/dev/null 2>&1 || fail "flock tidak tersedia (install util-linux)."
exec 9>"$LOCK_FILE"
flock -n 9 || fail "Pembaruan lain sedang berjalan."

cd "$ROOT_DIR"
node_major="$(node -p 'process.versions.node.split(`.`)[0]' 2>/dev/null || true)"
[ -n "$node_major" ] && [ "$node_major" -ge 20 ] || fail "Node.js 20 atau lebih baru diperlukan."
command -v npm >/dev/null 2>&1 || fail "npm tidak ditemukan."

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  log "Mengambil perubahan terbaru dari branch $BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

log "Memasang dependensi"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

log "Membangun situs"
rm -rf dist
npm run build
[ -s dist/index.html ] || fail "Build tidak menghasilkan dist/index.html. Situs aktif tetap aman."
[ -d dist/assets ] || fail "Build tidak menghasilkan folder aset. Situs aktif tetap aman."
grep -q '<div id="root"></div>' dist/index.html || fail "dist/index.html tidak valid."

log "Menyiapkan rilis $RELEASE_ID"
mkdir -p "$RELEASES_DIR"
cp -a dist "$RELEASE_DIR"
[ -s "$RELEASE_DIR/index.html" ] || fail "Rilis baru tidak lengkap."

if [ -L "$CURRENT_LINK" ]; then
  PREVIOUS_TARGET="$(readlink -f "$CURRENT_LINK" || true)"
fi

ln -s "$RELEASE_DIR" "$WEBROOT/.current-$RELEASE_ID"
mv -Tf "$WEBROOT/.current-$RELEASE_ID" "$CURRENT_LINK"

rollback() {
  if [ -n "$PREVIOUS_TARGET" ] && [ -d "$PREVIOUS_TARGET" ]; then
    ln -s "$PREVIOUS_TARGET" "$WEBROOT/.rollback-$RELEASE_ID"
    mv -Tf "$WEBROOT/.rollback-$RELEASE_ID" "$CURRENT_LINK"
  fi
}

if command -v nginx >/dev/null 2>&1; then
  nginx -t || { rollback; fail "Konfigurasi nginx tidak valid; versi sebelumnya dipulihkan."; }
fi

if [ "${SKIP_HTTP_CHECK:-0}" != "1" ] && command -v curl >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then
  status="$(curl -sS -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:80:127.0.0.1" "http://$DOMAIN/admin" || true)"
  case "$status" in
    200|301|302) ;;
    *) rollback; fail "Pemeriksaan /admin menghasilkan HTTP $status; versi sebelumnya dipulihkan." ;;
  esac
fi

find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr | awk 'NR>5 {sub(/^[^ ]+ /, ""); print}' \
  | xargs -r rm -rf

log "Pembaruan selesai. Rilis aktif: $RELEASE_ID"