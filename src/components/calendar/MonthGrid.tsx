import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { buildMonthCells } from "./dateUtils";

export type MonthGridKind =
  | "event"
  | "task"
  | "shift"
  | "anniversary"
  | "deadline"
  | "meeting";

export type ShiftCode = "D" | "E" | "OFF";

export interface MonthGridSchedule {
  id: number | string;
  date: string;
  time?: string | null;
  title: string;
  icon?: string | null;
  kind: MonthGridKind;
  shiftCode?: ShiftCode | null;
  railColor?: string;
}

export interface MonthGridProps {
  month: Date;
  schedules: readonly MonthGridSchedule[];
  selectedDate?: string | null;
  today?: Date;
  onSelectDate: (dateKey: string) => void;
  onOverflowDate?: (dateKey: string) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const DATE_LABEL_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

const DEFAULT_RAIL_COLOR: Record<Exclude<MonthGridKind, "shift">, string> = {
  event: "var(--color-brand)",
  task: "var(--color-success)",
  deadline: "var(--color-danger)",
  anniversary: "var(--color-cat-lab)",
  meeting: "var(--color-brand)",
};

function shiftBadgeClasses(code: ShiftCode): string {
  if (code === "D") {
    return "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-hi)]";
  }
  if (code === "E") {
    return "border-[var(--color-p3)] bg-[var(--color-surface-3)] text-[var(--color-p3)]";
  }
  return "border-[var(--color-border-strong)] bg-[var(--color-surface-3)] text-[var(--color-text-dim)]";
}

function scheduleSortValue(schedule: MonthGridSchedule): string {
  return schedule.time ?? "";
}

function EventChip({ schedule }: { schedule: MonthGridSchedule }) {
  const railColor =
    schedule.railColor ??
    DEFAULT_RAIL_COLOR[schedule.kind === "shift" ? "event" : schedule.kind];
  const railStyle: CSSProperties = { backgroundColor: railColor };
  const isDeadline = schedule.kind === "deadline";

  return (
    <div
      data-testid="month-grid-chip"
      className={cn(
        "relative flex min-w-0 items-center gap-1 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-2.5 pr-1 text-[12px] leading-4 text-[var(--color-text)]",
        isDeadline && "font-medium text-[var(--color-danger)]",
      )}
      title={[schedule.time, schedule.title].filter(Boolean).join(" ")}
    >
      <span
        aria-hidden="true"
        data-color-rail
        className="absolute inset-y-0 left-0 w-[3px]"
        style={railStyle}
      />
      {isDeadline && <span aria-hidden="true">⚠</span>}
      {schedule.icon && <span aria-hidden="true">{schedule.icon}</span>}
      {schedule.time && (
        <span className="shrink-0 font-semibold tabular-nums">
          {schedule.time}
        </span>
      )}
      <span className="min-w-0 truncate">{schedule.title}</span>
    </div>
  );
}

export function MonthGrid({
  month,
  schedules,
  selectedDate,
  today = new Date(),
  onSelectDate,
  onOverflowDate,
}: MonthGridProps) {
  const cells = buildMonthCells(month, today);
  const schedulesByDate = new Map<string, MonthGridSchedule[]>();

  for (const schedule of schedules) {
    const current = schedulesByDate.get(schedule.date);
    if (current) current.push(schedule);
    else schedulesByDate.set(schedule.date, [schedule]);
  }

  return (
    <div
      role="grid"
      aria-label={`${month.getFullYear()}년 ${month.getMonth() + 1}월`}
      aria-colcount={7}
      aria-rowcount={7}
      className="grid h-full min-h-0 grid-cols-7 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-1)]"
    >
      {WEEKDAY_LABELS.map((label, weekday) => (
        <div
          key={label}
          role="columnheader"
          aria-colindex={weekday + 1}
          aria-rowindex={1}
          className={cn(
            "border-b border-r border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-2 text-center text-[12px] font-semibold text-[var(--color-text-muted)] last:border-r-0",
            weekday === 0 && "text-[var(--color-danger)]",
            weekday === 6 && "text-[var(--color-p3)]",
          )}
        >
          {label}
        </div>
      ))}

      {cells.map((cell, index) => {
        const daySchedules = schedulesByDate.get(cell.dateKey) ?? [];
        const shifts = daySchedules.filter(
          (schedule): schedule is MonthGridSchedule & { shiftCode: ShiftCode } =>
            schedule.kind === "shift" && schedule.shiftCode != null,
        );
        const regularSchedules = daySchedules
          .filter(
            (schedule) =>
              schedule.kind !== "shift" || schedule.shiftCode == null,
          )
          .sort((left, right) =>
            scheduleSortValue(left).localeCompare(scheduleSortValue(right)),
          );
        const visibleSchedules = regularSchedules.slice(0, 3);
        const displayedCount = visibleSchedules.length + (shifts.length > 0 ? 1 : 0);
        const overflowCount = Math.max(0, daySchedules.length - displayedCount);
        const weekend =
          cell.weekday === 0
            ? "sunday"
            : cell.weekday === 6
              ? "saturday"
              : undefined;

        return (
          <div
            key={cell.dateKey}
            role="gridcell"
            aria-colindex={(index % 7) + 1}
            aria-rowindex={Math.floor(index / 7) + 2}
            data-date={cell.dateKey}
            data-adjacent-month={cell.isCurrentMonth ? undefined : "true"}
            className={cn(
              "relative min-h-[112px] min-w-0 border-b border-r border-[var(--color-border)] bg-[var(--color-surface-1)] p-2",
              index % 7 === 6 && "border-r-0",
              index >= 35 && "border-b-0",
              !cell.isCurrentMonth && "opacity-60",
              cell.isToday && "bg-[var(--color-brand-soft)]",
              selectedDate === cell.dateKey &&
                "ring-1 ring-inset ring-[var(--color-brand-hi)]",
            )}
          >
            <button
              type="button"
              aria-label={DATE_LABEL_FORMAT.format(cell.date)}
              aria-current={cell.isToday ? "date" : undefined}
              aria-pressed={selectedDate === cell.dateKey}
              data-weekend={weekend}
              className={cn(
                "absolute inset-0 z-0 rounded-none text-[var(--color-text-hi)] outline-none transition-colors duration-[120ms] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-hi)]",
                !cell.isCurrentMonth && "text-[var(--color-text-dim)]",
                cell.weekday === 0 && "text-[var(--color-danger)]",
                cell.weekday === 6 && "text-[var(--color-p3)]",
              )}
              onClick={() => onSelectDate(cell.dateKey)}
            />

            <div className="pointer-events-none relative z-[1] flex min-w-0 flex-col gap-1.5">
              <div className="flex min-h-6 items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold tabular-nums",
                    cell.isToday &&
                      "ring-2 ring-[var(--color-brand-hi)] text-[var(--color-text-hi)]",
                  )}
                >
                  {cell.dayNumber}
                </span>
                {shifts[0] && (
                  <span
                    data-shift-code={shifts[0].shiftCode}
                    className={cn(
                      "inline-flex h-5 items-center rounded-full border px-1.5 text-[11px] font-semibold leading-none",
                      shiftBadgeClasses(shifts[0].shiftCode),
                    )}
                  >
                    {shifts[0].shiftCode}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                {visibleSchedules.map((schedule) => (
                  <EventChip key={schedule.id} schedule={schedule} />
                ))}
              </div>
            </div>

            {overflowCount > 0 && (
              <button
                type="button"
                aria-label={`일정 ${overflowCount}개 더 보기`}
                className="relative z-[2] mt-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[12px] font-semibold text-[var(--color-brand-hi)] outline-none transition-colors duration-[120ms] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-hi)]"
                onClick={() =>
                  (onOverflowDate ?? onSelectDate)(cell.dateKey)
                }
              >
                +{overflowCount}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
