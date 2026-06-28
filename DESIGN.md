---
name: Foodize
description: Food pre-ordering platform connecting customers with local restaurants
colors:
  accent: "oklch(46% 0.12 42)"
  accent-dim: "oklch(40% 0.10 42)"
  accent-deep: "oklch(34% 0.08 42)"
  saffron: "#c9a84c"
  parchment-dark: "#C9B99A"
  walnut: "#2E2418"
  walnut-soft: "#3D3020"
  bark: "#4E3E2A"
  umber: "#5C4D38"
  dusk: "#6B5D4A"
  sand: "#8A7D6A"
  linen: "#C4B8A6"
  vellum: "#EDE5D8"
  parchment: "#F5F0E8"
  success: "oklch(56% 0.16 145)"
  warning: "oklch(62% 0.14 85)"
  error: "oklch(52% 0.14 160)"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "normal"
  title:
    fontFamily: "'Manrope', -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "'Manrope', -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'Manrope', -apple-system, sans-serif"
    fontSize: "0.64rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.06em"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.mustard}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.mustard-dim}"
  button-secondary:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.walnut}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.walnut}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.walnut}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
  restaurant-card:
    backgroundColor: "{colors.parchment}"
    rounded: "{rounded.md}"
  menu-item:
    backgroundColor: "{colors.vellum}"
    rounded: "{rounded.md}"
  tag-pill:
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  order-status-badge:
    rounded: "{rounded.xs}"
    padding: "4px 10px"
---

# Design System: Foodize

## 1. Overview

**Creative North Star: "The Hungry Almanac"**

Foodize reads like a well-worn restaurant compendium: warm paper stock, deliberate typography, a palette borrowed from spice markets and aged parchment rather than app stores. Every screen makes food look desirable before it handles logistics. The accent is mustard gold, not a call-to-action orange. The neutrals carry the warmth of linen and walnut, not the cold indifference of slate.

The light mode scene: a student on their phone at 11am, mid-campus, deciding what to order before a lecture. The interface should feel considered and calm, with just enough warmth to make the choice feel good. The dark mode scene: a vendor on a tablet during a dinner shift, scanning incoming orders in a dim kitchen. High contrast against warm-tinted dark surfaces, immediate hierarchy, no ambient noise.

This system rejects every first-reflex response for food apps: Яндекс Еда's aggressive red and discount-first hierarchy, Wolt's cold Scandinavian minimalism, Uber Eats' neon-on-dark brutalism. It rejects orange in all its forms, warm or muted, as a primary accent: orange reads as urgency and fast food, neither of which is this product's register. It also rejects the generic SaaS answer: Tailwind clones with Inter on white, card grids without personality, no editorial voice.

**Key Characteristics:**

- Mustard gold accent used sparingly; its richness signals quality, not discount
- Warm-tinted neutrals throughout: walnut near-black, parchment near-white, linen and vellum as surface layers
- Playfair Display appears only at display and headline scale; body work is Manrope's territory
- Tonal layer system (parchment → vellum → linen → sand) structures depth without shadows at rest
- Shadows reserved for floating elements: modals, drawers, FABs, cart overlays
- Motion is responsive, not choreographed: state feedback, not performance


## 2. Colors: The Almanac Palette

Warm parchment neutrals anchored by a single mustard-gold accent. No orange, no red, no cool grays. The palette reads like a well-maintained leather-bound book: rich, warm, intentional.

### Primary

- **Mustard** (`#D4A32A` / `oklch(70% 0.14 82)`): The sole action color. Used on primary buttons, active navigation states, add-to-cart controls, FAB, and interactive focus states. Deliberate, premium, editorially warm. Never used decoratively on static fills outside interactive elements.
- **Mustard Dim** (`#B88A1E` / `oklch(60% 0.12 80)`): Hover and pressed state. Never appears at rest.
- **Mustard Deep** (`#9A7218` / `oklch(50% 0.10 78)`): Active/selected states where Mustard would be too bright. Carries weight without shouting.

### Secondary

