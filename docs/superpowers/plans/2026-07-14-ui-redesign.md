# Hearth UI 리디자인 계획 (2026-07-14)

실행자: Codex. 이 문서만 보고 실행 가능해야 함.

## 배경 / 문제 진단

유료 앱(MAS $15.99)인데 판매 0건. 스크린샷 기준 진단:

1. **캘린더**: 모든 일정이 동일한 파란 막대. 종류 구분·시간 표시·강조 없음. 원인은 스타일이 아니라 **`schedules` 테이블에 종류(kind)/색상 필드가 없어서** 렌더링이 단색일 수밖에 없는 구조. CLI로 등록한 일정을 눈으로 확인하기 어려움.
2. **메모보드**: 포커스 보드는 자유 배치뿐. "갑자기 메모 → 날짜별로 자동 정리되는 메모장" 모드가 없음.
3. **프로젝트**: 카드에 raw 파일 경로가 본문을 지배. 전체가 단조로운 베이지 톤, 시각적 위계 없음.
4. **이동**: 탭 전환이 즉시 교체(deferred value)라 뚝뚝 끊김. 전환 모션 없음.

## 절대 불변 계약 (이걸 깨면 실패)

AI agent CLI 시스템의 계약. 모든 Phase에서 준수:

- **DB 경로**: `~/Library/Application Support/com.codewithgenie.hearth/data.db` (`--db` / `$HEARTH_DB` 오버라이드 포함) 변경 금지.
- **스키마**: 기존 테이블·컬럼 이름/타입/의미 변경·삭제 금지. **추가는 허용하되 반드시 DEFAULT 있는 additive 컬럼 + `PRAGMA user_version` 마이그레이션**(`src-tauri/core/src/db.rs`)으로만. 구버전 CLI 바이너리가 신버전 DB에 INSERT/SELECT 해도 깨지지 않아야 함.
- **CLI 표면**: 기존 명령·플래그 이름, stdout `{"ok":true,"data":...}` / stderr `{"ok":false,"error":...,"hint":...}` 봉투, exit code(1/2) 변경 금지. 새 플래그는 optional로만 추가.
- **동기화**: `src-tauri/app/src/watcher.rs`의 500ms `data_version` 폴링 → `*:changed` 이벤트 → `src/lib/dbChangeBridge.ts` 경로 유지.
- **스킬**: `skills/hearth/SKILL.md`의 propose→approve→apply 레시피가 그대로 동작해야 함. 새 플래그 추가 시 SKILL.md·`docs/hearth-cli-ko.md`에 반영.

각 Phase 완료 시 회귀 체크(아래 "공통 검증") 필수.

## 공통 검증 (모든 Phase 끝에 실행)

```bash
npm run test                                   # vitest
cd src-tauri && cargo test                     # core + cli smoke + tool_calling_integration
# CLI 왕복 스모크 (임시 DB):
HEARTH_DB=/tmp/hearth-smoke.db ./target/release/hearth project create "smoke" --priority P2
HEARTH_DB=/tmp/hearth-smoke.db ./target/release/hearth schedule create 2026-07-15 --time 10:00 --description "smoke"
HEARTH_DB=/tmp/hearth-smoke.db ./target/release/hearth memo create "smoke" --color blue
HEARTH_DB=/tmp/hearth-smoke.db ./target/release/hearth search "smoke"
bash scripts/smoke-skills.sh                   # 스킬 라우팅
```

앱 실행 후 CLI로 일정 생성 → 1초 내 캘린더에 반영되는지 육안 확인.

---

## Phase 1 — 캘린더: 데이터 모델 + 다이어리 렌더링 (최우선)

### 1a. 스키마: 일정에 종류/색을 부여 (additive)

`schedules`에 컬럼 추가 (db.rs 마이그레이션):

- `kind TEXT NOT NULL DEFAULT 'event'` — `event | task | shift | anniversary` (근무 D/E/OFF 같은 반복 근무는 `shift`)
- `color TEXT` — NULL이면 kind 기반 자동 배색
- `icon TEXT` — NULL 허용, 이모지 1개 (다이어리 스티커 역할)

