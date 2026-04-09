# Problems & Solutions Log

A record of non-obvious issues encountered during development of the KMS website, and how they were resolved.

---

## 2026-04-09 — ElevenLabs voice chatbot booking flow: Calendly confirmation not detected; call not ending

**Problem:** After a user completed a Calendly booking, the chatbot didn't detect it, didn't show the confirmation message, and didn't end the call. When the user verbally said they'd booked, the agent had no way to act on it either.

**Root cause:** Three layered issues. (1) Calendly may send `postMessage` data as a JSON string rather than an object, so `e.data.event` was `undefined` and the `'calendly.event_scheduled'` check silently failed every time. (2) There was no client tool for the agent to call when the user verbally reported completing their booking. (3) Earlier attempts used `sendContextualUpdate` to trigger agent speech on booking confirmation, but this method injects silent context — it doesn't reliably trigger the agent to speak; only `sendUserMessage` or resolving a pending tool Promise does.

**Fix:** Updated `onCalendlyMsg` to parse `e.data` as JSON when it arrives as a string before checking the event type. Extracted a shared `confirmBooking()` function called by both the Calendly listener and a new `end_call` client tool. The `end_call` tool lets the agent end the session when the user verbally confirms they've booked. Added `suppressNextUserMsg` flag to hide the injected `sendUserMessage("Booking confirmed.")` from the transcript.

**Lesson:** Always normalise Calendly `postMessage` data with `typeof e.data === 'string' ? JSON.parse(e.data) : e.data` before reading properties — the format varies. `sendContextualUpdate` is silent context only; use `sendUserMessage` to reliably trigger agent speech. For any post-booking action the user might trigger verbally, add a dedicated client tool rather than relying on the agent's system prompt alone.

## 2026-04-09 — sendContextualUpdate on Calendly open triggered premature booking confirmation

**Problem:** Adding a `sendContextualUpdate` call immediately after `openCalendly()` caused the agent to respond with the booking confirmation message before any booking had been made.

**Root cause:** The `sendContextualUpdate` payload included language about the booking calendar and waiting for confirmation, which the agent misinterpreted as a booking completion event. Combined with a still-pending tool Promise, the agent's response was unpredictable.

**Fix:** Removed `sendContextualUpdate` from the Calendly-open path entirely. The tool now resolves immediately with a return string instructing the agent to say "if you have any questions just ask" — this is the only reliable way to trigger speech while keeping the flow clean. The Calendly listener runs independently in the background.

**Lesson:** Don't use `sendContextualUpdate` to trigger speech at the moment Calendly opens — the agent can misread the context. Resolve the tool immediately with explicit speech instructions instead, and handle the Calendly confirmation separately via a `window.message` listener.

## 2026-04-06 — ElevenLabs chatbot stuck on loading spinner; mic not released on close

**Problem:** Clicking "Start Voice Chat" granted microphone permission but the loading spinner never cleared and the chat never connected. Closing the panel left the browser microphone indicator (red tab light) active.

**Root cause:** Two separate bugs. First, the SDK package in `sdkUrl` was `@elevenlabs/client` (ElevenLabs' general REST API wrapper) instead of `@11labs/client` (the Conversational AI SDK) — `startSession()` exists in both but hangs indefinitely in the wrong package. Second, `closePanel()` only called `endSession()` when `sessionActive` was true; closing during the loading phase left `sessionActive = false` so no cleanup ran and the mic stream stayed alive.

**Fix:** Changed `sdkUrl` to `https://cdn.jsdelivr.net/npm/@11labs/client/+esm`. Added a `sessionAborted` flag — set on `closePanel()`, checked after `startSession()` resolves to immediately call `endSession()` if the user closed mid-connect. Added a 15-second `Promise.race` timeout so the spinner always clears if connection fails.

**Lesson:** ElevenLabs has two distinct npm packages — `@elevenlabs/client` (general API) and `@11labs/client` (Conversational AI SDK). Only `@11labs/client` exports a working `Conversation.startSession()`. When building cleanup for async connection flows, always handle the case where the user cancels before the Promise resolves — `sessionActive` will still be false, so guard flags or post-resolve checks are needed to trigger teardown.

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