- **Saffron** (`#E8B84B` / `oklch(78% 0.13 82)`): Star ratings, quality cues, "popular" badges. Lighter and airier than mustard; signals delight, not action.
- **Parchment Dark** (`#C9B99A`): Warm mid-tone for dividers, secondary borders, subtle decorative elements. Sits between the accent family and neutral family.

### Neutral

- **Walnut** (`#2E2418`): Primary text. A near-black pulled toward warm brown — never cold, never pure black. Reads as ink on parchment.
- **Walnut Soft** (`#3D3020`): Secondary dark surface for dark mode, auth background split.
- **Bark** (`#4E3E2A`): Dark UI chrome at rest.
- **Umber** (`#5C4D38`): Supporting text in dark contexts.
- **Dusk** (`#6B5D4A`), **Sand** (`#8A7D6A`), **Linen** (`#C4B8A6`): Text-2, text-3, and muted labels respectively. Warm throughout.
- **Vellum** (`#EDE5D8`): Card backgrounds and raised surfaces. Noticeably warm, slightly off-cream.
- **Parchment** (`#F5F0E8`): Page background floor. Near-white with a clear warm-yellow tint; never cold.

### Semantic

- **Success** (`oklch(56% 0.16 145)`): Forest green. Order confirmed, verified purchase, completed states. Desaturated enough to coexist with warm neutrals without clashing.
- **Warning** (`oklch(62% 0.14 85)`): Warm amber-olive. Pre-close, limited quantity, attention-required. Adjacent to the mustard family but distinct in purpose.
- **Error** (`oklch(52% 0.14 160)`): Muted teal-green, not red. Validation failures, cancelled orders. Deliberately avoids red and orange to stay within palette rules.

### Named Rules
**The One Almanac Rule.** Mustard and its states mark at most one primary action per screen. When it appears, it is the only saturated color visible at that moment. No competing accents. Its rarity is the point.

**The No-White, No-Black Rule.** Page backgrounds are never pure `#ffffff` and text is never pure `#000000`. Parchment (`#F5F0E8`) is the floor. Walnut (`#2E2418`) is the ceiling. All surfaces and text live between them, tinted warm.

**The No-Orange, No-Red Rule.** Orange (`#ff6b35` and all its variants), red, and warm-to-hot hues in the 0–40 hue range of OKLCH are forbidden as accent or action colors. They read as urgency, fast food, and discount — none of which is this product's register.


## 3. Typography: Editorial Warmth

**Display Font:** Playfair Display (Georgia, serif)
**Body Font:** Manrope (-apple-system, BlinkMacSystemFont, sans-serif)

**Character:** Playfair Display carries the editorial register of a food publication: visible ink stress, a hint of luxury, appropriate only at headline scale. Manrope handles everything functional with geometric warmth and strong weight contrast. The pairing works because neither font competes for the same territory. Together, they read as a printed almanac that happens to be interactive.

### Hierarchy

- **Display** (800 weight, `clamp(2rem, 5vw, 3rem)`, line-height 1.15): Restaurant names at hero scale, page titles where Foodize sets the tone. Sparse use only.
- **Headline** (700 weight, `clamp(1.5rem, 3vw, 2rem)`, line-height 1.35): Section titles on the restaurant page, menu category headers. Playfair at this scale reads as curated, not overblown.
- **Title** (700 weight, `1rem`, line-height 1.35, Manrope): Card headings, order summaries, sidebar section titles. Clean, functional authority.
- **Body** (400 weight, `0.875rem`, line-height 1.55, Manrope): Menu item descriptions, order history, all paragraph text. Max line length 65ch.
- **Label** (700 weight, `0.64rem`, line-height 1.35, Manrope, `letter-spacing: 0.06em`, ALL CAPS): Navigation links, form labels, status badges, tag pills. Uppercase at this size reads as structured, not shouting.

### Named Rules
**The Serif Scarcity Rule.** Playfair Display is used for Display and Headline roles only. It never appears in body text, labels, buttons, or navigation. When it appears, it signals: this is the name of a place, or the headline of a page. Everywhere else is Manrope.

**The Scale Contract.** Font sizes follow a 1.25× ratio (0.64 / 0.75 / 0.875 / 1 / 1.25 / 1.5 / 2 / 3). No intermediate values. No `font-size: 15px`.


