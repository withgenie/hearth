// Unified settings modal. Replaces the AI-only dialog.
//
// Three tabs: AI / 백업 / 카테고리. We keep every section mounted so unsaved
// input survives a tab switch; only the `active` prop flips so each section
// can refetch on activation.

import { useEffect, useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { cn } from "../lib/cn";
import { SettingsGeneralSection } from "./SettingsGeneralSection";
import { SettingsThemeSection } from "./SettingsThemeSection";
import { SettingsAiSection } from "./SettingsAiSection";
import { SettingsBackupSection } from "./SettingsBackupSection";
import { SettingsCategoriesSection } from "./SettingsCategoriesSection";
import { SettingsIntegrationsSection } from "./SettingsIntegrationsSection";
import { SettingsAboutSection } from "./SettingsAboutSection";
import { useT } from "../i18n/LocaleContext";

type TabKey =
  | "general"
  | "theme"
  | "ai"
  | "backup"
  | "categories"
  | "integrations"
  | "about";

export function SettingsDialog({
  open,
  onClose,
  initialTab = "general",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: TabKey;
}) {
  const t = useT();
  const tabs: { key: TabKey; label: string }[] = [
    { key: "general", label: t("일반", "General") },
    { key: "theme", label: t("테마", "Theme") },
    { key: "ai", label: "AI" },
    { key: "backup", label: t("백업/가져오기", "Backup/Import") },
    { key: "categories", label: t("카테고리", "Categories") },
    { key: "integrations", label: t("통합", "Integrations") },
    { key: "about", label: t("정보", "About") },
  ];
  const [tab, setTab] = useState<TabKey>(initialTab);

  // Sync the active tab whenever the dialog (re-)opens via a different entry
  // point — e.g. the AiStatusPill dispatches "settings:open" with tab:"ai".
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="settings-title"
      className="max-w-2xl"
    >
      <h2
        id="settings-title"
        className="text-heading text-[var(--color-text-hi)] mb-4"
      >
        {t("설정", "Settings")}
      </h2>

      <div
        role="tablist"
        aria-label={t("설정 탭", "Settings tabs")}
        className="flex gap-1 mb-5 border-b border-[var(--color-border)]"
      >
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "px-3 h-9 text-[13px] -mb-px border-b-2 transition-colors",
              tab === item.key
                ? "border-[var(--color-brand-hi)] text-[var(--color-text-hi)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Each section stays mounted; only visibility flips. `active` tells
          the section it is the one in focus so it can refetch. */}
      <div className={tab === "general" ? "" : "hidden"}>
        <SettingsGeneralSection active={tab === "general"} />
      </div>
      <div className={tab === "theme" ? "" : "hidden"}>
        <SettingsThemeSection />
      </div>
      <div className={tab === "ai" ? "" : "hidden"}>
        <SettingsAiSection active={tab === "ai"} />
      </div>
      <div className={tab === "backup" ? "" : "hidden"}>
        <SettingsBackupSection active={tab === "backup"} />
      </div>
      <div className={tab === "categories" ? "" : "hidden"}>
        <SettingsCategoriesSection />
      </div>
      <div className={tab === "integrations" ? "" : "hidden"}>
        <SettingsIntegrationsSection />
      </div>
      <div className={tab === "about" ? "" : "hidden"}>
        <SettingsAboutSection active={tab === "about"} />
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="secondary" onClick={onClose}>
          {t("닫기", "Close")}
        </Button>
      </div>
    </Dialog>
  );
}
