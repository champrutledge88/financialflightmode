# FFM Personalized Flight Plan V1 — Product Specification

Phase: SPEC CLOSURE (Revision 4)
Author role: FFM Product Architect / SPEC Owner
Status: Revision 4 — closes the two remaining P1 findings from the independent Revision 3
Product Re-Review (`PASS WITH CHANGES`). Product thesis and personalization engine are approved
and not reopened in this revision.

**Canonical product name (Revision 4):** **Personalized Flight Plan** — the name used in the
approved original MVP spec (`ffm_personalized_flight_plan_one_page_spec_approved.md`), the name
already used in the restored Product Promise (§1), and a more accurate description of
deterministic self-service personalization than "Customized," which can imply bespoke
Founder/manual work. Used throughout this document from Revision 4 forward. The file path
remains `ffm_customized_flight_plan_v1_spec.md` through PR #10 to avoid unnecessary Git churn —
this is a documentation-content rename only, not a file rename. Quoted material inside the
Revision 3 Reconciliation Log below is left verbatim as a historical record of what each prior
revision literally said at the time; it is not restated under the new name.

Grounding note: reconciled against `docs/scorecard/*`, `docs/funnel/README.md`,
`src/flightScoreCalculator.js`, `src/main.js`, `index.html`, `privacy.html`, `terms.html`, and
the approved original one-page MVP spec (now in-repo:
`ffm_personalized_flight_plan_one_page_spec_approved.md`). Stage taxonomy remains
**Pre-Flight → Turbulence → Cruise Control → Flight Mode** (live code is authoritative over the
Scorecard docs' stale "On Approach" label). No new stages introduced. Nothing here changes the
live `getStage`/`calculateFlightScore` code.

---

## Revision 4 — SPEC Closure Log

Closes the two P1 findings from the independent Revision 3 Product Re-Review (`PASS WITH
CHANGES`). Product strategy and the personalization engine are not reopened.

| # | Finding | SPEC Change | Status |
|---|---|---|---|
| 1 | Strong Signal was REQUIRED but Persona 1 omitted it with no deterministic rule | §6, §8, §10 (Persona 1 and 4), §16 — Strong Signal is now **always shown** (Option A), copy framed as relative-strongest not overall-financial-health, with a deterministic tie-break for the all-signals-tied case reusing the live `getStrongestSignal` stable-sort order | Resolved |
| 2 | Calibration Mode needed a defined evidence schema without reintroducing financial-data retention | §11, §13, §16 — explicit calibration record MAY/MUST-NOT-contain schema; temporary, pilot-only, separated from any user-facing data; no account or persistent financial profile | Resolved |
| 3 | Product carried two names ("Customized" and "Personalized" Flight Plan) | Title (above), §1, §4, and all current-tense prose renamed to **Personalized Flight Plan**; file path intentionally unchanged | Resolved |
| 4 | Pilot structure needed a stronger validation checkpoint | §15 — Cohort 1 restructured to **5 observed independent users → checkpoint → 5 additional independent users**, still 10 total, still fully self-service, no delivered plan rewritten | Resolved |
| 5 | "Calibration Override Rate" implied plans were being overridden | §11, §13, §15, §16 — renamed **Engine Failure Rate**, explicitly diagnostic-only; manual intervention tracked separately only if it ever occurs unexpectedly | Resolved |

---

## Revision 3 — Product Reconciliation Log

The original MVP spec was written and approved before Revision 1's repository grounding took
place, so Revisions 1–2 built on an incomplete picture. This revision does not pick one file
over the other — it restores the original's validated product principles where Revision 2
diverged from them without cause, and keeps Revision 2's logic-level improvements where they
strengthen rather than contradict the original.

| Area | Original MVP said | Revision 2 said | Revision 3 resolution |
|---|---|---|---|
| Founder involvement | Works **without** founder assistance | Founder writes/reviews every delivered plan | **Restored + upgraded:** self-service by default; Founder Calibration Mode is pilot-only QA, not a delivery gate (§11) |
| Data retained | Email, optional first name, score, stage, source, completion date only | Temporary but real retention of full financial inputs for founder review | **Restored:** financial inputs are CLIENT-SIDE ONLY, never transmitted (§13). Revision 2's 45-day "operational workflow" apparatus is superseded, not needed once nothing sensitive is transmitted |
| Access model | Score/stage shown immediately; email only gates delivery + ongoing education | "Application-gated" access before a plan is even generated | **Restored:** open self-service, matching the live Scorecard's own current behavior; email consent gates delivery/enrollment only, not visibility (§12, §14) |
| Output elements | Score+Stage, Strong Signal, **two** Warning Lights, Do Now/This Payday/This Month, 30-Day Mission, Workbook Connection, EMAIL MY FLIGHT PLAN / OPEN THE STARTER KIT | Current Position, Flight Status, Priority #1 (folded warning), Priority #2, generic 30-Day block, generic CTA | **Reconciled, not duplicated:** Priority #1/#2 are renamed to Warning Light #1/#2 (same ranking math, restored approved terminology); Strong Signal restored (Rev 2 silently dropped FFM's only positive-framed element); cadence relabeled Do Now/This Payday/This Month; 30-Day Mission restored as one measurable, self-checkable line (absorbing Rev 2's "Next Checkpoint" idea rather than adding a redundant 4th bucket); exact CTA labels restored (§8/§10) |
| Action library | Approved 5-pillar table (Cash Flow Control, Debt Discipline, Emergency Runway, Wealth Systems, Ownership Mindset) with exact workbook tabs | Vague "matching Starter Kit section" | **Restored + extended:** original table adopted verbatim, with one added row (Savings System) because the live Scorecard's 5 scoring signals don't map 1:1 onto the original's 5 action pillars — flagged explicitly below (§8) |
| Advice boundary wording | "Never recommend a security, lender, credit product, debt settlement provider, tax position, or legal action" | Similar but less specific | **Restored:** adopted the original's exact, previously-approved phrasing (§13) |
| Pilot sizing | Definition of Done: 10 independent testers, unassisted | Wave 1 (5) → checkpoint → Wave 2 (≤15), founder-bottleneck-driven | **Reconciled:** Cohort 1 = 10 testers (matches the approved DoD number exactly), evaluated against the DoD's unassisted-completion bar plus Rev 2's quantified decision metrics. The 5-then-15 stepped ceiling was sized around founder bandwidth; once delivery is automated (this revision) that constraint mostly disappears, so a flat 10-tester Cohort 1 is the more defensible number, not an arbitrary compromise (§15) |
| cashRemaining fragility boundary | Not addressed | `<= 0`, justified | **Kept** — pure logic improvement, no conflict (§6 Step 1) |
| Hard Override vs. Flag/Context | Not addressed | Defined | **Kept** — strengthens "never let a subjective flag override the numbers" without contradicting anything in the original (§6 Step 1) |
| Relative signal ranking / stage-gate suppression / tie-break | Implied ("rank only supported categories") but not mechanized | Fully mechanized | **Kept** — this is the concrete mechanism the original's plain-English rule needed (§6) |
| "Buy a home" objective option | Not present in original | Removed by Rev 2 | **Kept removed** — consistent with original's advice-boundary language |
| Founder Override Rate | Not present in original | Per-delivery override log | **Repurposed, not discarded:** becomes a Calibration Override Rate — a QA metric on a sampled/complete review of Cohort 1's automated outputs, not a gate on shipping any individual plan (§11, §15) |

---

## 1. Executive Product Definition

**Product Promise (restored, original wording):** *Your score shows where you are. Your
Personalized Flight Plan shows what to do next.*

Personalized Flight Plan V1 is a **self-service, deterministic** personalization layer that sits
between the free Scorecard/Starter Kit and the future Flight Crew/Membership tiers. Immediately
after completing the existing Scorecard, the pilot sees — in the browser, with no gate, no
founder step, and no additional financial data leaving the device — their score, stage, a
positive Strong Signal, two ranked Warning Lights, a three-step action sequence (Do Now / This
Payday / This Month), a 30-Day Mission, and an exact workbook connection. They may then choose
to **EMAIL MY FLIGHT PLAN** (the one point where email/consent is requested) and/or **OPEN THE
STARTER KIT**.

It is not a budgeting app, not an advisor, and not a dashboard, and — corrected in this
revision — it is not a product that requires the Founder to hand-write every user's result. It
is a **decision artifact generated the same way the live Scorecard already generates a score:
client-side, instantly, deterministically.**

---

## 2. User / Problem

*(Unchanged by Revision 3 — not implicated by the reconciliation.)*

**Primary V1 user:** Someone who has completed the free Scorecard and is most likely in
**Pre-Flight or Turbulence**. They may have downloaded the Starter Kit but have not achieved
consistent execution.

- **Financial situation:** irregular follow-through; awareness of income/bills but not of how
  the pieces rank against each other.
- **Pain points:** decision fatigue; generic content that restates what they already know
  without sequencing it.
- **Emotional state:** anxious, mistrustful of finance content, wants the truth without shame.
- **Why existing budgeting apps are insufficient:** they display data, they don't prioritize it.
- **What they actually need:** a short, specific, ranked answer delivered the moment they
  finish the Scorecard — not a second intake, not a wait for a human.
- **Desired action after receiving the plan:** complete the first action, and take the next
  visible FFM step.

---

## 3. Core Job To Be Done

**Core Job:** *Tell me, in priority order, what to fix first given my actual numbers, so I
stop guessing — right now, without waiting on anyone.* (The "without waiting on anyone" clause
is added in Revision 3 to make the original's no-founder-assistance requirement part of the
core job itself, not just an implementation detail.)

- **Supporting Jobs:** show one Strong Signal as evidence of progress; show two Warning Lights
  with an exact next action each; connect the plan back into the existing Starter Kit workbook.
- **Future Jobs (post-V1):** recurring/updating plans; Flight Crew accountability integration;
  goal/scenario tracking; multi-objective planning.

---

## 4. Product Position in the FFM Ecosystem

*(Unchanged by Revision 3.)*

`Scorecard → Starter Kit → Flight Plan System → Personalized Flight Plan → Flight Crew → Membership`
*(renamed from "Customized Flight Plan" per Revision 4's canonical-name decision — same
ecosystem step, same position, name only)*

Personalized Flight Plan V1 reuses the Scorecard's existing five signals and scoring logic and
routes its output back into the Starter Kit's existing workbook — not a parallel product.

---

## 5. Required Inputs Matrix

| Input | Classification | Where Computed / Retained | Why It's Needed |
|---|---|---|---|
| Monthly income, needs, wants, savings, extra debt payment, total debt balance, emergency fund saved/goal, current investment value (the 9 existing Scorecard fields) | REQUIRED | **CLIENT-SIDE ONLY** (Revision 3, §13) — identical to how the live Scorecard already handles them; never transmitted | Everything the ranking engine needs; already collected today |
| Immediate pressure (single-select: Stable / Unexpected bill / Income disruption / Falling behind on a payment) | REQUIRED | CLIENT-SIDE ONLY | Drives Hard-Override-vs-Flag/Context (§6 Step 1) |
| Short-term objective (single-select, optional: Stop the bleeding / Build a cushion / Get out of debt / Save more consistently / Start investing) | OPTIONAL | CLIENT-SIDE ONLY | Tie-break only (§6 Step 4); "buy a home" stays removed — every remaining option maps 1:1 to a signal and implies no lending/mortgage guidance |
| Email / optional first name | REQUIRED (email) / OPTIONAL (name) | **MAY/MUST RETAIN** (§13) | Only requested at the EMAIL MY FLIGHT PLAN step, not before |
| Score / stage / Warning Light #1 category | DERIVED | MAY RETAIN (§13) — non-sensitive outcome labels, not dollar figures | Computed via the existing calculator |

**Principle applied (restored + strengthened):** every REQUIRED financial input already exists
in the live Scorecard and never leaves the browser. Exactly one new required field and one new
optional field are added, both non-financial selects, both client-side only.

---

## 6. Personalization Framework

Unchanged in mechanism from Revision 2 — these were validated logic improvements, not points of
conflict with the original, and are kept in full:

- **Step 1 — Hard Override vs. Flag/Context.** `cashRemaining <= 0` is always a Hard Override.
  A non-"Stable" pressure selection only becomes a Hard Override when corroborated by an
  Objective Fragility Signal already used by the live calculator (`savingsRate < 0.05` or
  `emergencyFundLevel < 0.25`); otherwise it is Flag/Context — noted, not acted on. `<= 0`
  (not `< 0`) because a household at exactly zero remaining cash has no margin for the next
  dollar of variance.
- **Step 2 — Rank the five signals by relative weakness** (score ÷ category max — the existing
  `getRelativeCategoryScores` math).
- **Step 3 — Stage-gate sequencing.** For Pre-Flight and Turbulence, Wealth Fuel is never
  promoted ahead of Cash Flow Control, Emergency Runway, or Debt Load.
- **Step 4 — Deterministic tie-break.** Two candidates are tied when their relative-score gap is
  ≤ 0.10 (adjacent-ranked candidates only). A matching optional objective breaks the tie toward
  that category; if omitted, the tie resolves to the fixed safety-sequence order (Cash Flow
  Control > Emergency Runway > Debt Load > Savings System > Wealth Fuel).
- **Step 5 — Fallback when nothing is weak.** If every signal's relative score is ≥ 0.90, the
  fallback action is the original's **Ownership Mindset** pillar (§8) — a Control Tower Review
  — rather than a manufactured weakness.

**Strong Signal selection (Revision 4 — resolves P1-1, "Strong Signal Omission Rule").**
**Always show the strongest relative signal.** No omission threshold is invented: no existing
FFM methodology document defines a principled minimum bar for what counts as "strong," so
inventing one would be exactly the arbitrary threshold the reviewer warned against. The rule is
therefore Option A, applied with no exception:

- Strong Signal is the category returned by the existing `getStrongestSignal` logic — the single
  highest relative score (score ÷ category max) among the five signals — shown on **every**
  plan, regardless of how strong or weak that top score actually is in absolute terms.
- **Copy meaning is strictly relative, never absolute:** the user-facing line always reads as
  *"Among your current signals, this is the strongest one"* — never *"you are financially strong
  in this area."* This holds even when the strongest relative score is itself low (e.g., 0.50) —
  see Persona 1 (§10), which is now the worked proof that the copy doesn't overstate financial
  health.
- **Deterministic tie-break when multiple signals are equally strongest** (including the
  all-five-tied-at-1.0 case): resolved by the existing `getStrongestSignal` implementation's own
  stable-sort behavior, not a new rule — ties resolve in the fixed order **Cash Flow Control >
  Savings System > Debt Load > Emergency Runway > Wealth Fuel** (the category object's existing
  key order in `flightScoreCalculator.js`). See Persona 4 (§10).

**Terminology change (Revision 3):** what Revision 2 called "Priority #1 / Priority #2" is now
presented to the user as **Warning Light #1 / Warning Light #2** — same ranking output, restored
approved terminology, and it reuses the live calculator's own `getWarningLight` naming rather
than introducing new product vocabulary.

**Why this is more than a worksheet** *(unchanged from Revision 2 — not implicated by
reconciliation):* the differentiation is the category weighting, relative scoring, stage-gate
sequencing, and priority suppression already encoded in FFM's own methodology, plus the exact
routing into FFM's own workbook — not the form fields or (now removed) founder delivery.

---

## 7. Stage Logic

*(Unchanged — Pre-Flight → Turbulence → Cruise Control → Flight Mode, matching the original's
own Stage Standard almost verbatim: Pre-Flight = learn your numbers and set up the cockpit;
Turbulence = stabilize the most urgent signal before fixing everything; Cruise Control =
strengthen consistency and automate; Flight Mode = protect the base and expand ownership
capacity. See prior revisions for the full Primary Objective / Common Risks / Priority Actions /
Graduation Signal breakdown per stage — not repeated here as it is untouched by this
reconciliation.)*

---

## 8. Personalized Flight Plan Output (Reconciled — restores the original's Required Result table)

| Element | Classification | Source / Notes |
|---|---|---|
| Score + Stage | REQUIRED | Existing score ring + stage badge, rendered client-side exactly as the live Scorecard already does. |
| **Strong Signal** | **REQUIRED — always shown (Revision 4, §6)** | The single strongest relative signal (`getStrongestSignal`), shown on every plan with no omission threshold — copy is explicitly relative ("the strongest of your current signals"), never a claim of overall financial health. Revision 2 had dropped this element; Revision 3 restored it but left its omission condition (Persona 1) non-deterministic, which Revision 4 closes. Not duplicative of the Warning Lights below — it names what's already working, even when that "strongest" score is itself modest. |
| **Warning Light #1** | REQUIRED | The engine's top-ranked signal (§6), with its explanation and exact next action folded in — this *is* Revision 2's Priority #1, renamed to the originally-approved term. No separate redundant "Warning Indicator" summary exists (Revision 2's correct fix, kept). |
| **Warning Light #2** | REQUIRED | Second-ranked signal, same treatment — this *is* Revision 2's Priority #2, renamed. |
| Next Three Moves — **Do Now / This Payday / This Month** | REQUIRED | Cadence relabeled to the original's approved, payday-anchored terms (matches the live site's own "give every paycheck a mission" language) — replaces Revision 2's generic NOW/THIS WEEK/THIS MONTH. |
| **30-Day Mission** | REQUIRED | One measurable mission tied to Warning Light #1, carrying its own explicit, self-checkable success condition — this absorbs Revision 2's "Next Checkpoint" idea directly into the Mission rather than adding a fourth, separate bucket. |
| Workbook Connection | REQUIRED | Exact tab + action from the restored action library below — not a vague "matching section" pointer. |
| Primary CTA — **EMAIL MY FLIGHT PLAN** | REQUIRED | The single point where email/consent is requested (§12); triggers the existing MailerLite workflow automatically, no founder step. |
| Secondary CTA — **OPEN THE STARTER KIT** | REQUIRED | Unchanged destination, restored exact label. |
| Willingness-to-pay / Flight Crew question | OPTIONAL, pilot-only | Kept from Revision 2 as a pilot-metrics addendum after the two CTAs above — not part of the original's Required Result table, so it stays explicitly secondary and removable outside the pilot. |
| Priority #3 / 90-Day Direction | OPTIONAL / BACKLOG | Unaffected by this reconciliation — still excluded from V1 (neither spec calls for them). |

