import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getUiPreferences, saveUiPreferences } from "../api";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("UI preferences API", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("loads the backend defaults through the typed command", async () => {
    vi.mocked(invoke).mockResolvedValue({
      memoView: "list",
      activeTab: "projects",
    });

    await expect(getUiPreferences()).resolves.toEqual({
      memoView: "list",
      activeTab: "projects",
    });
    expect(invoke).toHaveBeenCalledWith("get_ui_preferences");
  });

  it("saves a camelCase partial memo-view update without overwriting activeTab", async () => {
    vi.mocked(invoke).mockResolvedValue({
      memoView: "journal",
      activeTab: "calendar",
    });

    await saveUiPreferences({ memoView: "journal" });

    expect(invoke).toHaveBeenCalledWith("save_ui_preferences", {
      input: { memoView: "journal" },
    });
  });
});
