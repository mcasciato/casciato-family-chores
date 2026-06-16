<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (C) 2026 Michael Casciato -->

# Skill: UI Development & Aesthetics

Use this skill whenever you need to build, edit, or style frontend elements in Chore Quest. All user interfaces must look premium, modern, and work smoothly on touchscreens (e.g., Raspberry Pi touch displays).

---

## Design Principles & Theme

Chore Quest uses curated HSL/gradient palettes and a sleek, dynamic interface. Avoid default web styles and raw primary colors.

### 1. Colors & Gradients
* **Do NOT use raw colors**: Avoid `#ff0000`, `blue`, `green`, etc.
* **Palette**: Prefer rich gradients, translucent backdrops (glassmorphism), and soft glowing shadows.
* **Theme Styling**: Use HSL values (e.g., `hsl(260, 85%, 60%)` for purple theme) to dynamically adjust lightness/saturation for hover or active states.

### 2. Touch Friendliness & Sizing
* **Minimum Tap Target**: Keep all buttons and interactive elements to a minimum of **$48\text{px} \times 48\text{px}$** for easy tapping.
* **Padding & Spacing**: Add generous margins and paddings to prevent accidental double-clicks.
* **Scrollbars**: Make scrollbars easy to interact with on touch screens or hide them completely in favor of smooth swipe/scroll containers.

### 3. Micro-Animations & Hover States
* Add smooth transitions on hover/focus states: `transition: all 0.2s ease-in-out`.
* Use scale effects on hover: `transform: scale(1.02)`.
* Include ripple/glowing effects when elements are tapped/activated.

---

## Coding Guidelines (within `client/`)

1. **Framework & Styles**: Chore Quest uses a React client inside `/client` with Vanilla CSS.
2. **Typography**: Utilize premium, legible modern typography (like Inter, Outfit, or Roboto). Avoid default serif fonts.
3. **Responsive Design**: Ensure layouts scale beautifully to typical touchscreen resolutions (e.g., $800 \times 480$ or similar small touch panels). Use flexbox and CSS grids instead of absolute pixel dimensions.
4. **No Placeholders**: Always generate complete styles; do not write TODOs or stub selectors.

---

## Mobile-First & Responsive-First Design Mentality

Since Chore Quest is frequently viewed on mobile displays and low-power touchscreens (like a Raspberry Pi screen), components must adapt to constraints gracefully rather than just shrinking. 

### Case Study: Kids Progress Table
Refer to the implementation in [KidsProgressTable.jsx](file:///Users/michaelcasciato/Documents/dev/casciato-family-chores/client/src/components/parent/KidsProgressTable.jsx) for the standard pattern:

1. **Dynamic Layout Switching**: Use window resize listeners or media queries to toggle layouts. Avoid forcing wide desktop tables (`<table>`) onto small screens.
2. **Card Layout for Mobile**: On mobile view (typically width $< 768\text{px}$), the parent dashboard collapses tabular data into stacked, self-contained `.glass-card` elements instead of a horizontal table.
3. **Collapsible Disclosures (Accordion)**: Keep long details (e.g., active quests) hidden behind easy-to-tap headers that expand or contract with CSS animations, saving vertical screen real estate.
4. **Button Footers**: Ensure buttons are full-width or split evenly (`flex: 1` or `display: grid`) across the card bottom, providing clear, easy-to-tap targets.

