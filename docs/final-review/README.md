# Scorecard final review · October 29, 2026

Preview work only. All financial values in this folder are synthetic examples. Production merge and deployment remain unapproved.

## Result and input changes

The existing nine step flow now distinguishes monthly take home income and spending from current balances. Monthly mortgage payments and minimum debt payments belong in needs; only mortgage balance is excluded from the debt balance. Savings contributions exclude existing balances and payroll retirement deductions. Essential and optional subscriptions are counted once. Unknown amounts require an estimate or a pause, never an assumed zero. Paycheck conversion retains weekly and biweekly annualization and rounds to cents.

One Flight Report replaces the legacy results, briefing and separate Personalized Flight Plan view. Results navigation points to it. The existing personalized plan engine remains authoritative for the strong signal, ranked priorities, pressure safeguards, objective tie breaks, action library, workbook route and 30 day mission. The canonical report presents that plan rather than silently retiring its behavior. Score weights and stage methodology are unchanged. The earlier phase 2 report independently promoted savings even when the approved plan ranked another category; that conflict is removed. A bounded savings amount is added only when the approved primary priority is savings or emergency runway. Extra transfers cannot exceed available cash or the savings shortfall. Zero and negative cash retain explicit cash protection.

Pressure and objective choices remain browser memory only. They may influence the existing plan when supported by the numbers, but never the score. No financial email was added. The separate email lead form and its consent wording remain unchanged; no lead submissions were made during verification.

## Privacy and saved checkpoint

Static financial inputs are hidden, have no form owner and cannot natively submit on either index.html or ffm-scorecard.html. JavaScript creates the calculation form and prevents native submission. With JavaScript disabled, the page explains why the private tool cannot run. These checks supersede the old historical evidence which accepted the unsafe fallback POST.

Download my report creates a script free standalone HTML file in the browser, including exact monthly inputs and balances, date, score/stage, the canonical priority and plan, and a reflection date 30 calendar days later. It needs no remote assets or backend storage. Print or save PDF opens the same standalone document and invokes browser print; the visitor chooses their printer or PDF destination. A blocked popup has a download fallback. The saved file contains financial answers and should be kept privately. No automatic reminder or persistent history is claimed.

Example data is labeled and cannot be downloaded as a personal result. Editing hides the stale report, preserves answers, and recalculation replaces the same canonical node.

## Verification

- 69 Node unit tests pass, including cash amounts from one cent through $100, target shortfall, zero/negative cash, date boundaries, parser rejection, paycheck annualization, objective tie breaks, corroborated pressure overrides and uncorroborated context. Existing plan and scoring regression tests remain intact.
- Full Chromium suite passes at 390, 760 and 1280 pixels: nine step completion, required selections, estimates, Enter, Back, chips, Skip/Escape, reduced motion, focus, touch targets, analytics allowlist, no values in captured outgoing requests, no web storage and no uncaught browser errors.
- Additional finalization suite passes: invalid/unknown entry blocking, $10 and $0.99 recommendations, download and offline opening without HTTP requests, print entry invocation, edit/back/recalculate, canonical navigation and both no JavaScript entry points.
- The synthetic A4 PDF was rendered page by page with PDFKit and visually inspected: two legible pages, no clipped text or blank trailing page. It is test evidence, not a promise of identical pagination in every browser or paper size.
- Native Safari is used for the review handoff. Physical iPhone/Android, VoiceOver, actual printer and manual Safari print dialog checks remain unverified. An earned 4.7 rating and pilot usability validation are not claimed.

Commands: `node --test`; `SCORECARD_EVIDENCE_DIR=/tmp/ffm-final-review node scripts/verify-scorecard.mjs`; `SCORECARD_EVIDENCE_DIR=/tmp/ffm-final-review node scripts/verify-final-scorecard.mjs`. Set SCORECARD_ORIGIN to test a deployed preview. Evidence is bounded to this review; older phase2 and video-launch folders are historical.
