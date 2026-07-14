import {
  useEffect,
  useMemo,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import "./App.css";
import { Layout } from "./components/Layout";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetailDialog } from "./components/ProjectDetailDialog";
import { CalendarView } from "./components/CalendarView";
import { MemoBoard } from "./components/MemoBoard";
import { MigrationWizard } from "./components/MigrationWizard";
import { ToastProvider } from "./ui/Toast";
import { ThemeProvider } from "./theme/ThemeContext";
import { useProjects } from "./hooks/useProjects";
import { useMemos } from "./hooks/useMemos";
import { useUiScale } from "./hooks/useUiScale";
import { useTauriDbChangeBridge } from "./lib/dbChangeBridge";
import type { Priority, Tab } from "./types";

type ViewPhase = "idle" | "exiting" | "entering";

const phaseClass: Record<ViewPhase, string> = {
  idle: "tab-view--idle",
  exiting: "tab-view--exiting",
  entering: "tab-view--entering",
};

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, []);

  return reducedMotion;
}

export function TabViewTransition({
  activeTab,
  children,
}: {
  activeTab: Tab;
  children: (tab: Tab) => ReactNode;
}) {
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [phase, setPhase] = useState<ViewPhase>("idle");
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (activeTab === displayedTab) {
      if (reducedMotion && phase !== "idle") setPhase("idle");
      return;
    }
    if (reducedMotion) {
      setDisplayedTab(activeTab);
      setPhase("idle");
      return;
    }
    if (phase !== "exiting") {
      setPhase("exiting");
    }
  }, [activeTab, displayedTab, phase, reducedMotion]);

  const finishPhase = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (phase === "exiting") {
      setDisplayedTab(activeTab);
      setPhase("entering");
      return;
    }
    if (phase === "entering") setPhase("idle");
  };

  return (
    <div
      aria-label="선택한 화면"
      className={`tab-view ${phaseClass[phase]}`}
      onAnimationEnd={finishPhase}
      role="tabpanel"
    >
      {children(displayedTab)}
    </div>
  );
}

function ProjectsTab({
  priorities,
  category,
  onAdd,
}: {
  priorities: Set<Priority>;
  category: string | null;
  onAdd: () => void;
}) {
  const { projects, loading, update, remove, reorder } = useProjects(
    priorities,
    category
  );
  const { memos, reload: reloadMemos } = useMemos();
  const [detailProjectId, setDetailProjectId] = useState<number | null>(null);

  const detailProject = useMemo(
    () => projects.find((p) => p.id === detailProjectId) ?? null,
    [projects, detailProjectId]
  );

  // Close the dialog if the underlying project was deleted or filtered out
  // from the current view — otherwise the dialog would keep rendering a
  // stale snapshot and saves would 404 in Rust.
  useEffect(() => {
    if (detailProjectId !== null && !detailProject) {
      setDetailProjectId(null);
    }
  }, [detailProject, detailProjectId]);


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        로딩 중...
      </div>
    );
  }

  return (
    <>
      <ProjectList
        projects={projects}
        onUpdate={update}
        onDelete={remove}
        onReorder={reorder}
        onAdd={onAdd}
        onOpenDetail={(p) => setDetailProjectId(p.id)}
      />
      <ProjectDetailDialog
        open={detailProjectId !== null}
        project={detailProject}
        memos={memos}
        onClose={() => setDetailProjectId(null)}
        onProjectUpdated={() => {
          /* useProjects subscribes to projects:changed already */
        }}
        onMemosChanged={reloadMemos}
      />
    </>
  );
}

function App() {
  useUiScale();
  useTauriDbChangeBridge();
  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout>
          {({ activeTab, priorities, category, openNewProject }) => (
            <TabViewTransition activeTab={activeTab}>
              {(displayedTab) => (
                <>
                  {displayedTab === "projects" && (
                    <ProjectsTab
                      priorities={priorities}
                      category={category}
                      onAdd={openNewProject}
                    />
                  )}
                  {displayedTab === "calendar" && <CalendarView />}
                  {displayedTab === "memos" && <MemoBoard />}
                </>
              )}
            </TabViewTransition>
          )}
        </Layout>
        <MigrationWizard />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
