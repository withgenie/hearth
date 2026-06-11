import { describe, expect, it } from "vitest";
import {
  dateKeyFromCalendarValue,
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
});
