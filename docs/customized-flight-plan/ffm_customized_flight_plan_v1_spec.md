# FFM Customized Flight Plan V1 — Product Specification

Phase: SPEC REVISION (post independent Product Challenge)
Author role: FFM Product Architect / SPEC Owner
Status: Revision 2 — Product Challenge returned **APPROVE WITH CHANGES**; this revision
resolves all P0/P1/P2 findings below.

Grounding note: this SPEC is reconciled against current repository source of truth —
`docs/scorecard/*`, `docs/funnel/README.md`, `src/flightScoreCalculator.js`, `src/main.js`,
`index.html`, `privacy.html`, `terms.html`. Where docs and live code disagree (the 40–69
band is named "On Approach" in the Scorecard methodology docs but shipped as **"Turbulence"**
in `flightScoreCalculator.js` and on the live site), this SPEC treats the live code/site as
authoritative and uses **Pre-Flight → Turbulence → Cruise Control → Flight Mode**. No new
stages are introduced. Nothing in this revision changes the live Scorecard's own
`getStage`/`calculateFlightScore` code — the crisis-override boundary discussed below (§6)
governs only the new Customized Flight Plan priority engine, not the shipped stage
calculation.

---

## Revision 2 — Challenge Resolution Log

| # | Level | Finding | SPEC Section(s) Changed | Status |
|---|---|---|---|---|
| 1 | P0 | Privacy/consent model conflicted with live "not stored" posture | §13, §17 (non-goals), §19 | Resolved — SPEC now specifies one-time submission into a private, access-controlled operational workflow; exact retention day-count flagged in §20 for Founder sign-off |
| 2 | P0 | Crisis-override boundary used `< 0`, missing exact-zero fragility | §6 Step 1, §10 (Persona 1) | Resolved — boundary changed to `<= 0` with explicit justification; applies only to the Flight Plan priority engine, not the live stage calculator |
| 3 | P0 | Founder could silently rescue weak engine output | §11, §15 | Resolved — explicit Founder MAY / MUST NOT list, override logging requirement, Founder Override Rate added as a core pilot metric |
| 4 | P1 | Short-term objective was REQUIRED; "buy a home" implied regulated guidance | §5, §6 Step 4 | Resolved — objective is now OPTIONAL; "buy a home" removed and replaced with a fully generic 5-option set, one per signal |
| 5 | P1 | "Similarly weak" tie-break was undefined | §6 Step 4 | Resolved — deterministic 0.10 (10-percentage-point) relative-score threshold defined, applied only between adjacent-ranked candidates |
| 6 | P1 | Subjective pressure could override objective signals unconditionally | §6 Step 1 (Hard Override vs. Flag/Context) | Resolved — pressure alone only overrides when corroborated by an existing fragility threshold already used by the live calculator (savingsRate < 5%, emergencyFundLevel < 25%, or cashRemaining ≤ 0) |
| 7 | P1 | Warning/Turbulence Indicator was a redundant standalone output | §8 | Resolved — removed as a separate element; its explanation is folded into Priority #1 |
| 8 | P1 | Differentiation section led with surface features, not methodology | §6 (new closing subsection) | Resolved — reframed around category weighting, relative scoring, stage-gate sequencing, priority suppression, and ecosystem routing |
| 9 | P2 | Pilot sized at ~20 users with no staged checkpoint | §15 | Resolved — Wave 1 (5 users, 5 required profile types) → explicit checkpoint → Wave 2 (up to 15) |
| 10 | P2 | Success metrics didn't distinguish decision-critical from operational | §15 | Resolved — 5 decision metrics prioritized (Action, Clarity, Trust, Product Continuation, Founder Override Rate); Activation/Completion demoted to operational; Wave 1 go/no-go thresholds defined |
| 11 | — | Monetization needed a Wave 1 vs. later-cohort distinction | §14 | Resolved — Wave 1 stays free; a later paid-pilot cohort is a conditional recommendation, no price committed |
| 12 | — | Personas didn't test the revised rules | §10 | Resolved — all four personas rebuilt and hand-verified against the live scoring formulas to exercise zero-cash, negative-cash, close-signal, and strong-profile-with-flagged-pressure cases |
| 13 | — | Acceptance criteria didn't cover the above | §16 | Resolved — criteria rewritten to test each revised rule explicitly |
| 14 | — | No change log existed | This section | Resolved |

---

## 1. Executive Product Definition

Customized Flight Plan V1 is a founder-guided, rules-based personalization layer that sits
between the free Scorecard/Starter Kit and the future Flight Crew/Membership tiers. It takes
a user's existing Scorecard inputs plus one new required field (and one optional field) and
returns a single short document: current position, a strict priority order (not a list of
equal options), a 30-day action sequence, and a next-step CTA into the FFM ecosystem.

It is not a budgeting app, not an advisor, and not a dashboard. It is a **decision artifact**
— its entire job is to prove FFM can look at a specific person's numbers and correctly tell
them what matters most right now, in a way generic budgeting content cannot. §6 closes with
an explicit answer to "why is this more than a worksheet."

---

## 2. User / Problem

**Primary V1 user:** Someone who has completed the free Scorecard (already inside the FFM
funnel) and is most likely in **Pre-Flight or Turbulence** — the two stages the current
site's own funnel is built to serve first (free Starter Kit, five-message Pre-Flight
sequence). They may have downloaded the Starter Kit but have not achieved consistent
execution.

- **Financial situation:** irregular follow-through on a budget; some awareness of income/
  bills but not of how the pieces rank against each other.
