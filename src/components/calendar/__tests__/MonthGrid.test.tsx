import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthGrid, type MonthGridSchedule } from "../MonthGrid";
import {
  buildMonthCells,
  formatLocalDateKey,
  parseLocalDateKey,
} from "../dateUtils";

describe("MonthGrid date utilities", () => {
  it("builds a Sunday-first 42-cell month across the June to July boundary", () => {
    const cells = buildMonthCells(new Date(2026, 6, 1));

    expect(cells).toHaveLength(42);
    expect(cells[0]).toMatchObject({
      dateKey: "2026-06-28",
      weekday: 0,
      isCurrentMonth: false,
    });
    expect(cells[2].dateKey).toBe("2026-06-30");
    expect(cells[3]).toMatchObject({
      dateKey: "2026-07-01",
      weekday: 3,
      isCurrentMonth: true,
    });
    expect(cells[41].dateKey).toBe("2026-08-08");
  });

  it("round-trips date-only keys with local calendar fields instead of UTC", () => {
    const localHalfPastMidnight = new Date(2026, 6, 1, 0, 30);

    expect(formatLocalDateKey(localHalfPastMidnight)).toBe("2026-07-01");
    expect(formatLocalDateKey(parseLocalDateKey("2026-07-01"))).toBe(
      "2026-07-01",
    );
    expect(() => parseLocalDateKey("2026-02-30")).toThrow(
      "Invalid local date key",
    );
  });
});

