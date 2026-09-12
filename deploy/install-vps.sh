#!/usr/bin/env bash
# Installer idempoten Prestasi Kita untuk Ubuntu/Debian + nginx.

set -Eeuo pipefail

[ "${EUID:-$(id -u)}" -eq 0 ] || { echo "Jalankan dengan sudo." >&2; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${DOMAIN:-prestasikita.com}"
WEBROOT="${WEBROOT:-/www/wwwroot/$DOMAIN}"
NGINX_SOURCE="$ROOT_DIR/deploy/nginx-kejarprestasi.id.conf"
NGINX_TARGET="${NGINX_TARGET:-/etc/nginx/conf.d/$DOMAIN.conf}"

log() { printf '==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v nginx >/dev/null 2>&1 || fail "nginx belum terpasang."
command -v node >/dev/null 2>&1 || fail "Node.js 20+ belum terpasang."
node_major="$(node -p 'process.versions.node.split(`.`)[0]')"
[ "$node_major" -ge 20 ] || fail "Node.js minimal versi 20 (versi aktif: $node_major)."

log "Menyiapkan webroot $WEBROOT"
mkdir -p "$WEBROOT/releases" "$WEBROOT/.well-known/acme-challenge"

log "Memeriksa konfigurasi domain ganda"
duplicates="$(grep -RslE "server_name[^;]*((www\\.)?$DOMAIN)" /etc/nginx 2>/dev/null | grep -Fv "$NGINX_TARGET" || true)"
if [ -n "$duplicates" ]; then
  printf 'ERROR: konfigurasi nginx lama untuk domain yang sama ditemukan:\n%s\n' "$duplicates" >&2
  printf 'Nonaktifkan file tersebut, lalu jalankan installer kembali.\n' >&2
  exit 1
fi

log "Memasang konfigurasi nginx situs statis"
mkdir -p "$(dirname "$NGINX_TARGET")"
if [ -f "$NGINX_TARGET" ]; then
  cp -a "$NGINX_TARGET" "$NGINX_TARGET.backup-$(date -u +%Y%m%d%H%M%S)"
fi
sed \
  -e "s/prestasikita\.com/$DOMAIN/g" \
  -e "s#/www/wwwroot/$DOMAIN/current#$WEBROOT/current#g" \
  "$NGINX_SOURCE" > "$NGINX_TARGET"

chmod +x "$ROOT_DIR/deploy/update.sh"
log "Membuat rilis pertama"
SKIP_GIT_PULL=1 SKIP_HTTP_CHECK=1 WEBROOT="$WEBROOT" DOMAIN="$DOMAIN" "$ROOT_DIR/deploy/update.sh"

nginx -t || fail "Konfigurasi nginx gagal diuji. Cadangan tersedia di samping file konfigurasi."
systemctl reload nginx

status="$(curl -sS -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:80:127.0.0.1" "http://$DOMAIN/admin" || true)"
case "$status" in
  200|301|302) log "Instalasi berhasil. /admin merespons HTTP $status" ;;
  *) fail "Instalasi selesai tetapi /admin merespons HTTP $status. Periksa log nginx." ;;
esac

log "Tidak diperlukan PM2 atau service Node.js."