import { PRIORITIES, PRIORITY_COLORS } from "../types";
import type { Priority } from "../types";
import { useCategories } from "../hooks/useCategories";
import { cn } from "../lib/cn";
import { useT } from "../i18n/LocaleContext";

export function Sidebar({
  activePriorities,
  activeCategory,
  onTogglePriority,
  onSelectCategory,
}: {
  activePriorities: Set<Priority>;
  activeCategory: string | null;
  onTogglePriority: (p: Priority) => void;
  onSelectCategory: (c: string | null) => void;
}) {
  const t = useT();
  const { categories } = useCategories();
  const priorityLabels: Record<Priority, string> = {
    P0: t("긴급", "Urgent"),
    P1: t("높음", "High"),
    P2: t("중간", "Medium"),
    P3: t("낮음", "Low"),
    P4: t("참고", "Reference"),
  };

  return (
    <aside className="w-56 shrink-0 bg-[var(--color-surface-1)] border-r border-[var(--color-border)] py-5 px-3 flex flex-col gap-7 overflow-y-auto">
      <FilterGroup label={t("우선순위", "Priority")}>
        {PRIORITIES.map((p) => (
          <FilterItem
            key={p}
            active={activePriorities.has(p)}
            onClick={() => onTogglePriority(p)}
            dot={PRIORITY_COLORS[p]}
            text={`${p} — ${priorityLabels[p]}`}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t("카테고리", "Categories")}>
        {/* "전체 보기" — default state. Sends no category filter so rows with
             NULL category (which SQL `IN (...)` would drop) also appear. */}
        <FilterItem
          active={activeCategory === null}
          onClick={() => onSelectCategory(null)}
          text={t("전체 보기", "View all")}
        />
        {categories.map((c) => (
          <FilterItem
            key={c.id}
            active={activeCategory === c.name}
            // Click-again on the active category falls back to 전체 보기 so
            // the user can always return to "all" without hunting for the
            // 전체 보기 row.
            onClick={() =>
              onSelectCategory(activeCategory === c.name ? null : c.name)
            }
            dot={c.color}
            text={c.name}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-label text-[var(--color-text-dim)] mb-2 px-1">{label}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function FilterItem({
  active,
  onClick,
  dot,
  text,
}: {
  active: boolean;
  onClick: () => void;
  /** Omitted for "전체 보기" which has no color. The spacer below keeps
   *  label text left-aligned with dotted rows. */
  dot?: string;
  text: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 h-7 px-2 rounded-[var(--radius-sm)] text-[12px] text-left",
        "transition-colors duration-[120ms]",
        active
          ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
          : "text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]"
      )}
      aria-pressed={active}
    >
      {dot ? (
        <span
          className={cn("w-2 h-2 rounded-full shrink-0", !active && "opacity-40")}
          style={{ backgroundColor: dot }}
        />
      ) : (
        <span className="w-2 h-2 shrink-0" aria-hidden="true" />
      )}
      {text}
    </button>
  );
}
