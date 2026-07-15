#!/usr/bin/env node
// Read or atomically finalize the next build-number.json counter.
//
// CFBundleVersion (Apple's monotonically-increasing build number) is distinct
// from CFBundleShortVersionString (the user-visible "1.0.0"). The App Store
// rejects re-uploads that don't bump CFBundleVersion, even when the marketing
// version is unchanged. This script owns that counter; build-mas.sh patches
// the value into Info.plist via PlistBuddy after `tauri build` and before
// re-signing.
//
// build-number.json is checked in so bumps survive across machines.

import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(ROOT, "build-number.json");

const obj = JSON.parse(readFileSync(path, "utf8"));
if (typeof obj.build !== "number" || !Number.isInteger(obj.build) || obj.build < 1) {
  console.error(`bump-build-number: build-number.json has invalid .build: ${obj.build}`);
  process.exit(1);
}

const [command, rawBuild] = process.argv.slice(2);

if (command === "--candidate") {
  console.log(obj.build + 1);
  process.exit(0);
}

if (command === "--finalize") {
  const next = Number(rawBuild);
  if (!Number.isInteger(next) || (next !== obj.build && next !== obj.build + 1)) {
    console.error(`bump-build-number: can only finalize current or next build (current ${obj.build}, requested ${rawBuild})`);
    process.exit(1);
  }
  if (next !== obj.build) {
    const tmp = `${path}.tmp-${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ build: next }, null, 2) + "\n");
    renameSync(tmp, path);
  }
  console.log(`bump-build-number: ${next}`);
  process.exit(0);
}

if (command) {
  console.error("usage: bump-build-number.js [--candidate | --finalize BUILD]");
  process.exit(1);
}

const next = obj.build + 1;
const tmp = `${path}.tmp-${process.pid}`;
writeFileSync(tmp, JSON.stringify({ build: next }, null, 2) + "\n");
renameSync(tmp, path);
console.log(`bump-build-number: ${next}`);
