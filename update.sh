#!/usr/bin/env bash
# Kompatibilitas perintah lama: bash update.sh
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT_DIR/deploy/update.sh" "$@"