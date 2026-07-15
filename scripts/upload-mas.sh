#!/usr/bin/env bash
# Upload one explicit, hash-verified MAS .pkg to App Store Connect.
#
# Build and upload are split because the build number is consumed on every
# upload (App Store rejects duplicates). Two commands force an explicit
# decision before burning a build.
#
# Spec: docs/superpowers/specs/2026-04-26-mas-readiness-design.md §5
#
# Usage:
#   bash scripts/upload-mas.sh <pkg-path> <sha256>
#
# Required env:
#   APP_STORE_API_KEY_ID
#   APP_STORE_API_ISSUER_ID
#   API_PRIVATE_KEYS_DIR  (defaults to $HOME/.private_keys)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${APP_STORE_API_KEY_ID:-}" || -z "${APP_STORE_API_ISSUER_ID:-}" ]]; then
  echo "upload-mas: APP_STORE_API_KEY_ID / APP_STORE_API_ISSUER_ID must be exported" >&2
  exit 1
fi

[[ "$#" -eq 2 ]] || { echo "usage: bash scripts/upload-mas.sh <pkg-path> <sha256>" >&2; exit 64; }
PKG="$1"
EXPECTED_SHA256="$2"
[[ -f "$PKG" ]] || { echo "upload-mas: package not found: $PKG" >&2; exit 1; }
[[ "$EXPECTED_SHA256" =~ ^[0-9a-fA-F]{64}$ ]] || { echo "upload-mas: invalid SHA-256" >&2; exit 1; }
ACTUAL_SHA256="$(shasum -a 256 "$PKG" | awk '{print $1}')"
EXPECTED_SHA256="$(printf '%s' "$EXPECTED_SHA256" | tr '[:upper:]' '[:lower:]')"
[[ "$ACTUAL_SHA256" == "$EXPECTED_SHA256" ]] || {
  echo "upload-mas: SHA-256 mismatch for $PKG" >&2
  exit 1
}

echo "==> Uploading $PKG"

# TODO(D14 deadline = 2026-05-10): see build-mas.sh — fall back to
#   `xcrun iTMSTransporter -m upload` if altool MAS upload is removed.
xcrun altool --upload-app -f "$PKG" -t macos \
  --apiKey "$APP_STORE_API_KEY_ID" \
  --apiIssuer "$APP_STORE_API_ISSUER_ID"

echo "✅ Upload accepted by App Store Connect — wait ~10–30 min for processing."