## 4. Elevation: Tonal Layers First

This system uses tonal layering as its primary depth language. Four warm surface levels exist on both light and dark themes: parchment (base), vellum (raised one step), linen (raised two steps), sand (raised three steps). These create hierarchy without shadows.

Shadows are reserved exclusively for floating and interactive state changes: modals, drawers, FABs, cart overlays, and hover states on interactive cards. A shadow on a static at-rest card is a failure. In dark mode, the same structure applies: walnut-soft (base), bark (raised one), umber (raised two), dusk (raised three).

### Shadow Vocabulary

- **Ambient** (`0 1px 2px rgba(46,36,24,0.06)`): Barely-there lift on small interactive tokens.
- **Structural** (`0 8px 24px rgba(46,36,24,0.08)`): Card hover states, selected states, elevated containers.
- **Floating** (`0 16px 42px rgba(46,36,24,0.12)`): Drawers, sidesheets, bottom sheets.
- **Modal** (`0 24px 64px rgba(46,36,24,0.14)`): Modal dialogs and cart overlay.
- **Mustard Glow** (`0 10px 26px rgba(212,163,42,0.24)`): Primary button hover, add-to-cart button, FAB. The only colored shadow. Warm and rich, not urgent.

### Named Rules
**The Float Rule.** Shadows are a property of motion and state, not of visual hierarchy at rest. If an element is not floating, dragging, or being interacted with, it has no shadow. Depth is communicated by surface tone.

**The Mustard Glow Exception.** The Mustard Glow shadow appears only on mustard-colored interactive elements. It does not appear on any other color or at rest.


## 5. Components

### Buttons
Warm, weighted, deliberate. Buttons feel considered without being corporate.

- **Shape:** Gently rounded (8px radius — `--r-sm`)
- **Primary:** Mustard background (`#D4A32A`), white text, 12px/20px padding, min-height 44px. Mustard Glow shadow at rest; stronger glow + Mustard Dim background on hover. Manrope title-weight label, not uppercase.
- **Hover / Focus:** Background shifts to Mustard Dim (`#B88A1E`); focus ring via `box-shadow: 0 0 0 3px rgba(212,163,42,0.22)`. No `outline`.
- **Secondary:** Parchment background, `border: 1px solid rgba(46,36,24,0.14)`, walnut text. Hover: vellum background.
- **Ghost:** Transparent background, no border, walnut text. Hover: subtle parchment tint.
- **Small variant:** 8px/12px padding, 36px min-height. Same rules.
- **Icon-only:** 40x40px square, no padding, centered icon.

### Tag Pills / Chips

- **Style:** `border-radius: 100px`, 4px/10px padding. Two contexts: cuisine-type chips on restaurant cards (semi-transparent dark background for legibility over photos) and filter chips in the menu (mustard-tinted background when active, vellum background when inactive).
- **Label:** Manrope label-scale, uppercase, `letter-spacing: 0.06em`.

### Restaurant Cards
The primary discovery unit on the home screen. Photo-forward with a dark scrim, not a standard card layout.

- **Format:** 3:2 aspect ratio. Border-radius `--r-md` (12px). Thin border (`1px solid rgba(46,36,24,0.08)`).
- **Scrim:** `linear-gradient(to top, rgba(20,14,6,0.78), rgba(20,14,6,0.32) 45%, rgba(20,14,6,0.04))`. Warmer black for the scrim — pulled toward walnut, not neutral black.
- **Photo treatment:** `filter: saturate(1.02) contrast(1.02)` — barely perceptible; keeps food photography vivid without over-processing.
- **Badges:** Status (open/closed) top-left, rating top-right. Dark semi-transparent background, warm-white border. Never block the photo.

### Menu Item Rows
- **Format:** Horizontal flex. Image 100px wide (130px for featured). Text right. Add button pinned bottom-right.
- **Border:** `1px solid rgba(46,36,24,0.08)`, radius `--r-md`.
- **Featured variant:** Slightly richer border, structural shadow, wider image. Differentiates editorially selected items.
- **Add button:** 38x38px, mustard background, `--r-sm`, Mustard Glow shadow.

