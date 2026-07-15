import { describe, expect, it } from "vitest";
import { parseLocaleCache, resolveLocale, resolveSystemLocale } from "../locale";

describe("locale resolution", () => {
  it.each([
    [["ko-KR"], "ko"],
    [["fr-FR", "en-US"], "en"],
    [["fr-FR", "ko_KR"], "ko"],
    [["fr-FR"], "en"],
    [[], "en"],
  ] as const)("resolves ordered browser languages %j", (languages, expected) => {
    expect(resolveSystemLocale(languages)).toBe(expected);
  });

  it("keeps explicit preferences independent from browser language", () => {
    expect(resolveLocale("ko", ["en-US"])).toBe("ko");
    expect(resolveLocale("en", ["ko-KR"])).toBe("en");
  });

  it("rejects malformed or inconsistent boot caches", () => {
    expect(parseLocaleCache(null)).toBeNull();
    expect(parseLocaleCache("not json")).toBeNull();
    expect(parseLocaleCache('{"preference":"ja","effective":"en"}')).toBeNull();
    expect(parseLocaleCache('{"preference":"ko","effective":"en"}')).toBeNull();
    expect(parseLocaleCache('{"preference":"system","effective":"ko"}')).toEqual({
      preference: "system",
      effective: "ko",
    });
  });
});
