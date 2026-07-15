#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = join(root, "assets/app-store/1.1.0");
const outputRoot = join(root, "docs/superpowers/app-store/screenshots/1.1.0");
const rawManifestPath = join(assetRoot, "raw-manifest.json");
const claimMapPath = join(assetRoot, "claim-map.json");
const outputManifestPath = join(outputRoot, "manifest.json");

const expectedRaw = [
  "raw/ko/01-projects.png",
  "raw/ko/03-calendar.png",
  "raw/ko/04-memos.png",
  "raw/ko/05-journal.png",
  "raw/en/01-projects.png",
  "raw/en/03-calendar.png",
  "raw/en/04-memos.png",
  "raw/en/05-journal.png",
];
const expectedOutput = [
  "ko/01-workspace.png",
  "ko/02-capture.png",
  "ko/03-calendar.png",
  "ko/04-drag.png",
  "ko/05-local.png",
  "en/01-workspace.png",
  "en/02-capture.png",
  "en/03-calendar.png",
  "en/04-drag.png",
  "en/05-local.png",
];

function fail(message) {
  console.error(`Store screenshot validation failed: ${message}`);
  process.exit(1);
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sameMembers(actual, expected, label) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(`${label} mismatch\nexpected: ${right.join(", ")}\nactual: ${left.join(", ")}`);
  }
}

function pngDimensions(path) {
  const data = readFileSync(path);
  if (data.length < 24 || data.toString("ascii", 1, 4) !== "PNG") fail(`${path} is not a PNG`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

function validateRaw() {
  const manifest = json(rawManifestPath);
  sameMembers(manifest.items.map((item) => item.path), expectedRaw, "raw manifest");
  for (const item of manifest.items) {
    const path = join(assetRoot, item.path);
    if (!existsSync(path)) fail(`missing raw image ${item.path}`);
    if (sha256(path) !== item.sha256) fail(`raw hash mismatch for ${item.path}`);
    if (!item.appData.includes(`hearth-qa-${item.locale}`)) fail(`non-isolated provenance for ${item.path}`);
  }

  const claims = json(claimMapPath);
  for (const locale of ["ko", "en"]) {
    const evidencePath = join(assetRoot, claims[locale].evidence);
    const evidence = readFileSync(evidencePath, "utf8");
    for (const claim of claims[locale].claims) {
      if (!evidence.includes(claim)) fail(`${locale} claim is not in accepted evidence: ${claim}`);
    }
  }
  console.log("PASS: 8 isolated raw images and bilingual agent claims are accepted");
}

function validateOutputs(writeManifest) {
  const actual = ["ko", "en"].flatMap((locale) =>
    readdirSync(join(outputRoot, locale))
      .filter((name) => name.endsWith(".png"))
      .map((name) => `${locale}/${name}`),
  );
  sameMembers(actual, expectedOutput, "store output");
  const items = expectedOutput.map((item) => {
    const path = join(outputRoot, item);
    const [width, height] = pngDimensions(path);
    if (width !== 2880 || height !== 1800) fail(`${item} is ${width}x${height}, expected 2880x1800`);
    return { path: item, sha256: sha256(path), width, height };
  });
  if (writeManifest) {
    writeFileSync(
      outputManifestPath,
      `${JSON.stringify({ version: "1.1.0", rawManifestSha256: sha256(rawManifestPath), items }, null, 2)}\n`,
    );
  }
  console.log("PASS: exactly 10 deterministic-size store screenshots are accepted");
}

const args = new Set(process.argv.slice(2));
if (args.size === 0 || args.has("--raw")) validateRaw();
if (args.has("--outputs")) validateOutputs(args.has("--write-output-manifest"));
