# Hearth 1.1.0 — App Store Connect 입력 가이드

최종 갱신: 2026-07-15 20:01 KST

## 현재 ASC 상태

- macOS 버전: `1.1.0`
- 현재 연결 빌드: `13` (`VALID`)
- 출시 방식: **수동 출시** (`MANUAL`)
- 한국어 메타데이터: 아래 AI Agent 중심 문구 반영 완료
- 심사 노트: 반영 완료
- 영어 현지화: 생성·반영 완료, 공개 이름은 `Hearth: Local Workspace`
- 스크린샷: 실제 ko/en 앱과 격리 Agent 세션에 연결된 새 이미지 5장씩 업로드 완료
- 가격: 175개 지역에 2026-07-16부터 한국 기준 ₩2,000의 지역별 현지 가격 적용, 2026-08-16에 한국 기준 ₩22,000 가격대로 자동 복원
- 판매 지역: 현재 175개 전 지역 활성, `새로운 지역에 자동 제공` 켜짐
- 심사 제출: 2026-07-15 19:56 KST 제출, `심사 대기 중`
- 마케팅 사이트: AI Agent + Hearth Skill 중심 화면 배포 및 공개 URL 검증 완료

## 확정된 출시 운영

1. 2026-07-16부터 2026-08-15까지 한 달간 한국 기준 ₩2,000 프로모션을 운영한다.
2. 2026-08-16부터 기존 한국 기준 ₩22,000 가격으로 자동 복원한다.
3. 현재 175개 App Store 국가 또는 지역과 향후 새로 추가되는 지역에 자동 제공한다.
4. Apple 승인 뒤에는 자동 공개하지 않고 App Store Connect에서 수동으로 출시한다.

심사 제출 시점에 라이브 `1.0.1`에는 변화가 없다. 가격·판매 지역 변경은 App Store Connect의 전파에 최대 24시간이 걸릴 수 있으며, 국가별 법률·세금에 따라 표시 가격은 현지 통화로 자동 환산된다.

## 출시 할인 예약

```text
정가: ₩22,000
출시 프로모션: ₩2,000
기간: 2026-07-16~2026-08-15
복원: 2026-08-16 ₩22,000
범위: 현재 175개 App Store 국가 또는 지역
상태: ASC 예약 완료
```

스토어 문구에는 가격을 직접 넣지 않는다. 지역별 현지 가격과 세금이 다르므로 마케팅 사이트·SNS·출시 공지에서만 `One-month launch offer` / `출시 기념 한 달 특별가`를 사용하고, 한국 대상 채널에서만 정확한 ₩2,000 가격과 날짜를 함께 표기한다.

## 한국어 입력값

### 앱 이름

```text
Hearth
```

### 부제

```text
AI 에이전트 워크스페이스
```

### 프로모션 텍스트

```text
Claude Code·Codex용 Hearth Skill로 AI 에이전트가 프로젝트·메모·일정을 직접 정리합니다. 열려 있는 Hearth에 즉시 반영되고, 데이터는 내 Mac에 남습니다.
```

### 키워드

```text
메모,일정,캘린더,투두,노트,저널,퀵캡처,프로젝트관리,자동화,개발자도구,바이브코딩,로컬,오프라인,프라이버시,생산성
```

### 새로운 기능

```text
Hearth 1.1에서 월간 캘린더를 새롭게 만들었습니다. 일정을 다른 날짜로 드래그해 이동하고, 날짜 패널에서 일정과 메모를 함께 확인하세요. 날짜별 저널과 빠른 기록, 더 선명한 프로젝트 우선순위, 부드러운 화면 전환, 다듬어진 10개 테마도 추가했습니다.
```

### 설명

```text
AI 에이전트가 직접 조작하는 로컬 워크스페이스.
Claude Code와 Codex용 Hearth Skill을 연결하면 에이전트가 자연어 요청을 프로젝트·메모·일정으로 정리하고, 열려 있는 Hearth가 변경 사항을 즉시 보여줍니다.

"오늘 작업한 PR을 새 프로젝트로 정리하고 내일 오후 3시 리뷰 일정을 잡아줘"라고 말해보세요. Hearth Skill이 전용 CLI를 통해 실제 워크스페이스를 업데이트합니다.

프로젝트·일정·메모를 한곳에. ⌃⇧H로 어떤 앱 위에서도 생각을 바로 기록하고, 모든 데이터는 내 Mac의 SQLite에 저장합니다. 가입도 구독도 없습니다.

하루를 놓치지 않는 캘린더
— 7열 월간 보기에서 일정과 교대 근무를 한눈에 확인
— 일정 칩을 다른 날짜로 드래그해 바로 변경
— 날짜를 누르면 그날의 일정과 메모를 한 패널에서 편집
— 이벤트·할 일·교대·기념일별 색상과 아이콘

기록이 이어지는 워크스페이스
— 프로젝트 우선순위와 메모를 한 화면에서 정리
— 날짜별 저널과 "갑자기 메모" 빠른 입력
— ⌘F로 프로젝트·메모·일정 전체 검색
— 10개 테마와 사용자 지정 강조색

내 데이터는 내 Mac에
Hearth는 계정, 분석 도구, 자체 서버가 없습니다. 데이터베이스 파일을 직접 백업하거나
Time Machine으로 보관할 수 있습니다. OpenAI 연동은 선택 사항이며, 사용할 때만 자신의
API 키를 등록합니다.

Hearth Skill과 CLI는 선택 기능입니다. 앱의 기본 기능에는 AI가 필요하지 않습니다.

Mac App Store에서 한 번 구매하면 계속 사용할 수 있습니다. 별도 계정과 구독은 없습니다.
```

