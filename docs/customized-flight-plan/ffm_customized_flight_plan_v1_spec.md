# FFM Customized Flight Plan V1 — Product Specification

Phase: SPEC (pre-engineering)
Author role: FFM Product Architect / Product Strategist
Status: Draft for independent Product Challenge

Grounding note: this SPEC is reconciled against current repository source of truth —
`docs/scorecard/*`, `docs/funnel/README.md`, `src/flightScoreCalculator.js`, `src/main.js`,
`index.html`, `privacy.html`, `terms.html`. Where docs and live code disagree (the 40–69
band is named "On Approach" in the Scorecard methodology docs but shipped as **"Turbulence"**
in `flightScoreCalculator.js` and on the live site), this SPEC treats the live code/site as
authoritative and uses **Pre-Flight → Turbulence → Cruise Control → Flight Mode**. No new
stages are introduced.

---

## 1. Executive Product Definition

Customized Flight Plan V1 is a founder-guided, rules-based personalization layer that sits
between the free Scorecard/Starter Kit and the future Flight Crew/Membership tiers. It takes
a user's existing Scorecard inputs plus two new short-answer fields and returns a single
short document: current position, a strict priority order (not a list of equal options),
a 30-day action sequence, and a next-step CTA into the FFM ecosystem.

It is not a budgeting app, not an advisor, and not a dashboard. It is a **decision artifact**
— its entire job is to prove FFM can look at a specific person's numbers and correctly tell
them what matters most right now, in a way generic budgeting content cannot.

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
already raised their hand via the Scorecard.

---

## 3. Core Job To Be Done

**Core Job:** *Tell me, in priority order, what to fix first given my actual numbers, so I
stop guessing.*

- **Supporting Jobs:** show the "why" behind the ranking (which signal is weakest and how
  much runway/pressure exists); translate the #1 priority into one concrete first action;
  connect the plan back into the existing Starter Kit sections and next FFM product.
- **Future Jobs (post-V1):** recurring/updating plans over time; Flight Crew accountability
  integration; goal/scenario tracking; multi-objective planning (e.g., simultaneous debt +
  home-purchase goals).

Customized Flight Plan has one center of gravity: **ranked priority, not a plan of everything.**

---

## 4. Product Position in the FFM Ecosystem

Confirmed ecosystem (per Founder-provided sequence, not altered here):

`Scorecard → Starter Kit → Flight Plan System → Customized Flight Plan → Flight Crew → Membership`

Reconciling what each stage currently is, from repository evidence:

- **Scorecard** — the diagnostic. Live, free, client-side only, produces score + stage +
  strongest signal + warning light (`src/flightScoreCalculator.js`).
- **Starter Kit** — the free self-serve execution kit (7-tab workbook, 12-page kit, 8-page
  setup guide, weekly reset). Today its only personalization is a single stage-matched
  workbook section (`starterSection` field) — no ranked priorities, no runway/warning context
  carried into it.
- **Flight Plan System** — the workbook/execution system itself that the Starter Kit teaches
  the user to run (the "Flight Plan Budget System," referenced directly in the live lead-form
  copy). This is the *manual system*, not a personalized product.
- **Customized Flight Plan (V1, this SPEC)** — the missing link: takes the same signals the
  Scorecard already computes and turns them into a ranked, specific plan instead of a single
  stage-matched section pointer. It must be a **precision upgrade** over what the free Starter
  Kit already gives, not a parallel product.
- **Flight Crew** — undocumented anywhere in the repository. Treated here as the future
  human/community accountability layer FFM has publicly sequenced after Customized Flight
  Plan. Not designed in this SPEC.
- **Membership** — undocumented. Treated as the future recurring paid tier. Not designed here.

Customized Flight Plan V1 must **reuse** the Scorecard's existing five signals and scoring
logic rather than invent a second scoring system, and its output must **route back into**
the Starter Kit's existing workbook sections rather than replace them.

---

## 5. Required Inputs Matrix

