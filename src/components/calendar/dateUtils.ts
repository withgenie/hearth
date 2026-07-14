export interface MonthCellDate {
  date: Date;
  dateKey: string;
  dayNumber: number;
  weekday: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const LOCAL_DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatLocalDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const match = LOCAL_DATE_KEY.exec(dateKey);
  if (!match) throw new Error(`Invalid local date key: ${dateKey}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error(`Invalid local date key: ${dateKey}`);
  }

  return parsed;
}

export function buildMonthCells(
  visibleMonth: Date,
  today: Date = new Date(),
): MonthCellDate[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstVisibleDay = 1 - firstOfMonth.getDay();
  const todayKey = formatLocalDateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, firstVisibleDay + index);
    const dateKey = formatLocalDateKey(date);
    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      weekday: date.getDay(),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
    };
  });
}
