import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "../Dialog";

describe("Dialog shared motion", () => {
  it("uses the shared backdrop and panel entry surfaces without changing dismissal", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} labelledBy="dialog-title">
        <h2 id="dialog-title">테스트 대화상자</h2>
      </Dialog>,
    );

    const panel = screen.getByRole("dialog", { name: "테스트 대화상자" });
    const backdrop = panel.parentElement;
    expect(panel).toHaveClass("dialog-panel");
    expect(backdrop).toHaveClass("dialog-backdrop");

    if (backdrop) fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