| Input | Classification | Why It's Needed / Effect on Output | Privacy Sensitivity | Already in FFM? |
|---|---|---|---|---|
| Monthly income | REQUIRED | Denominator for every ratio (cash flow, savings rate, debt load). Without it, nothing computes. | Moderate (single figure, no source detail) | Yes — Scorecard |
| Needs (fixed expenses) | REQUIRED | Determines cash remaining and (see §8) can double as the runway denominator. | Moderate | Yes — Scorecard |
| Wants (variable spending) | REQUIRED | Same — needed for accurate cash-remaining figure. | Moderate | Yes — Scorecard |
| Savings (monthly) | REQUIRED | Drives Savings System signal and savings rate. | Moderate | Yes — Scorecard |
| Extra debt payment | REQUIRED | Distinguishes "carrying debt" from "actively attacking debt" — changes Debt Load score and the debt-related action text. | Moderate | Yes — Scorecard |
| Total debt balance | REQUIRED | Drives Debt Load signal; determines whether debt is Priority #1. | Higher (aggregate debt figure) | Yes — Scorecard |
| Emergency fund saved / goal | REQUIRED | Drives Emergency Runway signal; the single most common Priority #1 in Pre-Flight/Turbulence. | Moderate | Yes — Scorecard |
| Current investment value | REQUIRED | Drives Wealth Fuel signal; needed to know when to *stop* recommending survival moves and start recommending growth moves. | Higher (asset figure) | Yes — Scorecard |
| Immediate pressure (single-select: e.g. "stable," "income disruption," "unexpected bill," "falling behind on a payment") | REQUIRED (new) | Feeds the crisis-override rule in §6 — two users with identical numbers can have different true priority #1 if one has an active shock. | Low if kept to categories, not free narrative | No — new, minimal field |
| Short-term objective (single-select: e.g. "stop the bleeding," "build a cushion," "get out of debt," "start investing," "buy a home") | REQUIRED (new) | Breaks ties between equally weak signals and shapes the "why" narrative language; does not override safety-first sequencing (§6). | Low | No — new, minimal field |
| Email / contact | REQUIRED | Needed to deliver the plan and for founder-assisted pilot follow-up. | Moderate (PII) | Yes — existing lead form / MailerLite |
| Score / stage | DERIVED | Computed from the inputs above via the existing calculator — never asked directly. | N/A | Yes — Scorecard |
| Long-term objective / life goal | OPTIONAL | Useful color for the 90-Day Direction line; not required to rank priorities. | Low–Moderate | No |
| Credit utilization | DO NOT COLLECT IN V1 | Users rarely know it precisely; collecting it pulls toward credit-report integration, an explicit non-goal. Debt Load already captures debt pressure without it. | High if collected | No |
| Investment account detail (types, contribution %) | DO NOT COLLECT IN V1 | Adds no ranking value beyond current investment value; edges toward individualized investment advice, a boundary FFM must not cross. | High | No |
| Bank balances / linked transactions | DO NOT COLLECT IN V1 | Explicit non-goal (no Plaid/aggregation in V1); not required — self-reported totals are sufficient for ranking. | Very high | No |

**Principle applied:** every REQUIRED input either already exists in the live Scorecard or is
one of exactly two new single-select fields. No new financial-data category is introduced.

---

## 6. Personalization Framework

The engine is a conceptual decision framework, not new scoring math — it **reuses** the
relative-category-scoring approach already implemented in `flightScoreCalculator.js`
(`getRelativeCategoryScores` / `getWarningLight` / `getStrongestSignal`) and extends it with
two new inputs.

**Step 1 — Crisis override.**
If `cashRemaining < 0` (already computed) **or** the user selects an active-pressure option
(income disruption, falling behind on a payment, unexpected bill), Priority #1 is
automatically **Cash Flow Control**, regardless of any other signal's relative score. Nothing
else is prioritized above stopping active bleeding.

**Step 2 — Rank the five signals by relative weakness.**
When there is no crisis override, compute each signal's score relative to its own maximum
(the existing per-category math). Sort ascending. The weakest relative signal is the
candidate for Priority #1, the next weakest for Priority #2, and so on.

**Step 3 — Apply stage-appropriate sequencing.**
Raw weakness alone is not enough — sequencing matters. Even if Wealth Fuel is a Pre-Flight or
Turbulence user's technically weakest relative signal, it is never promoted to Priority #1 or
#2 ahead of Cash Flow Control, Emergency Runway, or Debt Load for those two stages. This
matches the evidence-library posture already documented in the Scorecard SOP (build a basic
buffer before advanced moves). Cruise Control and Flight Mode users, who have already cleared
the survival signals, are the ones for whom Wealth Fuel can legitimately surface as a top
priority.

