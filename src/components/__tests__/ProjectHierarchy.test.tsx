import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProjectCard } from "../ProjectCard";
import { ProjectList } from "../ProjectList";
import type { Project } from "../../types";
import { ToastProvider } from "../../ui/Toast";
import * as api from "../../api";

vi.mock("../../hooks/useCategories", () => ({
  useCategories: () => ({ categories: [] }),
}));

vi.mock("../../api", () => ({
  NEEDS_BOOKMARK_ERROR: "needs_bookmark",
  openInFinder: vi.fn().mockResolvedValue(undefined),
  openInTerminal: vi.fn().mockResolvedValue(undefined),
  pickProjectFolder: vi.fn(),
  updateProject: vi.fn(),
}));

const project: Project = {
  id: 7,
  priority: "P0",
  number: null,
  name: "Hearth 데스크톱",
  category: null,
  path: "/Users/genie/dev/tools/hearth",
  evaluation: "프로젝트 평가 첫 줄\n프로젝트 평가 둘째 줄\n보이지 않을 셋째 줄",
  sort_order: 0,
  created_at: "2026-07-14T12:00:00Z",
  updated_at: "2026-07-14T12:00:00Z",
};

test("프로젝트 이름과 Finder 경로가 조용한 카드 위계를 만든다", () => {
  const onOpenFinder = vi.fn();
  const onOpenTerminal = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const onOpenDetail = vi.fn();

  render(
    <ProjectCard
      project={project}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onOpenTerminal={onOpenTerminal}
      onOpenFinder={onOpenFinder}
      onOpenDetail={onOpenDetail}
    />,
  );

  expect(screen.getByRole("heading", { name: project.name })).toHaveClass(
    "text-heading",
  );
  expect(screen.queryByText(project.path!)).not.toBeInTheDocument();

  const finder = screen.getByRole("button", {
    name: "Finder에서 hearth 열기",
  });
  expect(finder).toHaveTextContent("hearth");
  fireEvent.click(finder);
  expect(onOpenFinder).toHaveBeenCalledWith(project);
  fireEvent.focus(finder);
  expect(screen.getByRole("tooltip")).toHaveTextContent(project.path!);

  expect(
    screen.getByRole("button", { name: /프로젝트 평가 첫 줄/ }),
  ).toHaveClass("line-clamp-2");
  expect(
    screen.getByRole("button", { name: "우선순위 변경 — 현재 P0" }),
  ).not.toHaveTextContent("P0");

  fireEvent.click(screen.getByRole("button", { name: "터미널에서 열기" }));
  expect(onOpenTerminal).toHaveBeenCalledWith(project);
  fireEvent.click(screen.getByRole("button", { name: "삭제" }));
  expect(onDelete).toHaveBeenCalledWith(project.id);
  fireEvent.click(screen.getByRole("button", { name: "프로젝트 설정" }));
  expect(onOpenDetail).toHaveBeenCalledWith(project);
  expect(
    screen.getByRole("button", { name: "드래그하여 순서 변경" }),
  ).toBeInTheDocument();

  fireEvent.doubleClick(
    screen.getByRole("listitem", { name: project.name }),
  );
  expect(onOpenDetail).toHaveBeenCalledTimes(2);

  fireEvent.click(screen.getByRole("button", { name: project.name }));
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Hearth 새 이름" },
  });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(onUpdate).toHaveBeenCalledWith(project.id, {
    name: "Hearth 새 이름",
  });
});

test("P0–P2는 카드로, P3–P4는 콤팩트 목록으로 구분한다", () => {
  const projects = (["P0", "P2", "P3", "P4"] as const).map(
    (priority, index): Project => ({
      ...project,
      id: index + 1,
      name: `${priority} 프로젝트`,
      priority,
      path: `/workspace/${priority.toLowerCase()}-folder`,
    }),
  );

  render(
    <ToastProvider>
      <ProjectList
        projects={projects}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
        onOpenDetail={vi.fn()}
      />
    </ToastProvider>,
  );

  expect(
    within(screen.getByRole("list", { name: "P0 프로젝트 카드" })).getByRole(
      "listitem",
      { name: "P0 프로젝트" },
    ),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("list", { name: "P3 프로젝트 콤팩트 목록" }),
    ).getByRole("listitem", { name: "P3 프로젝트" }),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("list", { name: "P4 프로젝트 콤팩트 목록" }),
    ).getByRole("listitem", { name: "P4 프로젝트" }),
  ).toBeInTheDocument();

  const urgent = screen.getByRole("region", { name: "P0 긴급 프로젝트" });
  expect(urgent.className).toContain("var(--color-danger)");
  expect(screen.queryByRole("button", { name: /밀도/ })).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Finder에서 p3-folder 열기" }),
  );
  expect(api.openInFinder).toHaveBeenCalledWith("/workspace/p3-folder", 3);
});
