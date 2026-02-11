# RETAIN Dashboard Design System (2025–2026)

SaaS admin-panel oriented. Built for consistency, scalability, accessibility (WCAG AA), dark/light modes, and fast scanning (<5s insight time).

---

## 1. Foundations / Tokens

### Spacing Grid (8pt system)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps, icon padding |
| `--space-sm` | 8px | Internal element gap |
| `--space-1_5` | 12px | Compact density |
| `--space-md` | 16px | Default gap, card internal |
| `--space-2_5` | 20px | Card padding sweet spot |
| `--space-lg` | 24px | Card padding, widget gap |
| `--space-xl` | 32px | Section gaps |
| `--space-2xl` | 40px | Large spacing |
| `--space-xxl` | 48px | Section gutters |
| `--space-3xl`–`7xl` | 56–128px | Major section gutters |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, chips, badges |
| `--radius-md` | 10px | Cards, modals, inputs |
| `--radius-lg` | 12px | Dialogs, panels |
| `--radius-xl` | 16px | Large panels |
| `--radius-2xl` | 20px | Big dialogs |
| `--radius-pill` | 9999px | Pills/capsules |

### Shadows / Elevation

| Level | Token | Usage |
|-------|-------|-------|
| Flat | `--shadow-none` | No elevation |
| Subtle | `--shadow-xs` | Resting state |
| Card | `--shadow-sm` | Cards, surfaces |
| Hover | `--shadow-md` | Hover / active |
| Modal | `--shadow-lg` | Modals, dropdowns |
| Overlay | `--shadow-overlay` | Overlays + backdrop |

### Icons

- **Base size**: 16px
- **Scale**: 12px (dense), 18–20px (nav/actions), 24px (buttons), 32px (empty/hero), 48px (KPI)
- **Stroke**: 1.75px default, 1.5px (thin), 2px (bold)
- **Set**: Lucide React (stroke-based, consistent weight)

---

## 2. Typography

### Font Family

| Token | Value |
|-------|-------|
| `--font-sans` | `'Inter', -apple-system, sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` |

### Type Scale (fluid via `clamp()`)

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 11–12px | Axis labels, helpers |
| `--text-sm` | 13px | Secondary text |
| `--text-base` | 14–15px | Body, labels |
| `--text-lg` | 16–18px | Table heads, subtitles |
| `--text-xl` | 20–24px | Section titles |
| `--text-2xl` | 28–32px | Card hero metrics |
| `--text-3xl` | 36–44px | Main KPI |
| `--text-display` | 48–72px | Single-number views |

### Font Weights (3 max)

| Weight | Usage |
|--------|-------|
| 400 Regular | Body, labels |
| 500 Medium | Subheaders, table heads |
| 600 Semibold | Card titles, metrics |

**Line height**: Body 1.45–1.6, Headings 1.2–1.3

---

## 3. Color System

### Neutrals (Warm)

| Token | Light | Dark |
|-------|-------|------|
| Background | `#F7F6F3` | `#0C0C0D` |
| Foreground | `#1A1A1A` | `#FAFAF9` |
| Card | `#FFFFFF` | `#18181B` |
| Muted | `#F5F3F0` | `#27272A` |
| Muted FG | `#78716C` | `#A1A1AA` |
| Border | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |

### Semantic / Status

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#10b981` | Positive, booked |
| `--warning` | `#f59e0b` | In-progress, caution |
| `--destructive` | `#ef4444` | Errors, danger |
| `--info` | `#3b82f6` | Info, AI actions |

### Chart Palette (7-color qualitative)

`#18181B` · `#3b82f6` · `#10b981` · `#f59e0b` · `#8b5cf6` · `#ef4444` · `#71717A`

**Contrast**: WCAG AA (4.5:1 text), AAA target for large text.

---

## 4. Component Defaults

### Buttons

| Size | Height | H-Padding | Radius |
|------|--------|-----------|--------|
| sm | 32–36px | 12px | 8px |
| md | 40px | 16px | 8–10px |
| lg | 48–52px | 20px | 10px |

**Variants**: primary (filled), secondary (outline), destructive, ghost, link
**Icon spacing**: 8px from text

### Inputs / Forms

- Height: 40–48px
- Padding: 10–12px horizontal
- Focus: 2px ring `primary/500` + offset 0

### Cards

- Padding: 20–24px
- Radius: 12–16px
- Header: semibold 16px + 16px bottom margin
- Footer: subtle border-top + 16px padding

### Tables

- Row height: 48–56px
- Cell padding: 12–16px horizontal
- Header: medium 14px, border-bottom

---

## 5. Layout / Structure

| Element | Value |
|---------|-------|
| Sidebar | 240–280px wide → 64–80px collapsed |
| Content padding | 24–32px |
| Max content width | 1280–1440px (centered) |
| Breakpoints | sm 640, md 768, lg 1024, xl 1280, 2xl 1536 |
| Mobile tap target | min 44×44px |
| Body font mobile | ≥15px preferred |

---

## 6. Accessibility & Polish

- **Focus**: Visible ring (2px solid + offset), not just color change
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Screen reader**: Semantic HTML + ARIA
- **Loading**: Skeleton pulse/shimmer
- **Empty state**: Large centered icon (32px) + 16–20px headline + supportive text
- **Dark mode**: Auto via `prefers-color-scheme` + manual toggle
