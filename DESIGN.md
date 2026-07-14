# Hearth Design System

This file is the visual source of truth for Hearth. It extracts the current theme and `src/ui` system and records the approved 2026-07-14 redesign contracts before implementation. “Current” means the behavior present at `c5b5649`; “approved” means required by `docs/superpowers/plans/2026-07-14-ui-redesign.md` but not necessarily implemented yet. There is intentionally no Research Log because this is an extraction from an existing component system.

## 1. Atmosphere & Identity

Hearth should feel like a quiet, local-first worktable: compact enough for projects, schedules, and fast notes, but warm and legible rather than clinical. Its signature is **diary-like information density on layered paper surfaces**—warm-paper dark is the default, color is semantic and restrained, and tactile memo character is reserved for memos rather than sprayed across every card. The redesign strengthens this signature with a hand-organized month, a daily page, chronological journal rows, and quieter project hierarchy; it must not turn Hearth into a generic bordered-card dashboard or a decorative gradient showcase.

Source basis: the current warm-paper default and surface stack are defined in `src/App.css:4-22`; the compact shell and Korean primary navigation are in `src/components/Layout.tsx:181-210` and `src/components/TopBar.tsx:15-70`; the approved diary, journal, and project direction is in `docs/superpowers/plans/2026-07-14-ui-redesign.md:57-105`.

## 2. Color

### Theme-owned roles

The theme layer owns exactly 18 roles. Components consume the role, never a preset-specific value.

| Role | Token | Warm Paper default | Usage |
|---|---|---:|---|
| deepest surface | `--color-surface-0` | `#141312` | app background and deepest canvas |
| shell surface | `--color-surface-1` | `#1a1917` | top bar, dialog, primary panels |
| raised surface | `--color-surface-2` | `#221f19` | controls, menus, hover fills |
| strongest surface | `--color-surface-3` | `#2a2721` | active/raised fills and quiet badges |
| separator | `--color-border` | `#2e2a23` | default border and divider |
| strong separator | `--color-border-strong` | `#3a362e` | scrollbar, keyboard key, stronger boundary |
| highest-emphasis text | `--color-text-hi` | `#f4efcf` | product name, display and heading emphasis |
| primary text | `--color-text` | `#ebeadf` | body and control labels |
| secondary text | `--color-text-muted` | `#a7a496` | supporting labels and inactive navigation |
| lowest-emphasis text | `--color-text-dim` | `#7a7668` | placeholders, disabled metadata, out-of-month dates |
| brand/action | `--color-brand` | `#d97706` | primary action, active semantic rail |
| brand emphasis | `--color-brand-hi` | `#fbbf24` | hover, focus, current-day ring, high-emphasis brand text |
| brand tint | `--color-brand-soft` | `rgba(217, 119, 6, 0.18)` | selected and today backgrounds |
| urgent priority | `--color-p0` | `#ef4444` | P0 rail/dot and urgent markers |
| low priority / evening shift | `--color-p3` | `#3b82f6` | P3 rail/dot, Saturday, and E shift |
| success / task | `--color-success` | `#22c55e` | task and confirmation states |
| danger / deadline | `--color-danger` | `#ef4444` | destructive, deadline, and Sunday states |
| lab / anniversary | `--color-cat-lab` | `#a855f7` | lab category and anniversary accent |

Source basis: `src/theme/types.ts:39-56`, `src/App.css:4-22`, and `src/theme/presets.ts:8-23`.

### Ten-preset strategy

Hearth ships five dark and five light presets. `warm-paper` is the no-attribute CSS fallback and default setting; the other nine are `[data-theme]` overrides. Every preset supplies the same 18 roles in the same order. The compact tuples below are `surface-0 / surface-1 / surface-2 / surface-3`, `border / border-strong`, `text-hi / text / text-muted / text-dim`, `brand / brand-hi / brand-soft`, and `p0 / p3 / success / danger / cat-lab`.

