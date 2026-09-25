# Vaani Studio Design System

## Visual language

The interface is a neutral technical workspace. Surfaces are dark by default, typography is compact, and accent color communicates interaction rather than branding.

## Color tokens

### Dark theme

| Token | Value | Use |
|---|---|---|
| `--vs-bg-canvas` | `#0B0D10` | Application background |
| `--vs-bg-panel` | `#11151B` | Main panels |
| `--vs-bg-panel-raised` | `#151A21` | Menus, dialogs, active rows |
| `--vs-bg-control` | `#181D24` | Inputs, segmented controls |
| `--vs-bg-input` | `#0F1217` | Text fields |
| `--vs-border-subtle` | `#252B34` | Dividers and quiet borders |
| `--vs-border-default` | `#303741` | Controls and panel edges |
| `--vs-border-strong` | `#46505D` | Hover and active edges |
| `--vs-text-primary` | `#E8ECF1` | Content and labels |
| `--vs-text-secondary` | `#929BA8` | Supporting metadata |
| `--vs-text-muted` | `#626B78` | Disabled and tertiary metadata |
| `--vs-accent` | `#3B82F6` | Focus, selection, primary action |
| `--vs-accent-hover` | `#4D8FF7` | Primary hover |
| `--vs-success` | `#35C98A` | Ready/completed state |
| `--vs-warning` | `#E6A93A` | Needs attention |
| `--vs-danger` | `#E05D68` | Error/destructive state |

Media surfaces may use `#050608` regardless of theme because the video canvas is a content surface, not a panel.

### Light theme

Use the same semantic names with neutral light surfaces (`#F5F7F9`, `#FFFFFF`, `#E9EDF1`) and dark text (`#18202A`, `#53606D`, `#7A8592`). Media surfaces remain dark. Accent and semantic colors retain their hue but use darker values for contrast.

## Typography

- UI: `Inter, "Segoe UI", sans-serif`
- Monospace/timecode: `"Cascadia Mono", Consolas, monospace`
- Body/control: 12–13px
- Metadata: 11px minimum
- Section heading: 15–18px
- Dialog heading: 18–20px maximum
- Avoid 22px+ headings inside the workbench.

## Spacing

Use the 4px scale: 4, 8, 12, 16, 24, 32. Prefer 8px between controls and 12–16px between groups. Do not use arbitrary large gaps to fill the viewport.

## Geometry

- Inputs/select/button: 32px standard, 28px compact.
- Toolbar: 36–40px.
- Panel title/header: 36px.
- Dialog radius: 6px.
- Control radius: 3–4px.
- Panel radius: 0–2px.
- Pills are reserved for status/count indicators.

## Elevation

- Panels use borders, not shadows.
- Dialogs use one subtle shadow.
- No glow, glass blur, or gradient surfaces.
- Hover is a border/surface change before it is a color change.

## Shared components

### Button

`primary`: solid accent, used once per context.
`secondary`: panel surface plus default border.
`tertiary`: transparent/text action.
`danger`: semantic danger treatment.

All buttons expose a real `<button>`, disabled state, keyboard focus, and a tooltip for icon-only actions.

### Field

32px height, 3px radius, explicit label, visible focus ring, and a compact unit suffix where useful. Paths and diagnostic text remain selectable.

### Tabs

Text-first tabs with a 2px bottom indicator. Use `aria-selected` and keyboard navigation.

### Panel

A titled region with a quiet header, 1px border, and scrollable body. Panels are not automatically elevated cards.

### Table

Compact header, 32–36px rows, sticky identity/time columns where useful, horizontal scrolling at compact widths, and a clear selected row.

### EmptyState

Short title, one sentence, one relevant action. No illustration is required.

### Progress

Determinate bar with stage label, percentage, elapsed/ETA when available, and cancel action. Progress must expose an accessible status.

### Dialog

Shared backdrop, `role="dialog"`, `aria-modal`, title, close control, Escape support, focus containment/restoration, and a scrollable body.

## Responsive rules

- `>= 1440px`: full three-panel layouts.
- `1200–1439px`: narrower side panels and reduced preview padding.
- `1024–1199px`: use narrower inline side panels and explicit toolbar toggles; never hide the only inspector recovery action.
- `< 1024px`: unsupported for the desktop editor; show a compact notice rather than collapsing critical controls.
- `max-height: 800px`: reduce preview chrome and vertical padding, not information density.

## Accessibility

- Maintain WCAG AA contrast for text and controls.
- Never rely on color alone for selection, warnings, or errors.
- Use semantic buttons, inputs, labels, tables, and dialogs.
- Keep focus visible and restore it after dialogs.
- Respect `prefers-reduced-motion`.
- Allow text selection in diagnostics, paths, and editable fields.