### Restored Action Library (Reconciliation finding)

The original's 5-pillar action library does not map 1:1 onto the live Scorecard's 5 *scoring*
signals — "Savings System" (a live scoring category) has no dedicated row in the original table,
and "Ownership Mindset" is a stage-level fallback action, not one of the five ranked signals.
Both gaps are resolved explicitly rather than left implicit:

| Signal / Pillar | Approved First Action | Workbook Control |
|---|---|---|
| Cash Flow Control | Complete income/expense entries, update actuals, or audit 1–3 spending leaks | Monthly Budget + Dashboard |
| **Savings System** *(added — no original row existed)* | Set or confirm one automatic transfer from checking to savings each payday | Savings Tracker + Monthly Budget |
| Emergency Runway | Set the next $500, $1,000, or one-month target and a repeatable contribution | Savings Tracker + Dashboard |
| Debt Load (original: "Debt Discipline") | Confirm minimums and choose one priority balance | Debt Snowball + Monthly Budget |
| Wealth Fuel (original: "Wealth Systems") | Establish or review one repeatable saving/investing contribution after the base is stable | Investment Tracker + Savings Rate |
| **Ownership Mindset** *(fallback only — used when §6 Step 5 applies, all signals ≥ 0.90, never as a ranked Warning Light)* | Complete a Control Tower Review before payday and choose one priority | Dashboard + Month-End Reset |

