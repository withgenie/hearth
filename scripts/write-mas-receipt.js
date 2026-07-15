#!/usr/bin/env node

import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [receiptArg, pkgArg, sha256, version, buildRaw] = process.argv.slice(2);
const build = Number(buildRaw);
if (!receiptArg || !pkgArg || !/^[0-9a-f]{64}$/i.test(sha256 ?? "") || !version || !Number.isInteger(build)) {
  console.error("usage: write-mas-receipt.js <receipt> <pkg> <sha256> <version> <build>");
  process.exit(64);
}

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const receiptPath = resolve(root, receiptArg);
const packagePath = resolve(root, pkgArg);
readFileSync(packagePath);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root, encoding: "utf8" }).trim();
const receipt = {
  version,
  build,
  package: pkgArg,
  sha256: sha256.toLowerCase(),
  commit,
  tree,
  appleValidated: true,
};
const tmp = `${receiptPath}.tmp-${process.pid}`;
writeFileSync(tmp, JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
renameSync(tmp, receiptPath);
console.log(receiptPath);
