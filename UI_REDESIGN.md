# Vaani Studio UI Redesign

## Objective

Vaani Studio should feel like a quiet, precise Windows creative workstation. The redesign removes the generic AI/SaaS dashboard language and replaces it with a dense application shell, restrained surfaces, functional panels, and keyboard-first editing.

The redesign changes presentation and interaction quality while preserving transcription, project persistence, media preparation, subtitle editing, styling, diarization, export, batch processing, settings, diagnostics, and model management.

## Redesign status

The active shell and workspaces now use the semantic token layer, compact command surfaces, and the shared dialog/empty-state/progress primitives. The remaining legacy CSS and dormant duplicate components are retained for compatibility while active routes are verified.

## Design principles

1. Content first: media, captions, timeline, and controls are the primary visual hierarchy.
2. Neutral by default: blue is reserved for selection, focus, and primary commands.
3. Dense but breathable: use 4/8/12/16/24 spacing and compact 32px controls.
4. Functional grouping: panels and rows communicate relationships, not decoration.
5. Stable motion: 120–180ms state transitions only; no bounce, glow, or decorative animation.
6. Keyboard first: visible focus, native tab order, contextual shortcuts, and Escape behavior.
7. Truthful status: display actual model, media, timing, dirty, progress, and error state.
8. Preserve workflows: redesign layers must not bypass the existing project/store/action contracts.

## Target shell

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Vaani Studio  v0.1.0   Project name · Unsaved       Shortcuts Guide  │
├──────────────────────────────────────────────────────────────────────┤
│ Projects   Editor   Subtitles   Style   Settings     Generate  Export │
├──────────────────────────────────────────────────────────────────────┤
│ Active workspace                                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Ready · Media · Subtitles · Model · Performance                    │
└──────────────────────────────────────────────────────────────────────┘
```

- Title bar: 38px, quiet project identity and window controls.
- Navigation: 42px, text-first tabs with a 2px active indicator.
- Workspace: fills available height; no marketing hero area.
- Status bar: 26–28px, compact factual readouts.

## Page composition

### Projects

Use a constrained 960–1120px content column:

- Section title and one short task description.
- Primary `Import Media`, secondary `New Project`, tertiary `Open Project`.
- Recent projects table with name, media, modified date, duration, subtitle count, and actions.
- Compact empty state with one useful next action.

### Editor

Retain the workstation layout:

```text
Toolbar
┌──────────────┬──────────────────────────────┬──────────────┐
│ Subtitle list│       Video / audio preview  │ Inspector    │
│              ├──────────────────────────────┤              │
│              │       Waveform + subtitles   │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

The center preview remains the visual focus. At compact widths, side panels remain explicitly reachable through the editor toolbar; hiding a panel expands the center stage instead of removing its only recovery path.

### Subtitles

Use a dense caption table with sticky identity/time columns, inline text and timecode editing, keyboard navigation, and an overflow action group. Search and replace should be a compact drawer, not a second decorative card.

### Style

Use a compact preset browser, one canonical preview, and a property inspector. Presets are rows with small previews, not large showcase cards. Typography, color, position, and karaoke controls use consistent compact fields.

### Settings

Use a conventional desktop settings layout: category navigation on the left, one readable settings column in the center, and contextual diagnostics only where needed. Remove the permanent help/status rail. Settings that are not wired to persisted state must be removed, disabled, or labeled as informational.

### Onboarding

Use one optional five-step first-run flow at approximately 760×500:

1. Getting started
2. Workspace
3. Generate subtitles
4. Edit and style
5. Ready

Keep it task-oriented, local, and reversible. The technical hardware scan belongs in Settings or an advanced step. The tour must use the same dialog primitive, focus handling, and visual tokens as every other dialog.

## Interaction rules

- Primary: one solid accent action per context.
- Secondary: dark surface plus border.
- Tertiary: text or icon-only with tooltip.
- Destructive actions require a clear danger treatment and confirmation where irreversible.
- Loading states show determinate progress, current stage, and cancellation.
- Empty states state what is missing and provide one relevant action.
- Status text must be factual and selectable where paths or diagnostics are shown.
- All clickable cards become buttons, radio groups, or checkboxes.
- Modal content supports Escape, focus containment/restoration, and reduced motion.

## Implementation phases

1. Tokens, reset, shell, and shared primitives.
2. Title bar, navigation, status bar.
3. Projects and empty states.
4. Editor, preview, timeline, and inspector.
5. Subtitles and Style.
6. Export and Settings.
7. Onboarding, dialogs, progress, and accessibility.
8. Responsive verification and regression cleanup.

## Acceptance criteria

- No active screen reads as a marketing page or card dashboard.
- Dark and light themes use semantic tokens consistently.
- 1280×720, 1366×768, 1600×900, 1920×1080, and 2560×1440 remain usable.
- 1024×700 minimum window keeps all important panels reachable.
- Existing workflows and IPC contracts remain intact.
- Keyboard focus, shortcuts, progress, cancellation, dirty state, and errors are visible and truthful.
- `npm run typecheck`, `npm test`, and `npm run build` pass.