### URL

```text
마케팅 URL: https://hearth.codewithgenie.com/ko
지원 URL: https://hearth.codewithgenie.com/ko/support
개인정보처리방침 URL: https://hearth.codewithgenie.com/ko/privacy
```

## 영어 입력값

### 앱 이름

```text
Hearth: Local Workspace
```

`Hearth` 단독 이름은 다른 Apple 개발자 계정이 사용 중이라 사용할 수 없다. en-US 현지화를 생성할 때 ASC가 최종 이름 중복 검사를 수행한다.

### 부제

```text
AI agent workspace for Mac
```

### 프로모션 텍스트

```text
Connect the Hearth Skill to Claude Code or Codex. Your AI agent organizes projects, memos, and schedules while your data stays on your Mac.
```

### 키워드

```text
todo,notes,memo,tasks,calendar,planner,journal,capture,projects,automation,cli,local,offline,privacy
```

### What's New

```text
Hearth 1.1 brings a redesigned month calendar with drag-to-reschedule, a day panel that keeps schedules and memos together, Journal view with instant capture, clearer project priorities, smoother navigation, and ten refined themes.
```

### Description

```text
THE LOCAL WORKSPACE YOUR AI AGENT CAN ACTUALLY USE
Connect the Hearth Skill to Claude Code or Codex. Your agent turns natural-language requests into projects, memos, and schedules, and the open Hearth app reflects each change immediately.

Try: "Turn today's PRs into a new project and schedule tomorrow's review for 3 PM." The Hearth Skill uses its dedicated CLI to update your real workspace.

Projects, schedules, and memos stay together. Press ⌃⇧H over any app to capture a thought, while every record stays in a SQLite file on your Mac. No account. No subscription.

A CALENDAR THAT KEEPS THE DAY IN VIEW
— See events and shifts in a clear seven-column month
— Drag a schedule chip to another date to reschedule it
— Open a day to edit its schedules and memos together
— Give events, tasks, shifts, and anniversaries their own colors and icons

A WORKSPACE WHERE NOTES KEEP THEIR CONTEXT
— Organize projects by priority without losing the details
— Review memos by date in Journal and capture today's note instantly
— Search projects, memos, and schedules with ⌘F
— Choose from ten themes or set a custom accent

YOUR DATA STAYS ON YOUR MAC
Hearth has no account, analytics, or Hearth-operated server. Back up the
database yourself or let Time Machine handle it. OpenAI integration is optional
and uses only the API key you provide.

The Hearth Skill and CLI are optional. Core app features do not require AI.

One Mac App Store purchase. No separate account and no recurring subscription.
```

### URLs

```text
Marketing URL: https://hearth.codewithgenie.com/en
Support URL: https://hearth.codewithgenie.com/en/support
Privacy Policy URL: https://hearth.codewithgenie.com/en/privacy
```

## 심사 설정

```text
로그인 필요: 아니요
데모 계정 필요: 아니요
앱 내 구입: 없음
구독: 없음
IDFA 사용: 아니요
수출 규정 비면제 암호화 사용: 아니요
개인정보 수집: 데이터 수집 안 함
출시 방식: 수동 출시
```

심사 노트 원문은 [`review-notes.md`](./review-notes.md)를 사용한다.

## 스크린샷 업로드 순서

한국어:

1. `screenshots/1.1.0/ko/01-workspace.png`
2. `screenshots/1.1.0/ko/02-capture.png`
3. `screenshots/1.1.0/ko/03-calendar.png`
4. `screenshots/1.1.0/ko/04-drag.png`
5. `screenshots/1.1.0/ko/05-local.png`

영어는 같은 순서의 `en/` 파일을 사용한다.

## 제출 결과 확인

- build `13`이 `VALID`이고 1.1.0에 선택됨
- 한국어/영어 문구 길이 제한 통과
- 새 스크린샷 5장씩 순서 확인
- 2026-07-16~2026-08-15 한국 기준 ₩2,000 프로모션과 2026-08-16 복원 확인
- 현재 175개 지역과 향후 새 지역 자동 제공 확인
- 수동 출시 선택
- Export Compliance: 비면제 암호화 없음
- IDFA: 사용 안 함
- `심사 대기 중` 상태와 review submission ID `42617e83-af27-4fb6-8bf0-fe42b028e23c` 확인
