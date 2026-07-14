export type ScheduleKind = "event" | "task" | "shift" | "anniversary";

export type ScheduleClassification = ScheduleKind | "deadline" | "meeting";

export type ScheduleThemeToken =
  | "--color-brand"
  | "--color-success"
  | "--color-danger"
  | "--color-p3"
  | "--color-cat-lab"
  | "--color-text-dim";

export type ScheduleRailColor =
  | { kind: "theme-token"; value: ScheduleThemeToken }
  | { kind: "custom"; value: string };

export interface ScheduleStyleInput {
  description?: string | null;
  location?: string | null;
  kind?: ScheduleKind | null;
  color?: string | null;
}

export interface ScheduleRenderStyle {
  classification: ScheduleClassification;
  kind: ScheduleKind;
  emphasis: "standard" | "deadline" | "meeting";
  shiftCode: "D" | "E" | "OFF" | null;
  railColor: ScheduleRailColor;
  surfaceToken: "--color-surface-2";
  textToken: "--color-text";
  source:
    | "explicit-kind"
    | "legacy-description"
    | "location"
    | "meeting-clue"
    | "default";
  colorSource: "explicit" | "classification";
}

const CLASSIFICATION_TOKENS: Record<
  ScheduleClassification,
  ScheduleThemeToken
> = {
  event: "--color-brand",
  task: "--color-success",
  shift: "--color-brand",
  anniversary: "--color-cat-lab",
  deadline: "--color-danger",
  meeting: "--color-p3",
};

const SHIFT_DESCRIPTION = /근무|\bOFF\b/i;
const DEADLINE_DESCRIPTION = /마감|납부|신고/;
const MEETING_DESCRIPTION = /(?:^|\s)@\S+|미팅|회의|\bmeeting\b/i;

function shiftCodeFrom(description: string): ScheduleRenderStyle["shiftCode"] {
  if (/\bOFF\b/i.test(description)) return "OFF";
  if (/\bD\b/i.test(description)) return "D";
  if (/\bE\b/i.test(description)) return "E";
  return null;
}

function inferredClassification(
  schedule: ScheduleStyleInput,
): Pick<
  ScheduleRenderStyle,
  "classification" | "kind" | "emphasis" | "shiftCode" | "source"
> {
  const description = schedule.description?.trim() ?? "";

  if (schedule.kind && schedule.kind !== "event") {
    return {
      classification: schedule.kind,
      kind: schedule.kind,
      emphasis: "standard",
      shiftCode: schedule.kind === "shift" ? shiftCodeFrom(description) : null,
      source: "explicit-kind",
    };
  }

  if (SHIFT_DESCRIPTION.test(description)) {
    return {
      classification: "shift",
      kind: "shift",
      emphasis: "standard",
      shiftCode: shiftCodeFrom(description),
      source: "legacy-description",
    };
  }

  if (DEADLINE_DESCRIPTION.test(description)) {
    return {
      classification: "deadline",
      kind: "event",
      emphasis: "deadline",
      shiftCode: null,
      source: "legacy-description",
    };
  }

  if (schedule.location?.trim()) {
    return {
      classification: "meeting",
      kind: "event",
      emphasis: "meeting",
      shiftCode: null,
      source: "location",
    };
  }

  if (MEETING_DESCRIPTION.test(description)) {
    return {
      classification: "meeting",
      kind: "event",
      emphasis: "meeting",
      shiftCode: null,
      source: "meeting-clue",
    };
  }

  return {
    classification: "event",
    kind: "event",
    emphasis: "standard",
    shiftCode: null,
    source: "default",
  };
}

export function classifyScheduleStyle(
  schedule: ScheduleStyleInput,
): ScheduleRenderStyle {
  const inferred = inferredClassification(schedule);
  const explicitColor = schedule.color?.trim();
  const defaultToken =
    inferred.classification === "shift" && inferred.shiftCode === "E"
      ? "--color-p3"
      : inferred.classification === "shift" && inferred.shiftCode === "OFF"
        ? "--color-text-dim"
        : CLASSIFICATION_TOKENS[inferred.classification];

  return {
    ...inferred,
    railColor: explicitColor
      ? { kind: "custom", value: explicitColor }
      : { kind: "theme-token", value: defaultToken },
    surfaceToken: "--color-surface-2",
    textToken: "--color-text",
    colorSource: explicitColor ? "explicit" : "classification",
  };
}
