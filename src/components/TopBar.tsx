// src/components/TopBar.tsx
import {
  LayoutGrid,
  CalendarDays,
  StickyNote,
  Settings2,
} from "lucide-react";
import type { Tab } from "../types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../lib/cn";
import { AiStatusPill } from "./AiStatusPill";

const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { key: "projects", label: "프로젝트", icon: LayoutGrid },
  { key: "calendar", label: "캘린더", icon: CalendarDays },
  { key: "memos", label: "메모보드", icon: StickyNote },
];

const indicatorTransform: Record<Tab, string> = {
  projects: "translateX(0%)",
  calendar: "translateX(100%)",
  memos: "translateX(200%)",
};

export function TopBar({
  active,
  onChange,
  onOpenSettings,
  version,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  onOpenSettings: () => void;
  version: string;
}) {
  return (
    <div className="flex items-center gap-1 px-4 h-12 bg-[var(--color-surface-1)] border-b border-[var(--color-border)]">
      <span className="text-heading text-[var(--color-text-hi)] mr-1 tracking-tight">
        Hearth
      </span>
      {version && (
        <Tooltip label={`버전 v${version}`}>
          <span className="text-[11px] font-mono text-[var(--color-text-dim)] mr-3">
            v{version}
          </span>
        </Tooltip>
      )}
      <div
        aria-label="주 화면"
        className="relative grid grid-cols-3"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            aria-selected={active === t.key}
            onClick={() => onChange(t.key)}
            role="tab"
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] text-[13px]",
              "transition-colors duration-[120ms]",
              active === t.key
                ? "text-[var(--color-brand-hi)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
            )}
          >
            <Icon icon={t.icon} size={16} />
            {t.label}
          </button>
        ))}
        <span
          aria-hidden="true"
          className="topbar-tab-indicator"
          data-testid="active-tab-indicator"
          style={{
            transform: indicatorTransform[active],
            transitionDuration: "150ms",
            transitionProperty: "transform",
            transitionTimingFunction: "var(--ease-out-smooth)",
          }}
        />
      </div>
      <div className="flex-1" />
      <AiStatusPill />
      <Button
        variant="ghost"
        size="sm"
        leftIcon={Settings2}
        onClick={onOpenSettings}
      >
        설정
      </Button>
    </div>
  );
}