If the data does not support a conclusion for a category, show a neutral next step rather than
forcing a ranking — carried over verbatim from the original.

---

## 9. 30-Day Action Framework

Relabeled to the original's approved cadence (Revision 3):

- **Do Now:** completable today.
- **This Payday:** the concrete step tied to the next paycheck cycle — payday-anchored,
  matching how the Starter Kit and live site already frame budgeting cadence.
- **This Month:** the behavior that needs to become consistent.
- The **30-Day Mission** (§8) carries its own explicit success condition, so no separate
  "checkpoint" bucket is added on top of these three.

---

## 10. Four Personalization Examples (Relabeled — math unchanged and re-verified)

*Figures are identical to Revision 2, hand-verified against `calculateFlightScore`; output
terminology changes (Priority #1/#2 → Warning Light #1/#2; cadence labels; restored CTAs). Strong
Signal is recomputed for every persona per Revision 4's always-show rule (§6) — Persona 1 and
Persona 4 are the two worked cases that previously left this ambiguous.*

### Persona 1 — Pre-Flight, exactly zero remaining cash: "Maya"
Income $3,000 · Needs $2,200 · Wants $650 · Savings $150 · Extra debt payment $0 · Total debt
$14,000 · Emergency fund $500 / $2,000 goal · Investments $0. Pressure: Stable.
- `cashRemaining = $0` → score 35 → **Pre-Flight** (stage calculation untouched).
- `cashRemaining <= 0` → **Hard Override**.
- **Strong Signal (Revision 4 — resolves the P1-1 omission ambiguity):** relative scores are
  cashRemaining 0.40, savingsRate 0.48, debtPressure 0.15, **emergencyFund 0.50**, investments 0.
  Emergency Runway is the mathematical strongest at 0.50 — modest in absolute terms, which is
  exactly why the copy stays relative: *"Emergency Runway — among your current signals, this is
  your strongest one right now. It's not finished, just furthest along."* This is the proof case
  that the always-show rule doesn't overstate financial health even at a low top score.
- **Warning Light #1:** Cash Flow Control — "Your cash flow is exactly break-even, which means
  any surprise expense puts you negative. That comes before anything else."
- **Warning Light #2:** Debt Load (relative score 0.15 — weakest non-suppressed signal;
  Wealth Fuel's 0.0 is suppressed per Step 3 for Pre-Flight).
- Do Now: open a separate account and move any surplus dollar there. This Payday: confirm every
  bill against Needs. This Month: pick one debt to target once cash flow holds ≥ $0.
- **30-Day Mission:** "Keep cash remaining at $0 or above for one full pay cycle" (self-checkable
  via the next Scorecard retake).
- Workbook Connection: Monthly Budget + Dashboard (Cash Flow Control row).

### Persona 2 — Turbulence, negative remaining cash: "Jordan"
Income $4,200 · Needs $3,200 · Wants $1,200 · Savings $0 · Extra debt payment $100 · Total debt
$6,000 · Emergency fund $200 / $2,000 goal · Investments $0. Pressure: Falling behind on a
payment.
- `cashRemaining = −$300` → score 25 → **Turbulence**. Hard Override.
- **Strong Signal:** Debt Load (relative 0.75 — the extra debt payment is actively working even
  though everything else is under pressure) — proof Strong Signal isn't reserved for strong
  overall profiles; it's the one thing genuinely working for *this* person.
- **Warning Light #1:** Cash Flow Control — stop the $300/month shortfall.
- **Warning Light #2:** Savings System (relative 0.20 — weakest remaining non-suppressed signal;
  corrected in Revision 2 from an earlier mislabeling as Emergency Runway).