**Step 4 — Let the declared objective break ties, not override safety.**
The short-term objective field adjusts *which* of two similarly weak signals is surfaced
first and shapes the plain-language "why," but it cannot override Step 3's sequencing. A
user in Turbulence who selects "start investing" as their objective still gets Emergency
Runway or Debt Load as Priority #1 if either is critically weak — the plan explains why,
rather than silently ignoring the request.

**Step 5 — Priority #3 (optional).**
Shown only when a third signal is meaningfully weak (relative score below the same ~0.9
threshold the existing `getWarningLight` logic already uses). If all remaining signals are
strong (a Cruise Control/Flight Mode profile), Priority #3 is replaced with a stage-appropriate
growth action rather than a manufactured weakness — matching the existing "Optimization
Capacity" fallback already built into the calculator.

This design guarantees the output changes materially with the user's actual numbers (Section
10 demonstrates this with four grounded examples) rather than only with their stage bucket.

---

## 7. Stage Logic

*(Pre-Flight → Turbulence → Cruise Control → Flight Mode — no new stages added.)*

### Pre-Flight
- **Primary Objective:** Establish baseline visibility and make sure cash flow isn't
  actively negative before anything else.
- **Common Risks:** No working budget; irregular income tracking; reactive decisions;
  avoidance of looking at the numbers at all.
- **Priority Actions:** Confirm income/bills baseline; identify the first leak; get monthly
  cash remaining to zero or above.
- **Graduation Signal:** A full pay cycle of non-negative cash flow plus a started (>0)
  emergency fund — i.e., clearing the conditions that would otherwise force a Turbulence
  classification under the existing stage logic.

### Turbulence
- **Primary Objective:** Stabilize. Stop whatever is actively wrong (negative cash flow, a
  savings rate under 5%, or an emergency fund under 25% of goal) before optimizing anything.
- **Common Risks:** Debt servicing eating all flexibility; treating a symptom (one bill)
  instead of the systemic leak; no repeatable weekly check-in.
- **Priority Actions:** Fix negative cash flow first if present; otherwise raise savings rate
  above 5% and push the emergency fund toward 25% of goal; pick one debt or cash-flow
  pressure point per week.
- **Graduation Signal:** Score ≥ 70 with no critical cash failure — sustained positive cash
  flow, savings rate and emergency fund both above minimum thresholds.

### Cruise Control
- **Primary Objective:** Make progress repeatable. Automate what's working; close the
  remaining gaps (emergency fund under 100% of goal, moderate debt, low wealth fuel).
- **Common Risks:** Plateauing because nothing feels urgent; inconsistent weekly review;
  debt paid on autopilot with no acceleration plan.
- **Priority Actions:** Automate savings/debt payments; push the emergency fund to 100% of
  goal; start or increase wealth-fuel contributions.
- **Graduation Signal:** Score ≥ 90 with strength across all five categories, sustained over
  more than one review cycle (not a single good month).

### Flight Mode
- **Primary Objective:** Optimize and expand — protect the system, grow income/investing
  capacity, move from stability toward ownership.
- **Common Risks:** Complacency (the system erodes quietly); lifestyle creep eroding the
  savings rate; no plan for turning stability into a bigger goal.
- **Priority Actions:** Monthly full-dashboard review; increase investing or income capacity;
  set an ownership-readiness goal.
- **Graduation Signal:** Not a further Scorecard stage — "graduation" here means readiness
  for Flight Crew/Membership's deeper layer, not a fifth stage.

---

## 8. Customized Flight Plan Output

| Output Element | Classification | Notes |
|---|---|---|
| Current Position | REQUIRED | Score + the five signal snapshot, reusing existing calculator output. |
| Flight Status (stage + explanation) | REQUIRED | Reuses existing stage name/message — no new stage copy invented. |
| Priority #1 | REQUIRED | Per §6 engine; always present. |
| Priority #2 | REQUIRED | Per §6 engine. |
| Priority #3 | OPTIONAL | Shown only when a third signal is meaningfully weak, or replaced by a growth action for strong profiles. |
| Financial Runway | REQUIRED | Reuses existing `emergencyFundLevel` (% of user-defined goal). See note below — a literal "months of runway" metric is deliberately deferred. |
| Warning / Turbulence Indicator | REQUIRED | Reuses existing `getWarningLight` output. |
| 30-Day Flight Plan | REQUIRED | See §9. |
| 90-Day Direction | OPTIONAL | One sentence of directional framing tied to the declared objective — not a roadmap. |
| Next FFM Product CTA | REQUIRED | Routes to the matching Starter Kit workbook section today; frames (without yet defining) the future Flight Crew step. |

