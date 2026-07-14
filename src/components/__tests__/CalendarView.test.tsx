import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Memo, Schedule } from "../../types";
import { CalendarView } from "../CalendarView";

const scheduleHook = vi.hoisted(() => ({
  schedules: [] as Schedule[],
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const memoHook = vi.hoisted(() => ({
  memos: [] as Memo[],
}));

vi.mock("../../hooks/useSchedules", () => ({
  useSchedules: () => scheduleHook,
}));

vi.mock("../../hooks/useMemos", () => ({
  useMemos: () => memoHook,
}));

function schedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 7,
    date: "2026-07-14",
    time: "10:00",
    location: null,
    description: "제품 회의",
    notes: null,
    kind: "event",
    color: null,
    icon: null,
    remind_before_5min: false,
    remind_at_start: false,
    created_at: "2026-07-14T00:00:00Z",
    updated_at: "2026-07-14T00:00:00Z",
    ...overrides,
  };
}

function memo(overrides: Partial<Memo> = {}): Memo {
  return {
    id: 21,
    content: "CLI에서 적은 새벽 메모",
    color: "green",
    project_id: null,
    sort_order: 0,
    font_size: "normal",
    is_bold: false,
    focus_x: null,
    focus_y: null,
    tags: [],
    created_at: "2026-07-14 16:30:00",
    updated_at: "2026-07-14 16:30:00",
    ...overrides,
  };
}

describe("CalendarView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 14, 12));
    scheduleHook.schedules = [];
    memoHook.memos = [];
    scheduleHook.create.mockReset().mockResolvedValue(undefined);
    scheduleHook.update.mockReset().mockResolvedValue(undefined);
    scheduleHook.remove.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("navigates months with Korean controls and returns to today", () => {
    render(<CalendarView />);

    expect(screen.getByRole("heading", { name: "2026년 7월" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    expect(screen.getByRole("heading", { name: "2026년 8월" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    expect(screen.getByRole("heading", { name: "2026년 7월" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "다음 달" }));
    fireEvent.click(screen.getByRole("button", { name: "오늘" }));
    expect(screen.getByRole("heading", { name: "2026년 7월" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "2026년 7월 14일 화요일" }),
    ).toHaveAttribute("aria-current", "date");
  });

  it("classifies schedule view models for the month grid and day panel", () => {
    scheduleHook.schedules = [
      schedule({
        id: 1,
        description: "세금 신고 마감",
        time: "09:00",
      }),
      schedule({
        id: 2,
        description: "야간 근무 E",
        time: null,
      }),
      schedule({
        id: 3,
        description: "기념일",
        kind: "anniversary",
        color: "var(--color-p3)",
        icon: "🎂",
        time: "18:00",
      }),
    ];

    render(<CalendarView />);

    expect(screen.getByText("⚠")).toBeVisible();
    expect(screen.getByText("E")).toHaveAttribute("data-shift-code", "E");
    expect(screen.getByText("🎂")).toBeVisible();
    const anniversaryChip = screen.getByText("기념일").closest(
      "[data-testid='month-grid-chip']",
    );
    expect(anniversaryChip?.querySelector("[data-color-rail]")).toHaveStyle({
      backgroundColor: "var(--color-p3)",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "2026년 7월 14일 화요일" }),
    );
    const panel = screen.getByRole("dialog", {
      name: "2026년 7월 14일 화요일",
    });
    expect(within(panel).getByText("마감")).toBeVisible();
    expect(within(panel).getByText("근무")).toBeVisible();
    expect(
      within(panel).getByRole("heading", { name: "기념일" }),
    ).toBeVisible();
  });

  it("routes cell, panel, modal, and CRUD actions", async () => {
    scheduleHook.schedules = [schedule()];
    render(<CalendarView />);

    fireEvent.click(
      screen.getByRole("button", { name: "2026년 7월 14일 화요일" }),
    );
    let panel = screen.getByRole("dialog", {
      name: "2026년 7월 14일 화요일",
    });
    fireEvent.click(within(panel).getByRole("button", { name: "새 일정 추가" }));
    expect(screen.getByRole("dialog", { name: "일정 추가" })).toBeVisible();
    expect(screen.getByDisplayValue("2026-07-14")).toHaveAttribute(
      "type",
      "date",
    );
    fireEvent.change(screen.getByLabelText("내용"), {
      target: { value: "새 일정" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(scheduleHook.create).toHaveBeenCalledOnce());

    panel = screen.getByRole("dialog", {
      name: "2026년 7월 14일 화요일",
    });
    fireEvent.click(within(panel).getByRole("button", { name: "제품 회의 수정" }));
    expect(screen.getByRole("dialog", { name: "일정 수정" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("내용"), {
      target: { value: "수정된 회의" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(scheduleHook.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ description: "수정된 회의" }),
      ),
    );

    panel = screen.getByRole("dialog", {
      name: "2026년 7월 14일 화요일",
    });
    fireEvent.click(within(panel).getByRole("button", { name: "제품 회의 삭제" }));
    await waitFor(() => expect(scheduleHook.remove).toHaveBeenCalledWith(7));
  });

  it("opens the overflow date and focuses a schedule after a cold load", async () => {
    scheduleHook.schedules = Array.from({ length: 4 }, (_, index) =>
      schedule({ id: index + 1, date: "2026-07-15", description: `일정 ${index + 1}` }),
    );
    const { rerender } = render(<CalendarView />);

    fireEvent.click(screen.getByRole("button", { name: "일정 1개 더 보기" }));
    expect(
      screen.getByRole("dialog", { name: "2026년 7월 15일 수요일" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "날짜 페이지 닫기" }));

    scheduleHook.schedules = [];
    rerender(<CalendarView />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("schedule:focus", {
          detail: { scheduleId: 99 },
        }),
      );
    });
    scheduleHook.schedules = [
      schedule({ id: 99, date: "2026-09-03", description: "찾은 일정" }),
    ];
    rerender(<CalendarView />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "2026년 9월" })).toBeVisible(),
    );
    expect(
      screen.getByRole("dialog", { name: "2026년 9월 3일 목요일" }),
    ).toHaveTextContent("찾은 일정");
  });

  it("shows SQLite UTC memos on their matching local journal date", () => {
    memoHook.memos = [memo()];
    const createdAt = new Date("2026-07-14T16:30:00Z");
    const dateLabel = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(createdAt);
    const timeLabel = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(createdAt);
    const nextDate = new Date(
      createdAt.getFullYear(),
      createdAt.getMonth(),
      createdAt.getDate() + 1,
    );
    const nextDateLabel = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(nextDate);
    render(<CalendarView />);

    fireEvent.click(screen.getByRole("button", { name: dateLabel }));
    let panel = screen.getByRole("dialog", {
      name: dateLabel,
    });
    const memoContent = within(panel).getByText("CLI에서 적은 새벽 메모");
    expect(within(panel).getByText(timeLabel)).toBeVisible();
    expect(memoContent.closest("article")?.querySelector("span")).toHaveStyle({
      backgroundColor: "var(--color-success)",
    });

    fireEvent.click(within(panel).getByRole("button", { name: "다음 날짜" }));
    panel = screen.getByRole("dialog", {
      name: nextDateLabel,
    });
    expect(within(panel).queryByText("CLI에서 적은 새벽 메모")).toBeNull();
  });
});