| Preset | Mode | Surface tuple | Border tuple | Text tuple | Brand tuple | Semantic tuple |
|---|---|---|---|---|---|---|
| Warm Paper | dark | `#141312 / #1a1917 / #221f19 / #2a2721` | `#2e2a23 / #3a362e` | `#f4efcf / #ebeadf / #a7a496 / #7a7668` | `#d97706 / #fbbf24 / rgba(217, 119, 6, 0.18)` | `#ef4444 / #3b82f6 / #22c55e / #ef4444 / #a855f7` |
| Midnight | dark | `#0f1420 / #141b2c / #1b2439 / #232d46` | `#273352 / #334063` | `#e6ecff / #d8ddef / #8d97b5 / #5e6885` | `#3b82f6 / #60a5fa / rgba(59, 130, 246, 0.18)` | `#f87171 / #60a5fa / #4ade80 / #f87171 / #c084fc` |
| Forest | dark | `#0f1612 / #141e18 / #1b2a20 / #223529` | `#26402f / #30503b` | `#e5f3e8 / #d7e7dc / #8ea89a / #5f786a` | `#10b981 / #34d399 / rgba(16, 185, 129, 0.18)` | `#f87171 / #60a5fa / #4ade80 / #f87171 / #c084fc` |
| Plum | dark | `#1a1320 / #211828 / #2b1f35 / #362843` | `#3a2b49 / #4a3860` | `#f0e9fa / #e1d8ef / #a295b8 / #766888` | `#a855f7 / #c084fc / rgba(168, 85, 247, 0.18)` | `#f87171 / #60a5fa / #4ade80 / #f87171 / #c084fc` |
| Carbon | dark | `#111111 / #181818 / #1f1f1f / #272727` | `#2c2c2c / #3a3a3a` | `#f5f5f5 / #e5e5e5 / #a3a3a3 / #737373` | `#f97316 / #fb923c / rgba(249, 115, 22, 0.18)` | `#f87171 / #60a5fa / #4ade80 / #f87171 / #c084fc` |
| Cream | light | `#fdf8ef / #f6efdf / #ede4cc / #e2d7b8` | `#d5c79c / #b8a775` | `#2a2218 / #3d3325 / #6a5c47 / #94866f` | `#b45309 / #92400e / rgba(180, 83, 9, 0.18)` | `#991b1b / #1e40af / #065f46 / #991b1b / #6b21a8` |
| Linen | light | `#fafaf7 / #f3f3ee / #eaeae4 / #dededa` | `#d0d0cc / #b0b0ab` | `#1a1a1a / #2e2e2e / #5f5f5c / #8b8b87` | `#1d4ed8 / #1d4ed8 / rgba(29, 78, 216, 0.18)` | `#991b1b / #1e40af / #065f46 / #991b1b / #6b21a8` |
| Mint | light | `#f4faf6 / #e9f3ec / #ddeae1 / #ceddd3` | `#b9ccbf / #9ab2a2` | `#152419 / #223024 / #4e6455 / #7d9283` | `#059669 / #065f46 / rgba(5, 150, 105, 0.18)` | `#991b1b / #1e40af / #065f46 / #991b1b / #6b21a8` |
| Blush | light | `#fdf5f6 / #f8e9ec / #efdadd / #e3c7cd` | `#d4b2ba / #b88f99` | `#2a1619 / #3c2429 / #6a4a51 / #947079` | `#be185d / #9d174d / rgba(190, 24, 93, 0.18)` | `#991b1b / #1e40af / #065f46 / #991b1b / #6b21a8` |
| Arctic | light | `#f4f7fb / #e8eef5 / #dae4ef / #c8d6e5` | `#b1c3d8 / #8ea7c2` | `#0b1a2a / #1a2838 / #485b72 / #7b8ea5` | `#0284c7 / #075985 / rgba(2, 132, 199, 0.18)` | `#991b1b / #1e40af / #065f46 / #991b1b / #6b21a8` |

Source basis: preset values and light/dark metadata are in `src/theme/presets.ts:8-172`; the nine override blocks and warm-paper cascade strategy are in `src/theme/theme.css:1-148`; default selection and preset groups are in `src/theme/types.ts:3-37`.

