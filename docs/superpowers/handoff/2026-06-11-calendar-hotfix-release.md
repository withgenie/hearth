# Handoff — Hearth 1.0.1 calendar hotfix release

Date: 2026-06-11
Repo: `/Users/genie/dev/tools/hearth`

## Completed work

- Fixed calendar date selection bug where clicking a date in the month calendar opened the schedule modal for the previous day.
- First fix normalized date parsing (`new Date("YYYY-MM-DD")` UTC issue), then second fix corrected `react-big-calendar` slot hit-testing by reading the visible month cell under the click point.
- Cleaned local generated artifacts from Git visibility by ignoring `.codegraph/` and `dist-mas/`.
- Reinstalled local `/Applications/Hearth.app`, removed duplicate build bundle copies that appeared in Alfred, and confirmed only one app process was running.
- Prepared MAS hotfix release `1.0.1` build `11`.

## Important commits

- `0677fab Fix calendar date selection offset`
- `448cfab Ignore local generated artifacts`
- `8ab799e Fix calendar visible date selection`
- `c5b5649 Prepare 1.0.1 release`

Current `git status --short` was clean before this handoff file was created.

## Release state

- Marketing version: `1.0.1`
- Build number: `11`
- MAS package built and validated:
  - `dist-mas/Hearth-1.0.1-11.pkg`
- `scripts/build-mas.sh` completed successfully with `altool` validation:
  - `VERIFY SUCCEEDED with no errors`

## Verification already run

- `npm test -- --run src/components/__tests__/CalendarView.test.tsx` — passed
- `npm run build` — passed
- `npm test` — passed: 20 files / 88 tests
- `bash scripts/build-mas.sh` with `.env.release` and `CI=false` — passed

## ASC text prepared

### Promotional text

```text
Hearth는 프로젝트, 메모, 일정을 한곳에 정리하는 로컬 우선 개인 작업공간입니다. 더 정확한 캘린더 일정 관리 경험을 위해 날짜 선택 오류를 개선했습니다.
```

### What's New / Upgraded items

```text
캘린더 사용성을 개선했습니다.

• 월간 캘린더에서 날짜를 클릭할 때 하루 전 날짜로 일정 추가 창이 열리던 문제를 수정했습니다.
• 화면에 실제로 보이는 날짜 셀을 기준으로 일정이 생성되도록 날짜 선택 로직을 보정했습니다.
• 캘린더 날짜 처리 회귀 테스트를 추가해 같은 문제가 반복되지 않도록 안정성을 강화했습니다.
```

Shorter option:

```text
캘린더에서 날짜 클릭 시 하루 전 날짜로 일정 추가 창이 열리던 문제를 수정했습니다.
```

## Next actions

1. Upload MAS package:

   ```sh
   set -a
   . ./.env.release
   set +a
   bash scripts/upload-mas.sh
   ```

2. In App Store Connect:
   - Create/select version `1.0.1`.
   - Attach build `11` after processing completes.
   - Paste the Korean promotional / What's New text above.
   - Submit for review.

3. Commit this handoff file if desired. It was intentionally not committed automatically.
