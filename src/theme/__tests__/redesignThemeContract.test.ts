import { describe, expect, it } from "vitest";
import { hexToRgb } from "../derive";
import { PRESETS } from "../presets";
import { DARK_PRESETS, LIGHT_PRESETS } from "../types";

const PRESET_TOKEN_NAMES = [
  "--color-surface-0",
  "--color-surface-1",
  "--color-surface-2",
  "--color-surface-3",
  "--color-border",
  "--color-border-strong",
  "--color-text-hi",
  "--color-text",
  "--color-text-muted",
  "--color-brand",
  "--color-brand-hi",
  "--color-brand-soft",
] as const;

const THEMED_SEMANTIC_TOKEN_NAMES = [
  "--color-p0",
  "--color-p3",
  "--color-success",
  "--color-danger",
  "--color-cat-lab",
] as const;

const REDESIGN_TOKEN_NAMES = [
  ...PRESET_TOKEN_NAMES,
  ...THEMED_SEMANTIC_TOKEN_NAMES,
] as const;

const TEXT_TOKEN_NAMES = [
  "--color-text-hi",
  "--color-text",
  "--color-text-muted",
] as const;

const SURFACE_TOKEN_NAMES = [
  "--color-surface-0",
  "--color-surface-1",
  "--color-surface-2",
  "--color-surface-3",
] as const;

const ACCENT_TEXT_ROLES = [
  ["--color-brand-hi", "--color-surface-1"],
  ["--color-brand-hi", "--color-surface-2"],
  ["--color-brand-hi", "--color-surface-3"],
] as const;

const NON_TEXT_INDICATOR_TOKEN_NAMES = [
  "--color-brand",
  "--color-p0",
  "--color-p3",
  "--color-success",
  "--color-danger",
  "--color-cat-lab",
] as const;

type NodeProcess = {
  readonly cwd: () => string;
  readonly getBuiltinModule: (name: "fs") => {
    readonly readFileSync: (path: string, encoding: "utf8") => string;
  };
};

function isNodeProcess(value: unknown): value is NodeProcess {
  return (
    typeof value === "object" &&
    value !== null &&
    "cwd" in value &&
    typeof value.cwd === "function" &&
    "getBuiltinModule" in value &&
    typeof value.getBuiltinModule === "function"
  );
}

const CSS_TOKEN_DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;
const nodeProcess: unknown = Reflect.get(globalThis, "process");
if (!isNodeProcess(nodeProcess)) {
  throw new TypeError("theme contract tests require the Node.js test runner");
}
const appCss = nodeProcess
  .getBuiltinModule("fs")
  .readFileSync(`${nodeProcess.cwd()}/src/App.css`, "utf8");
const GLOBAL_TOKENS = new Map(
  [...appCss.matchAll(CSS_TOKEN_DECLARATION)].map((match) => [
    match[1],
    match[2].trim(),
  ]),
);

const PRESET_IDS = [...DARK_PRESETS, ...LIGHT_PRESETS];

function resolvedPresetTokens(presetId: (typeof PRESET_IDS)[number]) {
  return new Map([...GLOBAL_TOKENS, ...Object.entries(PRESETS[presetId])]);
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  const foregroundChannels = [
    foregroundRgb.r,
    foregroundRgb.g,
    foregroundRgb.b,
  ].map((channel) => channel / 255).map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const backgroundChannels = [
    backgroundRgb.r,
    backgroundRgb.g,
    backgroundRgb.b,
  ].map((channel) => channel / 255).map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const foregroundLuminance =
    0.2126 * foregroundChannels[0] +
    0.7152 * foregroundChannels[1] +
    0.0722 * foregroundChannels[2];
  const backgroundLuminance =
    0.2126 * backgroundChannels[0] +
    0.7152 * backgroundChannels[1] +
    0.0722 * backgroundChannels[2];
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe.each(PRESET_IDS)("%s redesign theme contract", (presetId) => {
  it("exposes every token consumed by the redesign", () => {
    const tokens = resolvedPresetTokens(presetId);

    for (const tokenName of REDESIGN_TOKEN_NAMES) {
      expect(
        tokens.get(tokenName),
        `${presetId} is missing ${tokenName}`,
      ).toBeTruthy();
    }
  });

  it("keeps high, primary, and muted text readable on every surface", () => {
    const tokens = resolvedPresetTokens(presetId);

    for (const textToken of TEXT_TOKEN_NAMES) {
      for (const surfaceToken of SURFACE_TOKEN_NAMES) {
        const ratio = contrastRatio(
          tokens.get(textToken) ?? "",
          tokens.get(surfaceToken) ?? "",
        );
        expect(
          ratio,
          `${presetId} ${textToken} on ${surfaceToken}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(ACCENT_TEXT_ROLES)(
    "keeps %s readable as compact text on %s",
    (textToken, surfaceToken) => {
      const tokens = resolvedPresetTokens(presetId);
      const ratio = contrastRatio(
        tokens.get(textToken) ?? "",
        tokens.get(surfaceToken) ?? "",
      );
      expect(
        ratio,
        `${presetId} ${textToken} on ${surfaceToken}`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(NON_TEXT_INDICATOR_TOKEN_NAMES)(
    "keeps the %s rail distinct from a schedule chip",
    (indicatorToken) => {
      const tokens = resolvedPresetTokens(presetId);
      const ratio = contrastRatio(
        tokens.get(indicatorToken) ?? "",
        tokens.get("--color-surface-2") ?? "",
      );
      expect(
        ratio,
        `${presetId} ${indicatorToken} on --color-surface-2`,
      ).toBeGreaterThanOrEqual(3);
    },
  );
});
