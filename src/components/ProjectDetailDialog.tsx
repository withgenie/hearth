import { useEffect, useMemo, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import {
  ProjectFormFields,
  emptyProjectForm,
  type ProjectFormState,
} from "./ProjectFormFields";
import type { Project, Memo, Priority } from "../types";
import * as api from "../api";
import { useT } from "../i18n/LocaleContext";

export function ProjectDetailDialog({
  open,
  project,
  memos,
  onClose,
  onProjectUpdated,
  onMemosChanged,
}: {
  open: boolean;
  project: Project | null;
  memos: Memo[];
  onClose: () => void;
  onProjectUpdated: () => void;
  onMemosChanged: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [saving, setSaving] = useState(false);
  const [newMemoContent, setNewMemoContent] = useState("");

  const scopedMemos = useMemo(
    () => (project ? memos.filter((m) => m.project_id === project.id) : []),
    [memos, project]
  );

  useEffect(() => {
    if (!project) return;
    setForm({
      name: project.name,
      priority: project.priority as Priority,
      category: project.category ?? "",
      path: project.path ?? "",
      evaluation: project.evaluation ?? "",
      // null = backend keeps any existing bookmark untouched; the field is
      // only filled in if the user (re-)picks via the folder button.
      pathBookmark: null,
    });
    setNewMemoContent("");
  }, [project]);

  if (!open || !project) return null;

  const handleSave = async () => {
    const trimmed = form.name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.updateProject(project.id, {
        name: trimmed,
        priority: form.priority,
        category: form.category === "" ? undefined : form.category,
        path: form.path.trim() || undefined,
        evaluation: form.evaluation.trim() || undefined,
        pathBookmark: form.pathBookmark ?? undefined,
      });
      window.dispatchEvent(new CustomEvent("projects:changed"));
      onProjectUpdated();
      toast.success(t("프로젝트 저장됨", "Project saved"));
      onClose();
    } catch (e) {
      toast.error(t(`저장 실패: ${e}`, `Save failed: ${e}`));
    } finally {
      setSaving(false);
    }
  };

  const handleAddMemo = async () => {
    const content = newMemoContent.trim();
    if (!content) return;
    try {
      await api.createMemo({ content, color: "yellow", project_id: project.id });
      setNewMemoContent("");
      onMemosChanged();
    } catch (e) {
      toast.error(t(`메모 생성 실패: ${e}`, `Memo creation failed: ${e}`));
    }
  };

  const handleDeleteMemo = async (m: Memo) => {
    const yes = await ask(t("메모를 삭제할까요?", "Delete this memo?"), {
      title: t("메모 삭제", "Delete memo"),
      kind: "warning",
    });
    if (!yes) return;
    try {
      await api.deleteMemo(m.id);
      onMemosChanged();
    } catch (e) {
      toast.error(t(`메모 삭제 실패: ${e}`, `Memo deletion failed: ${e}`));
    }
  };

  const handleInlineEdit = async (m: Memo, content: string) => {
    try {
      await api.updateMemo(m.id, { content });
      onMemosChanged();
    } catch (e) {
      toast.error(t(`메모 저장 실패: ${e}`, `Memo save failed: ${e}`));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="project-detail-title"
      className="max-w-[560px]"
    >
      <h2
        id="project-detail-title"
        className="text-heading text-[var(--color-text-hi)] mb-4 truncate"
      >
        {project.name}
      </h2>

      <section>
        <ProjectFormFields
          value={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("취소", "Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {t("저장", "Save")}
          </Button>
        </div>
      </section>

      <section className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] text-[var(--color-text-muted)]">
            📝 {t("연결 메모", "Linked memos")} ({scopedMemos.length})
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {scopedMemos.map((m) => (
            <MemoRow
              key={m.id}
              memo={m}
              onSave={(c) => handleInlineEdit(m, c)}
              onDelete={() => handleDeleteMemo(m)}
            />
          ))}
          {scopedMemos.length === 0 && (
            <div className="text-[12px] text-[var(--color-text-dim)]">{t("없음", "None")}</div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <textarea
            className={
              "flex-1 min-h-[40px] max-h-[120px] px-2 py-1.5 rounded-[var(--radius-md)] text-[12px] " +
              "bg-[var(--color-surface-2)] border border-[var(--color-border)] " +
              "text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand-hi)]"
            }
            rows={2}
            value={newMemoContent}
            onChange={(e) => setNewMemoContent(e.target.value)}
            placeholder={t("새 메모…", "New memo…")}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddMemo}
            disabled={!newMemoContent.trim()}
          >
            {t("추가", "Add")}
          </Button>
        </div>
      </section>
    </Dialog>
  );
}

function MemoRow({
  memo,
  onSave,
  onDelete,
}: {
  memo: Memo;
  onSave: (c: string) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);

  useEffect(() => {
    setDraft(memo.content);
  }, [memo.content]);

  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-2 py-1.5">
      <div className="flex-1 min-w-0">
        {editing ? (
          <textarea
            className={
              "w-full px-1.5 py-1 rounded bg-[var(--color-surface-1)] text-[12px] " +
              "text-[var(--color-text)] border border-[var(--color-border)] " +
              "focus:outline-none focus:border-[var(--color-brand-hi)]"
            }
            autoFocus
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft !== memo.content) onSave(draft);
            }}
          />
        ) : (
          <button
            className="w-full text-left text-[12px] text-[var(--color-text)] whitespace-pre-wrap break-words"
            onClick={() => setEditing(true)}
          >
            {memo.content || (
              <span className="text-[var(--color-text-dim)]">{t("(비어 있음)", "(Empty)")}</span>
            )}
          </button>
        )}
      </div>
      <button
        className="text-[12px] text-[var(--color-text-dim)] hover:text-white hover:bg-[var(--color-danger)] rounded px-1.5 py-0.5"
        onClick={onDelete}
        aria-label={t("메모 삭제", "Delete memo")}
      >
        ✕
      </button>
    </div>
  );
}
