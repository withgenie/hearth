import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tab } from "../types";
import { TabViewTransition } from "../App";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  vi.useRealTimers();
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

function finishAnimation(element: Element, animationName: string) {
  const event = new Event("animationend", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: animationName });
  fireEvent(element, event);
}

describe("TabViewTransition", () => {
  it("finishes both phases on time when WebKit omits animationend", () => {
    vi.useFakeTimers();
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

    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--exiting");
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("projects");

    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--entering");
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("calendar");

    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--idle");
  });

  it("enters the latest tab without restarting an in-flight exit", () => {
    vi.useFakeTimers();
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
    act(() => vi.advanceTimersByTime(75));
    rerender(
      <TabViewTransition activeTab="memos">
        {renderView}
      </TabViewTransition>,
    );
    act(() => vi.advanceTimersByTime(75));

    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--entering");
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("memos");
  });

  it("clears the phase fallback when the transition unmounts", () => {
    vi.useFakeTimers();
    const { rerender, unmount } = render(
      <TabViewTransition activeTab="projects">
        {renderView}
      </TabViewTransition>,
    );

    rerender(
      <TabViewTransition activeTab="calendar">
        {renderView}
      </TabViewTransition>,
    );
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.runAllTimers()).not.toThrow();
  });

  it("ignores a late exit animation event after the fallback starts entering", () => {
    vi.useFakeTimers();
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

    act(() => vi.advanceTimersByTime(150));
    const incoming = screen.getByRole("tabpanel");
    expect(incoming).toHaveClass("tab-view--entering");

    finishAnimation(incoming, "tab-view-exit");
    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--entering");
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("calendar");

    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByRole("tabpanel")).toHaveClass("tab-view--idle");
  });

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

    finishAnimation(outgoing, "tab-view-exit");
    const incoming = screen.getByRole("tabpanel");
    expect(incoming).toHaveClass("tab-view--entering");
    expect(screen.getAllByTestId("heavy-view")).toHaveLength(1);
    expect(screen.getByTestId("heavy-view")).toHaveTextContent("calendar");

    finishAnimation(incoming, "tab-view-enter");
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
