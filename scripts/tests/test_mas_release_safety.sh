#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TMP="$(mktemp -d -t hearth-mas-safety.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

mkdir -p "$TMP/counter/scripts"
cp "$REPO_ROOT/scripts/bump-build-number.js" "$TMP/counter/scripts/"
printf '{\n  "build": 12\n}\n' > "$TMP/counter/build-number.json"

candidate="$(node "$TMP/counter/scripts/bump-build-number.js" --candidate)"
[[ "$candidate" == "13" ]] || fail "candidate should be 13, got $candidate"
[[ "$(node -p "require('$TMP/counter/build-number.json').build")" == "12" ]] || fail "candidate consumed the counter"
node "$TMP/counter/scripts/bump-build-number.js" --finalize 13 >/dev/null
[[ "$(node -p "require('$TMP/counter/build-number.json').build")" == "13" ]] || fail "finalize did not persist 13"
node "$TMP/counter/scripts/bump-build-number.js" --finalize 13 >/dev/null
if node "$TMP/counter/scripts/bump-build-number.js" --finalize 15 >/dev/null 2>&1; then
  fail "finalize accepted a skipped build"
fi
pass "candidate is non-consuming and finalize is atomic/idempotent"

PKG="$TMP/Hearth-1.1.0-13.pkg"
printf 'exact package bytes' > "$PKG"
SHA="$(shasum -a 256 "$PKG" | awk '{print $1}')"
BIN="$TMP/bin"
mkdir -p "$BIN"
cat > "$BIN/xcrun" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$HEARTH_TEST_XCRUN_LOG"
SH
chmod +x "$BIN/xcrun"

if APP_STORE_API_KEY_ID=test APP_STORE_API_ISSUER_ID=test PATH="$BIN:$PATH" \
  bash "$REPO_ROOT/scripts/upload-mas.sh" "$PKG" "${SHA%?}0" >/dev/null 2>&1; then
  fail "upload accepted a mismatched hash"
fi
[[ ! -e "$TMP/xcrun.log" ]] || fail "hash mismatch reached xcrun"

HEARTH_TEST_XCRUN_LOG="$TMP/xcrun.log" APP_STORE_API_KEY_ID=test APP_STORE_API_ISSUER_ID=test PATH="$BIN:$PATH" \
  bash "$REPO_ROOT/scripts/upload-mas.sh" "$PKG" "$SHA" >/dev/null
grep -Fq -- "--upload-app -f $PKG" "$TMP/xcrun.log" || fail "upload did not use the explicit package"
pass "upload rejects wrong hashes and targets the exact package"

RECEIPT="$TMP/Hearth-1.1.0-13.receipt.json"
node "$REPO_ROOT/scripts/write-mas-receipt.js" "$RECEIPT" "$PKG" "$SHA" 1.1.0 13 >/dev/null
node "$REPO_ROOT/scripts/verify-mas-receipt.js" "$RECEIPT" "$PKG" 1.1.0 13 >/dev/null
printf 'tampered' >> "$PKG"
if node "$REPO_ROOT/scripts/verify-mas-receipt.js" "$RECEIPT" "$PKG" 1.1.0 13 >/dev/null 2>&1; then
  fail "receipt verification accepted a tampered package"
fi
pass "receipt binds package hash, build, and source tree"

RECOVERY="$TMP/recovery"
mkdir -p "$RECOVERY/scripts" "$RECOVERY/dist-mas"
cp "$REPO_ROOT/scripts/build-mas.sh" "$RECOVERY/scripts/"
cp "$REPO_ROOT/scripts/bump-build-number.js" "$RECOVERY/scripts/"
cp "$REPO_ROOT/scripts/verify-mas-receipt.js" "$RECOVERY/scripts/"
printf '#!/usr/bin/env bash\nexit 0\n' > "$RECOVERY/scripts/check-signing.sh"
printf '#!/usr/bin/env node\n' > "$RECOVERY/scripts/sync-version.js"
printf '{"version":"1.1.0","type":"module"}\n' > "$RECOVERY/package.json"
printf '{"build":13}\n' > "$RECOVERY/build-number.json"
printf 'validated build 13' > "$RECOVERY/dist-mas/Hearth-1.1.0-13.pkg"
RECOVERY_SHA="$(shasum -a 256 "$RECOVERY/dist-mas/Hearth-1.1.0-13.pkg" | awk '{print $1}')"
(
  cd "$RECOVERY"
  git init -q
  git config user.email test@example.com
  git config user.name Test
  git add .
  git commit -qm initial
  COMMIT="$(git rev-parse HEAD)"
  TREE="$(git rev-parse 'HEAD^{tree}')"
  printf '{"version":"1.1.0","build":13,"package":"dist-mas/Hearth-1.1.0-13.pkg","sha256":"%s","commit":"%s","tree":"%s","appleValidated":true}\n' \
    "$RECOVERY_SHA" "$COMMIT" "$TREE" > dist-mas/Hearth-1.1.0-13.receipt.json
  bash scripts/build-mas.sh > recovery.log
)
grep -q 'already Apple-validated and finalized' "$RECOVERY/recovery.log" || fail "finalized build was not recovered"
[[ "$(node -p "require('$RECOVERY/build-number.json').build")" == "13" ]] || fail "recovery advanced to build 14"
[[ ! -e "$RECOVERY/dist-mas/Hearth-1.1.0-14.pkg" ]] || fail "recovery created build 14"
pass "re-running a finalized build 13 never advances to build 14"
