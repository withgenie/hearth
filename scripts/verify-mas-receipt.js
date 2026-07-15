#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [receiptArg, pkgArg, version, buildRaw, mode] = process.argv.slice(2);
const build = Number(buildRaw);
if (!receiptArg || !pkgArg || !version || !Number.isInteger(build)) {
  console.error("usage: verify-mas-receipt.js <receipt> <pkg> <version> <build> [--finalized]");
  process.exit(64);
}

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const receipt = JSON.parse(readFileSync(resolve(root, receiptArg), "utf8"));
const packageBytes = readFileSync(resolve(root, pkgArg));
const sha256 = createHash("sha256").update(packageBytes).digest("hex");
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root, encoding: "utf8" }).trim();
const valid = receipt.version === version
  && receipt.build === build
  && resolve(root, receipt.package) === resolve(root, pkgArg)
  && receipt.sha256 === sha256
  && (mode === "--finalized" || (receipt.commit === commit && receipt.tree === tree))
  && receipt.appleValidated === true;

if (!valid) {
  console.error("verify-mas-receipt: receipt does not match package, build, or source tree");
  process.exit(1);
}
console.log(`verify-mas-receipt: ${sha256}`);