Custom themes do not create a new neutral palette. They copy Carbon for dark or Linen for light, including the five contrast-safe semantic roles, then derive only `--color-brand`, `--color-brand-hi`, and `--color-brand-soft` from the chosen hex. Brand-high keeps hue/saturation and clamps lightness after a +10 adjustment to 45–75; brand-soft uses alpha 0.18. Source: `src/theme/derive.ts:93-125`.

### Remaining global semantic roles

The redesign-critical `p0`, `p3`, `success`, `danger`, and `cat-lab` roles are theme-owned above so they retain text and indicator contrast. The remaining roles below do not change by preset today.

| Family | Tokens and current values | Contract |
|---|---|---|
| priority | `--color-p1: #f97316`; `--color-p2: #eab308`; `--color-p4: #6b7280` | P1, P2, and P4 project priority rail/dot |
| category | `--color-cat-active: #22c55e`; `--color-cat-side: #f97316`; `--color-cat-tools: #6b7280`; `--color-cat-lecture: #3b82f6` | existing user-category accents outside the redesign contract |

Source basis: `src/App.css:24-40`.

### Approved redesign mappings and color rules

- Month event chips use `--color-brand`; task chips use `--color-success`; deadline emphasis uses `--color-danger`; anniversary uses the existing violet/pink-family `--color-cat-lab`; D shift uses `--color-brand`, E shift uses `--color-p3`, and OFF uses `--color-text-dim` on `--color-surface-3`. The left chip rail carries the semantic color; text remains on a contrast-safe surface.
- Today uses `--color-brand-hi` for the date ring and `--color-brand-soft` for the cell tint. Sunday and Saturday distinction must reuse `--color-danger` and `--color-p3`; adjacent-month dates use `--color-text-dim`.
- Memo color becomes a narrow left rail in journal mode. Project priority becomes a left rail plus dot. Neither contract permits a full-surface saturated fill.
- A caller-provided schedule `color` is data, not a design-system token. Rendering must validate/fallback it and preserve readable foreground contrast in every theme; it does not authorize hard-coded component colors.
- **No new dependency and no new raw color may be introduced in implementation.** If an existing role cannot express a required meaning, update this file and the theme sources first, then verify all ten presets. Do not copy the current raw white/black shortcuts from legacy buttons/calendar CSS into new work.

Source basis: `docs/superpowers/plans/2026-07-14-ui-redesign.md:61-68,93-96,110-119`; fallback roles in `src/App.css:24-40` and per-preset overrides in `src/theme/presets.ts`.

## 3. Typography

### Current scale

| Level / class | Size | Weight | Line height | Tracking | Use |
|---|---:|---:|---:|---:|---|
| display / `.text-display` | 22px | 600 | 1.2 | -0.015em | page-level display |
| heading / `.text-heading` | 15px | 600 | 1.3 | -0.005em | section and card title |
| body / `.text-body` | 13px | 400 | 1.45 | normal | app body and controls |
| small / `.text-small` | 12px | 400 | 1.4 | normal | supporting content |
| label / `.text-label` | 10px | 600 | 1.4 | 0.06em | compact uppercase labels only |
| mono / `.text-mono` | 12px | 400 | 1.4 | normal | versions, shortcuts, paths, times/data |

The supported compatibility sizes already present in shared UI are 11px for badges, keys, menu metadata, actions, and tooltips; 12px for compact controls and descriptions; 13px for default controls; and 14px for the legacy calendar toolbar. New calendar chips must be at least 12px, and date numbers must have stronger hierarchy than chip copy. New project names use `.text-heading`; raw paths are not body copy.

Font stacks are `--font-sans: "SF Pro Text", "Inter", system-ui, sans-serif` and `--font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace`. Use the sans stack for product language and the mono stack or tabular figures for time/version/path data. Do not add a third family.

Rules:

- Preserve the compact desktop scale during the approved redesign; do not silently import a marketing-site type scale.
- Keep Korean labels in sentence-style product language. Uppercase is reserved for short existing labels and priority/shift codes such as P0 and OFF.
- Long titles and descriptions wrap deliberately or clamp according to the component contract; unbroken paths/tokens never set the width of a primary region.
- The 10–13px legacy body scale is accepted pre-redesign debt under Section 8. New essential text must not be made smaller; 12px is the explicit floor for calendar chips in the approved plan.

