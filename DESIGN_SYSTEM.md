# RETAIN Design System

## Design Principles
- **Consistency**: Predefined styles reduce cognitive load
- **Hierarchy**: Size, color, spacing guide attention
- **Simplicity**: Prioritize whitespace for a "light" feel
- **Responsiveness**: Breakpoints at 480px, 768px, 1024px, 1440px+
- **Accessibility**: WCAG 2.1 AA compliance

---

## Color Palette

### Primary
| Token | Value | Usage |
|-------|-------|-------|
| Brand Primary | `#000000` | Text, headings, charts |
| Brand Accent | `#F5F5F5` | Background panels |
| Success | `#4CAF50` | Positive metrics |
| Warning | `#FFC107` | In-progress items |
| Error | `#F44336` | Alerts |

### Secondary
| Token | Value | Usage |
|-------|-------|-------|
| Highlight | `#2196F3` | Links, active states |
| Muted | `#9E9E9E` | Secondary text, borders |
| Background | `#FFFFFF` | Cards, main content |
| Sidebar | `#FAFAFA` | Side navigation |

### Grayscale
`#000000` → `#333333` → `#666666` → `#CCCCCC` → `#EEEEEE` → `#FFFFFF`

---

## Typography

**Font**: `'Inter', -apple-system, sans-serif`

| Element | Size | Weight |
|---------|------|--------|
| H1 | 2rem (32px) | 700 |
| H2 | 1.5rem (24px) | 700 |
| H3 | 1.25rem (20px) | 600 |
| Body | 1rem (16px) | 400 |
| Small | 0.875rem (14px) | 400 |
| Micro | 0.75rem (12px) | 400 |
| Metrics | 2.5rem (40px) | 700 |

**Line Heights**: Headings 1.2, Body 1.5

---

## Spacing (8px Grid)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| xxl | 48px |

**Grid**: 12 columns, 16px gutters, max 1440px container

---

## Components

### Buttons
- **Primary**: Black bg, white text, 4px radius, 8px 16px padding
- **Secondary**: White bg, black border
- **Hover**: Opacity 0.9, subtle shadow

### Cards
- White bg, 1px #CCCCCC border, 8px radius
- 16px padding
- Shadow on hover: `0 1px 3px rgba(0,0,0,0.1)`

### Navigation
- **Sidebar**: 240px fixed, #FAFAFA background
- **Icons**: 16-24px, muted gray

### Charts
- Grayscale bars #000000 → #666666
- Circular gauges with accent colors
