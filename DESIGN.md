# Travel AI Automation Platform Design System

## 1. Atmosphere & Identity

A calm operations cockpit for travel teams that need to trust parsed customer messages quickly. The signature is route-context clarity: a real destination image anchors the scenario, while compact operational surfaces show exactly how Kakao messages become CRM customers and booking leads.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| Surface/primary | --surface-primary | #f7faf8 | #101715 | Page background |
| Surface/secondary | --surface-secondary | #eef5f0 | #16211e | Destination and flow bands |
| Surface/elevated | --surface-elevated | #ffffff | #1f2b27 | Cards, panels |
| Text/primary | --text-primary | #17211d | #f3fbf6 | Headlines, body |
| Text/secondary | --text-secondary | #596a61 | #afbeb6 | Captions, hints |
| Border/default | --border-default | #cfddd4 | #31413a | Cards, dividers |
| Accent/primary | --accent-primary | #c6572f | #ff8a5f | CTAs, links, focus |
| Accent/hover | --accent-hover | #9f4122 | #ffad8f | CTA hover |
| Status/success | --status-success | #2f7d57 | #5fd08f | Verified handoff |
| Status/info | --status-info | #2f6f65 | #61c7b6 | Operational metadata |
| Hero/text | --hero-text | #ffffff | #ffffff | Text over destination image |
| Hero/muted | --hero-muted | #dff3e8 | #dff3e8 | Hero metadata text |
| Hero/overlay strong | --hero-overlay-strong | rgba(9, 18, 15, 0.78) | rgba(9, 18, 15, 0.78) | Left image scrim |
| Hero/overlay soft | --hero-overlay-soft | rgba(9, 18, 15, 0.36) | rgba(9, 18, 15, 0.36) | Right image scrim |

### Rules

- Destination imagery uses a dark overlay, never decorative gradients alone.
- Accent is reserved for CTAs, test badges, and the active Yangzhou scenario.
- New colors must be added here before use.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | clamp(2.25rem, 6vw, 4.5rem) | 800 | 1.08 | 0 | Hero |
| H1 | clamp(1.8rem, 3vw, 2.4rem) | 800 | 1.2 | 0 | Section headers |
| H2 | 1.35rem | 800 | 1.35 | 0 | Card titles |
| Body/lg | 1.08rem | 500 | 1.65 | 0 | Lead paragraphs |
| Body | 1rem | 400 | 1.65 | 0 | Default text |
| Body/sm | 0.92rem | 500 | 1.5 | 0 | Metadata |

### Font Stack

- Primary: Pretendard, Noto Sans KR, system-ui, sans-serif
- Mono: SFMono-Regular, Consolas, Liberation Mono, monospace

### Rules

- Letter spacing stays 0 across UI text.
- Body text stays at 14px or larger.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
| --- | --- | --- |
| --space-2 | 8px | Compact inline spacing |
| --space-3 | 12px | Small controls |
| --space-4 | 16px | Standard content gap |
| --space-5 | 20px | Section inner spacing |
| --space-6 | 24px | Card padding |
| --space-8 | 32px | Grid gaps |
| --space-12 | 48px | Section margins |
| --space-16 | 64px | Hero padding |

### Grid

- Max content width: 1120px
- Breakpoints: mobile under 680px, desktop above 960px
- Cards use an 8px radius.

### Rules

- Page sections are full-width bands or unframed layouts.
- Repeated operational items may use cards; no cards inside cards.

## 5. Components

### Module Card

- Structure: `article` with heading, concise role text, and stack metadata.
- Variants: default.
- Spacing: `--space-5`.
- States: hover lifts via border color only.
- Accessibility: text remains visible without color dependency.

### Test Scenario Panel

- Structure: destination copy, message sample, expected outputs.
- Variants: Yangzhou MVP.
- Spacing: `--space-6`.
- Accessibility: sample text uses semantic headings and code blocks.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 140ms | ease-out | Link and CTA hover |

### Rules

- Only transform and opacity may animate.
- Every link and CTA has hover and focus states.
- Respect `prefers-reduced-motion`.

## 7. Depth & Surface

### Strategy

Mixed: borders for operational surfaces, a single soft shadow for destination and scenario panels.

| Level | Value | Usage |
| --- | --- | --- |
| Subtle | --shadow-subtle: 0 12px 32px rgba(23, 33, 29, 0.08) | Scenario and module cards |
| Default border | 1px solid var(--border-default) | Cards, dividers |
