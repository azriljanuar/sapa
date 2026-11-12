# SAPA Design System Specification

> Reference Architecture: [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
> Framework: Next.js 16 + Tailwind CSS v4 + shadcn/ui (`base-nova` preset with Base UI primitives)

---

## 1. Brand & Semantic Color Tokens (OKLCH)

### Brand Identity (Emerald / Pesantren Green)
- **Primary:** `oklch(0.53 0.17 162)` (Emerald 600 - Main brand actions, active icons, brand accents)
- **Primary Foreground:** `oklch(1 0 0)` (White text on primary)
- **Focus Ring:** `oklch(0.53 0.17 162)` (Emerald focus highlight for inputs and buttons)

### Surfaces & Backgrounds
- **Background:** `oklch(0.985 0 0)` (Soft near-white dashboard background canvas)
- **Foreground:** `oklch(0.145 0 0)` (High-contrast dark charcoal text)
- **Card:** `oklch(1 0 0)` (Pure white card surfaces)
- **Card Foreground:** `oklch(0.145 0 0)` (Card primary text)
- **Popover:** `oklch(1 0 0)` (Dropdowns, menus, modals background)
- **Popover Foreground:** `oklch(0.145 0 0)` (Popover text)

### Secondary & Interactive States
- **Secondary:** `oklch(0.97 0 0)` (Subtle muted button backgrounds)
- **Secondary Foreground:** `oklch(0.205 0 0)` (Dark neutral text on secondary)
- **Muted:** `oklch(0.97 0 0)` (Subtle backgrounds, table header background, inactive tab bg)
- **Muted Foreground:** `oklch(0.556 0 0)` (Secondary label, description, table subtext)
- **Accent:** `oklch(0.97 0 0)` (Hover state background)
- **Accent Foreground:** `oklch(0.205 0 0)` (Text on accent hover)

### Feedback & State
- **Destructive:** `oklch(0.577 0.245 27.325)` (Vibrant red for destructive actions)
- **Destructive Foreground:** `oklch(0.985 0 0)` (Text on destructive buttons)
- **Border:** `oklch(0.922 0 0)` (Clean, subtle hair-line borders)
- **Input:** `oklch(0.922 0 0)` (Form input border)

### Sidebar Design Tokens
- **Sidebar Background (`--sidebar`):** `oklch(1 0 0)` (Clean white sidebar)
- **Sidebar Foreground (`--sidebar-foreground`):** `oklch(0.145 0 0)` (Default navigation text)
- **Sidebar Primary (`--sidebar-primary`):** `oklch(0.53 0.17 162)` (Active brand badge / highlight)
- **Sidebar Primary Foreground (`--sidebar-primary-foreground`):** `oklch(1 0 0)` (Text on active badge)
- **Sidebar Accent (`--sidebar-accent`):** `oklch(0.95 0.03 162)` (Subtle emerald-tinted hover/active background)
- **Sidebar Accent Foreground (`--sidebar-accent-foreground`):** `oklch(0.35 0.12 162)` (Deep emerald active text)
- **Sidebar Border (`--sidebar-border`):** `oklch(0.922 0 0)` (Sidebar dividing border)
- **Sidebar Ring (`--sidebar-ring`):** `oklch(0.53 0.17 162)` (Sidebar focus ring)

---

## 2. Typography Rules

- **Font Family (Sans):** `var(--font-sans)`, default Geist Sans / Inter / system-ui
- **Font Family (Mono):** `var(--font-geist-mono)`, monospace
- **Scale:**
  - `text-xs`: 0.75rem (12px) - Badges, breadcrumb trails, helper captions
  - `text-sm`: 0.875rem (14px) - Standard body, navigation items, table cells, form labels
  - `text-base`: 1rem (16px) - Section headers, card titles
  - `text-lg`: 1.125rem (18px) - Subheadings
  - `text-xl` to `text-2xl`: 1.25rem - 1.5rem (20px - 24px) - Main page headings, dashboard metrics
  - `text-3xl`: 1.875rem (30px) - Metric numbers, hero titles

---

## 3. Border Radius & Elevation

- **Base Radius (`--radius`):** `0.5rem` (8px)
  - `rounded-sm`: `calc(var(--radius) - 4px)` = 4px (small badges, micro indicators)
  - `rounded-md`: `calc(var(--radius) - 2px)` = 6px (inputs, small buttons)
  - `rounded-lg`: `var(--radius)` = 8px (default buttons, cards, selects)
  - `rounded-xl`: `calc(var(--radius) + 4px)` = 12px (containers, dialogs, nav items)
  - `rounded-2xl`: 16px (large modals, preview cards)

---

## 4. Spacing, Layout & Dimension Guidelines

- **Header Height:** `h-14` (56px) - Sticky top bar with search, notifications, switcher
- **Sidebar Width:**
  - Expanded: `w-64` (256px)
  - Collapsed: `w-20` (80px)
- **Page Container Padding:**
  - Mobile: `p-4`
  - Desktop: `p-6 lg:p-8`
- **Component Gap:**
  - Standard card interior gap: `gap-4`
  - Grid metrics gap: `gap-4 md:gap-6`
  - Form field gap: `space-y-4` or `gap-3`

---

## 5. Token Migration Map (From Hardcoded to Semantic)

| Legacy / Hardcoded Class | New Semantic Token Class | Usage Context |
| :--- | :--- | :--- |
| `bg-white` (sidebar) | `bg-sidebar` | Sidebar background |
| `bg-slate-50`, `bg-slate-50/50` | `bg-background` | Page background |
| `text-slate-900` | `text-foreground` | Primary text headings |
| `text-slate-600`, `text-slate-500` | `text-muted-foreground` | Secondary / subtext |
| `text-slate-400` | `text-muted-foreground/60` | Section headers ("OVERVIEW", "OTHERS") |
| `bg-emerald-50` (active nav) | `bg-sidebar-accent` | Active navigation background |
| `text-emerald-700` (active nav) | `text-sidebar-accent-foreground` | Active navigation text & icon |
| `border-slate-100`, `border-slate-200` | `border-border` / `border-sidebar-border` | Dividers & borders |
| `hover:bg-slate-50`, `hover:bg-slate-100` | `hover:bg-muted` / `hover:bg-sidebar-accent/50` | Hover interactive elements |
| `focus-visible:ring-emerald-500` | `focus-visible:ring-ring` | Focus state |
| `bg-emerald-600` (brand buttons/boxes) | `bg-primary text-primary-foreground` | Brand elements & primary buttons |
| `bg-slate-800` (user avatar) | `bg-foreground text-background` | Avatar fallbacks |