- Do Now: cut one recurring expense today. This Payday: confirm which bill is driving the
  shortfall. This Month: get cash remaining to ≥ $0, then start a $25/week savings habit.
- **30-Day Mission:** "Get cash remaining to $0 or above and confirm it on the next payday
  check-in."
- Workbook Connection: Monthly Budget + Dashboard.

### Persona 3 — Cruise Control, close-signal tie-break: "Priya"
Income $6,000 · Needs $2,800 · Wants $1,200 · Savings $600 · Extra debt payment $200 · Total
debt $9,000 · Emergency fund $6,000 / $9,000 goal · Investments $8,000. Pressure: Stable.
- `cashRemaining = $1,200` → score 82 → **Cruise Control**. No override.
- **Strong Signal:** Cash Flow Control (relative 1.0 — clearly the strongest).
- Weakest two: Savings System (0.72) and Emergency Runway (0.75) — gap 0.03, tied (≤ 0.10).
- **Objective = "Save more consistently":** Warning Light #1 = Savings System, #2 = Emergency
  Runway. **Objective = "Build a cushion":** tie-break flips them. **Objective omitted:** falls
  back to the fixed sequence → Warning Light #1 = Emergency Runway, #2 = Savings System.
- 30-Day Mission (objective-omitted branch): "Automate the remaining ~$1,000 to reach 100% of
  your emergency fund goal this month."
