#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT_DIR="${1:-$ROOT/dist}"
FORBIDDEN='SettingsLicenseSection|io\.hearth\.app\.pro|Hearth Pro|Restore purchase|구매 복원|Loading license status|라이선스 상태를 불러오는 중'

cd "$ROOT"

BUSINESS_MODEL="$(node -p "require('./tasks/asc-submission-state.json').business_model")"
if [[ "$BUSINESS_MODEL" != "paid_upfront" ]]; then
  echo "paid-upfront-contract: expected paid_upfront release model, got $BUSINESS_MODEL" >&2
  exit 1
fi

if rg -n --type ts --glob '!**/__tests__/**' --glob '!*.test.ts' --glob '!*.test.tsx' -e "$FORBIDDEN" src; then
  echo "paid-upfront-contract: production source contains IAP/license UI" >&2
  exit 1
fi

if [[ ! -d "$ARTIFACT_DIR" ]]; then
  echo "paid-upfront-contract: artifact directory not found: $ARTIFACT_DIR" >&2
  exit 1
fi

if rg -a -n -e "$FORBIDDEN" "$ARTIFACT_DIR"; then
  echo "paid-upfront-contract: built artifact contains IAP/license UI" >&2
  exit 1
fi

echo "PASS: paid-upfront source and artifact contain no IAP/license surface"
