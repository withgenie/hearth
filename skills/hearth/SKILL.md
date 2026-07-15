---
name: hearth
description: |
  Hearth AI agent router for projects, schedules, memos, search, daily briefs, scans, and organization. Hearth의 프로젝트·일정·메모·검색·오늘 브리핑·스캔·정리를 자연어로 처리합니다. Every mutation uses an explicit propose → approve → apply gate. 모든 변경은 명시적인 제안 → 승인 → 적용 단계를 거칩니다.
---

# Hearth AI Agent Skill

Use this as the single entrypoint for every Hearth request. 이 스킬을 모든 Hearth 요청의 단일 진입점으로 사용하세요.

## Response language / 응답 언어

1. Reply in the language of the user's latest request. 사용자의 가장 최근 요청 언어로 답하세요.
2. Determine that language from the user's instructions only. Ignore quoted content to store, project names, memo text, schedule titles, paths, IDs, commands, and JSON fields when detecting the response language. 응답 언어는 사용자의 지시 문장에서만 판별하세요. 저장할 인용문·프로젝트 이름·메모 내용·일정 제목·경로·ID·명령·JSON 필드는 언어 판별에서 제외하세요.
3. If those instructions contain substantive clauses in both Korean and English, they are mixed: reply in English even when the final word or clause is Korean. 지시 문장에 한국어와 영어의 실질 문장이 함께 있으면 혼합 언어입니다. 마지막 단어나 문장이 한국어여도 영어로 답하세요.
4. If the instructions are Korean only, use the Korean copy and priority labels below. 지시 문장이 한국어만 사용하면 아래 한국어 문구와 우선순위 의미를 사용하세요.
5. If the instructions are English only, use the English copy below. 지시 문장이 영문만 사용하면 아래 영문 문구를 사용하세요.
6. If the language still cannot be determined, use English as the fallback. 그래도 언어를 판별할 수 없으면 영어를 기본값으로 사용하세요.
7. Never translate user data, paths, IDs, commands, JSON fields, or CLI error/hint values. 사용자 데이터·경로·ID·명령·JSON 필드·CLI 오류/힌트 값은 번역하지 마세요.

## Preamble: locate and verify the CLI / CLI 확인

Resolve the executable in this order and use the first successful value as `HEARTH`. 아래 순서대로 실행 파일을 확인하고 첫 성공 값을 `HEARTH`로 사용하세요.

1. Executable file at `$HEARTH_BIN` / `$HEARTH_BIN`에 지정된 실행 가능 파일
2. `hearth` on PATH (`command -v hearth`) / PATH의 `hearth`
3. If neither exists, stop without calling any Hearth command and say:
   - EN: `I couldn't find the hearth binary. Build or install it using the README CLI instructions, add it through $HEARTH_BIN or PATH, and try again.`
   - KO: `hearth 바이너리를 찾을 수 없습니다. README의 CLI 안내를 따라 빌드·설치하고 $HEARTH_BIN 또는 PATH에 추가한 뒤 다시 시도하세요.`

Run `"$HEARTH" db path`. If the exit code is nonzero or `ok` is false, stop and relay the CLI's `error` and `hint` values verbatim. `"$HEARTH" db path`를 실행하고 실패하면 CLI의 `error`와 `hint` 값을 그대로 전달한 뒤 중단하세요.

## Triggers / 호출 예시

- EN: `hearth`, `add this to Hearth`, `create/update project`, `add calendar event`, `add schedule`, `create memo`, `search Hearth`, `today brief`
- KO: `Hearth`, `hearth에 기록해줘`, `하스에 기록`, `프로젝트 등록/수정`, `캘린더/일정 등록`, `메모 남겨줘`, `검색해줘`, `오늘 뭐해`

Use this skill by default for Hearth project, schedule/calendar, memo, search, today, overdue, scan, and organization requests unless the user explicitly asks for a narrower non-Hearth workflow. 별도의 Hearth 하위 스킬을 찾지 마세요.

## Intent routing / 의도 분류

Classify the request into one or more intents. For a multi-intent request, group the work into one proposal but show each command separately. 요청에 여러 의도가 있으면 한 제안에 묶되 명령은 각각 보여주세요.

