import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Memo, Project } from "../../types";
import {
  JournalMemoList,
  groupJournalMemos,
} from "../JournalMemoList";

const memo = (overrides: Partial<Memo>): Memo => ({
  id: 1,
  content: "memo",
  color: "yellow",
  project_id: null,
  sort_order: 0,
  font_size: "normal",
  is_bold: false,
  focus_x: null,
  focus_y: null,
  tags: [],
  created_at: "2026-07-14 12:00:00",
  updated_at: "2026-07-14 12:00:00",
  ...overrides,
});

const project: Project = {
  id: 7,
  priority: "P2",
  number: null,
  name: "Hearth",
  category: "Tools",
  path: null,
  evaluation: null,
  sort_order: 0,
  created_at: "",
  updated_at: "",
};

describe("JournalMemoList", () => {
  it("groups SQLite UTC timestamps by local date and sorts dates descending, times ascending", () => {
    const groups = groupJournalMemos(
      [
        memo({ id: 1, content: "late", created_at: "2026-07-14 16:30:00" }),
        memo({ id: 2, content: "early", created_at: "2026-07-14 14:30:00" }),
        memo({ id: 3, content: "later same day", created_at: "2026-07-14 15:30:00Z" }),
      ],
      "Asia/Seoul",
    );

    expect(groups.map((group) => group.dateKey)).toEqual([
      "2026-07-15",
      "2026-07-14",
    ]);
    expect(groups[0].memos.map((item) => item.memo.content)).toEqual([
      "later same day",
      "late",
    ]);
    expect(groups[1].memos.map((item) => item.memo.content)).toEqual(["early"]);
  });

  it("formats journal date headings in English when English is effective", () => {
    const [group] = groupJournalMemos(
      [memo({ created_at: "2026-07-14 12:05:00Z" })],
      "Asia/Seoul",
      "en",
    );

    expect(group.label).toMatch(/Jul/);
    expect(group.label).not.toContain("월");
  });

  it("renders sticky Korean date headers, local times, calm color rails, and metadata", () => {
    render(
      <JournalMemoList
        memos={[
          memo({
            content: "저널 메모",
            color: "green",
            project_id: 7,
            created_at: "2026-07-14 12:05:00Z",
          }),
        ]}
        projects={[project]}
        timeZone="Asia/Seoul"
      />,
    );

    const group = screen.getByRole("group", { name: /7월 14일/ });
    expect(within(group).getByText("저널 메모")).toBeInTheDocument();
    expect(within(group).getByText("21:05")).toBeInTheDocument();
    expect(within(group).getByText("Hearth")).toBeInTheDocument();
    expect(within(group).getByTestId("journal-color-rail")).toHaveClass(
      "bg-[var(--color-success)]",
    );
    expect(within(group).getByRole("heading")).toHaveClass("sticky");
  });
});
