import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsDialog } from "../components/SettingsDialog";

vi.mock("../components/SettingsGeneralSection", () => ({
  SettingsGeneralSection: () => null,
}));
vi.mock("../components/SettingsThemeSection", () => ({
  SettingsThemeSection: () => null,
}));
vi.mock("../components/SettingsAiSection", () => ({
  SettingsAiSection: () => null,
}));
vi.mock("../components/SettingsBackupSection", () => ({
  SettingsBackupSection: () => null,
}));
vi.mock("../components/SettingsCategoriesSection", () => ({
  SettingsCategoriesSection: () => null,
}));
vi.mock("../components/SettingsIntegrationsSection", () => ({
  SettingsIntegrationsSection: () => null,
}));
vi.mock("../components/SettingsAboutSection", () => ({
  SettingsAboutSection: () => null,
}));

describe("paid-upfront App Store contract", () => {
  it("does not expose a License or IAP surface in Settings", () => {
    render(<SettingsDialog open onClose={vi.fn()} />);

    expect(screen.queryByRole("tab", { name: "라이선스" })).not.toBeInTheDocument();
    expect(screen.queryByText("io.hearth.app.pro")).not.toBeInTheDocument();
    expect(screen.queryByText("Hearth Pro 구매")).not.toBeInTheDocument();
    expect(screen.queryByText("구매 복원")).not.toBeInTheDocument();
    expect(screen.queryByText("라이선스 상태를 불러오는 중입니다.")).not.toBeInTheDocument();
  });
});