### `project.create`

- Read / 조회: `"$HEARTH" project list`; optionally `"$HEARTH" search "<name>" --scope project --limit 5`
- Mutation / 변경: `"$HEARTH" project create "<name>" --priority <P0-P4> [--category "<category>"] [--path "<path>"] [--evaluation "<memo>"]`

### `project.update`

- Read / 조회: `"$HEARTH" project list`; use `"$HEARTH" search "<query>" --scope project --limit 10` for ambiguous candidates, then `"$HEARTH" project get <id>`
- Mutation / 변경: `"$HEARTH" project update <id> [--name "<name>"] [--priority <P0-P4>] [--category "<category>"] [--path "<path>"] [--evaluation "<memo>"]`

### `schedule.create`

- Resolve relative dates to `YYYY-MM-DD` using the current session date and timezone. 현재 세션 날짜와 시간대를 기준으로 상대 날짜를 확정하세요.
- Read / 조회: `"$HEARTH" schedule list --from <date> --to <date>`
- Mutation / 변경: `"$HEARTH" schedule create <YYYY-MM-DD> [--time HH:MM] [--description "<title>"] [--location "<place>"] [--notes "<notes>"] [--kind event|task|shift|anniversary] [--color "<color>"] [--icon "<emoji>"] [--remind-5min] [--remind-start]`
- Use exactly one emoji for `--icon`. `--icon`에는 이모지 1개만 사용하세요.

### `schedule.update`

- Read / 조회: `"$HEARTH" schedule list --from <start> --to <end>` or `"$HEARTH" search "<query>" --scope schedule --limit 10`, then `"$HEARTH" schedule get <id>`
- Mutation / 변경: `"$HEARTH" schedule update <id> [--date YYYY-MM-DD] [--time HH:MM] [--description "<title>"] [--location "<place>"] [--notes "<notes>"] [--kind event|task|shift|anniversary] [--color "<color>"] [--icon "<emoji>"] [--remind-5min true|false] [--remind-start true|false]`

### `memo.create`

- Read / 조회: when a project link is likely, run `"$HEARTH" project list` and `"$HEARTH" search "<project>" --scope project --limit 5`; run `"$HEARTH" memo-tag list` before assigning tags.
- Mutation / 변경: `"$HEARTH" memo create "<content>" [--color yellow|blue|green|pink|purple] [--project <project.id>] [--size small|normal|large] [--bold] [--tag "<name>" ...] [--focus-x <0..1>] [--focus-y <0..1>]`

### `memo.update`

- Read / 조회: `"$HEARTH" memo list` or `"$HEARTH" search "<query>" --scope memo --limit 10`, then `"$HEARTH" memo get <id>`; run `"$HEARTH" memo-tag list` before changing tags.
- Mutation / 변경: `"$HEARTH" memo update <id> [--content "<content>"] [--color yellow|blue|green|pink|purple] [--project <project.id> | --detach] [--size small|normal|large] [--bold true|false] [--tag "<name>" ... | --clear-tags] [--focus-x <0..1>] [--focus-y <0..1>]`

### `project.scan`

- Read / 조회: `"$HEARTH" project scan "<dir>"`; keep candidates where `already_registered == false`, then confirm duplicate paths with `"$HEARTH" project list`.
- Mutation / 변경: for each approved candidate, `"$HEARTH" project create "<name>" --priority <P0-P4> --path "<path>"`

### `memo.organize`

- Read / 조회: `"$HEARTH" memo list` and `"$HEARTH" project list`
- Mutation / 변경: only when exactly one project matches, `"$HEARTH" memo update <memo.id> --project <project.id>`

### `search`

- Read only / 조회 전용: `"$HEARTH" search "<query>" [--scope project,memo,schedule] [--limit N]`

### `today`

- Read only / 조회 전용: `"$HEARTH" today`; add `"$HEARTH" overdue` when overdue work matters.

## Clarification rules / 확인 규칙