Source basis: `src/App.css:56-90`; shared-size examples in `src/ui/Badge.tsx:21-24`, `src/ui/Button.tsx:29-32`, `src/ui/Kbd.tsx:7-12`, and `src/ui/Tooltip.tsx:25-32`; redesign requirements in `docs/superpowers/plans/2026-07-14-ui-redesign.md:61-68,93-95`.

## 4. Spacing & Layout

### Spacing contract

The base unit is **4px**. Use the existing Tailwind spacing utilities as the implementation vocabulary: 4, 8, 12, 16, 20, 24, 32, and 40px are the primary rhythm. Existing 6px half-steps are limited to tight icon/text or micro-control alignment; existing 10px values are compact optical padding. Values such as control heights, icon sizes, borders, and intrinsic sizing are component dimensions or browser mechanics, not spacing tokens. Do not invent CSS custom-property names for spacing unless this document and the source theme are updated together.

Current anchors include the 48px top bar (`h-12`), 40px/32px main inset (`px-10 py-8`), 16px top-bar inset (`px-4`), 36px default control height (`h-9`), and 28px compact control height (`h-7`). Source: `src/components/TopBar.tsx:33-70`, `src/components/Layout.tsx:181-209`, `src/ui/Button.tsx:29-32`, and `src/ui/Input.tsx:8-16`.

### Shell and scroll ownership

- The app is a bounded desktop shell: fixed TopBar, fixed Sidebar, and exactly one primary vertical scroll owner—`main`.
- `body` stays `overflow: hidden`; the shell fills the viewport; the inner flex row is `overflow-hidden`; `main` is `overflow-y-auto`. New views must fill or flow inside `main`, not create document scroll.
- Any DayPanel list may own a second, explicitly named scroll region inside the fixed panel. Its header/actions stay fixed and its list body gets bounded height plus `min-height: 0; overflow-y: auto`.
- MonthGrid itself does not horizontally or vertically scroll. It is a seven-column CSS grid that compresses/wraps within the available main width. Primary content must not require two-dimensional scrolling.
- The current shell uses `100vh` in both CSS and a scaled inline calculation. Migration to dynamic viewport units is desirable but not part of the approved redesign; it remains debt in Section 8.
- Prefer intrinsic sizing and `min-width: 0`/`overflow-wrap: anywhere` over viewport breakpoints for local components. At 375px, primary content must reflow to one readable column with no horizontal scrollbar; the desktop sidebar behavior may require a later explicit responsive contract.

Source basis: `src/App.css:66-80`; `src/components/Layout.tsx:181-210`; approved MonthGrid and DayPanel structure in `docs/superpowers/plans/2026-07-14-ui-redesign.md:57-79`; scroll/content-stress rules from the required layout reference, `skills/frontend/references/design/layout-skill.md:12-56,92-103`.

## 5. Components

### Current reusable primitives

All shared primitives use `cn` composition and current theme roles. “Missing” states are factual extraction gaps, not permission to fake a state in documentation-only tests.

