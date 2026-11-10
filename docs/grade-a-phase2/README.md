# Grade A Phase 2 · November 10, 2026

Founder approved the Grade A definition, the newsletter name Control Tower Briefing, and the start of Phase 2 (fix known defects). Nothing here is live until this branch is merged and Netlify deploys it.

## Changes

- Brand copy: no dashes in public copy, "Pre Flight" everywhere, newsletter renamed to Control Tower Briefing (landing, scorecard, thank you, privacy). `test/brand-copy.test.mjs` now guards pages, interface copy and generated report copy.
- Speed: the 98 KB hero photo embedded in `src/styles.css` (used only by `ffm-scorecard.html`) now references the identical file. Favicons and the footer logo embedded in HTML now reference identical files in `assets/logos/`. Header and footer logos use a 280px copy (WebP 18 KB with PNG fallback) instead of the 87 KB 720px original.
- Phones get a 1000px copy of the same hero photo (41 KB). The hero photo is preloaded per screen size.
- Layout shift: the scorecard keeps its space while the guided flow is built (CSS only, `@media (scripting: enabled)`), so the example report no longer jumps.

## Verification (local, Chromium, gzip served to mimic Netlify)

| Lighthouse 12.6.1 | main | this branch |
|---|---|---|
| Mobile Performance | 82 | 99 (3 runs) |
| Mobile LCP | 3.8 s | 2.1 s |
| Mobile CLS | 0.11 | 0 |
| Desktop Performance | 99 | 100 |
| Accessibility, Best Practices, SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| Page weight | 506 KiB | 201 KiB |

- `npm test`: 85 of 85 pass, including the new brand copy test (confirmed it fails when a dash is reintroduced).
- Browser regressions (Chromium only; WebKit and Firefox are not installed in this sandbox): 8 of 11 pass on both main and this branch. `verify-release-readiness` (line 17), `verify-scorecard` (line 93) and `verify-amount-field-navigation` (line 90) fail identically on unmodified main, so they predate this change.
- Full page screenshots at 390 and 1280 match main in layout and height. Differences are limited to edited copy and logo resampling.
- Google Analytics was blocked during local runs. Production numbers remain Unknown until PageSpeed Insights is run on financialflightmode.com after deploy.

## Not changed

- The About section sentence ("financial education and lifestyle brand") is founder approved copy and awaits new approved wording.
- Two oranges are in use: #E95C03 (approved) and #FF5A00 (approved landing design). No navy or blue found. Unifying them is a founder decision.
- `ffm-scorecard.html`, `thank-you.html` and `flight-notes.html` still embed some images; they are secondary pages.
- Personalized Flight Plan spec values (for example "Month-End Reset") are unchanged; the report builder already removes their dashes before display.
