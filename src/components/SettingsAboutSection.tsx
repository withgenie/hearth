// About / Version section. Hearth ships through the Mac App Store only —
// updates are delivered by the App Store itself. No update-related UI here:
// App Review guideline 2.4.5(vii) forbids any in-app update check surface
// (build 14 was rejected for a mere "open App Store Updates" link).

import { useEffect, useState } from "react";
import { getVersion, getTauriVersion } from "@tauri-apps/api/app";
import { useT } from "../i18n/LocaleContext";

export function SettingsAboutSection({ active }: { active: boolean }) {
  const t = useT();
  const [version, setVersion] = useState<string>("");
  const [tauri, setTauri] = useState<string>("");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void getVersion()
      .then((v) => {
        if (!cancelled) setVersion(v);
      })
      .catch(() => {
        /* non-Tauri context (tests) */
      });
    void getTauriVersion()
      .then((v) => {
        if (!cancelled) setTauri(v);
      })
      .catch(() => {
        /* non-Tauri context */
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-[13px] text-[var(--color-text-hi)] mb-2">
          {t("버전 정보", "Version information")}
        </h3>
        <div className="rounded-md border border-[var(--color-border)] p-4 text-[12px]">
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--color-text-muted)]">Hearth</span>
            <span className="font-mono text-[var(--color-text-hi)]">
              {version || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--color-text-muted)]">{t("번들 ID", "Bundle ID")}</span>
            <span className="font-mono text-[var(--color-text)]">
              com.codewithgenie.hearth
            </span>
          </div>
          {tauri && (
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--color-text-muted)]">Tauri</span>
              <span className="font-mono text-[var(--color-text)]">
                {tauri}
              </span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] text-[var(--color-text-hi)] mb-2">{t("제작", "Made by")}</h3>
        <p className="text-[12px] text-[var(--color-text-muted)]">
          {t("© 2026 위드지니 · 장재현", "© 2026 WithGenie · Jaehyun Jang")}
          <br />
          문의: genie@codewithgenie.com
        </p>
      </section>
    </div>
  );
}
