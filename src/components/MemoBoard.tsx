import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";
import {
  GripVertical,
  Plus,
  StickyNote,
  LayoutList,
  LayoutGrid,
  Monitor,
  NotebookText,
} from "lucide-react";
import { Icon } from "../ui/Icon";
import { cn } from "../lib/cn";
import { MemoRow } from "./MemoRow";
import { MemoMatrix } from "./MemoMatrix";
import { FocusMemoBoard } from "./FocusMemoBoard";
import { JournalMemoList } from "./JournalMemoList";
import { useMemos } from "../hooks/useMemos";
import { useProjects } from "../hooks/useProjects";
import { useCategories } from "../hooks/useCategories";
import { useMemoTags } from "../hooks/useMemoTags";
import { PRIORITIES } from "../types";
import type { Memo, MemoTag, Project } from "../types";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";
import { globalSequence, groupMemosByProject } from "../lib/memoSequence";
import * as api from "../api";
import type { MemoUpdateInput, MemoView } from "../api";

// Stable Set reference so `useProjects`'s effect deps don't churn every
// render (useProjects useCallback-s `load` on [priorities, category], and
// a fresh `new Set(...)` on every render re-creates `load` → refetches in
// a tight loop).
const ALL_PRIORITIES = new Set(PRIORITIES);

