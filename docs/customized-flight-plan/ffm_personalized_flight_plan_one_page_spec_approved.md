# FFM Personalized Flight Plan - One-Page Product Specification

**Status:** Approved for MVP build | **Owner:** Financial Flight Mode / RSG
**Purpose:** Convert a completed Flight Plan Scorecard into a clear next move without founder assistance.

> Added to the repository in Revision 3 of `ffm_customized_flight_plan_v1_spec.md` — this file
> was the originally-approved MVP concept, supplied after Revision 1's repository grounding and
> Revision 2's Product Challenge had already taken place. It is now committed here so future
> revisions treat it as in-repo source of truth rather than an external upload. See the
> "Revision 3 — Product Reconciliation Log" section of the main SPEC for how it was reconciled
> against Revision 2.

## Product Promise

**Your score shows where you are. Your Personalized Flight Plan shows what to do next.**

The pilot completes the existing Scorecard, immediately sees the current score and stage, receives a rules-based plan, and can email the plan and Starter Kit after providing consent. The MVP preserves the approved scoring logic.

## Required Result

| Component | MVP requirement |
|---|---|
| Score + stage | Current 0-100 score, orange ring, and Pre-Flight, Turbulence, Cruise Control, or Flight Mode explanation |
| Strong Signal | Strongest supported category presented as evidence of progress |
| Warning Lights | Two weakest supported categories presented directly and without shame |
| Next Three Moves | Ranked actions labeled **Do Now**, **This Payday**, and **This Month** |
| 30-Day Mission | One measurable mission tied to the highest-priority warning light |
| Workbook Connection | Exact Flight Plan Budget System tab and action |
| Primary CTA | **EMAIL MY FLIGHT PLAN** |
| Secondary CTA | **OPEN THE STARTER KIT** |

## Personalization Logic

Version one is deterministic, not open-ended AI advice. Use current inputs and component results, rank only supported categories, select one strong signal and two warning lights, and assign actions from this approved library:

| FFM pillar | Approved first action | Workbook control |
|---|---|---|
| Cash Flow Control | Complete income/expense entries, update actuals, or audit 1-3 spending leaks | Monthly Budget + Dashboard |
| Debt Discipline | Confirm minimums and choose one priority balance | Debt Snowball + Monthly Budget |
| Emergency Runway | Set the next $500, $1,000, or one-month target and a repeatable contribution | Savings Tracker + Dashboard |
| Wealth Systems | Establish or review one repeatable saving/investing contribution after the base is stable | Investment Tracker + Savings Rate |
| Ownership Mindset | Complete a Control Tower Review before payday and choose one priority | Dashboard + Month-End Reset |

If the data does not support a conclusion, show a neutral next step. Never recommend a security, lender, credit product, debt settlement provider, tax position, or legal action.

## Stage Standard

- **Pre-Flight:** Learn your numbers and set up the cockpit. Next move: clarity.
- **Turbulence:** Stabilize the most urgent signal before trying to fix everything.
- **Cruise Control:** Strengthen consistency and automate the right habits.
- **Flight Mode:** Protect the base and expand long-term ownership capacity.

## Data, Email, and Design Rules

- Show score and stage before requesting email; obtain consent for the plan and ongoing education.
- Reuse the existing MailerLite workflow where possible and prevent duplicate enrollment.
- Store only email, optional first name, score, stage, source, and completion date.
- Never expose personal financial inputs in URLs, analytics, logs, or subject lines.
- Use official FFM orange, black, charcoal, white, logo assets, score ring, status badges, 8px corners, and mobile-first layout.
- Include privacy, unsubscribe, and education-only language.

## Definition of Done

Ten independent testers can discover FFM, complete the Scorecard, understand their result, receive the resources, and name their next action without assistance. All four stages and boundary conditions produce approved results; current mobile Safari, mobile Chrome, desktop Chrome, and desktop Safari pass; conversion and error events are measurable; existing subscribers do not receive duplicate enrollment; and no sensitive input leaks.

**Out of scope:** AI coaching, bank connections, user accounts, full-budget storage, custom PDFs, sponsor placements, and changes to the current scoring formula.
