# Travel AI Automation Platform Design System

## 1. Atmosphere & Identity

An evidence-first technical field guide: calm enough to inspect, precise enough to trust, and open about unfinished production work. The signature is a cyan pipeline crossing a deep navy field, connecting a signed Kakao event to a CRM-ready lead without decorative product claims.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface/base | `--surface-base` | `#f4f7fb` | Page background |
| Surface/primary | `--surface-primary` | `#ffffff` | Reading surfaces |
| Surface/navy | `--surface-navy` | `#07152e` | Hero and terminal |
| Surface/navy-raised | `--surface-navy-raised` | `#102446` | Pipeline nodes |
| Text/primary | `--text-primary` | `#12213b` | Headings and body |
| Text/secondary | `--text-secondary` | `#53627a` | Supporting copy |
| Text/on-dark | `--text-on-dark` | `#f7fbff` | Hero content |
| Text/on-dark-muted | `--text-on-dark-muted` | `#b7c9e8` | Hero supporting copy |
| Border/default | `--border-default` | `#d8e1ee` | Structural borders |
| Border/dark | `--border-dark` | `#294568` | Dark surface borders |
| Accent/cyan | `--accent-cyan` | `#42d4e8` | Primary actions and flow |
| Accent/cyan-strong | `--accent-cyan-strong` | `#08758a` | Light-surface labels, hover, and focus |
| Accent/coral | `--accent-coral` | `#ff785f` | One warm evidence marker |
| Status/success | `--status-success` | `#167d5a` | Verified status |
| Status/caution | `--status-caution` | `#a85b00` | Explicit limitations |

### Rules

- Navy establishes the technical trust boundary; white surfaces hold evidence and instructions.
- Cyan marks actions, links, and the implemented pipeline. Coral appears only as a small attention marker.
- No new color enters CSS before it is documented here.

## 3. Typography

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `clamp(2.5rem, 6vw, 4.5rem)` | 760 | 0.98 | `-0.055em` | Hero |
| H1 | `clamp(2rem, 4vw, 3.5rem)` | 740 | 1.04 | `-0.045em` | Major sections |
| H2 | `clamp(1.5rem, 3vw, 2.25rem)` | 720 | 1.14 | `-0.035em` | Section headings |
| H3 | `1.125rem` | 700 | 1.35 | `-0.015em` | Evidence items |
| Body/large | `1.125rem` | 450 | 1.7 | `-0.01em` | Lead copy |
| Body | `1rem` | 450 | 1.65 | `0` | Default text |
| Body/small | `0.875rem` | 520 | 1.55 | `0` | Supporting metadata |
| Label | `0.75rem` | 720 | 1.4 | `0.09em` | Section labels |
| Mono | `0.875rem` | 520 | 1.65 | `0` | Commands and API paths |

### Font stack

- Primary: `"Pretendard", "Noto Sans KR", "Segoe UI", system-ui, sans-serif`
- Mono: `"SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace`

### Rules

- Keep body measures below 68 characters where practical.
- Use `text-wrap: balance` for headings and `text-wrap: pretty` for paragraphs.
- Korean copy uses `word-break: keep-all`; technical identifiers may wrap.

## 4. Spacing & Layout

### Base unit

All spacing derives from 4 px.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | `0.25rem` | Fine offsets |
| `--space-2` | `0.5rem` | Inline groups |
| `--space-3` | `0.75rem` | Compact padding |
| `--space-4` | `1rem` | Standard gap |
| `--space-5` | `1.25rem` | Button padding |
| `--space-6` | `1.5rem` | Panel padding |
| `--space-8` | `2rem` | Component separation |
| `--space-10` | `2.5rem` | Section interiors |
| `--space-12` | `3rem` | Section spacing |
| `--space-16` | `4rem` | Page rhythm |
| `--space-20` | `5rem` | Large section rhythm |
| `--space-24` | `6rem` | Desktop hero rhythm |

Supporting tokens:

- Radius: `--radius-small` (`0.5rem`), `--radius-medium` (`1rem`), and `--radius-large` (`1.5rem`).
- Content width: `--content-width` (`76rem`).

### Grid

- Max content width: `76rem`.
- Desktop: 12 conceptual columns with `2rem` gutters.
- Tablet at 768 px: stacked hero and two-column evidence where space permits.
- Mobile at 375 px: one column, `1rem` edge space, no horizontal scrolling.

## 5. Components

### Site navigation

- **Structure**: brand link, three anchor links, GitHub link.
- **States**: default, hover underline, active press, visible focus.
- **Accessibility**: labelled navigation, adequate target size, natural tab order.
- **Motion**: color and transform only, 160 ms.

### Action link

- **Variants**: cyan primary, dark outline, text link.
- **States**: default, hover lift, active press, focus ring.
- **Accessibility**: action text names the destination; no dead links.
- **Motion**: transform and color only, 160 ms.

### Pipeline

- **Structure**: ordered live-text nodes connected by decorative lines.
- **Variants**: source, boundary, storage, output.
- **States**: static; it is explanatory content, not an interactive control.
- **Accessibility**: ordered list preserves meaning without the visual connectors.

### Evidence item

- **Structure**: status marker, heading, concise evidence, direct source link.
- **Variants**: verified and limitation.
- **States**: linked heading has hover, active, and focus states.
- **Accessibility**: status is written in text, not encoded only by color.

### Command block

- **Structure**: label, shell command, expected outcome.
- **States**: selectable text; no fake copy control.
- **Accessibility**: commands remain readable at 200% zoom and wrap on narrow screens.

### Adoption callout

- **Structure**: honest current count, qualification rule, template and discussion actions.
- **Variants**: empty-state until independent reports exist.
- **Accessibility**: no metric is communicated only by size or color.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 120 ms | `ease-out` | Active press |
| Standard | 160 ms | `ease-out` | Hover and focus affordance |
| Emphasis | 420 ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Initial hero pipeline reveal only |

- Animate only `transform` and `opacity`.
- Disable the initial reveal when `prefers-reduced-motion: reduce` is active.
- Smooth anchor scrolling is allowed only when reduced motion is not requested.

## 7. Depth & Surface

The strategy is mixed: tonal shifts establish most hierarchy, one border separates evidence surfaces, and shadows are limited to the hero’s pipeline object and the adoption callout.

| Level | Token | Usage |
| --- | --- | --- |
| Inset | `--shadow-inset` | Pipeline node rim |
| Raised | `--shadow-raised` | Pipeline focal object |
| Callout | `--shadow-callout` | Adoption callout |

No generic shadow is applied to every card. Depth must communicate either an executable path or a decision point.
