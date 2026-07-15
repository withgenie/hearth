export type LocalePreference = "system" | "ko" | "en";
export type AppLocale = "ko" | "en";

export interface LocaleSettings {
  preference: LocalePreference;
  effective: AppLocale;
}

export const LOCALE_CACHE_KEY = "hearth.locale.v1";
export const LOCALE_EVENT = "locale:changed";

const isPreference = (value: unknown): value is LocalePreference =>
  value === "system" || value === "ko" || value === "en";

const isLocale = (value: unknown): value is AppLocale =>
  value === "ko" || value === "en";

export function resolveSystemLocale(languages: readonly string[]): AppLocale {
  for (const language of languages) {
    const base = language.trim().toLowerCase().split(/[-_]/, 1)[0];
    if (base === "ko" || base === "en") return base;
  }
  return "en";
}

export function resolveLocale(
  preference: LocalePreference,
  languages: readonly string[],
): AppLocale {
  return preference === "system" ? resolveSystemLocale(languages) : preference;
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

export function parseLocaleCache(raw: string | null): LocaleSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!isPreference(parsed.preference) || !isLocale(parsed.effective)) return null;
    if (parsed.preference !== "system" && parsed.preference !== parsed.effective) return null;
    return { preference: parsed.preference, effective: parsed.effective };
  } catch {
    return null;
  }
}

export function initialLocaleSettings(): LocaleSettings {
  if (typeof localStorage !== "undefined") {
    const cached = parseLocaleCache(localStorage.getItem(LOCALE_CACHE_KEY));
    if (cached) return cached;
  }
  return {
    preference: "system",
    effective: resolveSystemLocale(browserLanguages()),
  };
}