CLI(additive): `schedule create/update`에 `--kind`, `--color`, `--icon` optional 플래그 추가. `schedule list` 출력 data에 세 필드 포함(기존 필드 순서·이름 불변). `src-tauri/core/src/schedules.rs`, `cli/src/main.rs`, `skills/hearth/SKILL.md`, `docs/hearth-cli-ko.md` 갱신.

**자동 분류 폴백**: CLI/구버전이 kind 없이 등록해도 보기 좋아야 하므로, 렌더링 시 규칙 기반 추론을 프론트 `src/lib/scheduleStyle.ts`(신규)에 구현 — description이 `근무|OFF` 매칭 → shift, `마감|납부|신고` → deadline 강조, `@ 장소` 있으면 미팅 색, 그 외 kind/color 필드 우선. DB는 건드리지 않는 표시 전용 로직.

### 1b. 월 뷰를 커스텀 컴포넌트로 교체

`react-big-calendar` + `moment` 제거, `src/components/calendar/MonthGrid.tsx`(신규) 직접 구현. 이유: 다이어리형 데이 셀(색 도트, 스티커 이모지, shift 배지, 커스텀 오늘 링)은 rbc DOM과 계속 싸우게 되고, 이미 rbc 관련 날짜 오프셋 버그를 두 번 고침(커밋 8ab799e, 0677fab). 월 그리드는 7열 CSS grid + 순수 date 연산(기존 `Date` API, 라이브러리 불필요)으로 충분.

렌더링 규칙 (다이어리 스타일):

- **shift(근무 D/E/OFF)**: 막대가 아니라 날짜 숫자 옆 **작은 캡슐 배지** (D=amber, E=indigo, OFF=neutral). 매일 반복되는 근무가 화면을 지배하지 않게.
- **일반 일정**: 칩 형태 — 왼쪽 3px 색 레일 + `icon` 이모지 + 시간(있으면 `10:00` bold) + 제목. kind별 배색: event=brand, task=green, deadline계열=red 계열 + ⚠ 강조, anniversary=pink.
- **오늘**: 날짜 숫자에 브랜드색 원형 링 + 셀 배경 tint.
- 셀당 최대 3칩 + `+N` 오버플로 버튼 → 그 날짜 패널 열기.
- 주말 숫자 색 구분(일=red-ish, 토=blue-ish), 지난달/다음달 날짜는 dim.
- 글씨 크기 상향: 칩 텍스트 최소 12px, 날짜 숫자 위계 명확히. 기존 `@theme` 토큰만 사용.

### 1c. 날짜 상세 패널 (다이어리 페이지)

날짜 셀 클릭 → 우측 슬라이드 패널 `DayPanel.tsx`(신규): 선택 날짜의 일정 시간순 리스트(다이어리 한 페이지 느낌), 인라인 추가/수정/삭제(기존 `ScheduleModal` 로직 재사용), 해당 날짜 메모(Phase 2의 저널 데이터) 함께 표시. 키보드 ←→로 날짜 이동, Esc 닫기.

### 1d. 정리

- `package.json`에서 `react-big-calendar`, `@types/react-big-calendar`, `moment` 제거. `App.css`의 `.rbc-*` 오버라이드 삭제.
- `CalendarView.tsx`는 헤더(월 네비 + 오늘 버튼 + 새 일정)와 MonthGrid/DayPanel 조립만 담당하도록 축소.

검증: 공통 검증 + 월 경계(2026-06-30↔07-01), 타임존, 오늘 표시, CLI `schedule create --kind shift`가 배지로 뜨는지. 기존 오프셋 버그 재발 방지용 vitest 단위 테스트(월 그리드 날짜 계산 함수)를 추가.

## Phase 2 — 메모: 날짜별 메모장(저널) 모드