### Inputs / Fields

- **Style:** `border: 1px solid rgba(46,36,24,0.14)`, parchment background, `--r-sm` radius, 14px/16px padding.
- **Focus:** Border shifts to mustard, `box-shadow: 0 0 0 3px rgba(212,163,42,0.18)`.
- **Label:** Uppercase Manrope label-scale above the field.
- **Error state:** `border-color: var(--color-error)`, error message in error-bg tinted container below.
- **Disabled:** Reduced opacity, no interaction.

### Navigation
**Desktop header:** Fixed, 64px height. Frosted parchment glass: `background: rgba(245,240,232,0.90)` (light) / `rgba(46,36,24,0.88)` (dark), `backdrop-filter: blur(18px)`. Nav links: Manrope label-scale, uppercase, inactive in sand/dusk, active in mustard with mustard-tinted background pill.

**Mobile tab bar:** Fixed bottom, 68px height. Same frosted glass treatment. Active tab: mustard icon and label, with a 2px mustard-colored top indicator. Inactive: sand/linen.

### Cart FAB
Pill shape (`border-radius: 100px`), mustard background, positioned above the bottom tab bar. Mustard Glow shadow. Badge: parchment circle with walnut-colored count. On tap, opens the cart drawer from bottom.

### Cart Drawer
Bottom sheet. Rounds the top two corners (`--r-xl`). Frosted overlay: `background: rgba(46,36,24,0.38)`, `backdrop-filter: blur(8px)`. Shadow: `0 -16px 54px rgba(46,36,24,0.18)` upward. Full-screen on mobile.

### Order Status Badges

- `border-radius: --r-xs` (6px). Uppercase Manrope label. Color by state: pending (warning/amber-olive), preparing (mustard palette), ready (success/forest-green), cancelled (error/muted-teal). Always paired with a text label, never color-only.


## 6. Do's and Don'ts

### Do:

- **Do** use tonal background layers (parchment → vellum → linen → sand) to communicate depth at rest before reaching for shadows.
- **Do** reserve Playfair Display for Display and Headline typographic roles only. In buttons, navigation, labels, and body text, use Manrope.
- **Do** use mustard as a single concentrated signal per screen. One primary action gets it. Everything else defers.
- **Do** pair every status color signal with a text or icon label. Never color alone.
- **Do** treat food photography as the primary visual asset. Restaurant cards show photos at 3:2 with a warm-dark scrim.
- **Do** keep body text to 65ch maximum line length.
- **Do** use `prefers-reduced-motion` to disable all keyframe animations.
- **Do** tint every neutral toward the warm-brown family. If a gray looks cold or blue-shifted, it does not belong in this system.

### Don't:

- **Don't** use orange (`#ff6b35` or any hue in the OKLCH 0–40 range) as an accent, action, or interactive color. Orange reads as urgency and fast food. It is prohibited in this system.
- **Don't** use red or warm-to-hot reds (OKLCH hue 0–30) anywhere in the UI. This includes error states: use the muted teal-green error color instead.
- **Don't** use cool grays or cold neutrals. If a neutral lacks a warm brown tint, it is the wrong neutral.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** use `background-clip: text` with a gradient. Emphasis through weight or size only.
- **Don't** use glassmorphism decoratively. The header and tab bar use it purposefully because they float over content.
- **Don't** make the design look like Яндекс Еда or Delivery Club: no aggressive red or orange, no discount banner hierarchy.
- **Don't** make the design look like Wolt: no cold blue palette, no clinical minimalism.
- **Don't** make the design look like Uber Eats: no dark-on-neon, no countdown-timer urgency UI.
- **Don't** produce generic SaaS output: no Tailwind-default card grids, no Inter on white, no shadow-everything layout.
- **Don't** use shadows on static, at-rest cards. A restaurant card at rest has a thin border. Shadows belong to floating elements.
- **Don't** reuse mustard for decorative fills or background tinting. Its job is to mark action.
- **Don't** nest cards. A card inside a card is always the wrong structure.
- **Don't** default to a modal. For single confirmations, inline UI or a bottom sheet is almost always better.