- **Pain points:** decision fatigue ("I know I should save more AND pay down debt AND build
  an emergency fund — which first?"); generic content that restates what they already know
  without sequencing it.
- **Current FFM stage:** Pre-Flight or Turbulence (majority); Cruise Control/Flight Mode users
  are real but secondary for V1 learning purposes.
- **Emotional state:** anxious, mistrustful of finance content, wants to be told the truth
  without being shamed.
- **Why existing budgeting apps are insufficient:** they display data, they don't prioritize
  it. They require ongoing manual categorization. They rarely say "do X before Y."
- **What they actually need from FFM:** a short, specific, ranked answer — not more data entry,
  not more education, not a dashboard.
- **Desired action after receiving the plan:** complete the first 30-day action, and take the
  next visible FFM step (Weekly Reset / eventual Flight Crew or Membership CTA).

V1 does not attempt to serve every financial user type — it is built for the person who has
already raised their hand via the Scorecard. (Unchanged by Revision 2.)

---

## 3. Core Job To Be Done

**Core Job:** *Tell me, in priority order, what to fix first given my actual numbers, so I
stop guessing.*

- **Supporting Jobs:** show the "why" behind the ranking (now folded into Priority #1, §8);
  translate the #1 priority into one concrete first action; connect the plan back into the
  existing Starter Kit sections and next FFM product.
- **Future Jobs (post-V1):** recurring/updating plans over time; Flight Crew accountability
  integration; goal/scenario tracking; multi-objective planning (e.g., simultaneous debt +
  home-purchase goals).

Customized Flight Plan has one center of gravity: **ranked priority, not a plan of
everything.** (Unchanged by Revision 2.)

---

## 4. Product Position in the FFM Ecosystem

Confirmed ecosystem (per Founder-provided sequence, not altered here):

`Scorecard → Starter Kit → Flight Plan System → Customized Flight Plan → Flight Crew → Membership`

- **Scorecard** — the diagnostic. Live, free, client-side only, produces score + stage +
  strongest signal + warning light (`src/flightScoreCalculator.js`).
- **Starter Kit** — the free self-serve execution kit (7-tab workbook, 12-page kit, 8-page
  setup guide, weekly reset). Today its only personalization is a single stage-matched
  workbook section (`starterSection` field) — no ranked priorities.
- **Flight Plan System** — the workbook/execution system itself that the Starter Kit teaches
  the user to run. The manual system, not a personalized product.
- **Customized Flight Plan (V1, this SPEC)** — the missing link: takes the same signals the
  Scorecard already computes and turns them into a ranked, specific plan instead of a single
  stage-matched section pointer. A **precision upgrade** over the free Starter Kit, not a
  parallel product.
- **Flight Crew** — undocumented anywhere in the repository. Treated as the future
  human/community accountability layer. Not designed in this SPEC.
- **Membership** — undocumented. Treated as the future recurring paid tier. Not designed here.

Customized Flight Plan V1 must **reuse** the Scorecard's existing five signals and scoring
logic rather than invent a second scoring system, and its output must **route back into**
the Starter Kit's existing workbook sections. (Unchanged by Revision 2.)

---

## 5. Required Inputs Matrix

| Input | Classification | Why It's Needed / Effect on Output | Privacy Sensitivity | Already in FFM? |
|---|---|---|---|---|
| Monthly income | REQUIRED | Denominator for every ratio. | Moderate | Yes — Scorecard |
| Needs (fixed expenses) | REQUIRED | Determines cash remaining. | Moderate | Yes — Scorecard |
| Wants (variable spending) | REQUIRED | Same. | Moderate | Yes — Scorecard |
| Savings (monthly) | REQUIRED | Drives Savings System signal and savings rate. | Moderate | Yes — Scorecard |
| Extra debt payment | REQUIRED | Distinguishes carrying debt from attacking it. | Moderate | Yes — Scorecard |
| Total debt balance | REQUIRED | Drives Debt Load signal. | Higher | Yes — Scorecard |
| Emergency fund saved / goal | REQUIRED | Drives Emergency Runway signal and the Financial Runway output. | Moderate | Yes — Scorecard |
| Current investment value | REQUIRED | Drives Wealth Fuel signal. | Higher | Yes — Scorecard |
| Immediate pressure (single-select: **Stable / Unexpected bill / Income disruption / Falling behind on a payment**) | REQUIRED | Feeds the Hard-Override-vs-Flag/Context decision in §6 Step 1. Stays required because the engine cannot evaluate override eligibility without it. | Low — categories only, no narrative | No — new, minimal field |
| **Short-term objective** (single-select: **Stop the bleeding / Build a cushion / Get out of debt / Save more consistently / Start investing**) | **OPTIONAL (Revision 2 — was REQUIRED)** | Its only role is breaking ties between two closely-weak signals (§6 Step 4). When omitted, the tie-break falls back to a fixed default order — the engine never blocks on this field. "Buy a home" removed (Revision 2, Finding P1-4): every remaining option maps 1:1 to one of the five existing signals and implies no lending, mortgage, or DTI guidance. | Low | No — new, minimal field |
| Email / contact | REQUIRED | Needed to deliver the plan. | Moderate (PII) | Yes — existing lead form / MailerLite |
| Score / stage | DERIVED | Computed via the existing calculator — never asked directly. | N/A | Yes — Scorecard |
| Long-term objective / life goal | OPTIONAL | Color for the 90-Day Direction line only (backlog, §18). | Low–Moderate | No |
| Credit utilization | DO NOT COLLECT IN V1 | Pulls toward credit-report integration, an explicit non-goal. | High | No |
| Investment account detail | DO NOT COLLECT IN V1 | Edges toward individualized investment advice. | High | No |
| Bank balances / linked transactions | DO NOT COLLECT IN V1 | Explicit non-goal (no Plaid/aggregation). | Very high | No |

**Principle applied:** every REQUIRED input either already exists in the live Scorecard or is
the one new required field. Exactly one new field remains optional. No new financial-data
category is introduced.

---

## 6. Personalization Framework

The engine is a conceptual decision framework, not new scoring math — it **reuses** the
relative-category-scoring approach already implemented in `flightScoreCalculator.js`
(`getRelativeCategoryScores` / `getWarningLight` / `getStrongestSignal`). "Relative score" below
always means a category's score divided by its own maximum (the same 0–1 fraction the live
calculator already computes) — this is distinct from `emergencyFundLevel` (saved ÷ goal),
which is a display metric (§8 Financial Runway), not a ranking input. Keeping these two
numbers separate matters: Revision 1 conflated them in worked examples, which Revision 2's
personas (§10) correct.

### Step 1 — Crisis logic: Hard Override vs. Flag/Context (Revised — Findings P0-2, P1-6)

**Objective Fragility Signals** (reused verbatim from the live calculator's own
Turbulence-forcing conditions — no new thresholds invented):
- `cashRemaining <= 0` **(Revision 2 — was `< 0`)**
- `savingsRate < 0.05`
- `emergencyFundLevel < 0.25`

**Why `<= 0` and not `< 0`:** a household at exactly zero remaining cash has no margin for a
single unplanned expense — the next dollar of variance pushes them negative. Treating exact
break-even as "safe" contradicts the Scorecard's own public framing ("cash flow shows whether
your money has room to breathe"); zero is not breathing room. `<= 0` is the smallest change
that closes this gap without inventing a new formula.

**Hard Override** (Priority #1 is automatically **Cash Flow Control**, no exception):
- `cashRemaining <= 0` on its own is always sufficient, regardless of any self-reported
  pressure selection; **or**
- the user selects a non-"Stable" immediate-pressure option **and** at least one other
  Objective Fragility Signal is also true (`savingsRate < 0.05` or `emergencyFundLevel < 0.25`).

**Flag / Context** (engine ranks normally via Steps 2–4; the self-reported pressure is
appended as a short contextual note, not applied to ordering):
- the user selects a non-"Stable" immediate-pressure option **but no** Objective Fragility
  Signal corroborates it (`cashRemaining > 0` **and** `savingsRate >= 0.05` **and**
  `emergencyFundLevel >= 0.25`).

This keeps the rule to one sentence in either direction: *a subjective pressure flag only
changes the plan when an objective number backs it up; otherwise it's acknowledged, not acted
on.* Persona 4 (§10) is the worked proof of the Flag/Context branch.

### Step 2 — Rank the five signals by relative weakness.

When there is no Hard Override, compute each signal's relative score (score ÷ category max).
Sort ascending. The weakest is the Priority #1 candidate, the next weakest is the Priority #2
candidate, and so on.

### Step 3 — Apply stage-appropriate sequencing.

For **Pre-Flight and Turbulence** only, Wealth Fuel is never promoted to Priority #1 or #2
ahead of Cash Flow Control, Emergency Runway, or Debt Load, even if it is technically the
weakest relative signal — this matches the evidence-library posture already documented in the
Scorecard SOP (build a basic buffer before advanced moves). Cruise Control and Flight Mode
apply no such suppression.

### Step 4 — Deterministic tie-break (Revised — Finding P1-5)

Two candidates are considered **tied** when the gap between their relative scores is
**≤ 0.10** (10 percentage points) — and only when that gap is between two *adjacent-ranked*
candidates being decided for the same priority slot (i.e., the current #1-vs-#2 comparison, or
#2-vs-#3). 0.10 is chosen because it comfortably exceeds the score movement of a single
step in the underlying per-category tier functions (e.g., one savings-rate tier is a 6–7 point
swing on a 25-point scale, ≈ 24–28% relative) while still catching genuine near-ties — it will
not fire on differences that the existing formula already treats as clearly distinct.

- If the (optional) short-term objective maps to one of the two tied categories (Stop the
  bleeding → Cash Flow Control · Build a cushion → Emergency Runway · Get out of debt → Debt
  Load · Save more consistently → Savings System · Start investing → Wealth Fuel), that
  category is promoted to the higher slot.
- If the objective was omitted, or maps to neither tied category, the tie resolves to the
  fixed safety-sequence order: **Cash Flow Control > Emergency Runway > Debt Load > Savings
  System > Wealth Fuel.**

This is fully deterministic — no engineering interpretation is required later. Persona 3
(§10) walks all three branches (objective present and matching, objective present and
non-matching a different tied signal, objective omitted).

### Step 5 — Priority #3 (optional).

Shown only when a third signal's relative score is below 0.90 (the same threshold the existing
`getWarningLight` "Optimization Capacity" fallback already uses). If every remaining signal is
at or above 0.90, Priority #3 is replaced by a stage-appropriate growth action instead of a
manufactured weakness.

### Why this is more than a worksheet (Revision 2 — Finding P1-8)

The differentiation is **not** the two new form fields, founder delivery, or formatting — a
generic chatbot plus a budgeting worksheet could produce comparable-looking text. What it
cannot easily reproduce without FFM's own methodology is:

1. **Category weighting that already encodes FFM's judgment** — the five signals aren't
   weighted equally (25/25/20/20/10); that split is a methodology decision documented in the
   Scorecard SOP, not a generic best-practice list.
2. **Relative scoring, not raw values** — ranking by score ÷ category max, not by dollar
   amounts, is what lets a $9,000 debt balance and a 67% emergency fund be compared on the
   same axis at all.
3. **Stage-gate sequencing** — the same weakest-signal math produces a different answer in
   Pre-Flight/Turbulence than in Cruise Control/Flight Mode (Step 3), because FFM has an
   opinion about sequencing survival before optimization that a generic tool has no basis to
   apply.
4. **Priority suppression rules** — actively preventing a technically-true-but-wrong answer
   (e.g., "invest more" for someone with negative cash flow) is a deliberate constraint, not
   an emergent property of asking an LLM to "prioritize my finances."
5. **Ordered, checkable action sequencing** — NOW/THIS WEEK/THIS MONTH/NEXT CHECKPOINT tied to
   the ranked priority, not generic tips.
6. **Ecosystem routing** — the plan always lands the user back inside FFM's own Starter Kit
   section and forward toward Flight Crew, which no general-purpose tool can do.

A worksheet or a chat assistant can produce *a* plan. It cannot produce *FFM's* plan without
FFM's category weights, sequencing rules, and suppression logic — which is exactly what this
engine operationalizes.

---

## 7. Stage Logic

*(Pre-Flight → Turbulence → Cruise Control → Flight Mode — no new stages added. Unchanged by
Revision 2; not implicated by any challenge finding.)*

### Pre-Flight
- **Primary Objective:** Establish baseline visibility and make sure cash flow isn't
  actively negative before anything else.
- **Common Risks:** No working budget; irregular income tracking; reactive decisions;
  avoidance of looking at the numbers at all.
- **Priority Actions:** Confirm income/bills baseline; identify the first leak; get monthly
  cash remaining to zero or above.
- **Graduation Signal:** A full pay cycle of non-negative cash flow plus a started (>0)
  emergency fund.

### Turbulence
- **Primary Objective:** Stabilize. Stop whatever is actively wrong before optimizing
  anything.
- **Common Risks:** Debt servicing eating all flexibility; treating a symptom instead of the
  systemic leak; no repeatable weekly check-in.
- **Priority Actions:** Fix negative cash flow first if present; otherwise raise savings rate
  above 5% and push the emergency fund toward 25% of goal; pick one pressure point per week.
- **Graduation Signal:** Score ≥ 70 with no critical cash failure.

### Cruise Control
- **Primary Objective:** Make progress repeatable. Automate what's working; close the
  remaining gaps.
- **Common Risks:** Plateauing because nothing feels urgent; inconsistent weekly review;
  debt paid on autopilot with no acceleration plan.
- **Priority Actions:** Automate savings/debt payments; push the emergency fund to 100% of
  goal; start or increase wealth-fuel contributions.
- **Graduation Signal:** Score ≥ 90 with strength across all five categories, sustained over
  more than one review cycle.

### Flight Mode
- **Primary Objective:** Optimize and expand — protect the system, grow income/investing
  capacity, move from stability toward ownership.
- **Common Risks:** Complacency; lifestyle creep eroding the savings rate; no plan for turning
  stability into a bigger goal.
- **Priority Actions:** Monthly full-dashboard review; increase investing or income capacity;
  set an ownership-readiness goal.
- **Graduation Signal:** Not a further Scorecard stage — readiness for Flight Crew/Membership.

---

## 8. Customized Flight Plan Output

| Output Element | Classification | Notes |
|---|---|---|
| Current Position | REQUIRED | Score + five-signal snapshot, reusing existing calculator output. |
| Flight Status (stage + explanation) | REQUIRED | Reuses existing stage name/message. |
| **Priority #1 (with integrated why/warning explanation)** | REQUIRED | Per §6 engine. **Revision 2 (Finding P1-7):** the standalone Warning/Turbulence Indicator is removed — its explanation of which signal is weakest and why now lives directly inside Priority #1's narrative, so the user reads one explanation, not two descriptions of the same underlying signal. |
| Priority #2 | REQUIRED | Per §6 engine. |
| Priority #3 | OPTIONAL | Shown only when a third signal is meaningfully weak, or replaced by a growth action for strong profiles. |
| Financial Runway | REQUIRED | Reuses existing `emergencyFundLevel` (% of user-defined goal) — a **display** metric, distinct from the relative scores used for ranking (§6). A literal "months of runway" metric remains deliberately deferred (§18). |
| ~~Warning / Turbulence Indicator~~ | **REMOVED (Revision 2)** | Folded into Priority #1 above. |
| 30-Day Flight Plan | REQUIRED | See §9. |
| 90-Day Direction | OPTIONAL | One sentence of directional framing — not a roadmap. |
| Next FFM Product CTA (+ WTP question where appropriate) | REQUIRED | Routes to the matching Starter Kit workbook section today; honest "in development" framing for Flight Crew; carries the willingness-to-pay question defined in §14. |

---

## 9. 30-Day Action Framework

Every plan converts its Priority #1 into exactly one behavior sequence — not a list of
educational tips.

- **NOW:** The single first action, completable today.
- **THIS WEEK:** One concrete step that operationalizes the priority.
- **THIS MONTH:** The behavior that needs to become consistent.
- **NEXT CHECKPOINT:** A specific, self-checkable measure of progress — never a vague "review
  your finances."

This stays a short list of behaviors, not a task manager or recurring app (explicit
non-goal, §17). (Unchanged by Revision 2.)

---

## 10. Four Personalization Examples (Rebuilt — Finding P2-12)

*Hand-verified against the live `calculateFlightScore` formulas in
`src/flightScoreCalculator.js`. Each persona is chosen to exercise one of the revised rules
required by the challenge: exactly-zero cash, negative cash, a close-signal tie-break, and a
strong profile with self-reported (uncorroborated) pressure.*

### Persona 1 — Pre-Flight, exactly zero remaining cash: "Maya"
Income $3,000 · Needs $2,200 · Wants $650 · Savings $150 · Extra debt payment $0 · Total debt
$14,000 · Emergency fund $500 / $2,000 goal · Investments $0. Pressure: Stable.

- `cashRemaining = 3000 − 2200 − 650 − 150 − 0 = $0`. Category scores: cashRemaining 10,
  savingsRate 12, debtPressure 3, emergencyFund 10, investments 0 → **score 35**. Stage
  calculation is untouched by this SPEC and still evaluates to **Pre-Flight** (`cashRemaining`
  is not `< 0`, `savingsRate` = 0.05 is not `< 0.05`, `emergencyFundLevel` = 0.25 is not
  `< 0.25`).
- **Engine (Revision 2):** `cashRemaining <= 0` is true → **Hard Override**. Under the old
  `< 0` boundary this profile would *not* have triggered an override, and the weakest-signal
  math alone would have surfaced Debt Load first — leaving a $0 margin unprotected. This is
  the exact case the boundary fix (Finding P0-2) exists for.
- **Priority #1:** Cash Flow Control (Hard Override) — "Your cash flow is exactly break-even
  right now, which means any surprise expense puts you negative. That's the first thing to
  protect, even though debt is your largest score drag."
- **Priority #2:** Debt Load (relative score 0.15 — weakest among non-suppressed signals;
  Wealth Fuel's 0.0 is technically lower but suppressed per Step 3 for Pre-Flight).
- 30-Day: NOW = open a separate account and move any surplus dollar there; THIS WEEK = confirm
  every bill against Needs; THIS MONTH = pick one debt to target once cash flow stays ≥ $0.

### Persona 2 — Turbulence, negative remaining cash: "Jordan"
Income $4,200 · Needs $3,200 · Wants $1,200 · Savings $0 · Extra debt payment $100 · Total debt
$6,000 · Emergency fund $200 / $2,000 goal · Investments $0. Pressure: Falling behind on a
payment.

- `cashRemaining = 4200 − 3200 − 1200 − 0 − 100 = −$300`. Category scores: cashRemaining 0,
  savingsRate 5, debtPressure 15, emergencyFund 5, investments 0 → **score 25**. Stage =
  **Turbulence** (`cashRemaining < 0` forces this in the live, unmodified calculator).
- **Engine:** `cashRemaining <= 0` → **Hard Override** (also would have triggered under the
  old `< 0` boundary — this persona is the negative-cash control case).
- **Priority #1:** Cash Flow Control — stop the $300/month shortfall.
- **Priority #2:** relative scores among non-suppressed signals: savingsRate 0.20, debtPressure
  0.75, emergencyFund 0.25 → weakest is **Savings System (0.20)**, not Emergency Runway —
  correcting a Revision 1 error that ranked by `emergencyFundLevel` (a display metric) instead
  of the category's relative score.
- 30-Day: NOW = cut one recurring expense today; THIS WEEK = confirm which bill is driving the
  shortfall; THIS MONTH = get cash remaining to ≥ $0, then start a $25/week savings habit.

### Persona 3 — Cruise Control, close-signal tie-break: "Priya"
Income $6,000 · Needs $2,800 · Wants $1,200 · Savings $600 · Extra debt payment $200 · Total
debt $9,000 · Emergency fund $6,000 / $9,000 goal · Investments $8,000. Pressure: Stable.

- `cashRemaining = $1,200`. Category scores: cashRemaining 25, savingsRate 18, debtPressure 16,
  emergencyFund 15, investments 8 → **score 82** → **Cruise Control**, no Hard Override
  (`cashRemaining > 0`, pressure = Stable).
- Relative scores: savingsRate 0.72, emergencyFund 0.75, debtPressure 0.80, investments 0.80,
  cashRemaining 1.0. Weakest two: **Savings System (0.72)** and **Emergency Runway (0.75)** —
  gap = 0.03, well under the 0.10 tie threshold → **tied**.
- **If objective = "Save more consistently":** confirms the raw ranking → Priority #1 =
  Savings System, Priority #2 = Emergency Runway.
- **If objective = "Build a cushion":** overrides the raw ranking via the tie-break → Priority
  #1 = Emergency Runway, Priority #2 = Savings System.
- **If objective is omitted:** falls back to the fixed safety-sequence order (Emergency Runway
  ranks ahead of Savings System in that sequence) → Priority #1 = Emergency Runway, Priority #2
  = Savings System.
- 30-Day (objective-omitted branch): NOW = automate the remaining ~$1,000 toward full runway;
  THIS WEEK = set the auto-transfer date; THIS MONTH = confirm runway hits 100% of goal.

### Persona 4 — Flight Mode, strong profile + uncorroborated pressure: "Alex"
Income $8,000 · Needs $2,600 · Wants $1,000 · Savings $1,600 · Extra debt payment $0 · Total
debt $0 · Emergency fund $15,000 / $15,000 goal · Investments $40,000. Pressure: Unexpected
bill.

- `cashRemaining = $2,800`. Category scores: cashRemaining 25, savingsRate 25, debtPressure 20,
  emergencyFund 20, investments 10 → **score 100** → **Flight Mode**. All relative scores =
  1.0 (fully maxed).
- **Engine:** pressure = "Unexpected bill" (non-Stable), but `cashRemaining > 0`,
  `savingsRate` (0.20) is not `< 0.05`, `emergencyFundLevel` (1.0) is not `< 0.25` — **no**
  Objective Fragility Signal corroborates it → **Flag/Context**, not Hard Override. This is
  the direct proof for Finding P1-6: a financially strong user's self-reported temporary
  pressure does not silently replace an objectively stronger priority.
- **Priority #1:** growth action (Optimization Capacity fallback, all signals ≥ 0.90), with a
  short contextual line acknowledging the reported bill without changing the ranking: "You
  flagged an unexpected bill — your numbers currently show strong reserves to absorb it. If
  this reflects a bigger recent change, retake this with updated numbers."
- **Priority #2:** ownership-readiness goal, shaped by the (optional) long-term objective if
  provided.
- 30-Day: NOW = confirm the bill was absorbed without touching investments; THIS MONTH =
  scheduled full-dashboard review per the Flight Mode stage logic (§7).

These four outputs differ in which rule fires and why — Persona 1 and 2 both land on Cash Flow
Control but through the same Hard Override rule at two different severities; Persona 3 shows
the deterministic tie-break changing the answer in three legitimate directions; Persona 4
shows the engine explicitly *not* reacting to an uncorroborated flag. This is the concrete
proof the personalization is rule-driven, not templated text.

---

## 11. Automated vs. Founder-Assisted Matrix

| Rules-Based (deterministic, no per-case human input) | Founder-Assisted (Wave 1, 5 users) | Deferred |
|---|---|---|
| Stage determination (existing calculator, unmodified) | Tone pass, delivery presentation/channel | Full narrative generation via an LLM |
| Priority #1/#2/#3 ranking (§6 engine, including Hard Override / tie-break) | Flagging an output for review | Instant, fully self-serve delivery at scale |
| Priority #1 explanation text (folds in former warning-light context) | Interpreting free-text edge cases the two select fields don't cleanly cover | Dynamic re-personalization on repeat visits |
| 30-Day action template selection per priority | Recording override log entries (below) | Flight Crew scheduling integration |
| — | Collecting the qualitative pilot-metrics answers (§15) | Payment/subscription automation |

### Founder Editing Boundary (Revision 2 — Finding P0-3)

The pilot must test the **engine**, not the Founder's ability to rescue a weak output.

**Founder MAY:** adjust tone; fix grammar; add brief encouragement; choose delivery
presentation/channel; flag an output for review.

**Founder MUST NOT, silently:** change Priority #1; change Priority #2; reorder priorities;
materially rewrite the prescribed 30-day action; substitute a different recommendation.

**If the Founder believes an engine output is wrong:** it is logged, not quietly fixed. The
override log records — per plan — the input profile summary, the engine's computed output, the
Founder's proposed correction, and the stated reason. Nothing is corrected in the delivered
plan without that entry existing first. This log is the source of the **Founder Override
Rate** metric (§15) — a plan that required a logged override still counts against the engine's
performance, not in its favor.

---

## 12. User Journey

`Scorecard (existing) → Customized Flight Plan request → Explicit consent → Processing → Plan Delivery → Action → Follow-Up`

- **Steps:** Scorecard (existing) → one short additional form (1 required select + 1 optional
  select + email + explicit consent checkbox, §13) → confirmation state → delivered plan.
- **Estimated completion time:** under 60–90 seconds (the optional field, Revision 2, can be
  skipped).
- **Progress indicator:** none needed — one-screen form.
- **Save/return:** not required in V1 (no account system — see §13's explicit non-account
  model); an abandoned form simply restarts.
- **Mobile:** single-column form at parity with the existing scorecard's mobile behavior.
- **Empty/error states:** reuse the existing scorecard validation pattern — plain-language
  inline errors.
- **Why we're asking:** one line above the fields explaining that the required field
  determines override eligibility (§6) and the optional field only breaks close ties.
- **Consent (Revision 2, Finding P0-1):** a distinct, unchecked-by-default consent statement
  at submission — separate from the existing Starter Kit email consent — naming exactly what
  happens to the data (§13). The form cannot submit without it being affirmatively checked.
- **Next CTA:** the plan always ends on the matching Starter Kit workbook section, with honest
  "in development" framing for Flight Crew, plus the WTP question (§14) where appropriate.

---

## 13. Trust, Privacy, and Advice Boundaries (Rewritten — Finding P0-1, LAUNCH BLOCKER)

**The privacy conflict this section resolves:** the live Scorecard's privacy posture states
inputs "run in your browser" and are "not stored." A founder-reviewed Customized Flight Plan
cannot honor that literally — the data must leave the browser for the Founder to review and
deliver. This section defines the narrowest model that makes that honest, not the current
"nothing is stored" claim carried over unchanged.

**Model: one-time submission into a private, access-controlled operational workflow.**
Explicitly **not**: a user account, a persistent profile, a queryable financial database, or
indefinite storage. (Also encoded as a non-goal in §17.)

- **Exact purpose of retention:** generate the plan, allow the Founder's bounded review (§11),
  deliver the plan, and support exactly one defined pilot follow-up check-in (§15). No other
  use.
- **Explicit consent at collection:** a standalone statement at submission (distinct from the
  existing Starter Kit consent), e.g.: *"I understand my answers will be used once to generate
  my personalized Flight Plan, reviewed by the FFM Founder, and deleted within 45 days."*
  Must be affirmatively checked — never pre-checked, never implied by submitting the rest of
  the form.
- **Minimum retention:** through delivery plus the single follow-up window — **45 days** from
  submission (covers the 30-day plan itself plus a short buffer for the follow-up
  question in §15). This is a concrete starting number for Founder sign-off, not an open
  question left to interpretation (remaining calibration noted in §20).
- **Deletion:** hard-deleted at the end of the retention window — not archived, not
  anonymized-and-kept. A user may request earlier deletion at any time via the same contact
  path already described in `privacy.html`'s "Your Choices" section.
- **Who may access:** the Founder only, during the pilot. No third party. Not merged into the
  general MailerLite marketing list's custom fields or any shared/synced tool beyond the
  Founder's own private, access-controlled record.
- **Never in analytics:** financial input values, computed score, stage, or plan content —
  matching the existing GA4 rule (`privacy.html`, `docs/funnel/README.md`).
- **Never logged in the repository or in unsecured tooling:** any individual user's raw
  financial figures, email, or plan content.
- **Launch requirement:** `privacy.html` must carry a dedicated Customized Flight Plan section
  describing this exact model before Wave 1 begins collecting real user data. **This is a
  launch blocker**, not a nice-to-have — see §D of the revision output.
- **Disclaimer:** identical education-only posture as the existing Scorecard/Starter Kit — not
  financial, investment, tax, legal, or debt advice. Appears on the plan itself.
- **Advice boundary:** the plan ranks and sequences the user's own self-reported numbers using
  FFM's documented methodology; it never recommends a specific investment, lender, debt-payoff
  product, or tax action.

---

## 14. Monetization Recommendation (Revised — Finding P2-11)

**Wave 1 (5 users): free, application-gated, founder-assisted. No payment is introduced into
the first five-user pilot.**

Reasoning unchanged from Revision 1: the objective is to prove personalization value, clarity,
and engagement before contaminating those signals with purchase friction. The
willingness-to-pay question at delivery (§8, §15) is about the *next* ecosystem step (Flight
Crew), not about charging for the plan itself.

**Conditional recommendation for later cohorts:** if Wave 1 and/or Wave 2 (§15) establish
sufficient trust and action value, a later cohort — beyond Wave 2 — may test a small paid
price point for the Customized Flight Plan itself, specifically to obtain direct
willingness-to-pay evidence rather than the proxy question used in Wave 1/2. **No specific
price is committed in this SPEC**; that number is an open decision (§20) to be set only once
Wave 1/2 evidence exists to inform it.

---

## 15. Pilot Design & Success Metrics (Rewritten — Findings P2-9, P2-10)

### Wave 1 — 5 users

Recruit exactly five pilot users whose profiles deliberately exercise five different branches
of the revised engine:

1. **Crisis-override case** (negative or exactly-zero cash — Persona 1/2 pattern, §10).
2. **Non-crisis Turbulence case** (Turbulence stage, no Hard Override — e.g., low savings rate
   and thin emergency fund but positive cash flow).
3. **Cruise Control case** (Persona 3 pattern).
4. **Close-signal / tie-break case** (two relative scores within the 0.10 threshold, §6 Step
   4 — can overlap with #3 if it also happens to be Cruise Control, but must be recruited
   specifically for the tie condition, not assumed).
5. **One additional representative profile** — Founder's choice, filling whatever
   stage/branch combination isn't already covered by #1–#4 (e.g., a Flight Mode /
   Flag-Context case per Persona 4).

**Checkpoint:** after all five Wave 1 plans are delivered and the follow-up window (§13, up to
45 days, though the pilot follow-up question itself should be asked around day 14–30) has
closed for all five, the Founder runs an explicit go/no-go review before recruiting Wave 2.

### Wave 2 — up to 15 additional users

Proceeds **only if** Wave 1 meets the continuation criteria below. Wave 2 continues under the
same free/gated/founder-assisted model (§14) — no automation or payment is introduced by
advancing waves alone.

### Metrics — five decision-critical, two operational

**Decision-critical (drive the continue/revise/kill call):**

1. **Action** — completed the NOW action within 7 days.
2. **Clarity** — can restate Priority #1 in their own words, unprompted.
3. **Trust / Relevance** — rates the plan as feeling specific to their actual situation, not
   generic.
4. **Product Continuation** — takes the next meaningful FFM action (Starter Kit section,
   Weekly Reset, or next signup) within the defined 14-day follow-up window.
5. **Founder Override Rate** — % of Wave 1 plans that required a logged override (§11). This
   measures the *engine*, inverted: a high rate means the rules, not the Founder, need
   revision.

**Operational (tracked, not decision-driving at N=5):** Activation (started the request form)
and Completion (received a delivered plan).

### Wave 1 go/no-go criteria (N = 5, count-based — percentages are not meaningful at this
sample size)