| Primitive | Structure, variants, and spacing | Current states and accessibility | Motion, depth, and layout |
|---|---|---|---|
| `Button` | native button; primary, secondary, ghost, danger; `sm` 28px and `md` 36px; optional 14/16px icons | hover, focus-visible ring, disabled; native keyboard semantics; no loading API and no explicit pressed transform | color transition 120ms; inline cluster; secondary has border |
| `Input` | native input, 36px high, full width, 12px inline padding | placeholder, focus border; native disabled behavior but no styled error/loading contract | color transition 120ms; raised surface and border |
| `Badge` | span, 20px high, 8px inline padding; default or caller-provided tone | static, non-interactive; no state semantics by itself | tonal fill; inline cluster; no motion |
| `Icon` | Lucide adapter at 14/16/18px, stroke 1.75 | always `aria-hidden`; accessible name belongs to surrounding control | fixed visual primitive; no motion |
| `Kbd` | semantic `kbd`, minimum 20px, compact mono label | static keyboard hint | surface, strong border; no motion |
| `EmptyState` | centered stack with optional icon, description, action | explicit empty state; action supplies its own keyboard behavior | 24px horizontal/48px vertical padding; no motion |
| `Tooltip` | trigger wrapper and top/bottom tooltip | opens on hover and focus, closes on leave/blur; `role="tooltip"`; not interactive | transient bordered/shadow surface; no entry motion |
| `Popover` | trigger render prop plus left/right-flipping panel | `aria-expanded` passed to trigger; Escape and outside click close; panel is `role="dialog"`; no focus trap/return | absolute, viewport-flipped, border plus `--shadow-e2`; no entry motion |
| `ContextMenu` | fixed portal panel; standard, danger, disabled, inline, and separator rows | `role="menu"`/`menuitem`; Escape/outside close; disabled state; lacks roving focus/arrow-key navigation and initial focus | clamped to 8px viewport margin; border plus `--shadow-e3`; hover transition 120ms |
| `Dialog` | modal portal, backdrop, centered panel, optional labelled-by | Escape/backdrop close, Tab trap, focus entry and return, `role="dialog"`, `aria-modal`; requires caller-supplied accessible title id | 24px viewport inset, max-width medium, border plus `--shadow-e3`; approved 120ms entry contract below is not current |
| `Toast` | fixed bottom-right stack; success, error, info; undo/actions; 5s or sticky | semantic visual kind, buttons keyboard reachable, dismiss label; container currently lacks live-region semantics | raised bordered `--shadow-e2` surface; no entry/exit motion |

Source basis: `src/ui/Button.tsx:7-57`, `src/ui/Input.tsx:5-22`, `src/ui/Badge.tsx:5-30`, `src/ui/Icon.tsx:5-24`, `src/ui/Kbd.tsx:5-18`, `src/ui/EmptyState.tsx:7-34`, `src/ui/Tooltip.tsx:5-40`, `src/ui/Popover.tsx:11-91`, `src/ui/ContextMenu.tsx:13-152`, `src/ui/Dialog.tsx:6-93`, and `src/ui/Toast.tsx:16-177`.

### Approved MonthGrid

- **Structure/layout:** calendar header composes a semantic 7-column grid of weekday headers and date-cell buttons. Date math uses the existing `Date` API without a new library. A cell contains date number, optional shift capsule, and at most three event chips; `+N` is a button that opens the date panel. Adjacent-month cells remain navigable but visibly dim.
- **Variants:** current day, selected day, weekend Sunday/Saturday, adjacent month, empty, one-to-three chips, overflow, shift, event, task, deadline, anniversary.
- **Content anatomy:** shift is a small capsule beside the date number. Event chip is a calm surface with a 3px semantic rail, optional emoji icon, bold time when present, and title. Repetitive shifts never become full-width event bars.
- **States:** default, hover, active/pressed, focus-visible, selected, today, disabled only when an actual action is unavailable, and empty. Loading/error belong to the composed calendar view rather than fake cells.
- **Accessibility:** each date is a named button with full date in its accessible name; today/selected state is exposed programmatically; chip content does not create nested interactive controls inside a date button. Keyboard tab order is deterministic, and Enter/Space opens DayPanel. Month-boundary and timezone behavior require tests.
- **Motion/depth:** state transitions use 120ms transform/opacity only. Cells use the surface/border system, not per-cell shadows. Today tint/ring and semantic rails follow Section 2.

Source basis: `docs/superpowers/plans/2026-07-14-ui-redesign.md:57-79`.

### Approved DayPanel

- **Structure/layout:** right-side fixed panel composed as header, scroll-body, and actions. Header names the selected date and contains close/navigation controls; body lists schedules in time order and includes that date’s journal memos. Existing schedule create/edit/delete logic is reused.
- **States:** closed, entering, open, exiting; empty day; populated; loading; inline mutation pending/error; destructive confirmation where already required.
- **Keyboard/accessibility:** Left/Right Arrow moves one date, Escape closes, focus enters the panel and returns to the opener, controls remain in logical order, and the panel has a labelled dialog/complementary region. The body is the panel’s only scroll owner.
- **Motion/depth:** slide in with transform plus opacity; no width/right/layout animation. The panel uses tonal separation, a single boundary, and overlay elevation consistent with Dialog.

