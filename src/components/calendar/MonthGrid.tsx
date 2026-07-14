import { useState, type CSSProperties, type DragEvent } from "react";
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
  onMoveSchedule?: (
    scheduleId: MonthGridSchedule["id"],
    targetDate: string,
  ) => void | Promise<void>;
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

interface DraggableScheduleProps {
  schedule: MonthGridSchedule;
  isDragging: boolean;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    schedule: MonthGridSchedule,
  ) => void;
  onDragEnd: () => void;
  onSelectDate: (dateKey: string) => void;
}

function EventChip({
  schedule,
  isDragging,
  onDragStart,
  onDragEnd,
  onSelectDate,
}: DraggableScheduleProps) {
  const railColor =
    schedule.railColor ??
    DEFAULT_RAIL_COLOR[schedule.kind === "shift" ? "event" : schedule.kind];
  const railStyle: CSSProperties = { backgroundColor: railColor };
  const isDeadline = schedule.kind === "deadline";

  return (
    <button
      type="button"
      draggable
      aria-label={`${schedule.title} 일정 이동`}
      data-testid="month-grid-chip"
      data-dragging={isDragging ? "true" : undefined}
      className={cn(
        "pointer-events-auto relative flex min-w-0 cursor-grab items-center gap-1 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-2.5 pr-1 text-left text-[12px] leading-4 text-[var(--color-text)] outline-none transition-[opacity,box-shadow] duration-[120ms] hover:ring-1 hover:ring-[var(--color-border-strong)] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[var(--color-brand-hi)]",
        isDeadline && "font-medium text-[var(--color-danger)]",
        isDragging && "opacity-50",
      )}
      title={[schedule.time, schedule.title, "드래그하여 날짜 변경"]
        .filter(Boolean)
        .join(" · ")}
      onClick={() => onSelectDate(schedule.date)}
      onDragStart={(event) => onDragStart(event, schedule)}
      onDragEnd={onDragEnd}
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
    </button>
  );
}

export function MonthGrid({
  month,
  schedules,
  selectedDate,
  today = new Date(),
  onSelectDate,
  onOverflowDate,
  onMoveSchedule,
}: MonthGridProps) {
  const [draggedSchedule, setDraggedSchedule] =
    useState<MonthGridSchedule | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [moveStatus, setMoveStatus] = useState("");
  const cells = buildMonthCells(month, today);
  const schedulesByDate = new Map<string, MonthGridSchedule[]>();

  const beginDrag = (
    event: DragEvent<HTMLElement>,
    schedule: MonthGridSchedule,
  ) => {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(schedule.id));
    }
    setMoveStatus("");
    setDraggedSchedule(schedule);
  };

  const endDrag = () => {
    setDraggedSchedule(null);
    setDropTargetDate(null);
  };

  const dropSchedule = async (targetDate: string, targetLabel: string) => {
    const schedule = draggedSchedule;
    endDrag();
    if (!schedule || schedule.date === targetDate || !onMoveSchedule) return;

    try {
      await onMoveSchedule(schedule.id, targetDate);
      setMoveStatus(
        `${schedule.title} 일정을 ${targetLabel}로 이동했습니다.`,
      );
    } catch {
      setMoveStatus(
        `${schedule.title} 일정을 이동하지 못했습니다. 다시 시도해 주세요.`,
      );
    }
  };

  for (const schedule of schedules) {
    const current = schedulesByDate.get(schedule.date);
    if (current) current.push(schedule);
    else schedulesByDate.set(schedule.date, [schedule]);
  }

  return (
    <>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {moveStatus}
      </span>
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
        const displayedCount =
          visibleSchedules.length + (shifts.length > 0 ? 1 : 0);
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
            data-drop-target={
              dropTargetDate === cell.dateKey ? "true" : undefined
            }
            className={cn(
              "relative min-h-[112px] min-w-0 border-b border-r border-[var(--color-border)] bg-[var(--color-surface-1)] p-2",
              index % 7 === 6 && "border-r-0",
              index >= 35 && "border-b-0",
              !cell.isCurrentMonth && "opacity-60",
              cell.isToday && "bg-[var(--color-brand-soft)]",
              selectedDate === cell.dateKey &&
                "ring-1 ring-inset ring-[var(--color-brand-hi)]",
              dropTargetDate === cell.dateKey &&
                "bg-[var(--color-brand-soft)] ring-2 ring-inset ring-[var(--color-brand-hi)]",
            )}
            onDragOver={(event) => {
              if (
                !draggedSchedule ||
                draggedSchedule.date === cell.dateKey ||
                !onMoveSchedule
              ) {
                return;
              }
              event.preventDefault();
              if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
              setDropTargetDate(cell.dateKey);
            }}
            onDragLeave={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                event.currentTarget.contains(event.relatedTarget)
              ) {
                return;
              }
              if (dropTargetDate === cell.dateKey) setDropTargetDate(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              void dropSchedule(
                cell.dateKey,
                DATE_LABEL_FORMAT.format(cell.date),
              );
            }}
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
                  <button
                    type="button"
                    draggable
                    aria-label={`${shifts[0].title} 일정 이동`}
                    data-shift-code={shifts[0].shiftCode}
                    data-dragging={
                      draggedSchedule?.id === shifts[0].id ? "true" : undefined
                    }
                    className={cn(
                      "pointer-events-auto inline-flex h-5 cursor-grab items-center rounded-full border px-1.5 text-[11px] font-semibold leading-none outline-none transition-[opacity,box-shadow] duration-[120ms] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[var(--color-brand-hi)]",
                      shiftBadgeClasses(shifts[0].shiftCode),
                      draggedSchedule?.id === shifts[0].id && "opacity-50",
                    )}
                    title={`${shifts[0].title} · 드래그하여 날짜 변경`}
                    onClick={() => onSelectDate(shifts[0].date)}
                    onDragStart={(event) => beginDrag(event, shifts[0])}
                    onDragEnd={endDrag}
                  >
                    {shifts[0].shiftCode}
                  </button>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                {visibleSchedules.map((schedule) => (
                  <EventChip
                    key={schedule.id}
                    schedule={schedule}
                    isDragging={draggedSchedule?.id === schedule.id}
                    onDragStart={beginDrag}
                    onDragEnd={endDrag}
                    onSelectDate={onSelectDate}
                  />
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
    </>
  );
}
