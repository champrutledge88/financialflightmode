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

Founder feedback (2026-10-28): keep the sidebar brand lockup (FM mark plus "Cockpit" in the upper left of the
iPad and desktop layout) as is. This approves that layout element only; the product name itself is still open.

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
- **Insights, deeper (V1.1):** glass category ring with 30 day, 90 day, and 6 month views and tap to inspect;
  category drill down sheets; What Changed (everyday categories paced against a 3 month average);
  Spending Pace; Next 30 Days outlook; Keep Rate Trend; daily stats including no spend days.
- **Activity:** search, filters, and recategorization that can teach a rule for a merchant.
- **Medals:** 10 medals with bronze, silver, and gold tiers based on history and habits
  (imports, logbook length, green months, keep rate, fee free months, pay cycles, weekly review streak,
  subscription audits, accounts, category rules).
- **Medals, V1.1:** 3D coin spin on tap and a full screen celebration with confetti when a medal is earned
  (skipped under Reduce Motion).
- **Appearance:** Automatic, Light, or Dark, saved on the device.
- **Testing the import:** "Download a test CSV" produces a fictional Chase checking export that goes
  through the real file picker and import path.
- **Financial Flight Mode links:** Flight Scorecard, The Weekly Briefing, Flight Notes, Starter Kit, and X.
  No community destination exists yet, so "Join the Conversation" points to X until Mark decides.
- **Plan (V1.2):** Budgets with one-tap suggestions from the last three full months (rounded up to $10, fees
  excluded), a daily limit ("you can spend $X a day"), and On track / Watch / Over status. Bills that land once a
  month are never paced from a partial month. Goals with deposits, progress, and a projected finish date from the
  person's own deposit pace, or half of their monthly margin before any deposits exist; labeled as estimates.
- **Reports library (V1.2):** Spending by Category (month switcher and change vs the prior month), Income vs Expense,
  Subscription Insights (this year, last year, lifetime within imported history, yearly run rate), Year End
  Projection (year to date plus monthly averages), and Monthly Living Costs (with 3 and 6 month runway targets).
- **Executive layout (V1.2):** warm ambient backdrop with glass panels; on screens 1000px and wider a sidebar
  (sections plus the Reports library), two column dashboards, and centered modal sheets. On iPhone the tab bar is
  Today, Plan, Insights, Activity, Medals, with Settings behind the gear.
- **Settings:** accounts, balance and cushion, rules, bank export guide, install help, backup export
  and restore, and erase all.

## Code map

- `src/cockpit/` pure modules: `csv.js`, `bankFormats.js`, `categorize.js`, `insights.js`, `medals.js`,
  `store.js`, `sampleData.js`, `dates.js`, `format.js`, `deepInsights.js`, `planning.js`; UI in `app.js`, `charts.js`, `icons.js`, `cockpit.css`.
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
- Net Worth was considered from the reference designs but deferred: it needs asset and debt balances that
  CSV transactions do not contain, so it would require manual entry.
