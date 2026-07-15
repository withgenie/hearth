import { useMemo } from "react";
import type { Memo, Project } from "../types";
import { useT } from "../i18n/LocaleContext";
import { cn } from "../lib/cn";

type JournalMemo = {
  memo: Memo;
  createdAt: Date;
};

export type JournalMemoGroup = {
  dateKey: string;
  label: string;
  memos: JournalMemo[];
};

const COLOR_RAIL_CLASS: Record<string, string> = {
  yellow: "bg-[var(--color-brand-hi)]",
  pink: "bg-[var(--color-p0)]",
  blue: "bg-[var(--color-p3)]",
  green: "bg-[var(--color-success)]",
  purple: "bg-[var(--color-cat-lab)]",
};

function parseSqliteUtc(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const sqliteDateTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const normalized = sqliteDateTime.test(trimmed) && !hasTimeZone
    ? `${trimmed.replace(" ", "T")}Z`
    : trimmed;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function localDateKey(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function koreanDateLabel(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function groupJournalMemos(
  memos: Memo[],
  timeZone?: string,
): JournalMemoGroup[] {
  const grouped = new Map<string, JournalMemoGroup>();

  for (const memo of memos) {
    const createdAt = parseSqliteUtc(memo.created_at);
    if (!createdAt) continue;
    const dateKey = localDateKey(createdAt, timeZone);
    const group = grouped.get(dateKey) ?? {
      dateKey,
      label: koreanDateLabel(createdAt, timeZone),
      memos: [],
    };
    group.memos.push({ memo, createdAt });
    grouped.set(dateKey, group);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .map((group) => ({
      ...group,
      memos: [...group.memos].sort(
        (a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.memo.id - b.memo.id,
      ),
    }));
}

function localTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function JournalMemoList({
  memos,
  projects,
  timeZone,
}: {
  memos: Memo[];
  projects: Project[];
  timeZone?: string;
}) {
  const t = useT();
  const groups = useMemo(
    () => groupJournalMemos(memos, timeZone),
    [memos, timeZone],
  );
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  return (
    <div
      data-testid="journal-memo-list"
      className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1"
    >
      {groups.map((group) => {
        const headingId = `journal-date-${group.dateKey}`;
        return (
          <section
            key={group.dateKey}
            role="group"
            aria-labelledby={headingId}
            className="flex flex-col gap-2"
          >
            <h3
              id={headingId}
              className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface-0)] py-2 text-[13px] font-semibold text-[var(--color-text-hi)]"
            >
              {group.label}
            </h3>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-1)] divide-y divide-[var(--color-border)]">
              {group.memos.map(({ memo, createdAt }) => {
                const projectName = memo.project_id
                  ? projectNames.get(memo.project_id)
                  : undefined;
                return (
                  <article
                    key={memo.id}
                    data-memo-id={memo.id}
                    className="relative min-w-0 px-4 py-3 pl-5"
                  >
                    <span
                      data-testid="journal-color-rail"
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-0 left-0 w-[3px]",
                        COLOR_RAIL_CLASS[memo.color] ??
                          "bg-[var(--color-brand)]",
                      )}
                    />
                    <p
                      className={cn(
                        "whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--color-text)]",
                        memo.is_bold && "font-semibold",
                      )}
                    >
                      {memo.content || t("(비어 있음)", "(Empty)")}
                    </p>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-text-dim)]">
                      <time dateTime={memo.created_at}>
                        {localTime(createdAt, timeZone)}
                      </time>
                      {projectName ? (
                        <span className="truncate text-[var(--color-text-muted)]">
                          {projectName}
                        </span>
                      ) : null}
                      {memo.tags.map((tag) => (
                        <span key={tag.id}>#{tag.name}</span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
