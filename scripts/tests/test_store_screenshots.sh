#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BEFORE="$(mktemp -t hearth-store-before).txt"
AFTER="$(mktemp -t hearth-store-after).txt"
trap 'rm -f "$BEFORE" "$AFTER"' EXIT

node "$ROOT/scripts/validate-store-screenshots.js" --raw
bash "$ROOT/scripts/generate-store-screenshots.sh" >/dev/null
shasum -a 256 "$ROOT"/docs/superpowers/app-store/screenshots/1.1.0/{ko,en}/*.png > "$BEFORE"
bash "$ROOT/scripts/generate-store-screenshots.sh" >/dev/null
shasum -a 256 "$ROOT"/docs/superpowers/app-store/screenshots/1.1.0/{ko,en}/*.png > "$AFTER"
diff -u "$BEFORE" "$AFTER"
node "$ROOT/scripts/validate-store-screenshots.js" --outputs

echo "PASS: bilingual store screenshots regenerate deterministically"
