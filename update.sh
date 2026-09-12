#!/usr/bin/env bash
# Update script for VPS — pull, install, build, sync to webroot.
# This script is optimized for a STATIC SPA deployment.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBROOT="${WEBROOT:-/www/wwwroot/kejarprestasi.id}"
BRANCH="${BRANCH:-main}"

echo "==> [1/4] Updating source code (Branch: $BRANCH)"
cd "$ROOT_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# Detect package manager
if [ -f "bun.lock" ]; then
    PKG_MANAGER="bun"
    INSTALL_CMD="bun install"
elif [ -f "package-lock.json" ]; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm ci"
else
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
fi

echo "==> [2/4] Installing dependencies ($PKG_MANAGER)"
$INSTALL_CMD --no-audit --no-fund

echo "==> [3/4] Building production assets (SPA)"
# Ensure we use the correct build script for SPA
npm run build

# SAFETY CHECK: Ensure build actually produced output
if [ ! -f "dist/index.html" ]; then
    echo "ERROR: dist/index.html not found! Build might have failed."
    exit 1
fi

echo "==> [4/4] Syncing to webroot: $WEBROOT"

# If WEBROOT is the same as ROOT_DIR, we must NOT use --delete or we'll wipe the repo!
if [ "$ROOT_DIR" == "$WEBROOT" ] || [ "$ROOT_DIR" == "$(realpath "$WEBROOT")" ]; then
    echo "NOTICE: Root and Webroot are the same. Syncing with care..."
    # Only sync the dist contents to the current dir, no delete of other files
    cp -r dist/* "$WEBROOT/"
else
    mkdir -p "$WEBROOT"
    rsync -a --delete \
      --exclude='.well-known' \
      --exclude='.git' \
      --exclude='.env' \
      dist/ "$WEBROOT/"
fi

# Set permissions for Nginx (www-data)
# We try to chown only if running as root/sudo, otherwise just chmod
if [ "$EUID" -eq 0 ]; then
    chown -R www-data:www-data "$WEBROOT"
fi
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +

echo "==> Done! Deployment successful."
echo "    Webroot: $WEBROOT"
echo "    Domain:  https://kejarprestasi.id"
