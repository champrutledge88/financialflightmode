# Cockpit (V1)

Installable web app at `/cockpit.html` that turns a bank CSV export into a payday plan,
analytics, and habit medals. Authorized by Mark Rutledge on 2026-10-24 with these decisions:

| Decision | Choice |
| --- | --- |
| Platform | Installable web app (Add to Home Screen on iPhone), not a native App Store app |
| Data storage | On the device only (browser `localStorage`). Nothing is transmitted to FFM or any third party |
| "AI" in V1 | Built in rules on the device: bank format detection, categorization, payday and bill detection. No cloud model |
| Bank linking | None. Manual CSV import only, consistent with the manual first direction |
| Launch exposure | Live at `/cockpit.html` once merged, `noindex`, not linked from the homepage or funnel |

This supersedes the Personalized Flight Plan spec's "no full budget storage" exclusion **only for
on-device storage**. Server-side storage of financial data remains out of scope.

## What it does

- **Import:** recognizes Chase (checking and card), Apple Card, Bank of America (checking and card),
  Capital One (card and 360), Citi, American Express, Discover, U.S. Bank, PNC, Navy Federal, Ally,
  Charles Schwab Bank, and Wells Fargo (headerless). Other banks fall back to column detection.
  The review sheet shows totals and a preview and lets the person flip signs before saving.
  Re-importing an overlapping statement skips duplicates.
- **Today:** Safe to Spend (balance minus bills due before payday minus cushion), per-day amount,
  pay cycle rings (flexible spending vs time elapsed), bills before payday, projected landing,
  Next Move, Strong Signal, Warning Lights, and the weekly review.
- **Insights:** Flight Stage (Pre Flight, Turbulence, Cruise Control, Flight Mode), Know Your Numbers,
  monthly cash flow, category breakdown, pay cycle results, bills and subscriptions, income streams,
  weekday rhythm, top merchants.
- **Activity:** search, filters, and recategorization that can teach a rule for a merchant.
- **Medals:** 10 medals with bronze, silver, and gold tiers based on history and habits
  (imports, logbook length, green months, keep rate, fee free months, pay cycles, weekly review streak,
  subscription audits, accounts, category rules).
- **Settings:** accounts, balance and cushion, rules, bank export guide, install help, backup export
  and restore, and erase all.

## Code map

- `src/cockpit/` pure modules: `csv.js`, `bankFormats.js`, `categorize.js`, `insights.js`, `medals.js`,
  `store.js`, `sampleData.js`, `dates.js`, `format.js`; UI in `app.js`, `charts.js`, `icons.js`, `cockpit.css`.
- `cockpit.html`, `manifest.webmanifest`, `cockpit-sw.js` (offline cache scoped to `/cockpit`), `assets/app/` icons.
- Tests: `src/cockpit/cockpit.test.js` (`npm test`), including a check that customer facing copy has no dash characters.

## Known limits and open items

- Bank formats were built from published and commonly observed export layouts, not from real files
  from each bank. Validate with real exports from pilot users before claiming support publicly.
- Browser storage can be cleared by the person or by Safari for sites not added to the Home Screen.
  Backup export exists; there is no sync across devices by design.
- No usage analytics are fired from Cockpit, so product usage is currently **Unknown**. Adding
  privacy-safe events (no financial values) is a founder decision.
- Name "Cockpit" is a working name pending founder confirmation.
