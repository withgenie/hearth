import { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import {
  ProjectFormFields,
  emptyProjectForm,
  type ProjectFormState,
} from "./ProjectFormFields";
import * as api from "../api";
import { useT } from "../i18n/LocaleContext";

export function NewProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [saving, setSaving] = useState(false);

  const reset = () => setForm(emptyProjectForm());

  const submit = async () => {
    const trimmed = form.name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const created = await api.createProject(
        trimmed,
        form.priority,
        form.category || undefined,
        form.path.trim() || undefined,
        form.pathBookmark
      );
      window.dispatchEvent(new CustomEvent("projects:changed"));
      toast.success(t(`${created.name} 추가됨`, `${created.name} added`), {
        undo: async () => {
          await api.deleteProject(created.id);
          window.dispatchEvent(new CustomEvent("projects:changed"));
        },
      });
      reset();
      onClose();
    } catch (e) {
      toast.error(t(`생성 실패: ${e}`, `Create failed: ${e}`));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={cancel} labelledBy="new-project-title">
      <h2
        id="new-project-title"
        className="text-heading text-[var(--color-text-hi)] mb-4"
      >
        {t("새 프로젝트", "New project")}
      </h2>
      <ProjectFormFields
        value={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSubmitShortcut={submit}
        includeEvaluation={false}
        autoFocusName
      />
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={cancel} disabled={saving}>
          {t("취소", "Cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={saving || !form.name.trim()}
        >
          {t("생성", "Create")}
        </Button>
      </div>
    </Dialog>
  );
}