| Outcome | Condition |
|---|---|
| **GO — proceed to Wave 2** | Action ≥ 3/5, Clarity ≥ 4/5, Trust ≥ 3/5, Product Continuation ≥ 3/5, **and** Founder Override Rate ≤ 1/5 |
| **REVISE — fix the engine/output before Wave 2** | Any two or more decision-critical metrics miss their threshold above, **or** Founder Override Rate ≥ 2/5 |
| **RECONSIDER THE CORE CONCEPT** | Clarity or Trust individually falls to ≤ 1/5 — this specifically means the core job (§3) isn't landing at all, not a tuning problem |

This gives the Founder an explicit, pre-committed decision rule after five real users rather
than an open-ended "see how it feels" judgment call.

---

## 16. Acceptance Criteria (Rewritten — Finding P1-13)

1. A user who has completed the Scorecard is not asked to re-enter any of the 9 existing
   financial fields.
2. The request form collects exactly one required select (immediate pressure), one optional
   select (short-term objective), and email; no additional financial fields are present.
3. The request form can be submitted with the short-term objective left blank.
4. Stage determination for the plan exactly matches the live Scorecard's `getStage` output for
   the same inputs — this SPEC does not modify the live stage calculator.
5. `cashRemaining <= 0` always triggers the engine's Hard Override, setting Priority #1 to
   Cash Flow Control — this is tested explicitly for `cashRemaining = 0` and for
   `cashRemaining < 0` as two distinct cases.
