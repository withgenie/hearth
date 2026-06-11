import { describe, expect, it, vi } from "vitest";
import {
  dateKeyFromCalendarValue,
  dateKeyFromVisibleMonthCell,
  scheduleStartDate,
} from "../CalendarView";

describe("CalendarView date handling", () => {
  it("parses date-only schedules as local calendar days", () => {
    const start = scheduleStartDate({ date: "2026-04-20", time: null });

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(20);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("parses timed schedules at the requested local time", () => {
    const start = scheduleStartDate({ date: "2026-04-20", time: "09:30" });

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(20);
    expect(start.getHours()).toBe(9);
    expect(start.getMinutes()).toBe(30);
  });

  it("preserves UTC-midnight calendar slot dates", () => {
    const slotStart = new Date(Date.UTC(2026, 3, 20));

    expect(dateKeyFromCalendarValue(slotStart)).toBe("2026-04-20");
  });

  it("uses the visible month cell under the click point", () => {
    const row = document.createElement("div");
    row.className = "rbc-month-row";

    for (const [index, date] of [
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
    ].entries()) {
      const cell = document.createElement("div");
      cell.className = "rbc-date-cell";
      cell.getBoundingClientRect = vi.fn(
        () =>
          ({
            left: index * 100,
            right: (index + 1) * 100,
            top: 0,
            bottom: 20,
            width: 100,
            height: 20,
            x: index * 100,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      );
      const label = document.createElement("span");
      label.dataset.calendarDate = date;
      cell.append(label);
      row.append(cell);
    }

    document.body.append(row);
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => row);

    try {
      expect(dateKeyFromVisibleMonthCell({ clientX: 150, clientY: 8 })).toBe(
        "2026-06-12",
      );
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      row.remove();
    }
  });
});