- Workbook Connection: Savings Tracker + Dashboard.

### Persona 4 — Flight Mode, strong profile + uncorroborated pressure: "Alex"
Income $8,000 · Needs $2,600 · Wants $1,000 · Savings $1,600 · Extra debt payment $0 · Total
debt $0 · Emergency fund $15,000 / $15,000 goal · Investments $40,000. Pressure: Unexpected bill.
- `cashRemaining = $2,800` → score 100 → **Flight Mode**. All relative scores = 1.0.
- No Objective Fragility Signal corroborates the reported pressure → **Flag/Context**, not
  Hard Override — direct proof a strong profile's self-reported pressure alone doesn't override
  the numbers.
- **Strong Signal (Revision 4 — deterministic tie-break, §6):** all five relative scores are
  tied at 1.0. Per the restored `getStrongestSignal` stable-sort tie order (Cash Flow Control >
  Savings System > Debt Load > Emergency Runway > Wealth Fuel), **Cash Flow Control** is shown
  as the single Strong Signal — not because the other four are hidden, but because the rule
  never displays more than one Strong Signal line, and this is the deterministic answer for a
  five-way tie rather than an arbitrary pick.
- **Warning Light #1 (fallback, §6 Step 5):** Ownership Mindset — Complete a Control Tower
  Review before payday, with a short contextual note: "You flagged an unexpected bill — your
  reserves look strong enough to absorb it. If this reflects a bigger recent change, retake this
  with updated numbers."
- Workbook Connection: Dashboard + Month-End Reset.

---

## 11. Automated vs. Founder Calibration Mode (Rewritten — Reconciliation Finding: Founder Assistance; Revision 4 adds the Calibration Record Schema below)

**Resolution: the original's "without founder assistance" requirement is restored as the V1
default, and is the strongest architecture — not a compromise.** Revision 2's founder-written
delivery model was adopted while this file was unavailable, and it directly contradicts an
already-approved constraint (the original's own Definition of Done requires ten independent
testers to succeed *without assistance*). Once financial inputs never leave the browser (§13),
the original rationale for founder-per-plan review — reviewing what the founder would otherwise
have to manually assemble and send — no longer applies either: there's nothing sensitive for the
Founder to be a custodian of in the first place.

| Fully Automated (every user, every time) | Founder Calibration Mode (pilot-only, sampled/complete QA — not a delivery gate) | Deferred |
|---|---|---|
| Stage determination (existing calculator, unmodified) | Reviewing the pilot's generated outputs across Batches 1–2 (score/stage/Warning Lights/action, not raw financial inputs — those were never transmitted) for tone, correctness, and logic gaps | Full narrative generation via an LLM |
| Warning Light #1/#2 ranking, including Hard Override / tie-break (§6) | Writing a calibration record (schema below) noting the automated output looks wrong, with the Founder's proposed correction and reasoning, used to refine the *rules*, not to hand-fix that user's plan — this is what the Engine Failure Rate measures | Founder-assisted, deeper/white-glove sessions as a possible **future paid** offering — see §14 |
| Strong Signal selection, including tie-break (§6) | Collecting the qualitative pilot-metrics answers (§15) | Dynamic re-personalization on repeat visits |
| Do Now / This Payday / This Month / 30-Day Mission text generation | — | Flight Crew scheduling integration |
| Sending the plan via the existing MailerLite workflow on EMAIL MY FLIGHT PLAN | — | Payment/subscription automation |

### Calibration Record Schema (Revision 4 — resolves P1-2, "Calibration Log Data Model")

Founder Calibration Mode needs enough *derived* evidence to judge why the deterministic engine
produced a result — without reintroducing any of the raw financial data Revision 3 correctly
kept client-side (§13). The calibration record is the explicit boundary between those two
things.