6. A non-"Stable" pressure selection **without** a corroborating Objective Fragility Signal
   (§6 Step 1) never overrides an objectively-computed Priority #1 — it appears only as a
   contextual note.
7. A non-"Stable" pressure selection **with** a corroborating Objective Fragility Signal does
   trigger the Hard Override.
8. The tie-break threshold (0.10 relative-score gap, adjacent candidates only) is applied
   identically regardless of which two categories are tied — no case-by-case interpretation.
9. When two candidates are tied and an objective is provided that maps to one of them, that
   category is promoted; when no objective is provided, the tie resolves to the fixed
   safety-sequence order.
10. For Pre-Flight and Turbulence users, Wealth Fuel is never surfaced as Priority #1 or #2
    ahead of Cash Flow Control, Emergency Runway, or Debt Load.
11. Priority #1 and Priority #2 are always present; Priority #3 appears only per §6 Step 5.
12. The delivered plan includes: Current Position, Flight Status, Priority #1 (with its
    integrated explanation), Priority #2, Financial Runway, a 30-Day Action block, and a Next
    FFM Product CTA. There is no separate Warning/Turbulence Indicator element.
13. The plan never recommends a specific investment, lender, or financial product.
14. The education-only disclaimer appears on the plan itself.
15. The explicit consent statement (§13) must be affirmatively checked before the form
    submits; it is not pre-checked and is distinct from the existing Starter Kit consent.
