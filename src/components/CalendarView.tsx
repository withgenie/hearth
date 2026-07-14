import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { useSchedules } from "../hooks/useSchedules";
import { classifyScheduleStyle } from "../lib/scheduleStyle";
import type { Schedule } from "../types";
import { Button } from "../ui/Button";
import { DayPanel, type DayPanelSchedule } from "./calendar/DayPanel";
import { MonthGrid, type MonthGridSchedule } from "./calendar/MonthGrid";
import {
  formatLocalDateKey,
  parseLocalDateKey,
} from "./calendar/dateUtils";
import { ScheduleModal } from "./ScheduleModal";

type CalendarScheduleView = MonthGridSchedule & DayPanelSchedule;

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftedMonth(month: Date, offset: -1 | 1): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

function scheduleTitle(schedule: Schedule): string {
  return schedule.description?.trim() || schedule.location?.trim() || "일정";
}

function parsedFocusDate(dateKey: string): Date | null {
  try {
    return parseLocalDateKey(dateKey);
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

function scheduleView(schedule: Schedule): CalendarScheduleView {
  const style = classifyScheduleStyle(schedule);
  const railColor =
    style.railColor.kind === "custom"
      ? style.railColor.value
      : `var(${style.railColor.value})`;

  return {
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    title: scheduleTitle(schedule),
    location: schedule.location,
    notes: schedule.notes,
    icon: schedule.icon,
    kind: style.classification,
    shiftCode: style.shiftCode,
    railColor,
    color: railColor,
  };
}

export function CalendarView() {
  const { schedules, create, update, remove } = useSchedules();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<number | null>(null);
  const [modal, setModal] = useState<{
    schedule?: Schedule;
    initialDate?: string;
  } | null>(null);

  const scheduleViews = useMemo(
    () => schedules.map(scheduleView),
    [schedules],
  );
  const schedulesById = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, schedule])),
    [schedules],
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
            {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={ChevronLeft}
            aria-label="이전 달"
            title="이전 달"
            onClick={() => setVisibleMonth(shiftedMonth(visibleMonth, -1))}
          />
          <Button type="button" variant="secondary" size="sm" onClick={goToToday}>
            오늘
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={ChevronRight}
            aria-label="다음 달"
            title="다음 달"
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
            새 일정
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
        />
      </div>

      <DayPanel
        open={selectedDate !== null}
        date={selectedDate ?? formatLocalDateKey(today)}
        schedules={scheduleViews}
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
