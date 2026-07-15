#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, "docs/superpowers/app-store/asc-1.1.0-entry-guide.md");
const source = readFileSync(path, "utf8");

function fail(message) {
  console.error(`ASC copy validation failed: ${message}`);
  process.exit(1);
}

function localeSection(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) fail(`missing section ${start}`);
  return source.slice(from, to);
}

function field(section, heading) {
  const marker = `### ${heading}`;
  const from = section.indexOf(marker);
  if (from < 0) fail(`missing field ${heading}`);
  const tail = section.slice(from + marker.length);
  const match = tail.match(/```text\n([\s\S]*?)\n```/);
  if (!match) fail(`missing text block for ${heading}`);
  return match[1].trim();
}

const koSection = localeSection("## 한국어 입력값", "## 영어 입력값");
const enSection = localeSection("## 영어 입력값", "## 심사 설정");
const locales = {
  ko: {
    name: field(koSection, "앱 이름"),
    subtitle: field(koSection, "부제"),
    promotionalText: field(koSection, "프로모션 텍스트"),
    keywords: field(koSection, "키워드"),
    whatsNew: field(koSection, "새로운 기능"),
    description: field(koSection, "설명"),
    urls: field(koSection, "URL"),
  },
  en: {
    name: field(enSection, "앱 이름"),
    subtitle: field(enSection, "부제"),
    promotionalText: field(enSection, "프로모션 텍스트"),
    keywords: field(enSection, "키워드"),
    whatsNew: field(enSection, "What's New"),
    description: field(enSection, "Description"),
    urls: field(enSection, "URLs"),
  },
};

const limits = {
  name: 30,
  subtitle: 30,
  promotionalText: 170,
  keywords: 100,
  whatsNew: 4000,
  description: 4000,
};
for (const [locale, copy] of Object.entries(locales)) {
  for (const [key, limit] of Object.entries(limits)) {
    if (copy[key].length > limit) fail(`${locale}.${key} is ${copy[key].length}/${limit}`);
  }
  if (/,[ ]/.test(copy.keywords)) fail(`${locale}.keywords contains a space after a comma`);
  const urls = copy.urls.match(/https:\/\/\S+/g) ?? [];
  if (urls.length !== 3) fail(`${locale}.urls must contain exactly 3 HTTPS URLs`);
}
if (locales.en.name !== "Hearth: Local Workspace") fail("unexpected en-US app name");

const hash = createHash("sha256").update(source).digest("hex");
console.log(JSON.stringify({ sourceSha256: hash, locales }, null, 2));
console.error("PASS: ko/en ASC copy fields are within limits and structurally valid");