Source basis: `docs/superpowers/plans/2026-07-14-ui-redesign.md:70-77,101-106`; current modal focus behavior to reuse is in `src/ui/Dialog.tsx:19-64`.

### Approved journal row and quick capture

- **Journal layout:** fourth MemoBoard view; groups descend by `created_at` date with a sticky Korean date header, while rows within a group are chronological. Existing list, matrix, and focus modes remain available.
- **Row anatomy:** timestamp, readable memo body, and metadata/actions; memo color appears only as a left rail. Rows are calm cards—no post-it rotation or heavy memo shadow. Empty and long memo bodies must not break the group width.
- **Quick capture:** a persistently visible input at the top labelled “갑자기 메모”; Enter creates in today’s group through the existing memo create path. Empty input is not submitted; pending prevents duplicate submit; failure remains editable and is announced; success clears/refocuses the field.
- **States/accessibility:** view selector exposes active state; sticky headers do not hide focused rows; capture has an accessible label and predictable Enter behavior. Persist the last selected memo view in settings.

Source basis: `docs/superpowers/plans/2026-07-14-ui-redesign.md:81-89`.

### Approved compact project row

- P0–P2 remain in the fuller project hierarchy; P3/P4 collapse to a one-line compact row rather than introducing a density toggle.
- Row anatomy is priority dot/rail, project name, two-line-clamped evaluation where space permits, and a demoted Finder affordance showing only the last directory (for example `📁 hearth`). Full path appears only in a hover/focus tooltip.
- The whole row must not become an ambiguous nested button. Give open/edit/Finder actions separate semantic controls, keyboard focus, and accessible labels. A missing path disables only the Finder action.
- Long project names and unbroken paths truncate/wrap safely; compactness never removes the accessible full value.

Source basis: `docs/superpowers/plans/2026-07-14-ui-redesign.md:91-98`.

### Approved moving tab indicator and view transition

- TopBar keeps the three project/calendar/memo buttons and gains one absolute active indicator positioned by `transform`; active state remains available in text/color and programmatic state, never motion alone.
- `Cmd+1/2/3` switches the three tabs. The last active tab persists in settings and restores on launch.
- View transition is a small state machine: current view exits with opacity, content switches after exit completes, then next view enters with opacity plus a 4px upward settle. It must not use deferred rendering as the motion mechanism and must not leave outgoing and incoming views simultaneously keyboard-focusable.
- Transition wrappers remain inside `main`, preserve its scroll ownership, and use `onAnimationEnd`/equivalent completion without a motion library.

Source basis: current tab anatomy in `src/components/TopBar.tsx:15-59`; current active-tab ownership in `src/components/Layout.tsx:45-69,122-168`; redesign contract in `docs/superpowers/plans/2026-07-14-ui-redesign.md:100-106`.

## 6. Motion & Interaction

| Contract | Duration | Easing | Properties | Use |
|---|---:|---|---|---|
| micro | 120ms | `--ease-out-smooth` | transform and/or opacity; color may change without being the animated spatial contract | button/menu/input feedback and shared modal entry |
| view | 150ms | `--ease-out-smooth` | transform and opacity | tab exit/enter, moving indicator, DayPanel slide |

`--ease-out-smooth` is `cubic-bezier(0.2, 0.8, 0.2, 1)`. New spatial animation is restricted to `transform` and `opacity`: never animate width, height, inset, margin, padding, grid tracks, or scroll position. Existing shared primitives that currently use `transition-colors duration-[120ms]` keep their color feedback; new motion work adds transform/opacity without broad `transition-all`.

Dialog/modal entry is 120ms scale from 0.98 to 1 plus fade. DayPanel is a transform-based slide plus fade. Tab content exits by fade, then enters with fade and a 4px upward settle over 150ms. The active-tab indicator moves with transform over 150ms. Exit/entry completion must be deterministic and must not depend only on a timer.

Every interactive element requires visible default, hover where a pointer exists, active/pressed, focus-visible, and disabled/pending feedback where applicable. Keyboard actions must produce the same state changes as pointer actions.

