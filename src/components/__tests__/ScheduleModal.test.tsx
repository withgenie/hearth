import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleModal } from "../ScheduleModal";

describe("ScheduleModal notify toggle", () => {
  it("hides the time picker when notify is off", () => {
    render(
      <ScheduleModal onSave={vi.fn()} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />
    );
    expect(screen.queryByLabelText("시간")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("5분 전")).not.toBeInTheDocument();
  });

  it("reveals time picker + checkboxes when notify is turned on", () => {
    render(
      <ScheduleModal onSave={vi.fn()} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />
    );
    fireEvent.click(screen.getByLabelText("알림 받기"));
    expect(screen.getByLabelText("시간")).toBeInTheDocument();
    expect(screen.getByLabelText("5분 전")).toBeChecked();
    expect(screen.getByLabelText("정각")).not.toBeChecked();
  });

  it("emits notify fields on save when toggle is on", () => {
    const onSave = vi.fn();
    render(
      <ScheduleModal onSave={onSave} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />
    );
    fireEvent.click(screen.getByLabelText("알림 받기"));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-04-20",
        time: "09:00",
        remind_before_5min: true,
        remind_at_start: false,
      })
    );
  });

  it("omits time + flags when toggle stays off", () => {
    const onSave = vi.fn();
    render(
      <ScheduleModal onSave={onSave} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />
    );
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-04-20",
        time: undefined,
        remind_before_5min: false,
        remind_at_start: false,
      })
    );
  });

  it("disables save and shows hint when notify is on but time is cleared", () => {
    render(<ScheduleModal onSave={vi.fn()} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />);
    // Turn notify on — time auto-populates to 09:00 per Task 12 spec.
    fireEvent.click(screen.getByLabelText("알림 받기"));
    // Clear it.
    const timeInput = screen.getByLabelText("시간") as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: "" } });
    // Save must be disabled + hint visible.
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    expect(screen.getByText("시간을 입력해 주세요.")).toBeInTheDocument();
  });

  it("hydrates notify=true when editing a schedule with time", () => {
    render(
      <ScheduleModal
        onSave={vi.fn()}
        onClose={vi.fn()}
        schedule={{
          id: 1,
          date: "2026-04-20",
          time: "10:00",
          location: null,
          description: null,
          notes: null,
          kind: "event",
          color: null,
          icon: null,
          remind_before_5min: true,
          remind_at_start: false,
          created_at: "",
          updated_at: "",
        }}
      />
    );
    expect(screen.getByLabelText("알림 받기")).toBeChecked();
    expect(screen.getByLabelText("시간")).toHaveValue("10:00");
    expect(screen.getByLabelText("5분 전")).toBeChecked();
  });
});

describe("ScheduleModal IME-safe Enter", () => {
  it("submits on Enter when composition is not active", () => {
    const onSave = vi.fn();
    render(<ScheduleModal onSave={onSave} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />);
    const location = screen.getByLabelText("장소");
    // fireEvent.keyDown exposes the synthetic KeyboardEvent; jsdom default
    // isComposing=false / keyCode=13 for Enter.
    fireEvent.keyDown(location, { key: "Enter", code: "Enter" });
    expect(onSave).toHaveBeenCalled();
  });

  it("does NOT submit on Enter during IME composition", () => {
    const onSave = vi.fn();
    render(<ScheduleModal onSave={onSave} onClose={vi.fn()} initialDate="2026-04-20" initialTime="09:00" />);
    const location = screen.getByLabelText("장소");
    fireEvent.keyDown(location, {
      key: "Process", // Safari/WebKit emits "Process" while IME is mid-composition
      code: "Enter",
      keyCode: 229, // WebKit legacy marker for IME-in-progress
      isComposing: true,
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("ScheduleModal schedule metadata", () => {
  it("emits the selected Korean-labelled kind, color, and emoji when creating a schedule", () => {
    // Given: a new schedule form with metadata chosen by the user.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        initialDate="2026-04-20"
        initialTime="09:00"
      />,
    );
    expect(screen.getByRole("option", { name: "일정" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "할 일" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "근무" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "기념일" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("일정 종류"), {
      target: { value: "task" },
    });
    fireEvent.change(screen.getByLabelText("일정 색상"), {
      target: { value: "#123abc" },
    });
    fireEvent.change(screen.getByLabelText("스티커 이모지"), {
      target: { value: "🧑🏽‍💻" },
    });

    // When: the user saves the schedule.
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: the public save payload includes the selected metadata.
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "task",
        color: "#123abc",
        icon: "🧑🏽‍💻",
      }),
    );
  });

  it("hydrates and emits kind, color, and emoji when editing an existing schedule", () => {
    // Given: an existing anniversary schedule with explicit metadata.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        schedule={{
          id: 2,
          date: "2026-05-05",
          time: null,
          location: null,
          description: "기념일",
          notes: null,
          kind: "anniversary",
          color: "#c026d3",
          icon: "👨‍👩‍👧‍👦",
          remind_before_5min: false,
          remind_at_start: false,
          created_at: "",
          updated_at: "",
        }}
      />,
    );

    // When: the edit form is saved without changing its metadata.
    const kind = screen.getByLabelText("일정 종류");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: every persisted value remains visible and is emitted unchanged.
    expect(kind).toHaveValue("anniversary");
    expect(screen.getByLabelText("일정 색상")).toHaveValue("#c026d3");
    expect(screen.getByLabelText("스티커 이모지")).toHaveValue("👨‍👩‍👧‍👦");
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "anniversary",
        color: "#c026d3",
        icon: "👨‍👩‍👧‍👦",
      }),
    );
  });

  it("omits empty optional color and emoji fields from the save payload", () => {
    // Given: a new schedule with both optional metadata fields empty.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        initialDate="2026-04-20"
      />,
    );

    // When: the untouched form is saved.
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: empty optional metadata is absent rather than serialized.
    const submitted = onSave.mock.calls[0]?.[0];
    expect(submitted).not.toHaveProperty("color");
    expect(submitted).not.toHaveProperty("icon");
  });

  it("blocks submit with an accessible Korean error for non-emoji sticker text", () => {
    // Given: sticker text that is not an emoji.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        initialDate="2026-04-20"
      />,
    );
    fireEvent.change(screen.getByLabelText("스티커 이모지"), {
      target: { value: "hello" },
    });

    // When: the user attempts to save.
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: submission is blocked and the field error is announced.
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "스티커는 이모지 1개만 입력해 주세요.",
    );
  });

  it("blocks submit when the sticker contains multiple emoji graphemes", () => {
    // Given: two otherwise valid emoji graphemes.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        initialDate="2026-04-20"
      />,
    );
    fireEvent.change(screen.getByLabelText("스티커 이모지"), {
      target: { value: "🎉✨" },
    });

    // When: the user attempts to save.
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: submission is blocked by the same accessible field error.
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "스티커는 이모지 1개만 입력해 주세요.",
    );
  });

  it.each([
    ["family", "👨‍👩‍👧‍👦"],
    ["skin tone", "👍🏽"],
    ["keycap", "1️⃣"],
  ])("accepts one multi-codepoint %s emoji grapheme", (_label, emoji) => {
    // Given: one emoji represented by multiple Unicode code points.
    const onSave = vi.fn();
    render(
      <ScheduleModal
        onSave={onSave}
        onClose={vi.fn()}
        initialDate="2026-04-20"
      />,
    );
    fireEvent.change(screen.getByLabelText("스티커 이모지"), {
      target: { value: emoji },
    });

    // When: the user saves the schedule.
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    // Then: the full grapheme is emitted without an error.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ icon: emoji }));
  });
});