**Runway metric decision:** `needs` is already collected, which would allow deriving literal
"months of runway" (`emergencyFundSaved / needs`) without a new input. V1 deliberately does
**not** ship this second runway framing alongside the existing %-of-goal metric — shipping two
competing runway numbers before learning which one resonates adds confusion, not clarity.
Logged as a backlog item (§18), not a requirement.

---

## 9. 30-Day Action Framework

Every plan converts its Priority #1 into exactly one behavior sequence — not a list of
educational tips.

- **NOW:** The single first action, completable today (e.g., "Move $75 from checking to a
  separate savings account labeled Emergency Runway.").
- **THIS WEEK:** One concrete step that operationalizes the priority (e.g., "Complete the
  Know Your Numbers tab in the Starter Kit workbook.").
- **THIS MONTH:** The behavior that needs to become consistent (e.g., "Automate a $75
  transfer every payday.").
- **NEXT CHECKPOINT:** A specific, self-checkable measure of progress (e.g., "In 30 days,
  confirm the emergency fund balance increased and cash remaining stayed positive.") — never
  a vague "review your finances."

This stays a short list of behaviors, not a task manager or recurring app (explicit
non-goal, §18).

---

## 10. Four Personalization Examples

*Illustrative — computed against the existing `calculateFlightScore` logic in
`src/flightScoreCalculator.js`; figures are rounded for readability.*

### Persona 1 — Pre-Flight: "Maya"
Income $3,000 · Needs $2,200 · Wants $650 · Savings $150 (5.0%) · Extra debt payment $0 ·
Total debt $14,000 · Emergency fund $500 / $2,000 goal (25%) · Investments $0.
→ Cash remaining ≈ $0 (no crisis override). Score ≈ 35 → **Pre-Flight**.
- Weakest signals: Debt Load and Wealth Fuel (heavy debt ratio, zero investing).
- **Priority #1:** Debt Load — "Debt is the largest drag on your score even though your cash
  flow is currently break-even."
- **Priority #2:** Wealth Fuel is suppressed by stage sequencing (§6, Step 3); Cash Flow
  Control is surfaced instead — protect the fragile $0 margin before anything else.
- Plan: pick one debt to target, build a $0-margin buffer of $25/week before touching wealth
  fuel at all.

### Persona 2 — Turbulence: "Jordan"
Income $4,200 · Needs $3,200 · Wants $1,200 · Savings $0 · Extra debt payment $100 ·
Total debt $6,000 · Emergency fund $200 / $2,000 goal (10%) · Investments $0.
→ Cash remaining ≈ **–$300** → crisis override triggers regardless of any other signal.
- **Priority #1:** Cash Flow Control — stop the bleeding (identify $300+ of monthly leaks).
- **Priority #2:** Emergency Runway (10% of goal, second-weakest signal once cash flow is
  addressed).
- Plan: NOW = cut one recurring expense today; THIS WEEK = confirm which bill is driving the
  shortfall; THIS MONTH = get cash remaining to ≥ $0.

### Persona 3 — Cruise Control: "Priya"
Income $6,000 · Needs $2,800 · Wants $1,200 · Savings $600 (10%) · Extra debt payment $200 ·
Total debt $9,000 (1.5× income) · Emergency fund $6,000 / $9,000 goal (67%) · Investments
$8,000.
→ Cash remaining ≈ $1,200 (20%). Score ≈ 82 → **Cruise Control**.
- Weakest relative signals: Emergency Runway (67%) and Wealth Fuel (moderate).
- **Priority #1:** Emergency Runway — close the gap from 67% to 100% of goal.
- **Priority #2:** Wealth Fuel — increase investing now that survival signals are strong.
- Plan: automate the remaining ~$1,000 needed for full runway over the next few months;
  increase investment contribution by a fixed amount this month.

### Persona 4 — Flight Mode: "Alex"
Income $8,000 · Needs $2,600 · Wants $1,000 · Savings $1,600 (20%) · Extra debt payment $0 ·
Total debt $0 · Emergency fund $15,000 / $15,000 goal (100%) · Investments $40,000.
→ Cash remaining ≈ $2,800 (35%). Score = 100 → **Flight Mode**.
- No signal is meaningfully weak → Priority #3 fallback ("Optimization Capacity") applies.
- **Priority #1:** Growth action — increase investing rate or income capacity (stage
  objective, not a weakness-driven pick).
- **Priority #2:** Ownership-readiness goal, shaped by the user's declared long-term objective.
- Plan: NOW = review current investment allocation against goal; THIS MONTH = schedule the
  monthly full-dashboard review the stage logic calls for.

These four outputs differ in **which signal drives the plan and why**, not just in stage
label — Persona 1 and Persona 2 both surface Cash Flow Control but for different structural
reasons (a fragile $0 margin vs. an active –$300 shortfall), which is the concrete proof the
personalization is not templated text.

---

## 11. Automated vs. Founder-Assisted Matrix

| Rules-Based (deterministic, no per-case human input) | Founder-Assisted (pilot, <100 users) | Deferred |
|---|---|---|
| Stage determination (existing calculator) | Final read-through/tone pass on each plan before sending | Full narrative generation via an LLM |
| Priority #1/#2/#3 ranking (§6 engine) | Interpreting free-text edge cases that don't fit the two select fields | Instant, fully self-serve delivery at scale |
| Warning light / strongest signal / runway % | Manual delivery (email or short call) during pilot | Dynamic re-personalization on repeat visits |
| 30-Day action template selection per priority | Handling outlier profiles the rules don't cleanly cover | Flight Crew scheduling integration |
| — | Collecting the qualitative pilot-metrics answers (§15) | Payment/subscription automation |

Nothing here is automated merely because it could be. During the pilot, a human reviewing
every plan before it goes out is a **feature** (it's how the Founder learns which priorities
actually land), not a stopgap.

---

## 12. User Journey

`Scorecard (existing) → Customized Flight Plan request (2 new fields) → Processing → Plan Delivery → Action → Follow-Up`

- **Steps:** Scorecard (existing, already complete for this user) → one short additional form
  (2 new single-select fields + existing email capture) → confirmation state → delivered plan.
- **Estimated completion time:** under 90 seconds for the new form (it is explicitly *not* a
  second full financial intake — the 9 financial fields are inherited from the Scorecard
  the user already completed).
- **Progress indicator:** none needed — this is a one-screen form, not a multi-step wizard.
- **Save/return:** not required in V1 (no account system); if a user abandons, they simply
  restart the short form.
- **Mobile:** must work as a single-column form at parity with the existing scorecard's
  mobile behavior (already responsive per `src/styles.css`).
- **Empty/error states:** reuse the existing scorecard validation pattern (`main.js`
  `validateInputs`) — plain-language inline errors, no silent failures.
- **Why we're asking:** one line above the two new fields explaining that these answers
  change *which* priority comes first, not just the copy.
- **Trust messaging:** explicit statement that financial figures are used only to generate
  this plan and are not sold, consistent with the existing privacy posture (§13 flags the one
  real departure from that posture).
- **Next CTA:** the plan itself always ends on a single next action — the matching Starter
  Kit workbook section today, with a clear, honest "more personal guidance is coming"
  framing for the future Flight Crew step (do not name or promise Flight Crew specifics that
  don't exist yet).

---

## 13. Trust, Privacy, and Advice Boundaries

- **Collected:** the 9 existing Scorecard financial fields, 2 new single-select fields, and
  email — nothing else.
- **Intentionally not collected:** credit utilization, bank/transaction data, investment
  account detail, free-text financial narrative (§5).
- **Explicit departure from current model — flagged, not silently carried over:** today's
  Scorecard privacy policy states inputs "run in your browser" and are "not stored." A
  Customized Flight Plan that a founder reviews and delivers **requires temporarily
  persisting** the user's inputs (at minimum for the review/delivery window). This is a real
  privacy-policy change, not an implementation detail — Open Decision in §20.
- **Retention:** minimum necessary to generate and deliver the plan; no indefinite retention
  policy is assumed here — must be defined explicitly (§20), following the funnel doc's
  existing rule that raw financial values are never committed to the repository or sent to
  analytics.
- **Disclaimer:** identical education-only posture as the existing Scorecard/Starter Kit
  (`privacy.html`, `terms.html`) — not financial, investment, tax, legal, or debt advice.
  Must appear on the plan itself, not just buried in a linked policy page.
- **Advice boundary:** the plan ranks and sequences the user's *own* self-reported numbers
  using FFM's documented methodology; it never recommends a specific investment, lender,
  debt-payoff product, or tax action. Language stays at the "runway/pressure/priority" level
  already established in the Scorecard's public copy.
- **Never in analytics:** financial input values, computed score, stage, or plan content —
  matching the existing GA4 rule (`privacy.html`, `docs/funnel/README.md`).
- **Never logged in the repository or in unsecured tooling:** any individual user's raw
  financial figures, email, or plan content — matching the existing "prohibited from the
  repository" list in `docs/funnel/README.md`.

---

## 14. Monetization Recommendation

**Recommendation: Free, application-gated, founder-assisted — not a paid product in V1.**

Reasoning: the stated objective is to prove personalization value, clarity, engagement, and
*willingness to pay for deeper guidance* — the willingness-to-pay signal the brief asks for
is about the **next** ecosystem step (Flight Crew/Membership), not about charging for the
plan itself. Charging for Customized Flight Plan in V1 adds purchase friction that would
contaminate the two hardest signals to get clean with under 100 users: whether the
personalization itself lands, and whether it drives the user forward.

- **Position:** free, but explicitly **gated** (a short application/request, not open
  self-serve) — this preserves founder review capacity and signals the plan has real value
  without a price tag.
- **Willingness-to-pay capture without charging for the plan:** end every delivered plan with
  a direct, honest question ("Would you want ongoing, more personal guidance like this? Flight
  Crew is in development — would you want early access at [price point]?") and treat the
  answer as the actual WTP data point for §15.
- **Do not bundle Customized Flight Plan into a subscription yet** — Membership belongs later
  in the sequence per the confirmed ecosystem order.

---

## 15. Pilot Success Metrics

Sized for fewer than 100 users (thresholds are illustrative starting targets, not fixed
statistical claims):

| Metric | Definition | Illustrative Target (first 20–30 pilot users) |
|---|---|---|
| Activation | % who complete the 2 new required fields after reaching the request form | ≥ 60% |
| Completion | % of activated users who receive a delivered plan | ≥ 90% (founder-assisted, so this should be near-total) |
| Clarity | % who can restate their Priority #1 in their own words when asked (simple follow-up question) | ≥ 70% |
| Action | % who complete the NOW action within 7 days | ≥ 40% |
| Trust | % who rate the plan "relevant/specific to me" (not generic) on a short follow-up | ≥ 70% |
| Product Continuation | % who take the next FFM action (Starter Kit section, Weekly Reset, or next signup) within 14 days | ≥ 30% |
| Willingness to Pay | % who say yes to the Flight Crew/deeper-guidance question in §14 | Track as a raw count/% — this is directional evidence for the *next* product, not a pass/fail gate for V1 |

---

## 16. Acceptance Criteria

1. A user who has completed the Scorecard is not asked to re-enter any of the 9 existing
   financial fields.
2. The request form collects exactly 2 new fields (immediate pressure, short-term objective)
   plus email; no additional financial fields are present.
3. Stage determination for the plan exactly matches the live Scorecard's
   `getStage` output for the same inputs — no second, divergent stage calculation is
   introduced.
4. If `cashRemaining < 0` or the user selects an active-pressure option, Priority #1 is always
   Cash Flow Control, with no exception.
5. Priority #1 and Priority #2 are always present in a delivered plan; Priority #3 is present
   only when a third signal is meaningfully weak or a stage-appropriate growth action applies.
6. For Pre-Flight and Turbulence users, Wealth Fuel is never surfaced as Priority #1 or #2
   ahead of Cash Flow Control, Emergency Runway, or Debt Load.
7. Two users with different input profiles but the same stage receive demonstrably different
   Priority #1 selections and different "why" text (verified against the four personas in
   §10 as the acceptance baseline).
8. The delivered plan always includes: Current Position, Flight Status, Priority #1, Priority
   #2, Financial Runway, Warning Indicator, a 30-Day Action block (NOW/THIS WEEK/THIS
   MONTH/NEXT CHECKPOINT), and a Next FFM Product CTA.
9. The plan never recommends a specific investment, lender, or financial product.
10. The education-only disclaimer appears on the plan itself, not only on a linked page.
11. No financial input value, score, stage, or plan content is ever sent to analytics.
12. No individual user's raw financial data appears in the repository, in commit history, or
    in any committed log file.
13. The request form and delivered plan render correctly on a single-column mobile viewport.
14. Submitting the request form with an invalid or missing required field produces a
    plain-language inline error and does not submit.
15. A user who abandons the request form can restart it without any saved partial state (no
    account/session system required for V1).
16. The plan's Next FFM Product CTA links to the Starter Kit workbook section matching the
    user's stage, consistent with the existing `starterSection` mapping.
17. The plan does not reference Flight Crew or Membership as if they currently exist as
    live, purchasable products — framing stays honest about "in development."
18. Every delivered plan includes the willingness-to-pay question defined in §14.

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
- Recurring subscription/billing infrastructure (not needed — V1 is free/gated, §14)
- Gamification (streaks, badges, points) not already part of the existing Weekly Reset habit

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
- Long-term objective field promoted from optional to required, once its effect on output is
  validated
- Reconciling the stale "On Approach" stage name still present in the Scorecard methodology
  docs (non-blocking doc cleanup, unrelated to this SPEC's build scope)

---

## 19. Recommended V1 (the 20% that proves 80% of the value)

Ship exactly this and nothing more:

1. **No new financial intake** — reuse the 9 existing Scorecard fields as-is.
2. **Exactly 2 new fields** — immediate pressure (select) and short-term objective (select).
3. **The priority engine described in §6**, built as an extension of the existing
   `flightScoreCalculator.js` relative-scoring logic — not a parallel system.
4. **A one-page output**: Current Position, Flight Status, Priority #1, Priority #2, Warning
   Indicator, one 30-Day Action block, one Next FFM Product CTA. Priority #3 and the 90-Day
   Direction line are nice-to-have, not required for the first cohort.
5. **Manual, founder-written delivery** (email) for the first ~20 users using a consistent
   template — no automated send pipeline yet.
6. **Free, application-gated access** with the willingness-to-pay question embedded at
   delivery (§14).
7. **No account system, no persistence UI, no dashboard** — the "product" is the plan
   document itself plus a short intake form.

If this 20% doesn't produce personas that visibly differ (§10's bar) and doesn't produce a
completed first action from at least some pilot users, no amount of additional scope will fix
that — which is exactly what this slice is built to test first.

---

## 20. Open Decisions

Only decisions that materially change product design:

1. **Data retention policy** for Customized Flight Plan inputs — how long are a user's raw
   financial figures kept once the plan is delivered, and does the existing `privacy.html`
   need a new section before V1 launches? (Blocking for launch, not for spec approval.)
2. **Delivery channel** — email only, or founder-led short call for a subset of pilot users?
   Affects the Founder-Assisted matrix (§11) and completion-time expectations (§12).
3. **Flight Crew and Membership definitions** — genuinely undocumented anywhere in the
   repository. This SPEC deliberately does not design them, but the CTA language in §12/§16
   depends on at least a one-line honest description existing before launch.
4. **Where the 2 new fields live** — appended to the existing Scorecard form, or a separate
   short form gated behind the Scorecard result? Affects funnel step count in §12.
5. **Whether Priority #3 / 90-Day Direction ship in V1 or wait for the second cohort** —
   recommended answer is "wait" (§19), but this is a real scope call, not a foregone one.
6. **WTP price point to test** — no specific number is proposed here; recommend picking one
   concrete figure before the first plan is delivered so every pilot user is asked the same
   question.

---

## 21. Final Verdict

**SPEC READY FOR CHALLENGE**

This SPEC reuses the existing Scorecard's five signals and scoring logic rather than
inventing a parallel system, introduces exactly two new inputs, stays within the confirmed
ecosystem sequence, excludes every item on the explicit non-goal list, and flags rather than
silently resolves the one real conflict it surfaces (the data-retention/privacy-policy
departure required to deliver a founder-reviewed plan). No engineering plan or code is
included, per instruction. Proceed to independent Product Challenge.