Under `prefers-reduced-motion: reduce`, remove non-essential translation and scale, make tab/panel/dialog state changes effectively immediate, and preserve focus, selected, today, and semantic feedback without motion. No functionality may depend on animation events that never fire after reduction; the state machine needs an immediate completion path.

Existing 1.8s/2.2s find-highlight pulses are legacy search-location feedback, not reusable motion timings. Preserve only until the calendar replacement removes the RBC variant; evaluate the remaining memo highlight separately under reduced motion.

Source basis: current easing and 120ms primitives in `src/App.css:53-55`, `src/ui/Button.tsx:41-46`, `src/ui/Input.tsx:10-16`, and `src/ui/ContextMenu.tsx:134-142`; current highlight exceptions in `src/App.css:104-119,135-143`; approved motion in `docs/superpowers/plans/2026-07-14-ui-redesign.md:100-106`.

## 7. Depth & Surface

The current and retained strategy is **restrained mixed depth**: tonal shift first, one-pixel borders for containment, and shadows only for genuinely elevated/transient surfaces or tactile memos.

| Level | Token/value | Usage |
|---|---|---|
| tonal | `--color-surface-0` → `--color-surface-3` | primary hierarchy; prefer this before adding shadow |
| boundary | `--color-border`, `--color-border-strong` | divisions, controls, contained panels |
| elevation 1 | `--shadow-e1: 0 1px 2px rgba(0, 0, 0, 0.3)` | subtle raised surface; use sparingly |
| elevation 2 | `--shadow-e2: 0 4px 12px rgba(0, 0, 0, 0.35)` | popover, tooltip, toast |
| elevation 3 | `--shadow-e3: 0 20px 40px rgba(0, 0, 0, 0.5)` | dialog and context menu |
| tactile memo exception | `0 6px 16px rgba(0, 0, 0, 0.45)` | existing post-it memo cards only; not journal rows |

Radii are `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 10px`, and `--radius-xl: 14px`. Use tighter radii for nested controls and larger radii for outer panels; do not apply one radius to everything.

Month cells and project rows use tonal separation plus a boundary, not card shadows. DayPanel, Dialog, Popover, ContextMenu, Tooltip, and Toast may use their existing elevation. Journal rows deliberately remove the tactile memo shadow. The dark translucent dialog backdrop is a current overlay implementation detail, not a palette role to reuse in ordinary content.

Source basis: `src/App.css:42-51,104-105`; `src/ui/Dialog.tsx:68-86`, `src/ui/Popover.tsx:71-84`, `src/ui/ContextMenu.tsx:82-96`, `src/ui/Tooltip.tsx:24-33`, and `src/ui/Toast.tsx:94-122`; redesign surface direction in `docs/superpowers/plans/2026-07-14-ui-redesign.md:61-68,83-96`.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA. Body text and meaningful icon/text contrast target at least 4.5:1; large text and non-text boundaries/focus indicators target at least 3:1. The existing comment that body contrast was checked by hand is not a substitute for ten-theme automated plus visual verification.
- Every interactive element is keyboard reachable and has a visible focus indicator. The global 2px `--color-brand-hi` outline is the fallback; component rings may refine it but never remove it. Pointer-only disclosure such as full-path Tooltip must also open on focus.
- Dialog and DayPanel trap/contain focus as appropriate, close with Escape, restore focus, and have accessible names. ContextMenu requires arrow-key/roving-focus remediation before it is treated as a complete ARIA menu.
- MonthGrid dates have programmatic full-date names and selected/today state. DayPanel supports Left/Right Arrow date navigation. TopBar supports `Cmd+1/2/3`. Quick capture is labelled and announces success/error without stealing focus unexpectedly.
- Motion follows Section 6 and respects `prefers-reduced-motion`. Color is never the only indicator: semantic rails pair with text/icon/code, today pairs ring+tint+state, and active tabs pair indicator+text/programmatic state.
- Content stress is mandatory for every new/changed component: empty, long Korean/English label, long paragraph, unbroken path/token, max item count, and mutation error. At 375px primary content reflows to one readable column without horizontal scrolling; use `min-width: 0`, wrapping, clamp, or ellipsis by explicit contract.
- Verify all ten presets, keyboard-only flows, reduced motion, 200% zoom/reflow, and screen-reader names on the real rendered surface before calling the redesign complete.

