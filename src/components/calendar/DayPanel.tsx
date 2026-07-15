import { useEffect, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { useLocale, useT } from "../../i18n/LocaleContext";

export interface DayPanelSchedule {
  id: number | string;
  date: string;
  time?: string | null;
  title: string;
  location?: string | null;
  notes?: string | null;
  kind?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface DayPanelMemo {
  id: number | string;
  content: string;
  date?: string;
  time?: string | null;
  color?: string | null;
}

export interface DayPanelProps {
  open: boolean;
  date: string;
  schedules: readonly DayPanelSchedule[];
  memos?: readonly DayPanelMemo[];
  onCreate: (date: string) => void;
  onEdit: (schedule: DayPanelSchedule) => void;
  onDelete: (schedule: DayPanelSchedule) => void;
  onNavigateDate: (date: string) => void;
  onClose: () => void;
}

function parseLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function adjacentLocalDate(dateKey: string, offset: -1 | 1): string {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + offset);
  return formatLocalDate(date);
}

function sortSchedules(schedules: readonly DayPanelSchedule[]) {
  return [...schedules].sort((left, right) => {
    if (left.time && right.time) return left.time.localeCompare(right.time);
    if (left.time) return -1;
    if (right.time) return 1;
    return 0;
  });
}

export function DayPanel({
  open,
  date,
  schedules,
  memos,
  onCreate,
  onEdit,
  onDelete,
  onNavigateDate,
  onClose,
}: DayPanelProps) {
  const t = useT();
  const { effective } = useLocale();
  const dateFormat = new Intl.DateTimeFormat(effective === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const kindLabels: Record<string, string> = {
    event: t("일정", "Event"),
    task: t("할 일", "Task"),
    shift: t("근무", "Shift"),
    anniversary: t("기념일", "Anniversary"),
    deadline: t("마감", "Deadline"),
    meeting: t("미팅", "Meeting"),
  };
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panelRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const titleId = `day-panel-title-${date}`;
  const daySchedules = sortSchedules(
    schedules.filter((schedule) => schedule.date === date),
  );
  const dayMemos = memos
    ?.filter((memo) => memo.date == null || memo.date === date)
    .sort((left, right) => (left.time ?? "").localeCompare(right.time ?? ""));

  const onPanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onNavigateDate(
        adjacentLocalDate(date, event.key === "ArrowLeft" ? -1 : 1),
      );
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-[var(--color-surface-0)]/70"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className="day-panel-surface fixed inset-y-0 right-0 flex w-full max-w-md min-w-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text)] shadow-[var(--shadow-e3)] outline-none"
      >
        <header className="shrink-0 border-b border-[var(--color-border)] p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={ChevronLeft}
                aria-label={t("이전 날짜", "Previous date")}
                title={t("이전 날짜", "Previous date")}
                onClick={() => onNavigateDate(adjacentLocalDate(date, -1))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={ChevronRight}
                aria-label={t("다음 날짜", "Next date")}
                title={t("다음 날짜", "Next date")}
                onClick={() => onNavigateDate(adjacentLocalDate(date, 1))}
              />
            </div>
            <h2
              id={titleId}
              className="min-w-0 flex-1 text-[16px] font-semibold text-[var(--color-text-hi)]"
            >
              {dateFormat.format(parseLocalDate(date))}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={X}
              aria-label={t("날짜 페이지 닫기", "Close day panel")}
              title={t("날짜 페이지 닫기", "Close day panel")}
              onClick={onClose}
            />
          </div>
          <Button
            type="button"
            className="mt-3 w-full"
            leftIcon={Plus}
            onClick={() => onCreate(date)}
          >
            {t("새 일정 추가", "Add schedule")}
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <section aria-labelledby={`${titleId}-schedules`}>
            <h3
              id={`${titleId}-schedules`}
              className="mb-2 text-[12px] font-semibold text-[var(--color-text-muted)]"
            >
              {t(`일정 ${daySchedules.length}개`, `${daySchedules.length} schedules`)}
            </h3>
            <div className="flex min-w-0 flex-col gap-2">
              {daySchedules.map((schedule) => (
                <article
                  key={schedule.id}
                  data-testid="day-panel-schedule"
                  className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 pl-4"
                >
                  <span
                    data-color-rail
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{
                      backgroundColor:
                        schedule.color ?? "var(--color-brand)",
                    }}
                  />
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--color-text-hi)]">
                      {schedule.time ?? t("시간 미정", "No time")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {schedule.icon && (
                          <span aria-hidden="true">{schedule.icon}</span>
                        )}
                        <h4 className="min-w-0 break-words text-[13px] font-semibold text-[var(--color-text-hi)]">
                          {schedule.title}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
                        <span>
                          {kindLabels[schedule.kind ?? "event"] ??
                            schedule.kind}
                        </span>
                        {schedule.location && <span>{schedule.location}</span>}
                      </div>
                      {schedule.notes && (
                        <p className="mt-2 break-words text-[12px] leading-5 text-[var(--color-text-muted)]">
                          {schedule.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={Pencil}
                        aria-label={t(`${schedule.title} 수정`, `Edit ${schedule.title}`)}
                        title={t(`${schedule.title} 수정`, `Edit ${schedule.title}`)}
                        onClick={() => onEdit(schedule)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={Trash2}
                        aria-label={t(`${schedule.title} 삭제`, `Delete ${schedule.title}`)}
                        title={t(`${schedule.title} 삭제`, `Delete ${schedule.title}`)}
                        onClick={() => onDelete(schedule)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          {dayMemos && (
            <section
              aria-labelledby={`${titleId}-memos`}
              className="mt-6 border-t border-[var(--color-border)] pt-4"
            >
              <h3
                id={`${titleId}-memos`}
                className="mb-2 text-[12px] font-semibold text-[var(--color-text-muted)]"
              >
                {t(`저널 메모 ${dayMemos.length}개`, `${dayMemos.length} journal memos`)}
              </h3>
              <div className="flex min-w-0 flex-col gap-2">
                {dayMemos.map((memo) => (
                  <article
                    key={memo.id}
                    className="relative min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 pl-4"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-[3px] bg-[var(--color-border-strong)]"
                      style={
                        memo.color ? { backgroundColor: memo.color } : undefined
                      }
                    />
                    <div className="flex min-w-0 items-start gap-3">
                      {memo.time && (
                        <time className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--color-text-muted)]">
                          {memo.time}
                        </time>
                      )}
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[13px] leading-5 text-[var(--color-text)]">
                        {memo.content}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
