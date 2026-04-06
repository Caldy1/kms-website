# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing website for KMS (AI automation services company) hosted on Netlify at `kms-ai.co.uk`. No build step — files are published directly. No package.json, no Node dependencies, no framework.

## Deployment

- **Auto-deploy:** Push to `main` branch triggers GitHub Actions → Netlify deploy
- **Secrets required:** `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` (configured in GitHub repo settings)
- **Config:** `.github/workflows/deploy.yml`, `.netlify/netlify.toml`

There are no local dev commands. Open `index.html` directly in a browser to preview.

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Single-page site — all content and section markup |
| `styles.css` | All styles (~1,330 lines, heavily commented sections) |
| `script.js` | All JS behavior (~220 lines, vanilla ES6+) |
| `Company_Logo/` | Logo assets (white + transparent variants) |
| `PROBLEMS_AND_SOLUTIONS.md` | Dev troubleshooting log — check before investigating bugs |

## CSS Architecture

Styles are organized in clearly labeled comment blocks. Modify within the relevant section.

**CSS custom properties** are defined in `:root` at the top of `styles.css`:
- Colors: `--bg-dark`, `--teal-light`, `--teal-mid`, `--teal-deep`, `--gold`, `--text-primary`, etc.
- Layout: `--max-width: 1200px`, `--section-pad: 110px`, `--radius`, `--radius-lg`
- Motion: `--ease`, `--transition`

**Responsive breakpoints** (mobile-first, overrides applied at smaller sizes):
- `≤1024px` — tablet: service grid 3→2 cols, geo section stacks
- `≤768px` — mobile: nav collapses to hamburger, grids go to 1 col, hero orb opacities reduced
- `≤480px` — small mobile: hero/contact buttons go full-width column

**Hero background animation orb opacities** — these have been tuned and should not be changed without cause:
- Desktop: `orb--1: 0.715`, `orb--2: 0.234`, `orb--3: 0.091`
- Mobile override in `@media (max-width: 768px)`: `orb--1: 0.308`, `orb--2: 0.101`, `orb--3: 0.039`

## JavaScript Architecture

`script.js` is split into four self-contained sections:

1. **Scroll fade-in** — `IntersectionObserver` on `.fade-in` elements; adds `.visible` class to trigger CSS transitions. Hero elements stagger with 160ms delay.
2. **Mobile nav toggle** — `#navToggle` toggles `.open` on `#navLinks`; locks body scroll; closes on link click or Escape key.
3. **Chatbot modal** — `#chatbotBtn` opens `#chatbotModal`; overlay/Escape/close button dismiss it; aria attributes managed for accessibility.
4. **Hero canvas** — `initHeroCanvas()` draws an animated neural network (80 nodes, teal `#4AEAA5`, connections within 220px). Uses `requestAnimationFrame`.

## Page Sections (index.html)

All sections are `<section>` elements with matching IDs used for anchor nav:

`#hero` → `#services` → `#how-it-works` → `#why-kms` → `#geo` → `#contact`

Key element patterns:
- Scroll animations: add `class="fade-in"` (and `fade-in--delay-1` through `fade-in--delay-5` for stagger)
- Buttons: `.btn` + `.btn--primary` / `.btn--outline` / `.btn--ghost` + optional `.btn--large`
- Section dividers: `<div class="section-line"></div>` inside section for top border

## Design Tokens

Font: **Plus Jakarta Sans** (loaded from Google Fonts) — used for both display and body via `--font-display` / `--font-body`.

Color palette is dark teal/green (`#060F0C` base) with `#4AEAA5` teal accent and `#D4A843` gold accent.