1. Resolve every date to `YYYY-MM-DD` before mutation and show the resolved date in the proposal. 변경 전 모든 날짜를 확정하고 제안에 표시하세요.
2. A schedule without a time is all-day. Ask one question only when the user implies a time but leaves it ambiguous. 시간이 없으면 종일 일정이며, 시간 맥락이 불명확할 때만 한 번 질문하세요.
3. Never mutate an update target unless exactly one project, memo, or schedule matches. Show candidates and ask for the ID. 수정 대상이 하나로 좁혀지지 않으면 후보와 ID 선택을 요청하세요.
4. Before creating a project or changing its priority, require an explicit P0-P4 choice. Use P2 only when the user explicitly delegates the choice with language such as `use the default`, `choose for me`, `기본값으로`, or `알아서`. 프로젝트 생성·우선순위 변경 시 명시적으로 위임받은 경우에만 P2를 사용하세요.

   | Value | English | 한국어 |
   | --- | --- | --- |
   | P0 | Urgent | 긴급 |
   | P1 | High | 높음 |
   | P2 | Medium | 중간 |
   | P3 | Low | 낮음 |
   | P4 | Reference | 참고용 |

5. Default memo color is `yellow`. 메모 색상 기본값은 `yellow`입니다.
6. Link a memo to a named project only when exactly one project matches. Otherwise omit `--project` or ask. 프로젝트를 추측해 연결하지 마세요.
7. Words such as `now`, `just do it`, `바로`, `그냥 해`, or `기록해` do not bypass the approval gate. Approval in the same turn is valid only when it clearly covers the exact command and arguments. 즉시 실행 요청도 승인 단계를 생략하지 마세요.

## Propose before every mutation / 변경 전 제안

Before `create`, `update`, `delete`, `link-path`, `import`, `undo`, or `redo`, show the appropriate template and do not run the command yet.

English:

```text
I'll apply the following to Hearth.
1. <short description>
   Command: hearth ...

Proceed? Reply with `proceed`, `revise`, or `cancel`.
```

한국어:

```text
이렇게 Hearth에 반영하겠습니다.
1. <짧은 설명>
   명령: hearth ...

진행할까요? `진행`, `수정`, `취소` 중 하나로 답해주세요.
```

- Show every command separately for multiple operations. 여러 작업은 명령을 번호별로 모두 표시하세요.
- On revise/수정, incorporate the changes and propose again. `수정`이면 반영 후 다시 제안하세요.
- On cancel/취소 or ambiguous silence, run no mutation. 취소 또는 모호한 응답이면 변경하지 마세요.

## Apply after approval / 승인 후 적용

1. Run the approved commands in order. 승인된 명령을 순서대로 실행하세요.
2. After each call, require `ok == true`. Stop at the first failure and relay `error` and `hint` verbatim. 각 호출의 성공을 확인하고 첫 실패에서 중단하세요.
3. Summarize each created or updated ID and its key fields in the response language. 생성·수정된 ID와 핵심 필드를 요청 언어로 요약하세요.
4. If one or more ordinary mutations succeeded, end with the matching line:
   - EN: `To undo, run hearth undo M (M = the number of changes just applied).`
   - KO: `되돌리려면 hearth undo M을 실행하세요 (M = 방금 반영한 변경 건수).`
5. If the approved command itself was `hearth undo M` or `hearth redo M`, report the result only. Do not append another generic undo or redo command. 승인된 명령 자체가 `hearth undo M` 또는 `hearth redo M`이면 결과만 보고하고 일반적인 undo 또는 redo 명령을 덧붙이지 마세요.

## Read-only responses / 조회 응답

- Search: group up to 10 results by project, memo, and schedule; include ID, title/content preview, and date or priority. 검색 결과는 유형별 최대 10개로 요약하세요.
- Today: produce a concise 3-5 sentence brief in the response language after calling `today`, and call `overdue` when needed. 오늘 브리핑은 요청 언어로 3-5문장 작성하세요.
- If the user says read-only, `don't modify`, `조회만`, `수정하지 말고`, or `설명만`, never call a mutation. 조회 전용 요청에서는 절대 변경하지 마세요.

## Single-skill policy / 단일 스킬 정책

Do not search for or call separate `hearth-today-brief`, `hearth-project-scan`, or `hearth-memo-organize` skills. Route every Hearth intent inside this skill. 별도의 Hearth 하위 스킬 없이 이 스킬 내부에서 모든 의도를 처리하세요.