Source basis: current focus fallback in `src/App.css:98-102`; current Dialog behavior in `src/ui/Dialog.tsx:19-64`; current Tooltip focus behavior in `src/ui/Tooltip.tsx:14-37`; approved keyboard and theme checks in `docs/superpowers/plans/2026-07-14-ui-redesign.md:70-72,100-111`; required design-system validation in `skills/frontend/references/design/design-system-architecture.md:212-225`.

### Accepted debt

| Item | Location | Why it is accepted now | Exit condition |
|---|---|---|---|
| Calendar is monochrome RBC output with no schedule kind/color model; date offsets have regressed before | `CalendarView`, `.rbc-*`, schedule schema | Explicit pre-redesign baseline; Phase 1 replaces data/model/rendering in ordered slices | Phase 1 schema, MonthGrid, DayPanel, RBC removal, month-boundary/timezone tests and live CLI sync pass |
| No date-grouped journal/quick capture mode | `MemoBoard` | Explicit pre-redesign gap; existing list/matrix/focus must remain stable | Phase 2 ships journal grouping, capture, persistence and CLI live-sync proof |
| Project raw paths dominate and P3/P4 have no compact hierarchy | project view/cards | Explicit pre-redesign gap | Phase 3 ships demoted Finder affordance, hierarchy, clamps, compact rows and keyboard/tooltip proof |
| Tabs replace instantly; no moving indicator, shared view/dialog/panel motion, shortcuts, or persistence contract | `Layout`, `TopBar`, `Dialog` | Explicit pre-redesign gap | Phase 4 passes 120/150ms motion, reduced-motion, `Cmd+1/2/3`, persistence, focus and state-machine tests |
| Compact type runs below the general 14px body recommendation | `src/App.css`, shared primitives | Existing dense desktop product baseline; approved plan explicitly keeps 12px calendar chips as floor | Revisit only with a separately approved typography pass; no new essential text below 12px meanwhile |
| Shell uses `100vh` rather than dynamic viewport units | `src/App.css:66-71`, `src/components/Layout.tsx:181-185` | Existing desktop/Tauri shell; responsive viewport migration is outside the approved phases | Replace with a tested dynamic-viewport shell contract without breaking UI scale or desktop sizing |
| ContextMenu lacks full keyboard menu navigation; Toast lacks an explicit live region; Popover lacks focus containment/return | `src/ui/ContextMenu.tsx`, `src/ui/Toast.tsx`, `src/ui/Popover.tsx` | Existing primitives predate this extraction; redesign may reuse them only with their limits understood | Add public-behavior accessibility tests and complete the missing semantics when each primitive is touched |
| Legacy raw white/black and raw highlight RGBA values bypass role tokens | `src/ui/Button.tsx`, `src/ui/Dialog.tsx`, legacy `.rbc-*` and find-highlight CSS | Pre-existing implementation; broad palette cleanup is outside this documentation-only extraction | Remove RBC values in Phase 1; migrate remaining raw values through a separately reviewed token update |
| Isolated source-built Tauri baseline renders a uniform black WKWebView despite healthy Vite and correct temp DB | `.omo/.../evidence/C002-gui/baseline-red/` | Two safe, isolated pre-change attempts reproduced a QA-harness/renderer issue; it is not valid RED evidence for the redesign and diagnosis is outside this extraction | Diagnose the renderer separately or obtain readable current-HEAD Tauri proof; final redesign acceptance still requires real desktop screenshots/action log |

The pre-redesign product gaps are documented in `docs/superpowers/plans/2026-07-14-ui-redesign.md:5-13,43-106`. The isolated Tauri evidence records a healthy Vite server, exact source PID/temp DB isolation, uniformly black window, cleanup, and no production changes in `.omo/ulw-loop/019f605c-63fe-7c10-8888-20c1975476cd/evidence/C002-gui/baseline-red/action-log.md:5-36`.

New accessibility or design debt is recorded here when accepted, never silently. Implementation may not add dependencies, raw colors, reusable primitives, token roles, or motion timings that contradict this file; update `DESIGN.md` first when a genuinely new system decision is approved.