16. No financial input value, score, stage, or plan content is ever sent to analytics.
17. No individual user's raw financial data appears in the repository, in commit history, or
    in any committed log file.
18. Retained submission data is deleted at the end of the defined retention window (§13) and
    is never merged into the general marketing list's fields.
19. Any Founder edit that changes Priority #1, changes Priority #2, reorders priorities, or
    materially rewrites the 30-day action must have a corresponding override-log entry (§11);
    no such change may ship without one.
20. The request form and delivered plan render correctly on a single-column mobile viewport.
21. Submitting the request form with a missing required field produces a plain-language inline
    error and does not submit.
22. The plan does not reference Flight Crew or Membership as if they currently exist as live,
    purchasable products.
23. Wave 1's five decision-critical metrics (§15) are each independently measurable per user,
    supporting the go/no-go table without additional instrumentation being invented later.

---

## 17. Explicit Non-Goals

Excluded from V1 (all belong in backlog, not V1, if pursued at all):

- Bank-account connections or automated transaction import
- Plaid or any account-aggregation integration
- Credit-report integrations or credit-utilization collection
- Brokerage integrations
- Specific investment or security recommendations
- Tax optimization guidance
- An AI financial-advisor chat interface
- Bill payment functionality
- Forecasting/projection engines
- Complex multi-screen dashboards
- Recurring subscription/billing infrastructure (Wave 1/2 are free/gated, §14)
- Gamification not already part of the existing Weekly Reset habit
- **User accounts, persistent profiles, or a queryable financial database for Customized
  Flight Plan data** (Revision 2, Finding P0-1) — V1 uses a one-time submission into a
  private, access-controlled operational workflow only (§13), nothing more durable.

