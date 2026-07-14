import { describe, expect, it } from "vitest";

import { classifyScheduleStyle } from "../scheduleStyle";

type ScheduleFixture = {
  description?: string | null;
  location?: string | null;
  kind?: "event" | "task" | "shift" | "anniversary" | null;
  color?: string | null;
};

const style = (schedule: ScheduleFixture) => classifyScheduleStyle(schedule);

describe("classifyScheduleStyle", () => {
  it("lets an explicit non-default kind win over legacy description clues", () => {
    expect(
      style({ kind: "task", description: "야간 근무 마감" }),
    ).toMatchObject({
      classification: "task",
      kind: "task",
      railColor: { kind: "theme-token", value: "--color-success" },
      source: "explicit-kind",
    });

    expect(
      style({ kind: "anniversary", description: "세금 신고" }),
    ).toMatchObject({
      classification: "anniversary",
      kind: "anniversary",
      railColor: { kind: "theme-token", value: "--color-cat-lab" },
      source: "explicit-kind",
    });
  });

  it("keeps a custom color while retaining the resolved classification", () => {
    expect(style({ kind: "task", color: "#123abc" })).toMatchObject({
      classification: "task",
      railColor: { kind: "custom", value: "#123abc" },
      colorSource: "explicit",
    });
  });

  it.each([
    ["오전 근무 D", "D"],
    ["야간 근무 E", "E"],
    ["내일 OFF", "OFF"],
  ] as const)("infers a legacy shift from %s", (description, shiftCode) => {
    expect(style({ kind: "event", description })).toMatchObject({
      classification: "shift",
      kind: "shift",
      shiftCode,
      source: "legacy-description",
    });
  });

  it.each(["결제 마감", "관리비 납부", "부가세 신고"])(
    "infers deadline emphasis from %s",
    (description) => {
      expect(style({ description })).toMatchObject({
        classification: "deadline",
        kind: "event",
        emphasis: "deadline",
        railColor: { kind: "theme-token", value: "--color-danger" },
        source: "legacy-description",
      });
    },
  );

  it("uses meeting tone for a location field or meeting clue", () => {
    expect(style({ location: "회의실 A" })).toMatchObject({
      classification: "meeting",
      railColor: { kind: "theme-token", value: "--color-p3" },
      source: "location",
    });
    expect(style({ description: "디자인 회의 @성수" })).toMatchObject({
      classification: "meeting",
      source: "meeting-clue",
    });
  });

  it("falls back to event tokens without hard-coded surface colors", () => {
    expect(style({ description: "점심 약속" })).toEqual({
      classification: "event",
      kind: "event",
      emphasis: "standard",
      shiftCode: null,
      railColor: { kind: "theme-token", value: "--color-brand" },
      surfaceToken: "--color-surface-2",
      textToken: "--color-text",
      source: "default",
      colorSource: "classification",
    });
  });

  it("ignores an empty custom color", () => {
    expect(style({ color: "  " }).railColor).toEqual({
      kind: "theme-token",
      value: "--color-brand",
    });
  });
});