describe("MonthGrid", () => {
  const schedules: MonthGridSchedule[] = [
    {
      id: 1,
      date: "2026-07-01",
      time: null,
      title: "D 근무",
      kind: "shift",
      shiftCode: "D",
    },
    {
      id: 2,
      date: "2026-07-01",
      time: "10:00",
      title: "팀 미팅",
      icon: "📌",
      kind: "event",
    },
    {
      id: 3,
      date: "2026-07-01",
      time: "13:30",
      title: "문서 정리",
      kind: "task",
    },
    {
      id: 4,
      date: "2026-07-01",
      time: "18:00",
      title: "신고 마감",
      kind: "deadline",
    },
    {
      id: 5,
      date: "2026-07-01",
      time: "23:59",
      title: "숨겨진 기념일",
      kind: "anniversary",
    },
  ];

  function pointerDrag(
    source: HTMLElement,
    target: HTMLElement,
    pointerType: "mouse" | "touch" | "pen" = "mouse",
  ) {
    const pointer = { pointerId: 1, pointerType, button: 0, isPrimary: true };
    fireEvent.pointerDown(source, { ...pointer, clientX: 10, clientY: 10 });
    fireEvent.pointerEnter(target, { ...pointer, clientX: 120, clientY: 40 });
    fireEvent.pointerMove(target, { ...pointer, clientX: 120, clientY: 40 });
    fireEvent.pointerUp(target, { ...pointer, clientX: 120, clientY: 40 });
  }

  it("renders a Korean seven-column grid with today, weekend, and adjacent-month semantics", () => {
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        today={new Date(2026, 6, 4)}
        selectedDate="2026-07-01"
        schedules={[]}
        onSelectDate={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("columnheader").map((node) => node.textContent)).toEqual(
      ["일", "월", "화", "수", "목", "금", "토"],
    );
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);

    const today = screen.getByRole("button", {
      name: "2026년 7월 4일 토요일",
    });
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(today.getAttribute("data-weekend")).toBe("saturday");
    expect(today.className).toContain("text-[var(--color-p3)]");

    const sunday = screen.getByRole("button", {
      name: "2026년 7월 5일 일요일",
    });
    expect(sunday.getAttribute("data-weekend")).toBe("sunday");
    expect(sunday.className).toContain("text-[var(--color-danger)]");

    const adjacent = screen
      .getByRole("button", { name: "2026년 6월 30일 화요일" })
      .closest("[role='gridcell']");
    expect(adjacent?.getAttribute("data-adjacent-month")).toBe("true");
    expect(adjacent?.className).toContain("opacity-60");

    expect(
      screen
        .getByRole("button", { name: "2026년 7월 1일 수요일" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("shows one shift badge, three readable chips, and routes overflow to the day callback", () => {
    const onSelectDate = vi.fn();
    const onOverflowDate = vi.fn();
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        today={new Date(2026, 6, 14)}
        schedules={schedules}
        onSelectDate={onSelectDate}
        onOverflowDate={onOverflowDate}
      />,
    );

    const cell = screen
      .getByRole("button", { name: "2026년 7월 1일 수요일" })
      .closest("[role='gridcell']");
    expect(cell).not.toBeNull();
    const scoped = within(cell as HTMLElement);

    expect(scoped.getByText("D").getAttribute("data-shift-code")).toBe("D");
    const chips = scoped.getAllByTestId("month-grid-chip");
    expect(chips).toHaveLength(3);
    expect(chips.every((chip) => chip.className.includes("text-[12px]"))).toBe(
      true,
    );
    expect(scoped.getByText("10:00").className).toContain("font-semibold");
    expect(scoped.getByText("📌").textContent).toBe("📌");
    expect(scoped.getByText("팀 미팅").textContent).toBe("팀 미팅");
    expect(scoped.getByText("⚠").textContent).toBe("⚠");
    expect(scoped.queryByText("숨겨진 기념일")).toBeNull();
    expect(
      (chips[0].querySelector("[data-color-rail]") as HTMLElement).style
        .backgroundColor,
    ).toBe("var(--color-brand)");

    fireEvent.click(scoped.getByRole("button", { name: "일정 1개 더 보기" }));
    expect(onOverflowDate).toHaveBeenCalledWith("2026-07-01");
    expect(onSelectDate).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "2026년 7월 1일 수요일" }),
    );
    expect(onSelectDate).toHaveBeenCalledWith("2026-07-01");
  });

  it.each([
    ["D", "text-[var(--color-brand-hi)]"],
    ["E", "text-[var(--color-p3)]"],
    ["OFF", "text-[var(--color-text-dim)]"],
  ] as const)("styles the %s shift capsule with theme roles", (shiftCode, tokenClass) => {
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={[
          {
            id: shiftCode,
            date: "2026-07-02",
            title: `${shiftCode} 근무`,
            kind: "shift",
            shiftCode,
          },
        ]}
        onSelectDate={vi.fn()}
      />,
    );

    expect(screen.getByText(shiftCode).className).toContain(tokenClass);
  });

  it("keeps a generic shift without D, E, or OFF metadata visible as a normal chip", () => {
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={[
          {
            id: "generic-shift",
            date: "2026-07-03",
            time: "09:00",
            title: "현장 근무",
            kind: "shift",
            shiftCode: null,
          },
        ]}
        onSelectDate={vi.fn()}
      />,
    );

    const cell = screen
      .getByRole("button", { name: "2026년 7월 3일 금요일" })
      .closest("[role='gridcell']") as HTMLElement;
    const scoped = within(cell);

    expect(scoped.queryByText("D")).toBeNull();
    expect(scoped.queryByText("E")).toBeNull();
    expect(scoped.queryByText("OFF")).toBeNull();
    expect(scoped.getByText("현장 근무").textContent).toBe("현장 근무");
    const chip = scoped.getByTestId("month-grid-chip");
    expect(chip.className).toContain("text-[12px]");
    expect(
      (chip.querySelector("[data-color-rail]") as HTMLElement).style
        .backgroundColor,
    ).toBe("var(--color-brand)");
  });

  it("moves schedule chips with physical pointer events without a native drag event", async () => {
    const onMoveSchedule = vi.fn().mockResolvedValue(undefined);
    const onSelectDate = vi.fn();
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={schedules}
        onSelectDate={onSelectDate}
        onMoveSchedule={onMoveSchedule}
      />,
    );

    const targetCell = screen
      .getByRole("button", { name: "2026년 7월 2일 목요일" })
      .closest("[role='gridcell']") as HTMLElement;
    const chip = screen.getByRole("button", { name: "팀 미팅 일정 이동" });
    fireEvent.pointerDown(chip, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      isPrimary: true,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerEnter(targetCell, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 120,
      clientY: 40,
    });
    expect(targetCell.getAttribute("data-drop-target")).toBe("true");
    fireEvent.pointerMove(targetCell, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 120,
      clientY: 40,
    });
    fireEvent.pointerUp(targetCell, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 120,
      clientY: 40,
    });
    fireEvent.click(chip);

    await waitFor(() =>
      expect(onMoveSchedule).toHaveBeenCalledWith(2, "2026-07-02"),
    );
    expect(onMoveSchedule).toHaveBeenCalledTimes(1);
    expect(onSelectDate).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain(
      "팀 미팅 일정을 2026년 7월 2일 목요일로 이동했습니다.",
    );
  });

  it.each(["D", "E", "OFF"] as const)(
    "routes a dragged %s shift capsule to its target date",
    async (shiftCode) => {
      const onMoveSchedule = vi.fn().mockResolvedValue(undefined);
      render(
        <MonthGrid
          month={new Date(2026, 6, 1)}
          schedules={[
            {
              id: shiftCode,
              date: "2026-07-02",
              title: `${shiftCode} 근무`,
              kind: "shift",
              shiftCode,
            },
          ]}
          onSelectDate={vi.fn()}
          onMoveSchedule={onMoveSchedule}
        />,
      );

      pointerDrag(
        screen.getByRole("button", { name: `${shiftCode} 근무 일정 이동` }),
        screen
          .getByRole("button", { name: "2026년 7월 3일 금요일" })
          .closest("[role='gridcell']") as HTMLElement,
        shiftCode === "OFF" ? "touch" : "mouse",
      );

      await waitFor(() =>
        expect(onMoveSchedule).toHaveBeenCalledWith(shiftCode, "2026-07-03"),
      );
    },
  );

  it("does nothing when dropped on the same date or when no move callback exists", () => {
    const onMoveSchedule = vi.fn();
    const { rerender } = render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={schedules}
        onSelectDate={vi.fn()}
        onMoveSchedule={onMoveSchedule}
      />,
    );

    const sourceCell = screen
      .getByRole("button", { name: "2026년 7월 1일 수요일" })
      .closest("[role='gridcell']") as HTMLElement;
    const chip = screen.getByRole("button", { name: "팀 미팅 일정 이동" });
    pointerDrag(chip, sourceCell);
    expect(onMoveSchedule).not.toHaveBeenCalled();

    rerender(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={schedules}
        onSelectDate={vi.fn()}
      />,
    );
    pointerDrag(
      screen.getByRole("button", { name: "팀 미팅 일정 이동" }),
      screen
        .getByRole("button", { name: "2026년 7월 2일 목요일" })
        .closest("[role='gridcell']") as HTMLElement,
    );
    expect(onMoveSchedule).not.toHaveBeenCalled();
  });

  it("keeps a schedule chip's ordinary click behavior when no drag occurred", () => {
    const onSelectDate = vi.fn();
    render(
      <MonthGrid
        month={new Date(2026, 6, 1)}
        schedules={schedules}
        onSelectDate={onSelectDate}
        onMoveSchedule={vi.fn()}
      />,
    );

    const chip = screen.getByRole("button", { name: "팀 미팅 일정 이동" });
    fireEvent.pointerDown(chip, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      isPrimary: true,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(chip, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(chip);

    expect(onSelectDate).toHaveBeenCalledOnce();
    expect(onSelectDate).toHaveBeenCalledWith("2026-07-01");
  });
});
