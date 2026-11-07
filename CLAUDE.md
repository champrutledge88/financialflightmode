# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Financial Flight Mode is a static marketing site with a client-side financial
"Flight Score" calculator (financialflightmode.com). There is no backend,
no build step, and no package.json — every HTML file is served as-is.
Deployment is via Netlify (`netlify.toml`, `_headers`).

## Running it locally

There is no dev server or build tool configured. Serve the repo root with any
static file server, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/index.html`. There are no lint, test, or
build commands in this repo — nothing to run before a commit beyond visually
checking the page(s) you touched.

## Architecture

- **`index.html`** — the main landing page: hero, the scorecard form, results
  panel, email opt-in ("Starter Kit"), FAQ/how-it-works, legal disclaimer.
- **`ffm-scorecard.html`** — a near-duplicate of `index.html` (same 467
  lines, same markup/IDs) that exists only to give the scorecard its own
  canonical URL/OG tags for SEO (`/ffm-scorecard.html` vs `/`). **When you
  edit the scorecard markup, form, or copy in `index.html`, mirror the
  change in `ffm-scorecard.html`** (everything except the `<link rel=canonical>`,
  `og:url`, and JSON-LD `@id`/`url` values, which intentionally differ).
- **`thank-you.html`** / **`thank-you-download.html`** — `netlify.toml` force-
  rewrites `/thank-you.html` to serve `thank-you-download.html`'s content
  (200, not a redirect) so the URL stays `/thank-you.html` in the browser.
  `thank-you.html` itself is effectively unused as a distinct page; treat
  `thank-you-download.html` as the real "Starter Kit ready" page.
- **`privacy.html`, `terms.html`, `404.html`** — standalone legal/error
  pages. `404.html` inlines its own `<style>` rather than using
  `src/styles.css`.
- **`src/main.js`** — all interactive logic for the scorecard + lead-capture
  form on `index.html`/`ffm-scorecard.html`. Reads the 9 numeric inputs by
  `name`, calls `calculateFlightScore`, renders the results panel, and
  submits the email opt-in form directly to MailerLite's JSONP subscribe
  endpoint via `fetch` (no server involved). On success it fires GA4 events
  and redirects to `/thank-you.html`.
- **`src/flightScoreCalculator.js`** — the pure scoring engine, no DOM
  access. `calculateFlightScore(inputValues)` derives `cashRemaining`,
  `savingsRate`, `debtToIncome`, `emergencyFundLevel`; scores five
  categories (cash remaining, savings rate, debt pressure, emergency fund,
  investments) capped at 25/25/20/20/10 (100 total); and maps the total
  score + a couple of guardrails to one of four `STAGES`
  (`preflight` → `turbulence` → `cruise` → `flight`) via `getStage`. This is
  the single source of truth for scoring — see "Docs vs. code" below.
- **`src/analytics.js`** — lazy-initializes GA4 (`gtag`) on first import and
  exposes `trackEvent(name, params)`. All event tracking in `main.js` and
  the standalone pages goes through this module.
- **`src/styles.css`** — one global stylesheet (custom properties for
  colors: `--orange`, `--green`, `--red`, `--amber`, etc.) shared by every
  page except `404.html` and the two `thank-you*.html` pages.

### Cache-busting convention

Every `<link>`/`<script src>` that points at a `src/` file carries a
`?v=<slug>` query string (e.g. `styles.css?v=icons-orange-only-2`,
`main.js?v=stage-order-1`, `analytics.js?v=ga4-1`). There's no tooling that
generates these — when you change one of the `src/` files in a way that
needs to bust caches, bump its `?v=` slug **in every HTML file that
references it** (use `grep -rn '?v=' --include="*.html" .` to find them
all).

### Docs vs. code

`docs/scorecard/` contains methodology/SOP notes for the Flight Score
(read `docs/scorecard/README_START_HERE.md` for reading order). These docs
describe an aspirational/reference methodology and are **not always in
sync with the live code** — e.g. they describe a 4-tier "On Approach"
status band, while `flightScoreCalculator.js` actually names that stage
"Turbulence". Treat `flightScoreCalculator.js` as ground truth for current
behavior; treat the docs as the place to record *why* thresholds are what
they are and to update when you intentionally change scoring. The docs'
own validation SOP asks for a changelog-style note (version, date, reason,
files changed) whenever the scoring formula or labels change.

### Netlify config

- `netlify.toml`: disables pretty URLs, force-rewrites `/thank-you.html` →
  `/thank-you-download.html` (200), 301-redirects a legacy
  `/flight-plan-budget-system.html` URL to `/#flight-briefing-form`, and
  404s any request under `/docs/scorecard/*` (those markdown files are
  internal-only and must not be served publicly).
- `_headers`: sets `Content-Disposition: attachment` on the Starter Kit ZIP
  and disables caching on the thank-you pages.

### Third-party integrations

- **MailerLite** — email capture posts directly from the browser to a
  MailerLite JSONP subscribe endpoint built from
  `MAILERLITE_ACCOUNT_ID`/`MAILERLITE_FORM_ID` constants at the top of
  `src/main.js`. There's no MailerLite SDK; it's a raw `fetch` with a
  15s timeout.
- **Google Analytics (GA4)** — measurement ID is the `GA_MEASUREMENT_ID`
  constant in `src/analytics.js`. Key funnel events fired from `main.js`:
  `scorecard_start`, `scorecard_complete`, `briefing_view`,
  `briefing_submit_start`, `briefing_submit_success`/`_error`, `sign_up`;
  `thank_you_view` and `starter_kit_download` fire from
  `thank-you-download.html`.

## Conventions

- Plain ES modules, no bundler, no framework, no TypeScript. Keep new
  browser code dependency-free and import it with the same `?v=` pattern.
- Brand voice is an aviation/flight metaphor throughout (Pre-Flight,
  Turbulence, Cruise Control, Flight Mode, "cockpit", "runway", "co-pilot")
  — carry it through any new copy, IDs, or class names.
- The site explicitly disclaims itself as educational only, not financial/
  investment/tax/legal advice (see `privacy.html`, the calculator's
  disclaimer section, and the methodology docs) — preserve that framing in
  any new user-facing copy.
