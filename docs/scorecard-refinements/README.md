# Flight Scorecard refinements: founder review

Implements the approved draft while retaining the existing cockpit design, nine-step manual-entry flow, and concise two-page standalone HTML/PDF report. This branch is a review candidate. It has not been merged or released to production.

## Behavior

- Landing promise: **Your numbers. A clearer picture. One practical next move.** Use estimates to start. Refine your answers anytime.
- Cash-flow points assess whether all planned allocations fit within income. A fully assigned plan earns the same affordability points as one with unassigned cash. Monthly flexibility remains an explicit separate readout. Cash deficits still prevent Cruise Control or Flight Mode.
- Emergency points use cash divided by monthly essential expenses, against a fixed three-month scoring benchmark. A personal emergency goal only affects goal progress. Zero needs do not imply infinite protection.
- An optional required-payment field appears inside the existing debt question only when debt is entered. Payments exclude the mortgage and must already be included in needs. They are never deducted a second time. Missing payments are distinct from a confirmed zero and explicitly limit the assessment.
- Debt scoring uses payment share of take-home pay. It is not conventional lender DTI. Total balance is retained as context and extra payments cannot improve this score.
- Results open with score, summary, priority, explained next move, and download/print/edit controls. Instruments, cash allocation, Flight Path, warnings and inputs remain accessible in an expandable section. Downloads retain the same canonical action/reason, seven instrument readouts, input totals, and the Reflect section across two pages. Detailed category/account rows remain on screen.
- Savings mission: **Complete your planned savings transfer on each payday this month.**
- The landing illustration is derived from the same calculator/report as personal results. Analytics bands now align with stage score bands; stages remain separately reported because the cash-deficit safeguard can override the numeric band.

## Scoring policy for review

Existing category maximums remain 25 cash flow, 25 savings, 20 debt, 20 runway, 10 investments. Savings and investment rules are unchanged.

| Category | Condition | Points |
|---|---|---:|
| Cash flow | Plan exceeds income | 0/25 |
| Cash flow | Plan fits within income, including fully assigned | 25/25 |
| Runway | No cash or no essential expense basis | 0/20 |
| Runway | More than zero but below 0.75 months | 5/20 |
| Runway | 0.75 to below 1.5 months | 10/20 |
| Runway | 1.5 to below 2.25 months | 15/20 |
| Runway | 2.25 to below 3 months | 18/20 |
| Runway | 3 or more months | 20/20 |
| Debt | No debt outside mortgage | 20/20 |
| Debt | Required payments at or below 10% of take-home | 20/20 |
| Debt | Above 10% through 20% | 14/20 |
| Debt | Above 20% through 35% | 8/20 |
| Debt | Above 35% | 3/20 |
| Debt | Required payments unknown | 8/20, limited assessment |

These are provisional FFM educational thresholds, not validated financial-health or lending standards. Founder review should consider the new debt cutoffs, unknown-payment treatment, and the magnitude of score/stage changes. A fully assigned synthetic budget changes from 66/Turbulence to 85/Cruise Control; a high-required-payment example changes from 77/Cruise Control to 58/Turbulence. See [the complete ten-household comparison](calibration.md) and [exact synthetic inputs](calibration.json).

No bank linking, financial-answer persistence, or personal financial fields in analytics were added. Email signup is unchanged. Investment balance scoring and zero-income support remain outside this approved refinement scope.

## Validation

- `npm test`: 82 passing tests, including privacy checks, stage safeguards, goal independence, allocation invariance, debt-payment boundaries, no double deduction, unknown versus zero, canonical downloads, and pay-frequency wording.
- `node scripts/calibrate-scorecard-refinements.mjs`: compares ten synthetic households with base commit `e26b6569358fc906bc283e93d49d16f4b690bd92`.
- `npm run test:refinements`: actual Chromium checks of both entry points, 320/390/1280 widths, no overflow with details open or closed, conditional debt inputs and validation, downloads, edit flow, limited debt data, no debt, deficits, fully assigned budgets, reduced-motion and animated reveals, analytics parameter names, and no web storage.
- Standalone synthetic HTML report opened locally, rendered at mobile/desktop widths, and printed to PDF. External network requests were blocked during this local browser verification; no real email submissions were made. This is not a production performance audit or a live provider-integration test.
- [Browser results](evidence/verification.json), [mobile opening](evidence/report-opening-390.png), [expanded mobile report](evidence/report-expanded-390.png), [standalone report](evidence/synthetic-report-390.html), and [print PDF](evidence/synthetic-report.pdf).

Browser validation used Chromium 134 in this environment with its headless executable supplied via `CHROMIUM_EXECUTABLE_PATH` and `FFM_SINGLE_PROCESS=1`. The default command uses the repository's installed Playwright Chromium. iPhone Safari verification and five real pilot comprehension sessions remain release-review work.

## Concise report revision

The founder requested a maximum of two pages with reflection preserved. Page 1 contains the score, explanation, next action, readouts, and mission. Page 2 contains input totals and all three Reflect questions with writing space. Unbounded category/account lists are intentionally omitted from the download. Eight pagination checks passed across A4 and US Letter, including large values, cash deficits, and zero needs; Reflect remains on page 2. See `evidence/pagination-verification.json`.
