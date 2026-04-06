# Problems & Solutions Log

A record of non-obvious issues encountered during development of the KMS website, and how they were resolved.

---

## 2026-04-06 — Logo image not rendering after src path update

**Problem:** After updating `index.html` to reference `Company_Logo/KMS_logo_white.png`, the logo showed a broken image icon on the live site.

**Root cause:** The PNG file existed locally but had never been committed to git, so it wasn't present in the GitHub repo and Netlify had nothing to serve.

**Fix:** Ran `git add Company_Logo/KMS_logo_white.png` and pushed the asset separately after the HTML change was already live.

**Lesson:** When switching to a new image asset, always check `git status` to confirm the file is tracked before pushing the HTML change. New files in `Company_Logo/` (or any asset folder) are untracked by default and must be explicitly added.

## 2026-04-06 — Mobile hero background animation too bright — no media query overrides existed

**Problem:** The hero section background orbs (animated blurred gradients) appeared too bright on mobile devices, making the page feel visually overwhelming on small screens.

**Root cause:** The `styles.css` mobile media query (`@media (max-width: 768px)`) had no opacity overrides for `.hero__orb--1/2/3`, so mobile inherited the full desktop opacity values unchanged.

**Fix:** Added explicit opacity overrides for all three orbs inside the mobile media query, reducing them by 30% initially, then a further 20%. Final mobile values: `orb--1: 0.308`, `orb--2: 0.101`, `orb--3: 0.039`. Desktop values were also increased 30% to `0.715 / 0.234 / 0.091`.

**Lesson:** Whenever adjusting hero background animation brightness, always check that the mobile media query (`@media (max-width: 768px)`) has its own orb opacity overrides — desktop values are inherited by default, and the large blur radius reads much brighter on small screens where the orbs take up proportionally more of the viewport.
