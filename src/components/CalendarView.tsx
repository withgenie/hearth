import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { useMemos } from "../hooks/useMemos";
import { useSchedules } from "../hooks/useSchedules";
import { classifyScheduleStyle } from "../lib/scheduleStyle";
import type { Schedule } from "../types";
import { Button } from "../ui/Button";
import { groupJournalMemos } from "./JournalMemoList";
import { DayPanel, type DayPanelSchedule } from "./calendar/DayPanel";
import { MonthGrid, type MonthGridSchedule } from "./calendar/MonthGrid";
import {
  formatLocalDateKey,
  parseLocalDateKey,
} from "./calendar/dateUtils";
import { ScheduleModal } from "./ScheduleModal";
import { useLocale, useT } from "../i18n/LocaleContext";
import type { AppLocale } from "../i18n/locale";

type CalendarScheduleView = MonthGridSchedule & DayPanelSchedule;

const JOURNAL_COLOR_RAIL: Record<string, string> = {
  yellow: "var(--color-brand-hi)",
  pink: "var(--color-p0)",
  blue: "var(--color-p3)",
  green: "var(--color-success)",
  purple: "var(--color-cat-lab)",
};

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftedMonth(month: Date, offset: -1 | 1): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function scheduleTitle(schedule: Schedule, locale: AppLocale): string {
  return schedule.description?.trim() || schedule.location?.trim() || (locale === "ko" ? "일정" : "Schedule");
}

function parsedFocusDate(dateKey: string): Date | null {
  try {
    return parseLocalDateKey(dateKey);
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

function scheduleView(schedule: Schedule, locale: AppLocale): CalendarScheduleView {
  const style = classifyScheduleStyle(schedule);
  const railColor =
    style.railColor.kind === "custom"
      ? style.railColor.value
      : `var(${style.railColor.value})`;

  return {
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    title: scheduleTitle(schedule, locale),
    location: schedule.location,
    notes: schedule.notes,
    icon: schedule.icon,
    kind: style.classification,
    shiftCode: style.shiftCode,
    railColor,
    color: railColor,
  };
}

function journalLocalTime(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function CalendarView() {
  const t = useT();
  const { effective } = useLocale();
  const { schedules, create, update, remove } = useSchedules();
  const { memos } = useMemos();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<number | null>(null);
  const [modal, setModal] = useState<{
    schedule?: Schedule;
    initialDate?: string;
  } | null>(null);

  const scheduleViews = useMemo(
    () => schedules.map((schedule) => scheduleView(schedule, effective)),
    [effective, schedules],
  );
  const schedulesById = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, schedule])),
    [schedules],
  );
  const memoViews = useMemo(
    () =>
      groupJournalMemos(memos).flatMap((group) =>
        group.memos.map(({ memo, createdAt }) => ({
          id: memo.id,
          date: group.dateKey,
          time: journalLocalTime(createdAt, effective),
          content: memo.content || t("(비어 있음)", "(Empty)"),
          color:
            JOURNAL_COLOR_RAIL[memo.color] ?? "var(--color-brand)",
        })),
      ),
    [effective, memos, t],
  );

  const selectDate = (dateKey: string) => {
    const date = parseLocalDateKey(dateKey);
    setVisibleMonth(firstOfMonth(date));
    setSelectedDate(dateKey);
  };

  useEffect(() => {
    const onFocus = (event: Event) => {
      const detail = (
        event as CustomEvent<{ scheduleId?: number; date?: string }>
      ).detail;
      if (typeof detail?.scheduleId !== "number") return;
      setPendingFocusId(detail.scheduleId);

      if (detail.date) {
        const date = parsedFocusDate(detail.date);
        if (date) {
          setVisibleMonth(firstOfMonth(date));
          setSelectedDate(detail.date);
        }
      }
    };
    window.addEventListener("schedule:focus", onFocus);
    return () => window.removeEventListener("schedule:focus", onFocus);
  }, []);

  useEffect(() => {
    if (pendingFocusId === null) return;
    const found = schedulesById.get(pendingFocusId);
    if (!found) return;
    selectDate(found.date);
    setPendingFocusId(null);
  }, [pendingFocusId, schedulesById]);

  const handleSave = async (data: Parameters<typeof create>[0]) => {
    if (modal?.schedule) await update(modal.schedule.id, data);
    else await create(data);
    setModal(null);
  };

  const handleModalDelete = async () => {
    if (!modal?.schedule) return;
    await remove(modal.schedule.id);
    setModal(null);
  };

  const editSchedule = (view: DayPanelSchedule) => {
    const schedule = schedulesById.get(Number(view.id));
    if (schedule) setModal({ schedule });
  };

  const deleteSchedule = async (view: DayPanelSchedule) => {
    const schedule = schedulesById.get(Number(view.id));
    if (schedule) await remove(schedule.id);
  };

  const moveSchedule = async (
    scheduleId: MonthGridSchedule["id"],
    targetDate: string,
  ) => {
    const schedule = schedulesById.get(Number(scheduleId));
    if (!schedule || schedule.date === targetDate) return;

    await update(schedule.id, {
      date: targetDate,
      time: schedule.time ?? undefined,
      location: schedule.location ?? undefined,
      description: schedule.description ?? undefined,
      notes: schedule.notes ?? undefined,
      kind: schedule.kind,
      color: schedule.color ?? undefined,
      icon: schedule.icon ?? undefined,
      remind_before_5min: schedule.remind_before_5min,
      remind_at_start: schedule.remind_at_start,
    });
  };

  const goToToday = () => {
    const nextToday = new Date();
    setVisibleMonth(firstOfMonth(nextToday));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays
            aria-hidden="true"
            className="shrink-0 text-[var(--color-brand-hi)]"
            size={18}
          />
          <h2 className="text-heading text-[var(--color-text-hi)]">
            {new Intl.DateTimeFormat(effective === "ko" ? "ko-KR" : "en-US", {
              year: "numeric",
              month: "long",
            }).format(visibleMonth)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={ChevronLeft}
            aria-label={t("이전 달", "Previous month")}
            title={t("이전 달", "Previous month")}
            onClick={() => setVisibleMonth(shiftedMonth(visibleMonth, -1))}
          />
          <Button type="button" variant="secondary" size="sm" onClick={goToToday}>
            {t("오늘", "Today")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={ChevronRight}
            aria-label={t("다음 달", "Next month")}
            title={t("다음 달", "Next month")}
            onClick={() => setVisibleMonth(shiftedMonth(visibleMonth, 1))}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() =>
              setModal({ initialDate: formatLocalDateKey(new Date()) })
            }
          >
            {t("새 일정", "New schedule")}
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <MonthGrid
          month={visibleMonth}
          schedules={scheduleViews}
          selectedDate={selectedDate}
          today={today}
          onSelectDate={selectDate}
          onOverflowDate={selectDate}
          onMoveSchedule={moveSchedule}
        />
      </div>

      <DayPanel
        open={selectedDate !== null}
        date={selectedDate ?? formatLocalDateKey(today)}
        schedules={scheduleViews}
        memos={memoViews}
        onCreate={(date) => setModal({ initialDate: date })}
        onEdit={editSchedule}
        onDelete={deleteSchedule}
        onNavigateDate={selectDate}
        onClose={() => setSelectedDate(null)}
      />

      {modal && (
        <ScheduleModal
          schedule={modal.schedule}
          initialDate={modal.initialDate}
          onSave={handleSave}
          onDelete={modal.schedule ? handleModalDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
