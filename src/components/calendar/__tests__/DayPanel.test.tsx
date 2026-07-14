import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DayPanel, type DayPanelSchedule } from "../DayPanel";

const schedules: DayPanelSchedule[] = [
  {
    id: 1,
    date: "2026-07-14",
    time: null,
    title: "시간 미정 메모",
    kind: "task",
  },
  {
    id: 2,
    date: "2026-07-14",
    time: "14:30",
    title: "오후 미팅",
    kind: "event",
  },
  {
    id: 3,
    date: "2026-07-14",
    time: "09:00",
    title: "아침 근무",
    kind: "shift",
  },
];

describe("DayPanel", () => {
  it("opens a named Korean diary page, sorts timed schedules first, and starts creation for that date", () => {
    const onCreate = vi.fn();
    render(
      <DayPanel
        open
        date="2026-07-14"
        schedules={schedules}
        onCreate={onCreate}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onNavigateDate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const panel = screen.getByRole("dialog", {
      name: "2026년 7월 14일 화요일",
    });
    const rows = within(panel).getAllByTestId("day-panel-schedule");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("09:00"),
      expect.stringContaining("14:30"),
      expect.stringContaining("시간 미정"),
    ]);

    fireEvent.click(within(panel).getByRole("button", { name: "새 일정 추가" }));
    expect(onCreate).toHaveBeenCalledWith("2026-07-14");
  });

  it("shows diary metadata and routes edit and delete actions with the selected schedule", () => {
    const detailed: DayPanelSchedule = {
      id: 7,
      date: "2026-07-14",
      time: "10:20",
      title: "제품 회의",
      location: "회의실 A",
      notes: "결정 사항 정리",
      kind: "event",
      icon: "📌",
      color: "var(--color-brand)",
    };
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <DayPanel
        open
        date="2026-07-14"
        schedules={[detailed]}
        onCreate={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onNavigateDate={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const row = screen.getByTestId("day-panel-schedule");
    expect(row).toHaveTextContent("📌");
    expect(row).toHaveTextContent("일정");
    expect(row).toHaveTextContent("회의실 A");
    expect(row).toHaveTextContent("결정 사항 정리");
    expect(row.querySelector("[data-color-rail]")).toHaveStyle({
      backgroundColor: "var(--color-brand)",
    });

    fireEvent.click(within(row).getByRole("button", { name: "제품 회의 수정" }));
    fireEvent.click(within(row).getByRole("button", { name: "제품 회의 삭제" }));
    expect(onEdit).toHaveBeenCalledWith(detailed);
    expect(onDelete).toHaveBeenCalledWith(detailed);
  });

  it("navigates local dates across a month boundary, closes with Escape, and restores focus", () => {
    const onNavigateDate = vi.fn();
    const onClose = vi.fn();

    function KeyboardHarness() {
      const [open, setOpen] = useState(false);
      const [date, setDate] = useState("2026-06-30");
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            날짜 페이지 열기
          </button>
          <DayPanel
            open={open}
            date={date}
            schedules={[]}
            onCreate={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onNavigateDate={(nextDate) => {
              onNavigateDate(nextDate);
              setDate(nextDate);
            }}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        </>
      );
    }

    render(<KeyboardHarness />);
    const opener = screen.getByRole("button", { name: "날짜 페이지 열기" });
    opener.focus();
    fireEvent.click(opener);

    let panel = screen.getByRole("dialog", {
      name: "2026년 6월 30일 화요일",
    });
    expect(panel).toHaveFocus();
    fireEvent.keyDown(panel, { key: "ArrowRight" });
    expect(onNavigateDate).toHaveBeenLastCalledWith("2026-07-01");

    panel = screen.getByRole("dialog", {
      name: "2026년 7월 1일 수요일",
    });
    fireEvent.keyDown(panel, { key: "ArrowLeft" });
    expect(onNavigateDate).toHaveBeenLastCalledWith("2026-06-30");

    panel = screen.getByRole("dialog", {
      name: "2026년 6월 30일 화요일",
    });
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("renders the optional same-date journal memo section without mixing another date", () => {
    const props = {
      open: true,
      date: "2026-07-14",
      schedules: [],
      onCreate: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onNavigateDate: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(<DayPanel {...props} />);
    expect(screen.queryByRole("heading", { name: /저널 메모/ })).toBeNull();

    rerender(
      <DayPanel
        {...props}
        memos={[
          {
            id: 1,
            date: "2026-07-14",
            time: "08:15",
            content: "아침에 떠오른 아이디어",
            color: "var(--color-success)",
          },
          {
            id: 2,
            date: "2026-07-15",
            content: "내일 메모",
          },
        ]}
      />,
    );

    const memoSection = screen
      .getByRole("heading", { name: "저널 메모 1개" })
      .closest("section");
    expect(memoSection).not.toBeNull();
    expect(within(memoSection as HTMLElement).getByText("08:15")).toBeVisible();
    expect(
      within(memoSection as HTMLElement).getByText("아침에 떠오른 아이디어"),
    ).toBeVisible();
    expect(screen.queryByText("내일 메모")).toBeNull();
  });
});
