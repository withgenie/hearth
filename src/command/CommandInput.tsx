// src/command/CommandInput.tsx
import { forwardRef, type ChangeEvent, type KeyboardEvent } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Icon } from "../ui/Icon";
import { Kbd } from "../ui/Kbd";
import { cn } from "../lib/cn";
import { useT } from "../i18n/LocaleContext";

export const CommandInput = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    loading?: boolean;
    placeholder?: string;
    mode?: "local" | "ai";
    hasResponse?: boolean;
  }
>(function CommandInput(
  { value, onChange, onKeyDown, loading, placeholder, mode, hasResponse },
  ref
) {
  const t = useT();
  const isAi = mode === "ai";
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-12 px-4 border-b",
        "transition-colors duration-[120ms]",
        isAi
          ? "bg-[var(--color-brand-soft)] border-[var(--color-brand)]"
          : "border-[var(--color-border)]"
      )}
    >
      <Icon
        icon={loading ? Loader2 : isAi ? Sparkles : Search}
        size={18}
        className={
          loading
            ? "text-[var(--color-brand-hi)] animate-spin"
            : isAi
            ? "text-[var(--color-brand-hi)]"
            : "text-[var(--color-text-dim)]"
        }
      />
      <input
        ref={ref}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          placeholder ??
          (isAi
            ? t("질문을 입력하고 ⏎ — 예: '? PickAt 프로젝트 추가'", "Enter a request and press ⏎ — example: '? Add a PickAt project'")
            : t("명령을 입력하거나 ?로 AI에게 물어보세요", "Enter a command or ask AI with ?"))
        }
        className="flex-1 bg-transparent outline-none text-[14px] text-[var(--color-text-hi)] placeholder:text-[var(--color-text-dim)]"
        autoFocus
      />
      {/* Progression hint — shows the user what Enter will do next. */}
      {isAi && loading && (
        <span className="text-[11px] text-[var(--color-brand-hi)]">{t("응답 중…", "Responding…")}</span>
      )}
      {isAi && !loading && !hasResponse && value.trim().length > 1 && (
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {t("⏎ 질문 보내기", "⏎ Send request")}
        </span>
      )}
      <Kbd>ESC</Kbd>
      <Kbd>⌘K</Kbd>
    </div>
  );
});
