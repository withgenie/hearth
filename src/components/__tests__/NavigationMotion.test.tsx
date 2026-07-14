import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../ui/Toast";
import { Layout } from "../Layout";
import "../../App.css";

const { getUiPreferences, saveUiPreferences } = vi.hoisted(() => ({
  getUiPreferences: vi.fn(),
  saveUiPreferences: vi.fn(),
}));

vi.mock("@tauri-apps/api/app", () => ({ getVersion: vi.fn().mockResolvedValue("") }));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => undefined),
}));
vi.mock("../../api", () => ({
  getUiPreferences,
  saveUiPreferences,
  getProjects: vi.fn().mockResolvedValue([]),
  getSchedules: vi.fn().mockResolvedValue([]),
  getMemos: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../hooks/useDbRecoveryNotice", () => ({
  useDbRecoveryNotice: vi.fn(),
}));
vi.mock("../../lib/shortcuts", () => ({ useCmdF: vi.fn() }));
vi.mock("../Sidebar", () => ({ Sidebar: () => null }));
vi.mock("../AiStatusPill", () => ({ AiStatusPill: () => null }));
vi.mock("../NewProjectDialog", () => ({ NewProjectDialog: () => null }));
vi.mock("../NewMemoDialog", () => ({ NewMemoDialog: () => null }));
vi.mock("../SettingsDialog", () => ({ SettingsDialog: () => null }));
vi.mock("../../command/CommandPalette", () => ({ CommandPalette: () => null }));
vi.mock("../FindPalette", () => ({ FindPalette: () => null }));

function renderLayout() {
  return render(
    <ToastProvider>
      <Layout>
        {({ activeTab }) => <div data-testid="active-view">{activeTab}</div>}
      </Layout>
    </ToastProvider>,
  );
}

describe("Layout navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveUiPreferences.mockResolvedValue({
      memoView: "list",
      activeTab: "projects",
    });
  });

  it("hydrates the active tab without overwriting a newer user choice and saves only activeTab", async () => {
    let resolvePreferences: (value: {
      memoView: "list";
      activeTab: "memos";
    }) => void = () => undefined;
    getUiPreferences.mockReturnValue(
      new Promise((resolve) => {
        resolvePreferences = resolve;
      }),
    );
    renderLayout();

    fireEvent.click(screen.getByRole("tab", { name: "캘린더" }));
    resolvePreferences({ memoView: "list", activeTab: "memos" });

    await waitFor(() => {
      expect(screen.getByTestId("active-view")).toHaveTextContent("calendar");
    });
    expect(saveUiPreferences).toHaveBeenCalledWith({ activeTab: "calendar" });
    expect(saveUiPreferences).toHaveBeenCalledTimes(1);
  });

  it("maps Cmd+1/2/3 to tabs without intercepting ordinary number typing", async () => {
    getUiPreferences.mockResolvedValue({
      memoView: "list",
      activeTab: "projects",
    });
    renderLayout();
    await waitFor(() => expect(getUiPreferences).toHaveBeenCalledOnce());

    fireEvent.keyDown(window, { key: "2" });
    expect(screen.getByTestId("active-view")).toHaveTextContent("projects");
    expect(saveUiPreferences).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "2", metaKey: true });
    expect(screen.getByTestId("active-view")).toHaveTextContent("calendar");
    fireEvent.keyDown(window, { key: "3", metaKey: true });
    expect(screen.getByTestId("active-view")).toHaveTextContent("memos");
    fireEvent.keyDown(window, { key: "1", metaKey: true });
    expect(screen.getByTestId("active-view")).toHaveTextContent("projects");
    expect(saveUiPreferences.mock.calls).toEqual([
      [{ activeTab: "calendar" }],
      [{ activeTab: "memos" }],
      [{ activeTab: "projects" }],
    ]);
  });

  it("moves one 150ms indicator to the selected accessible tab", async () => {
    getUiPreferences.mockResolvedValue({
      memoView: "list",
      activeTab: "projects",
    });
    renderLayout();
    await waitFor(() => expect(getUiPreferences).toHaveBeenCalledOnce());

    const indicator = screen.getByTestId("active-tab-indicator");
    expect(indicator).toHaveStyle({ transform: "translateX(0%)" });
    fireEvent.click(screen.getByRole("tab", { name: "메모보드" }));

    expect(screen.getByRole("tab", { name: "메모보드" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(indicator).toHaveStyle({ transform: "translateX(200%)" });
    expect(getComputedStyle(indicator).transitionDuration).toBe("150ms");
    expect(getComputedStyle(indicator).transitionProperty).toBe("transform");
  });
});