---

## 18. Backlog

- Literal "months of runway" metric (derivable from existing `needs` + emergency fund fields,
  deliberately deferred per §8)
- Full 90-Day roadmap (multi-step, beyond a single directional sentence)
- AI-assisted narrative generation (once rules-based version is validated)
- Self-serve, non-gated delivery at scale
- Dynamic re-personalization / plan refresh on return visits
- Flight Crew scheduling/handoff integration
- Multi-objective planning (e.g., simultaneous debt payoff + home purchase goals)
- Long-term objective field promoted to required, once its effect on output is validated
- Reconciling the stale "On Approach" stage name still present in the Scorecard methodology
  docs (non-blocking, unrelated to this SPEC's build scope)
- **A paid-pilot cohort testing a specific price point for Customized Flight Plan itself**,
  conditional on Wave 1/2 results (§14) — no price committed yet

---

## 19. Recommended V1 (the 20% that proves 80% of the value)

Ship exactly this and nothing more:

1. **No new financial intake** — reuse the 9 existing Scorecard fields as-is.
2. **One required field, one optional field** — immediate pressure (required, drives
   Hard-Override/Flag-Context) and short-term objective (optional, tie-break only).
3. **The priority engine described in §6**, including the `<= 0` Hard Override boundary, the
   deterministic 0.10 tie-break, and the Flag/Context distinction — built as an extension of
   the existing `flightScoreCalculator.js` relative-scoring logic, not a parallel system.
4. **A one-page output** with no separate Warning Indicator element (§8): Current Position,
   Flight Status, Priority #1 (with integrated explanation), Priority #2, one 30-Day Action
   block, one Next FFM Product CTA. Priority #3 and 90-Day Direction remain excluded from
   Wave 1.
5. **Manual, founder-written delivery** for **Wave 1's 5 users**, bound by the explicit
   Founder editing boundary (§11) with override logging.
6. **Free, application-gated access**, explicit consent at collection (§13), with the
   willingness-to-pay question embedded at delivery (§14) — no payment in Wave 1.
7. **One-time, access-controlled, time-bound data handling** (§13) — no account system, no
   persistence UI, no dashboard, no queryable database.

If this slice doesn't produce the branch differentiation §10 demonstrates, and doesn't clear
the Wave 1 go/no-go bar in §15, no amount of additional scope fixes that — which is exactly
what Wave 1 is built to test first.

---

## 20. Open Decisions

Only decisions that still materially affect product design (several Revision 1 items are now
resolved with a concrete SPEC position and moved out of this list; what remains is genuinely
undecided or requires a Founder confirmation on a number already proposed):

1. **45-day retention window** — §13 proposes a concrete number as a starting point; Founder
   should confirm or adjust before Wave 1 launch.
2. **Delivery channel** — email only, or a founder-led short call for some/all of Wave 1's 5
   users? Affects §11/§12 completion-time expectations.
3. **Flight Crew and Membership definitions** — still genuinely undocumented anywhere in the
   repository; the CTA language in §12/§16 depends on at least a one-line honest description
   existing before launch.
4. **Where the two request-form fields live** — appended to the existing Scorecard form, or a
   separate short form gated behind the Scorecard result?
5. **Wave 3+ paid pilot price point** — intentionally not committed in this SPEC (§14, §18);
   depends on Wave 1/2 evidence.
6. **Exact operational tooling for the access-controlled record in §13** — this SPEC
   constrains the *architecture* (no account, no persistent profile, no queryable database)
   but deliberately does not choose a specific tool, which is an implementation decision, not
   a product one.

---

## 21. Final Verdict

**REVISED SPEC READY FOR RE-REVIEW**

All three P0 findings (privacy/consent model, crisis-override boundary, founder editing
boundary) are resolved with concrete, testable rules rather than deferred. All P1 findings
(optional objective field, generic objective set, deterministic tie-break, bounded pressure
override, output simplification, methodology-led differentiation) are resolved in the relevant
sections. Both P2 findings (staged pilot, prioritized metrics) are resolved with an explicit
Wave 1/Wave 2 structure and a pre-committed go/no-go rule. Worked personas and acceptance
criteria were rebuilt to test the revised rules, not just restate them. Remaining items in §20
are genuine open decisions (a config number to confirm, undocumented adjacent products, a
future price point) rather than unresolved challenge findings. No engineering plan or code is
included, per instruction.
