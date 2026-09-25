# Vaani Studio Component Map

## Active renderer tree

```text
App
├── desktop title bar
├── workspace navigation
├── active workspace
│   ├── ProjectsView
│   ├── EditorWorkspace
│   │   ├── SubtitleBrowserPanel
│   │   ├── VideoPlayerPreview
│   │   │   └── KineticSubtitleRenderer
│   │   ├── WaveformTimeline
│   │   └── ContextualInspector
│   ├── SubtitlesWorkspace
│   ├── StyleWorkspace
│   ├── ExportWorkspace
│   └── SettingsWorkspace
├── CrashRecoveryBanner
├── GenerateSubtitlesDialog
├── TutorialDialog / first-run flow
├── HelpDialog
├── ActionableErrorModal
└── BatchQueueModal
```

All active overlays use the shared `Dialog` primitive where a modal workflow exists. `ExportConfirmationModal`, `ActionableErrorModal`, and `BatchQueueModal` remain named components but are presentation surfaces over the shared primitive.

## State ownership

| State | Owner | Redesign constraint |
|---|---|---|
| Project, media, events, style, dirty/save state | `projectStore` | Never replace with page-local copies |
| Active tab, theme, panel dimensions, modal flags | `uiStore` | Persist only intentional UI preferences |
| Playback, model catalog, transcription progress, history | `App` | Keep callbacks and media clock contract |
| Subtitle edits and undo/redo | `App` + `editorOperations` | Route all edits through `commitEvents` |
| Timeline zoom/drag | `WaveformTimeline` | Preserve pointer and trim semantics |
| Settings transient UI | `SettingsWorkspace` | Remove or wire local-only controls |
| Onboarding completion | UI store + main onboarding API | Keep completion states distinct |

## Primary component responsibilities

### Shell

- `App.tsx`: global layout, title bar, navigation, status bar, overlays, and controller callbacks.
- `desktop-titlebar`: project identity, dirty state, help/theme/window controls.
- `main-nav-bar`: workspace navigation and Generate/Export commands.
- `desktop-statusbar`: factual media, subtitle, model, performance, and save state.

### Projects

- `ProjectsView.tsx`: import/open/new/sample actions and recent project browser.
- Redesign target: compact content column, one primary action, recent-project table, compact empty state.

### Editor

- `EditorWorkspace.tsx`: panel composition and resizing.
- `VideoPlayerPreview.tsx`: media element, frame clock, controls, subtitle overlay.
- `WaveformTimeline.tsx`: ruler, waveform, playhead, cue blocks, trim handles.
- `ContextualInspector.tsx`: selected event, script, style, media, and diarization properties.
- `SubtitleBrowserPanel.tsx`: compact event navigation and warnings.

### Subtitles

- `SubtitlesWorkspace.tsx`: active caption table and editing commands.
- Preserve inline text/timing/speaker editing and all App callbacks.

### Style

- `StyleWorkspace.tsx`: preset browser, canonical preview, style properties, karaoke, custom preset save.
- `PresetManager`: built-in/custom preset state and persistence.
- `KineticSubtitleRenderer`: word-level preview and stale timing fallback.

### Export

- `ExportWorkspace.tsx`: subtitle format, video render options, progress, and completion.
- `ExportConfirmationModal.tsx`: output actions.
- Preserve render job IDs, cancellation, and partial-file cleanup.

### Settings

- `SettingsWorkspace.tsx`: categories, real model/hardware controls, audio stream selection, diagnostics.
- Remove permanent help rail; move diagnostics into a category or drawer.
- Do not display local-only controls as if they were persisted.

### Dialogs

- `GenerateSubtitlesDialog.tsx`: transcription request and progress.
- `TutorialDialog.tsx`: replace the active seven-step marketing tour with the shared first-run flow or a contextual five-step guide.
- `OnboardingWizard.tsx`: dormant implementation; either mount and redesign it or retire it from the active path.
- `HelpDialog.tsx`: shortcuts and troubleshooting.
- `ActionableErrorModal.tsx`: actionable failures and diagnostics.
- `BatchQueueModal.tsx`: batch configuration, queue state, progress, cancellation.

## Shared visual primitives to introduce or consolidate

- `AppShell`
- `TopBar`
- `WorkspaceNav`
- `Panel`
- `PanelHeader`
- `Toolbar`
- `Button`
- `IconButton`
- `Field`
- `Select`
- `Slider`
- `Tabs`
- `DataTable`
- `EmptyState`
- `ProgressBar`
- `Dialog`
- `StatusBar`
- `Tooltip`

## Dormant/duplicate implementations

These files are not active in the current App tree and should not be expanded during the redesign without an explicit migration decision:

- `OnboardingWizard.tsx`
- `HardwarePerformanceModal.tsx`
- `ExportModal.tsx`
- `StylePresetStudio.tsx`
- `SubtitleListView.tsx`

## Migration order

1. Add semantic tokens and shared primitives.
2. Restyle the shell without changing callbacks.
3. Replace Projects composition.
4. Restyle Editor panels and add compact drawer affordances.
5. Normalize Subtitles and Style controls.
6. Simplify Export and Settings.
7. Consolidate onboarding/dialog behavior.
8. Remove dead selectors only after active routes and tests are stable.

## Current implementation notes

- The five-step `TutorialDialog` is the only active first-run flow.
- `recentProjectsLimit`, start page, autosave, focus mode, and generation destination are persisted in `uiStore`.
- Editor panel toggles, timeline trim handles, preview controls, and caption rows expose keyboard-accessible names and focus states.
- Unwired general/advanced settings are disabled and labeled as unavailable rather than presented as active preferences.
