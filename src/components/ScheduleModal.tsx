import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Schedule, ScheduleKind } from "../types";
import type { ScheduleInput } from "../api";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useT } from "../i18n/LocaleContext";

const SCHEDULE_KIND_OPTIONS = [
  { value: "event", label: "일정" },
  { value: "task", label: "할 일" },
  { value: "shift", label: "근무" },
  { value: "anniversary", label: "기념일" },
] as const satisfies readonly { value: ScheduleKind; label: string }[];

type GraphemeSegment = {
  readonly segment: string;
};

type GraphemeSegmenter = {
  segment(input: string): Iterable<GraphemeSegment>;
};

type GraphemeSegmenterConstructor = new (
  locales?: string | string[],
  options?: { readonly granularity: "grapheme" },
) => GraphemeSegmenter;

type IntlWithGraphemeSegmenter = {
  readonly Segmenter: GraphemeSegmenterConstructor;
};

const EMOJI_GRAPHEME_PATTERN =
  /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[0-9#*]\uFE0F?\u20E3/u;

function hasGraphemeSegmenter(value: unknown): value is IntlWithGraphemeSegmenter {
  return (
    typeof value === "object" &&
    value !== null &&
    "Segmenter" in value &&
    typeof value.Segmenter === "function"
  );
}

function isSingleEmoji(value: string): boolean {
  const intl: unknown = Intl;
  if (!value || !hasGraphemeSegmenter(intl)) return false;

  const segmenter = new intl.Segmenter("ko", { granularity: "grapheme" });
  let grapheme = "";
  let count = 0;
  for (const part of segmenter.segment(value)) {
    count += 1;
    if (count > 1) return false;
    grapheme = part.segment;
  }
  return count === 1 && EMOJI_GRAPHEME_PATTERN.test(grapheme);
}

function isScheduleKind(value: string): value is ScheduleKind {
  return SCHEDULE_KIND_OPTIONS.some((option) => option.value === value);
}

function onEnterSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
  const native = e.nativeEvent;
  if (
    e.key === "Enter" &&
    !native.isComposing &&
    native.keyCode !== 229 &&
    !e.shiftKey
  ) {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ScheduleModal({
  schedule,
  initialDate,
  initialTime,
  onSave,
  onDelete,
  onClose,
}: {
  schedule?: Schedule;
  initialDate?: string;
  initialTime?: string;
  onSave: (data: ScheduleInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const initialNotify =
    !!schedule && (
      !!schedule.time ||
      schedule.remind_before_5min ||
      schedule.remind_at_start
    );

  const defaultTime = initialTime ?? nowHHMM();
  const [date, setDate] = useState(schedule?.date ?? initialDate ?? "");
  const [notify, setNotify] = useState(initialNotify);
  const [time, setTime] = useState(
    schedule?.time ?? (initialNotify ? defaultTime : "")
  );
  const [remindBefore5, setRemindBefore5] = useState(
    schedule?.remind_before_5min ?? true
  );
  const [remindAtStart, setRemindAtStart] = useState(
    schedule?.remind_at_start ?? false
  );
  const [location, setLocation] = useState(schedule?.location ?? "");
  const [description, setDescription] = useState(schedule?.description ?? "");
  const [notes, setNotes] = useState(schedule?.notes ?? "");
  const [kind, setKind] = useState<ScheduleKind>(schedule?.kind ?? "event");
  const [color, setColor] = useState(schedule?.color ?? "");
  const [icon, setIcon] = useState(schedule?.icon ?? "");

  const isEdit = !!schedule;
  const timeMissing = notify && !time;
  const iconInvalid = icon !== "" && !isSingleEmoji(icon);

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    if (next && !time) setTime(defaultTime);
    if (next && !remindBefore5 && !remindAtStart) setRemindBefore5(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || timeMissing || iconInvalid) return;
    onSave({
      date,
      time: notify ? time : undefined,
      location: location || undefined,
      description: description || undefined,
      notes: notes || undefined,
      kind,
      ...(color ? { color } : {}),
      ...(icon ? { icon } : {}),
      remind_before_5min: notify ? remindBefore5 : false,
      remind_at_start: notify ? remindAtStart : false,
    });
  }

  return (
    <Dialog open onClose={onClose} labelledBy="schedule-title">
      <form onSubmit={handleSubmit}>
        <h2
          id="schedule-title"
          className="text-heading text-[var(--color-text-hi)] mb-4"
        >
          {t("일정", "Schedule")} {isEdit ? t("수정", "Edit") : t("추가", "Add")}
        </h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">
              {t("날짜", "Date")}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={onEnterSubmit}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-[13px] select-none">
            <input
              type="checkbox"
              checked={notify}
              onChange={toggleNotify}
              aria-label={t("알림 받기", "Enable reminders")}
            />
            <span>{t("알림 받기", "Enable reminders")}</span>
          </label>

          {notify && (
            <>
              <div>
                <label
                  htmlFor="schedule-time"
                  className="text-[11px] text-[var(--color-text-muted)] mb-1 block"
                >
                  {t("시간", "Time")}
                </label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onKeyDown={onEnterSubmit}
                  aria-label={t("시간", "Time")}
                />
              </div>
              <div className="flex gap-4 text-[13px]">
                <label className="flex items-center gap-1.5 select-none">
                  <input
                    type="checkbox"
                    checked={remindBefore5}
                    onChange={(e) => setRemindBefore5(e.target.checked)}
                    aria-label={t("5분 전", "5 minutes before")}
                  />
                  <span>{t("5분 전", "5 minutes before")}</span>
                </label>
                <label className="flex items-center gap-1.5 select-none">
                  <input
                    type="checkbox"
                    checked={remindAtStart}
                    onChange={(e) => setRemindAtStart(e.target.checked)}
                    aria-label={t("정각", "At start")}
                  />
                  <span>{t("정각", "At start")}</span>
                </label>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="schedule-kind"
              className="text-[11px] text-[var(--color-text-muted)] mb-1 block"
            >
              {t("일정 종류", "Schedule type")}
            </label>
            <select
              id="schedule-kind"
              value={kind}
              onChange={(event) => {
                if (isScheduleKind(event.target.value)) {
                  setKind(event.target.value);
                }
              }}
              className="h-9 w-full px-3 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-brand-hi)] transition-colors duration-[120ms]"
            >
              {SCHEDULE_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === "event"
                    ? t("일정", "Event")
                    : option.value === "task"
                      ? t("할 일", "Task")
                      : option.value === "shift"
                        ? t("근무", "Shift")
                        : t("기념일", "Anniversary")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schedule-color"
                className="text-[11px] text-[var(--color-text-muted)] mb-1 block"
              >
                {t("일정 색상", "Schedule color")}
              </label>
              <Input
                id="schedule-color"
                type="text"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                onKeyDown={onEnterSubmit}
                placeholder={t("자동 배색", "Automatic color")}
              />
            </div>
            <div>
              <label
                htmlFor="schedule-icon"
                className="text-[11px] text-[var(--color-text-muted)] mb-1 block"
              >
                {t("스티커 이모지", "Sticker emoji")}
              </label>
              <Input
                id="schedule-icon"
                type="text"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                onKeyDown={onEnterSubmit}
                placeholder={t("선택 사항", "Optional")}
                aria-invalid={iconInvalid}
                aria-describedby={iconInvalid ? "schedule-icon-error" : undefined}
              />
              {iconInvalid && (
                <div
                  id="schedule-icon-error"
                  role="alert"
                  className="mt-1 text-[11px] text-[var(--color-danger)]"
                >
                  {t("스티커는 이모지 1개만 입력해 주세요.", "Enter a single emoji for the sticker.")}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">
              {t("장소", "Location")}
            </label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={onEnterSubmit}
              aria-label={t("장소", "Location")}
            />
          </div>
          <div>
            <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">
              {t("내용", "Description")}
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={onEnterSubmit}
              aria-label={t("내용", "Description")}
            />
          </div>
          <div>
            <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">
              {t("비고", "Notes")}
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={onEnterSubmit}
              aria-label={t("비고", "Notes")}
            />
          </div>

          {timeMissing && (
            <div className="text-[11px] text-[var(--color-danger)]">
              {t("시간을 입력해 주세요.", "Enter a time.")}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-5">
          <div>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={Trash2}
                onClick={onDelete}
              >
                {t("삭제", "Delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("취소", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={timeMissing || iconInvalid}
            >
              {t("저장", "Save")}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