export function MemoBoard() {
  const { memos, create, update, remove, reload } = useMemos();
  // MemoBoard wants every project for the grouping + picker; `null` means
  // "no category filter" (전체 보기) so NULL-category rows are also included.
  const { projects } = useProjects(ALL_PRIORITIES, null);
  const { categories } = useCategories();
  const memoTags = useMemoTags();
  const toast = useToast();

  const groups = useMemo(
    () => groupMemosByProject(memos, projects),
    [memos, projects],
  );
  const seq = useMemo(() => globalSequence(memos), [memos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [activeId, setActiveId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [view, setView] = useState<MemoView>("list");
  const viewSelectedByUser = useRef(false);
  const [quickMemo, setQuickMemo] = useState("");
  const [savingQuickMemo, setSavingQuickMemo] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getUiPreferences()
      .then((preferences) => {
        if (active && !viewSelectedByUser.current) {
          setView(preferences.memoView);
        }
      })
      .catch((error) => {
        console.error("Failed to load UI preferences:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectView = (nextView: MemoView) => {
    viewSelectedByUser.current = true;
    setView(nextView);
    void api.saveUiPreferences({ memoView: nextView }).catch((error) => {
      toast.error(`뷰 설정 저장 실패: ${error}`);
    });
  };

  const submitQuickMemo = async () => {
    const content = quickMemo.trim();
    if (!content || savingQuickMemo) return;
    setSavingQuickMemo(true);
    try {
      await create({ content });
      setQuickMemo("");
    } catch (error) {
      toast.error(`메모 저장 실패: ${error}`);
    } finally {
      setSavingQuickMemo(false);
    }
  };

  // Listen for search-palette focus requests. We scroll the card into view
  // and trigger a one-shot glow via `find-highlight`. Re-keying on every
  // event (setHighlightedId(null) → id) so repeated clicks on the same memo
  // restart the animation instead of sitting on a static ring.
  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<{ memoId?: number }>).detail;
      const id = detail?.memoId;
      if (typeof id !== "number") return;
      setHighlightedId(null);
      requestAnimationFrame(() => {
        setHighlightedId(id);
        const el = document.querySelector<HTMLElement>(
          `[data-memo-id="${id}"]`,
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      const t = window.setTimeout(() => setHighlightedId(null), 2000);
      return () => window.clearTimeout(t);
    };
    window.addEventListener("memo:focus", onFocus);
    return () => window.removeEventListener("memo:focus", onFocus);
  }, []);

  const handleDragStart = (e: DragStartEvent) => {
    if (typeof e.active.id === "number") setActiveId(e.active.id);
  };

  // Cross-group drag: re-parent the memo to the target group's project (or
  // null for 기타), then rebuild a flat id list in current display order so
  // the global #N badges stay stable for non-moved memos.
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeIdNum =
      typeof active.id === "number" ? active.id : Number(active.id);
    const overIdNum = typeof over.id === "number" ? over.id : NaN;
    const sourceMemo = memos.find((m) => m.id === activeIdNum);
    const targetMemo = memos.find((m) => m.id === overIdNum);
    if (!sourceMemo || !targetMemo) return;

    const sameGroup = sourceMemo.project_id === targetMemo.project_id;
    const targetProjectId = targetMemo.project_id ?? null;

    // Speculative copy of the memo list with the source rebound to the
    // target group, so group rebuild below puts it in the right bucket.
    const nextMemos = memos.map((m) =>
      m.id === sourceMemo.id ? { ...m, project_id: targetProjectId } : m,
    );

    // Reorder within the target group: take the rebound group, move source
    // to the target's index. This captures the drop position precisely.
    const targetGroupIds = nextMemos
      .filter((m) => (m.project_id ?? null) === targetProjectId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.id);
    const fromIdx = targetGroupIds.indexOf(sourceMemo.id);
    const toIdx = targetGroupIds.indexOf(targetMemo.id);
    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      const [moved] = targetGroupIds.splice(fromIdx, 1);
      targetGroupIds.splice(toIdx, 0, moved);
    }

    // Rebuild the flat order: each group keeps its current relative order,
    // except the target group uses the spliced list computed above.
    const groupsAfter = groupMemosByProject(nextMemos, projects);
    const fullIds: number[] = [];
    for (const g of groupsAfter) {
      const isTargetGroup =
        (g.kind === "project" &&
          targetProjectId !== null &&
          g.project.id === targetProjectId) ||
        (g.kind === "etc" && targetProjectId === null);
      if (isTargetGroup) {
        fullIds.push(...targetGroupIds);
      } else {
        fullIds.push(...g.memos.map((m) => m.id));
      }
    }

    try {
      if (!sameGroup) {
        // `undefined` would be omitted by the Rust serde layer; send an
        // explicit null so the column is set to SQL NULL for 기타 drops.
        await api.updateMemo(sourceMemo.id, { project_id: targetProjectId });
      }
      await api.reorderMemos(fullIds);
      await reload();
    } catch (err) {
      toast.error(`메모 이동 실패: ${err}`);
    }
  };

  const handleCreate = () => {
    window.dispatchEvent(new CustomEvent("memo:new-dialog"));
  };
  const handleCreateInProject = (projectId: number | null) => {
    window.dispatchEvent(
      new CustomEvent("memo:new-dialog", { detail: { projectId } }),
    );
  };

  const activeMemo =
    activeId !== null ? (memos.find((m) => m.id === activeId) ?? null) : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-heading text-[var(--color-text-hi)]">메모보드</h2>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="뷰 전환"
            className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-1)] p-0.5"
          >
            <ViewTab
              active={view === "list"}
              onClick={() => selectView("list")}
              icon={LayoutList}
              label="리스트"
            />
            <ViewTab
              active={view === "matrix"}
              onClick={() => selectView("matrix")}
              icon={LayoutGrid}
              label="매트릭스"
            />
            <ViewTab
              active={view === "focus"}
              onClick={() => selectView("focus")}
              icon={Monitor}
              label="포커스"
            />
            <ViewTab
              active={view === "journal"}
              onClick={() => selectView("journal")}
              icon={NotebookText}
              label="저널"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={handleCreate}
          >
            메모 추가
          </Button>
        </div>
      </div>
      <div className="relative mb-4">
        <Input
          aria-label="갑자기 메모"
          placeholder="갑자기 메모"
          value={quickMemo}
          disabled={savingQuickMemo}
          onChange={(event) => setQuickMemo(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              void submitQuickMemo();
            }
          }}
          className="pr-20"
        />
        <span
          aria-live="polite"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-[var(--color-text-dim)]"
        >
          {savingQuickMemo ? "저장 중" : "Enter로 저장"}
        </span>
      </div>
      {memos.length === 0 ? (
        <EmptyState
          className="flex-1"
          icon={StickyNote}
          title="메모가 없습니다"
          description="⌘K 또는 메모 추가 버튼으로 시작하세요"
        />
      ) : view === "journal" ? (
        <JournalMemoList memos={memos} projects={projects} />
      ) : view === "focus" ? (
        <FocusMemoBoard
          memos={memos}
          projects={projects}
          categories={categories}
          tags={memoTags.tags}
          sequence={seq}
          highlightedId={highlightedId}
          onUpdate={update}
          onDelete={remove}
          onReload={reload}
          onCreateTag={(name) => memoTags.create({ name })}
        />
      ) : view === "matrix" ? (
        <MemoMatrix
          groups={groups}
          projects={projects}
          sequence={seq}
          highlightedId={highlightedId}
          tags={memoTags.tags}
          onUpdate={update}
          onDelete={remove}
          onCreateTag={(name) => memoTags.create({ name })}
          onCreateInProject={handleCreateInProject}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {groups.map((g) => {
              const key = g.kind === "project" ? `proj-${g.project.id}` : "etc";
              const title =
                g.kind === "project"
                  ? `${g.project.name} · ${g.project.priority}`
                  : "기타 · 프로젝트 미연결";
              return (
                <section
                  key={key}
                  className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)]"
                >
                  <header className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[12px] text-[var(--color-text-muted)]">
                    <span className="font-semibold text-[var(--color-text)]">
                      {title}
                    </span>
                    <span className="ml-auto text-[var(--color-text-dim)]">
                      {g.memos.length}개
                    </span>
                  </header>
                  <SortableContext
                    items={g.memos.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-[var(--color-border)]">
                      {g.memos.map((m) => (
                        <SortableMemoRow
                          key={m.id}
                          memo={m}
                          projects={projects}
                          tags={memoTags.tags}
                          onUpdate={update}
                          onDelete={remove}
                          onCreateTag={(name) => memoTags.create({ name })}
                          sequenceNumber={seq.get(m.id) ?? 0}
                          highlighted={m.id === highlightedId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </section>
              );
            })}
          </div>

          <DragOverlay>
            {activeMemo ? (
              <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-brand)] px-3 py-2 text-[12px] text-[var(--color-text-hi)] shadow-lg max-w-[260px]">
                {activeMemo.content.slice(0, 80) || "(비어 있음)"}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
function SortableMemoRow({
  memo,
  projects,
  tags,
  onUpdate,
  onDelete,
  onCreateTag,
  sequenceNumber,
  highlighted,
}: {
  memo: Memo;
  projects: Project[];
  tags: MemoTag[];
  onUpdate: (id: number, fields: MemoUpdateInput) => void | Promise<unknown>;
  onDelete: (id: number) => void;
  onCreateTag: (name: string) => Promise<MemoTag>;
  sequenceNumber: number;
  highlighted?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      data-memo-list-row
      style={style}
      className={cn(
        "flex items-start gap-1 bg-[var(--color-surface-1)] px-2 py-1",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`메모 #${sequenceNumber} 순서 이동`}
        className="mt-1.5 shrink-0 cursor-grab rounded p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] active:cursor-grabbing"
      >
        <Icon icon={GripVertical} size={14} />
      </button>
      <div className="min-w-0 flex-1">
        <MemoRow
          memo={memo}
          projects={projects}
          tags={tags}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCreateTag={onCreateTag}
          sequenceNumber={sequenceNumber}
          highlighted={highlighted}
        />
      </div>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-[12px] rounded",
        active
          ? "bg-[var(--color-surface-2)] text-[var(--color-text-hi)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
      )}
    >
      <Icon icon={icon} size={14} />
      {label}
    </button>
  );
}
