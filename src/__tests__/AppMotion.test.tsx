import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tab } from "../types";
import { TabViewTransition } from "../App";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
});

function renderView(tab: Tab) {
  return <div data-testid="heavy-view">{tab}</div>;
}

describe("TabViewTransition", () => {
  it("finishes the outgoing view before mounting and animating the incoming view", async () => {
    const { rerender } = render(
      <TabViewTransition activeTab="projects">
        {renderView}
      </TabViewTransition>,
    );

    rerender(
      <TabViewTransition activeTab="calendar">
        {renderView}
      </TabViewTransition>,
    );

    const outgoing = await screen.findByRole("tabpanel");
    expect(outgoing).toHaveClass("tab-view--exiting");
    expect(screen.getAllByTestId("heavy-view")).toHaveLength(1);
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("projects");

    fireEvent.animationEnd(outgoing);
    const incoming = screen.getByRole("tabpanel");
    expect(incoming).toHaveClass("tab-view--entering");
    expect(screen.getAllByTestId("heavy-view")).toHaveLength(1);
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("calendar");

    fireEvent.animationEnd(incoming);
    await waitFor(() => {
      expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--idle");
    });
  });

  it("switches immediately when the user prefers reduced motion", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn().mockReturnValue(true),
      }),
    });
    const { rerender } = render(
      <TabViewTransition activeTab="projects">
        {renderView}
      </TabViewTransition>,
    );

    rerender(
      <TabViewTransition activeTab="calendar">
        {renderView}
      </TabViewTransition>,
    );

    expect(screen.getByTestId("heavy-view")).toHaveTextContent("calendar");
    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--idle");
  });
});