- `MemoBoard.tsx`에 4번째 뷰 모드 **"저널"** 추가 (기존: 리스트/매트릭스/포커스 유지).
- `created_at` 기준 날짜 내림차순 그룹핑, sticky 날짜 헤더(`7월 14일 (화)` + 요일). 그룹 안은 시간순, 메모 색상은 왼쪽 색 레일로만 표현하고 본문 가독성 우선(포스트잇 회전·그림자 대신 차분한 카드).
- 상단에 항상 보이는 **빠른 입력창** ("갑자기 메모") — Enter로 즉시 오늘 그룹에 추가. 기존 `useMemos` create 재사용.
- 스키마 변경 없음. CLI `memo create`로 등록한 메모도 자동으로 해당 날짜 그룹에 나타남(계약상 공짜).
- 마지막 선택 뷰 모드를 `settings` KV에 저장해 재실행 시 복원.

검증: CLI로 메모 생성 → 저널 뷰 오늘 그룹에 1초 내 표시.

## Phase 3 — 프로젝트 뷰 정돈

- **경로 강등**: raw 경로를 카드 본문에서 빼고, 카드 하단에 `📁 hearth` 처럼 마지막 디렉토리명만 + 클릭 시 Finder 열기(기존 opener plugin), hover 툴팁에 전체 경로.
- **위계**: 프로젝트명을 크게(text-heading), 우선순위는 P0/P1 텍스트 배지 대신 카드 왼쪽 색 보더 + 작은 도트로. 메모(evaluation)는 2줄 clamp.
- P0 섹션은 배경 tint로 긴급감, P3/P4는 컴팩트(1줄) 행으로 접기 — 카드 그리드는 P0~P2만.
- 카드 밀도 옵션(카드/컴팩트 리스트 토글)은 **생략** — 위 접기로 충분. 필요해지면 그때.

스키마·CLI 변경 없음.

## Phase 4 — 내비게이션/모션

- 탭 전환: 나가는 뷰 fade-out + 들어오는 뷰 fade-in & 4px slide-up, 150ms `--ease-out-smooth`. CSS 클래스 + `onAnimationEnd`로 구현(라이브러리 금지). `prefers-reduced-motion` 존중.
- `Cmd+1/2/3` 탭 전환 단축키(Layout.tsx keydown, 이미 있으면 유지).
- 탭 바: 활성 탭 인디케이터가 이동하는 형태(absolute 요소 transform 애니메이션).
- 모달/패널 공통: 열림 120ms scale(0.98→1)+fade, DayPanel은 slide-in. 다이얼로그 전부 동일 규칙 적용.
- 마지막 활성 탭을 settings KV에 저장 → 재실행 시 복원.

## Phase 5 — 마무리

1. 10개 테마 전체에서 새 캘린더/저널 대비 확인 (특히 dark 계열에서 shift 배지·칩 색 → `theme/derive.ts` 경유하도록).
2. 공통 검증 전체 + 앱↔CLI 라이브 동기화 육안 확인.
3. `CHANGELOG.md` 갱신, 버전 범프(`scripts/bump-version.sh`)는 사용자 승인 후.
4. 리디자인 후 App Store 스크린샷/미리보기 교체 필요 — 별도 작업으로 사용자에게 알릴 것 (판매 0건의 절반은 스토어 첫인상).

## 실행 순서 / 원칙

- 순서 고정: 1 → 2 → 3 → 4 → 5. Phase 1이 가장 크고 가치도 가장 큼. Phase별로 커밋 분리, Phase 1은 1a(스키마+CLI) / 1b(월 뷰) / 1c(패널) / 1d(정리) 커밋 분리.
- 새 의존성 추가 금지(오히려 rbc+moment 2개 제거). 스타일은 기존 `@theme` 토큰과 Tailwind 유틸만.
- 각 Phase에서 기존 컴포넌트를 최대한 재사용(ScheduleModal, useSchedules, useMemos, cn 등). 새 상태관리 라이브러리·라우터 도입 금지.
- 막히면 해당 Phase를 건너뛰지 말고 중단 후 보고.