**A calibration record MAY contain** (for the pilot's Batches 1–2 / approved calibration testing only):
- Score, Stage
- Strong Signal category (including whether it was resolved by tie-break)
- Warning Light #1 category, Warning Light #2 category
- The five normalized relative category scores, as 0–1 derived values only
- The engine decision path / rule that fired: Hard Override, Flag/Context, Normal Relative
  Ranking, Stage Suppression, Objective Tie-Break, or the Step 5 deterministic fallback
- The generated action-library identifier or action label (§8) and the Workbook Connection
  selected
- Founder QA judgment: **correct / questionable / incorrect**
- A brief calibration note (free text, but scoped to *engine reasoning*, not the user's
  financial situation)
- Timestamp / test identifier

**A calibration record MUST NOT contain:** monthly income, needs amount, wants amount, savings
amount, debt balance, extra debt payment amount, emergency-fund dollar amounts, investment dollar
value, the raw financial-form payload in any form, financial values embedded in analytics or
URLs, or unrestricted narrative containing financial details. The five relative category scores
are the only numeric trace of the user's inputs permitted, and they remain normalized (0–1)
derived values — never the dollar figures or ratios they were computed from.

**Purpose, stated plainly:** the record exists to answer *"did the deterministic engine make the
correct decision, and which rule produced it?"* — nothing more. It must not become a hidden
financial profile or a persistent user-history system.

**Retention classification:** calibration records are **temporary pilot QA evidence**, retained
only for the duration of the Batch 1 / Batch 2 calibration period (§15), and kept entirely
separate from any user-facing data (§13's email/name/score/stage/source/date table) — there is no
user account for a calibration record to attach to, and none is created by this mechanism. They
are deleted at the end of the pilot's calibration window, the same way §13's outcome metadata is
time-bound.

**Engine Failure Rate** (Revision 4 — renamed from Revision 3's "Calibration Override Rate," per
the independent reviewer: the old name implied plans were being overridden, which never happens
in this architecture). Defined exactly as: **the percentage of reviewed generated plans where the
Founder concludes the deterministic engine selected a materially incorrect priority, action
sequence, or routing decision.** This is diagnostic only — it measures the engine, not any
individual user's experience, and **no delivered plan is manually rewritten or overridden as a
result of this review** (§11's automated-column list above is exhaustive; calibration review is
never added to it).

**Manual intervention** is not a planned mechanism in this architecture (self-service delivery has
no per-plan Founder step to intervene in). It is tracked as a **separate, distinct count** —
"Unexpected Manual Intervention" — only in the event it ever occurs outside the designed flow
(e.g., a data-corruption edge case requiring a one-off fix). In normal operation this count is
expected to be zero and is not conflated with the Engine Failure Rate, which is purely diagnostic
review of automated output.

---

## 12. User Journey (Revised — restores original's gate placement)

`Scorecard (existing, no gate) → Instant on-screen Flight Plan (client-side, no gate) → EMAIL MY FLIGHT PLAN (consent requested here) → OPEN THE STARTER KIT`

- Score, stage, Strong Signal, both Warning Lights, the three-step action sequence, the 30-Day
  Mission, and the Workbook Connection all render **immediately** after the Scorecard, exactly
  as the live score ring already renders today — no application, no waiting on a human, no
  second data-collection screen gating visibility.
- The **only** point email is requested is the EMAIL MY FLIGHT PLAN button — consistent with the
  original's rule ("show score and stage before requesting email; obtain consent for the plan
  and ongoing education").
- **Consent:** a single, distinct, unchecked-by-default statement at the EMAIL MY FLIGHT PLAN
  step, separate from any existing Weekly Briefing opt-in, naming exactly what's retained (§13).
- Reuses the existing MailerLite workflow and prevents duplicate enrollment for users already on
  the list (restored from the original's explicit requirement).
- **Mobile:** must pass on current mobile Safari, mobile Chrome, desktop Chrome, and desktop
  Safari (restored from the original's Definition of Done — dropped without explanation in
  Revision 2).

---

## 13. Trust, Privacy, and Advice Boundaries (Rewritten — Reconciliation Finding: Data Architecture)

**Model (restored, simplified from Revision 2): client-side calculation → render plan →
user optionally emails the outcome → retain only minimal, non-sensitive outcome metadata.**
Revision 2's temporary-but-real financial-data retention and its 45-day "operational workflow"
existed specifically to support founder-per-plan review. With that review model removed (§11),
the underlying justification for retaining financial data at all disappears — so it isn't
retained, full stop, not "retained briefly under controls."

| Datum | Classification |
|---|---|
| The 9 Scorecard financial fields, immediate pressure, short-term objective | **CLIENT-SIDE ONLY** — computed and rendered in-browser; never transmitted to any server or founder-visible record |
| Score, stage, Warning Light #1/#2 category labels | **MAY RETAIN** — non-sensitive outcome labels (fixed enums), not dollar figures |
| Email | **MUST RETAIN** — required to deliver the plan via the existing MailerLite workflow |
| First name | **MAY RETAIN** — optional, as in the original |
| Source, completion date | **MUST RETAIN** — needed for funnel measurement and duplicate-enrollment prevention |
| Consent flag + timestamp | **MUST RETAIN** — evidences that consent was obtained |
| Calibration records (pilot Batches 1–2 only — full schema in §11, Revision 4) | **MAY RETAIN, pilot-only, temporary QA evidence** — score/stage/Strong Signal/Warning Lights/decision-path/action-library ID/Founder judgment/note; normalized 0–1 relative scores only; never a dollar figure, never the raw financial-form payload; kept separate from the user-facing table below (no account exists for it to attach to); deleted at the end of the calibration period |
| Any dollar amount, full budget, or persistent financial profile | **DO NOT RETAIN** |
| Financial values in URLs, analytics, logs, or email subject lines | **DO NOT RETAIN / NEVER EXPOSE** (restored, broadened from Revision 2's repo-only framing to match the original's explicit URL/analytics/logs/subject-line list) |

- **Consent language:** "I'd like to receive my Flight Plan and future FFM education by email."
  — no financial-retention disclosure is needed because no financial data is retained; this is
  materially simpler than Revision 2's consent statement, which had to explain a 45-day
  financial-data retention window that no longer exists.
- **Disclaimer:** identical education-only posture as the existing Scorecard/Starter Kit,
  present on the plan itself.
- **Advice boundary (restored, original's exact approved phrasing):** "Never recommend a
  security, lender, credit product, debt settlement provider, tax position, or legal action."
- **`privacy.html` update:** still required before launch, but now a much smaller change — add
  one line confirming financial inputs are calculated in-browser and never transmitted (already
  true of the Scorecard today; this simply extends the same sentence to the Flight Plan). This
  is a documentation update, not a new retention regime — **no longer a structural launch
  blocker**, just a copy update to make before Batch 1 (§15).

---

## 14. Monetization Recommendation (Revised — gate placement corrected)

**V1: free, open self-service — not application-gated.** Revision 2's "application-gated"
access model is dropped: it presupposed a founder reviewing/approving each request before a plan
could even be generated, which directly conflicts with the restored no-founder-assistance
architecture (§11) and the original's unassisted-completion Definition of Done. Anyone who
completes the Scorecard gets an instant plan; email is requested only to send a copy and enroll
in ongoing education (§12).

- **Willingness-to-pay signal:** unchanged mechanism from Revision 2 — a direct question at the
  EMAIL MY FLIGHT PLAN step about deeper, ongoing guidance (Flight Crew). Still not a gate on the
  Flight Plan itself.
- **A notable reframe surfaced by this reconciliation:** founder-assisted, hand-reviewed
  guidance — the exact thing Revision 2 mistakenly made the *free V1 default* — is a much more
  coherent **future paid/premium offering** (Flight Crew-adjacent) once V1's automated version
  exists as the free baseline. Logged in §18, not committed here.

---

## 15. Pilot Design & Success Metrics (Revision 4 — checkpoint structure finalized)

### Pilot structure: 5 observed independent users → checkpoint → 5 additional independent users

The independent Revision 3 Re-Review recommended a stronger validation checkpoint than a flat
10-user cohort, without reopening the total (still 10, still matching the original's Definition
of Done, still not expanded to 20). Revision 4 adopts this exactly:

**Batch 1 — first 5 independent users**, deliberately covering:
1. A crisis-override case (negative or exactly-zero cash).
2. A non-crisis Turbulence case.
3. A Cruise Control case.
4. A close-signal / tie-break case.
5. A Flight Mode / Flag-Context case.

All 5 receive their plan **fully self-service — no Founder gating, no Founder editing of any
delivered plan.** This is unchanged from Cohort 1's design in Revision 3; only the checkpoint
timing is new.

**Checkpoint (after Batch 1, before recruiting Batch 2):** the Founder, using Batch 1's five
calibration records (§11 schema), inspects engine outputs and identifies any *systemic* logic
failure — not individual imperfect wording, a pattern in the decision path (Hard Override,
tie-break, stage suppression, etc.) producing a wrong result. **Delivered plans are not
rewritten** at this or any point; the checkpoint decides only whether it's safe to proceed to
Batch 2 as-is or pause to fix a rule first.

- **Proceed to Batch 2** if Batch 1's Engine Failure Rate (§11) is **≤ 1/5**.
- **Pause and fix the flagged rule before Batch 2** if Engine Failure Rate is **≥ 2/5** — revise
  the specific rule in §6, re-verify against the four personas in §10, then resume with Batch 2.

**Batch 2 — 5 additional independent users**, filling remaining representative profiles
(Founder's choice), also fully self-service with no gating or editing. Total across both
batches: **10 independent testers**, matching the original Definition of Done exactly — the
pilot is not expanded to 20 in V1.

### Definition of Done (restored, original wording, extended with quantified sub-measures)

Ten independent testers — across both batches — can discover FFM, complete the Scorecard,
understand their result, receive the resources, and **name their next action without
assistance**. All four stages and boundary conditions (including the Hard-Override and
Flag/Context branches, §6) produce approved results; current mobile Safari, mobile Chrome,
desktop Chrome, and desktop Safari pass; conversion and error events are measurable; existing
subscribers do not receive duplicate enrollment; no sensitive input leaks (trivially satisfied
once financial data is client-side only, §13).

Quantified against Revision 2's decision metrics, evaluated cumulatively across all 10 testers
at the end of Batch 2:

| Metric | DoD-aligned target (n=10, both batches) |
|---|---|
| Clarity — restates Warning Light #1 unprompted | ≥ 8/10 (this is the literal DoD bar) |
| Action — completes the Do Now action within 7 days | ≥ 5/10 |
| Trust / Relevance — plan feels specific, not generic | ≥ 7/10 |
| Product Continuation — takes the next FFM action within 14 days | ≥ 4/10 |
| **Engine Failure Rate** (renamed, §11) | ≤ 2/10 flagged as materially incorrect |
| Unexpected Manual Intervention (§11) | 0/10 expected; any non-zero count is investigated on its own, separately from the above |

**Go/No-Go:** meeting the DoD bar (Clarity ≥ 8/10 plus no cross-browser/duplicate-enrollment/data
-leak failures) is the hard gate, carried over unchanged from the original. The other metrics
inform whether to proceed to open rollout as-is or revise specific rules first — they do not
block the cohort from graduating on their own, since the DoD itself is the originally-approved
ship bar. The Batch 1→Batch 2 checkpoint above is a separate, earlier gate scoped only to
*systemic engine* correctness, not the full DoD.

### Beyond the 10-user pilot

Once delivery is automated, there is no fixed bandwidth ceiling on serving additional users —
the system serves the eleventh user exactly as easily as the first. Continued rollout past the
10-user pilot is gated on the DoD result above, not on a further founder-bandwidth-limited
headcount, and is out of scope for this V1 SPEC.

---

## 16. Acceptance Criteria (Reconciled)

1. A user who has completed the Scorecard is not asked to re-enter any of the 9 existing
   financial fields.
2. The Flight Plan (Score + Stage, Strong Signal, Warning Light #1/#2, Do Now/This Payday/This
   Month, 30-Day Mission, Workbook Connection) renders immediately after the Scorecard, with no
   application, approval, or founder step gating its visibility.
3. No financial input, immediate-pressure selection, or short-term-objective selection is ever
   transmitted off the user's device.
4. Email is requested only at the EMAIL MY FLIGHT PLAN step, with a distinct, affirmatively-
   checked consent statement.
5. `cashRemaining <= 0` always triggers the Hard Override (tested for both `= 0` and `< 0`).
6. A non-"Stable" pressure selection without a corroborating Objective Fragility Signal appears
   only as a contextual note and never changes Warning Light #1/#2.
7. The 0.10 relative-score tie-break threshold is applied identically regardless of which two
   categories are tied.
8. For Pre-Flight and Turbulence users, Wealth Fuel is never surfaced as Warning Light #1 or #2
   ahead of Cash Flow Control, Emergency Runway, or Debt Load.
9. Every plan includes exactly one Strong Signal, with no exception and no omission threshold
   (Revision 4, §6) — including profiles where the mathematically strongest relative score is
   itself low (Persona 1, §10).
10. Every plan includes exactly two Warning Lights, **except** when the Step 5 fallback
    (Ownership Mindset) applies, in which case a single fallback action is shown instead of two
    ranked Warning Lights (Persona 4, §10) — this exception applies only to Warning Lights, never
    to Strong Signal.
11. When multiple signals are tied for strongest (including an all-five tie), Strong Signal
    resolves via the fixed `getStrongestSignal` tie order — Cash Flow Control > Savings System >
    Debt Load > Emergency Runway > Wealth Fuel — with no other tie-break input considered.
12. The Workbook Connection names an exact tab and action from §8's restored action library —
    never a generic "see your Starter Kit" pointer.
13. Both CTAs render with their exact approved labels: **EMAIL MY FLIGHT PLAN** and **OPEN THE
    STARTER KIT**.
14. The plan never recommends a security, lender, credit product, debt settlement provider, tax
    position, or legal action.
15. The education-only disclaimer appears on the plan itself.
16. No financial input value, score, stage, or plan content is ever sent to analytics, logs, or
    embedded in a URL or email subject line.
17. Users already subscribed do not receive duplicate MailerLite enrollment.
18. The plan and Scorecard pass on current mobile Safari, mobile Chrome, desktop Chrome, and
    desktop Safari.
19. Every calibration record (§11) contains only fields from the MAY-contain list and never a
    field from the MUST-NOT-contain list — in particular, never a dollar amount, ratio computed
    directly from a dollar amount, or raw financial-form payload; the five relative category
    scores, where present, are normalized 0–1 values only.
20. A calibration record review never alters, rewrites, or overrides a plan already delivered to
    a user — Engine Failure Rate entries record disagreement with the engine for rule-refinement
    purposes only.
21. The Batch 1 → checkpoint → Batch 2 structure (§15) is followed exactly: Batch 2 recruitment
    does not begin until Batch 1's Engine Failure Rate has been evaluated against the ≤1/5
    proceed threshold, and no plan delivered in either batch is edited as a result of the
    checkpoint.
22. The pilot's Definition of Done metrics (§15) are independently measurable per tester, across
    both batches, without inventing new instrumentation later.

---

## 17. Explicit Non-Goals

Excluded from V1 (unchanged core list, with two additions from this reconciliation marked):

- Bank-account connections, Plaid/account aggregation, credit-report integrations
- Brokerage integrations, specific investment/security recommendations, tax optimization
- An AI financial-advisor chat interface, bill payment, forecasting/projection engines
- Complex multi-screen dashboards, recurring subscription/billing infrastructure, unnecessary
  gamification
- User accounts, persistent profiles, or a queryable financial database
- **Founder-in-the-loop delivery as the default path for any individual user's plan**
  *(Revision 3)* — Calibration Mode is sampled/complete QA on the pilot's Batches 1–2 only,
  never a per-user gate.
- **Server-side transmission or storage of raw financial inputs, in any form** *(Revision 3,
  strengthened from "not in analytics/repo" to "never transmitted at all")*.

---

## 18. Backlog

- Literal "months of runway" metric (backlog, unchanged).
- Priority #3 / 90-Day Direction beyond the 30-Day Mission.
- AI-assisted narrative generation, self-serve delivery at scale *(now largely achieved by this
  revision rather than deferred — removed from backlog)*, dynamic re-personalization, Flight
  Crew scheduling integration, multi-objective planning.
- Long-term objective field promoted to required, once validated.
- Reconciling the stale "On Approach" stage name in the Scorecard methodology docs.
- **Founder-assisted, hand-reviewed guidance as a future paid/premium offering** *(new,
  Revision 3, §14)* — the inverse of Revision 2's mistake: white-glove founder attention becomes
  a premium upsell once the automated version is the free baseline, not the free default itself.
- A future paid-pilot cohort testing a specific price point for Personalized Flight Plan itself —
  still no price committed.

---

## 19. Recommended V1

1. **No new financial intake, nothing transmitted** — reuse the 9 existing Scorecard fields,
   client-side only; add one required and one optional non-financial select, also client-side
   only.
2. **The §6 priority engine unchanged** — Hard Override/Flag-Context, relative ranking,
   stage-gate suppression, deterministic tie-break.
3. **Instant, self-service, automated delivery** for every user — no application gate, no
   founder-per-plan step.
4. **The restored one-page output**: Score + Stage, Strong Signal, Warning Light #1/#2, Do
   Now/This Payday/This Month, 30-Day Mission, exact Workbook Connection, EMAIL MY FLIGHT PLAN,
   OPEN THE STARTER KIT.
5. **Founder Calibration Mode, pilot-only**: reviews the pilot's 10 automated outputs across
   Batch 1 → checkpoint → Batch 2 after the fact, logs calibration records and the Engine Failure
   Rate, refines rules — never blocks delivery.
6. **Free, open self-service** — email requested only at the EMAIL MY FLIGHT PLAN step.
7. **Nothing sensitive retained** — financial data never leaves the browser; only the original's
   minimal outcome metadata (email, optional name, score, stage, source, completion date) is
   ever stored.

---

## 20. Open Decisions

1. **`privacy.html` copy update** — one line confirming Flight Plan inputs are client-side only,
   same as the existing Scorecard language; small, but should land before Batch 1.
2. **Flight Crew and Membership definitions** — still undocumented anywhere in the repository;
   the EMAIL MY FLIGHT PLAN step's WTP question and §18's future paid-tier idea both depend on at
   least a one-line honest description existing before launch.
3. **Exact wording/placement of the two new select fields** relative to the existing Scorecard
   form (appended vs. a follow-up screen) — a UI decision, not a product one, but affects
   completion-time expectations in §12.
4. **Rollout beyond the 10-user pilot** — this SPEC removes any fixed ceiling beyond Batch 1/
   Batch 2 on the reasoning that automation removes the founder-bandwidth constraint; confirm the
   Founder agrees that's the right call before treating the pilot's DoD pass as a green light for
   open rollout.
5. **Future paid price point** for either a paid Personalized Flight Plan cohort or a
   founder-assisted premium tier (§14, §18) — intentionally not committed in this SPEC.

---

## 21. Final Verdict

**SPEC CLOSURE COMPLETE — READY FOR FINAL RE-REVIEW**

Revision 4 closes both P1 findings from the independent Revision 3 Product Re-Review (`PASS WITH
CHANGES`) without reopening product strategy or the personalization engine, per instruction:

- **Strong Signal omission ambiguity** is resolved with Option A — always show the mathematically
  strongest relative signal, framed as relative-strongest rather than overall-financial-health,
  with a deterministic tie-break reusing the live `getStrongestSignal` stable-sort order for the
  all-tied case (§6, §8, §10 Personas 1 and 4).
- **Calibration record data model** is explicitly defined with a MAY-contain / MUST-NOT-contain
  schema that preserves Revision 3's client-side-only financial data architecture — the record is
  temporary pilot QA evidence, scoped to the pilot's two batches, never a user account or
  persistent financial profile (§11, §13).

The reviewer's two non-blocking closures are also complete: the product is named **Personalized
Flight Plan** throughout current-tense prose (title, §1, §4, §14, §20 — historical quotes in the
Revision 3 log are left verbatim as a record of what was said at the time; the file path is
unchanged to avoid Git churn), and the pilot is restructured to **5 observed independent users →
checkpoint → 5 additional independent users**, still 10 total, still fully self-service with no
delivered plan edited at the checkpoint (§15). "Calibration Override Rate" is renamed **Engine
Failure Rate**, defined as purely diagnostic, with unexpected manual intervention tracked as a
separate, distinct count. No engineering plan or code is included, per instruction.
