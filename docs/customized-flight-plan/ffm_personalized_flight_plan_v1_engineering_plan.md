# FFM Personalized Flight Plan V1 — Engineering Implementation Plan

Phase: PLAN
Author role: Senior Product Engineer / Technical Architect
Status: Planning document only. No production code, no calculator-formula changes, no
redesign of the approved product. This document converts the approved Personalized Flight
Plan V1 SPEC (Revision 4) into the safest, smallest, testable engineering plan.

**Source of truth read in full before writing this plan:**

- `ffm_customized_flight_plan_v1_spec.md` (Revision 4, PR #10, commit `725b6237`)
- `ffm_personalized_flight_plan_one_page_spec_approved.md` (approved original MVP one-pager, PR #10, commit `725b6237`)
- `docs/scorecard/README_START_HERE.md`, `ffm_scorecard_methodology_sop_v1.md`,
  `ffm_scorecard_public_explanation_copy_v1.md`, `ffm_scorecard_github_methodology_readme_v1.md`,
  `ffm_scorecard_validation_backlog_v1.md`
- `src/flightScoreCalculator.js`, `src/main.js`, `src/analytics.js`, `index.html`,
  `ffm-scorecard.html`, `privacy.html`, `terms.html`, `netlify.toml`
- `docs/funnel/README.md`, `docs/funnel/ga4-verification-log.md`

Treated as controlling: the live code in `src/flightScoreCalculator.js` and `src/main.js`,
not model memory or the Scorecard docs' stale "On Approach" label.

---

## 1. Confirmed Current Repo State

| Item | Finding |
|---|---|
| Current checked-out branch | `claude/ffm-flight-plan-engineering-s3hfhp` (this plan's designated branch) |
| Branch vs. `origin/main` | Identical — both at `fc8ba670443b05061bc93bf67acf01995ad8a4a9` ("Repair FFM free funnel reliability and verification"). No divergence, working tree clean. |
| `origin/main` SHA | `fc8ba670443b05061bc93bf67acf01995ad8a4a9` |
| PR #10 — "Add Customized Flight Plan V1 product SPEC" | **Open, draft, NOT merged.** Head branch `claude/ffm-repo-kb-access-tfk9a7` @ `725b62375198511bbda987ef04ca14560117d94b`. Base `main` @ `fc8ba670...` — i.e. PR #10 is already up to date with the current `main` tip; `mergeable_state: clean`. |
| Where the approved SPEC files physically live | **Only on PR #10's branch** (`claude/ffm-repo-kb-access-tfk9a7`), not on `main`, not on this engineering-plan branch. They were read via `git show origin/claude/ffm-repo-kb-access-tfk9a7:<path>` for this plan (read-only inspection; no branch switch, no merge performed). |
| Eventual implementation base | **`main`, after PR #10 merges.** PR #10 is the source-of-truth SPEC and must land first (or this branch must be rebased onto PR #10's head) before an implementation PR is opened, so the code changes below sit next to their own grounding SPEC in the tree. This plan does not merge PR #10 — flagged as a sequencing dependency, not actioned here. |
| Working tree status | Clean, nothing staged or pending. |
| Deployment host/config | **Netlify**, static hosting, no serverless/functions directory. `netlify.toml`: `pretty_urls = false`; three redirects — `/thank-you.html → /thank-you-download.html` (200), `/flight-plan-budget-system.html → /#flight-briefing-form` (301), `/docs/* → /404.html` (404, keeps repo docs out of the public site). No CI config (no `.github/workflows`), no build step — plain static files served as-is, ES modules loaded directly via `<script type="module">`. |
| Current test infrastructure | **None.** No `package.json`, no test framework, no unit tests, no CI. Verification today is manual: Google Tag Assistant + GA4 Realtime, logged in `docs/funnel/ga4-verification-log.md`. This directly shapes §7 below — any new test harness must add zero new tooling/build step. |

---

## 2. Architectural Principle — Confirmed Compliant

Approved architecture: `existing Scorecard inputs → client-side deterministic personalization
engine → self-service Personalized Flight Plan → optional email/resource delivery → minimal
retained metadata only.`

Repo evidence confirms nothing here needs to change to honor this:

- No backend exists today (`netlify.toml` has no `[functions]` block; no server code in the repo).
- The live Scorecard already computes everything client-side in `flightScoreCalculator.js`,
  imported directly into the browser — the new module follows the identical pattern.
- The only network call in the entire funnel is `submitLeadToMailerLite()` in `main.js`, a
  direct JSONP-style POST to MailerLite with **only `email`** in the payload today. No Plaid,
  bank-linking, brokerage, credit-report, or AI-generation dependency exists anywhere in the
  codebase.
- Therefore the plan below introduces **zero new infrastructure**: no new endpoint, no new
  storage, no new subscription/billing code, no accounts. It is additive client-side JS + two
  new form fields + rendering, exactly as the architecture requires.

---

## 3. Reuse vs. New Code

### Reused directly from `src/flightScoreCalculator.js` (no formula changes)

- `calculateFlightScore()` — full output object (`values`, `score`, `stage`, `metrics`,
  `categoryScores`, `briefing`) is the only source of derived data the new engine consumes.
- `getStage()` — stage object (name/message/nextAction/starterSection), untouched.
- `categoryScores` (the 5 raw sub-scores) and `categoryMaximums` (the 5 category caps).
- The relative-score math currently inside the private `getRelativeCategoryScores` helper
  (`score / categoryMaximums[key]`) — this is the exact function the SPEC's ranking, tie-break,
  and Strong Signal logic all depend on (§6). It must be **imported, not re-derived**, so the
  new module can never drift from the live formula.
- The **stable-sort tie order** already implicit in `getStrongestSignal`/`getWarningLight`
  (`Array.prototype.sort` is stable per spec, and `Object.entries(categoryScores)` preserves
  the object's key insertion order: `cashRemaining, savingsRate, debtPressure, emergencyFund,
  investments`). Verified this matches the SPEC's required tie-break order exactly (Cash Flow
  Control > Savings System > Debt Load > Emergency Runway > Wealth Fuel) — nothing to build,
  only to rely on by reusing the same underlying array rather than reimplementing a tie order.
- The existing `>= 0.9` "nothing is weak" threshold in `getWarningLight` — conceptually the same
  boundary as SPEC §6 Step 5's fallback condition; the *threshold value* is reused, but the
  *output* is new (see below), since the existing function's string output ("Optimization
  Capacity") still feeds the live `#warningLight` DOM node and must not change.

**Only proposed change to `flightScoreCalculator.js` — two additive exports, no logic
changed:**

```
export const categoryMaximums = { ... };            // already exists privately, unchanged
export const getRelativeCategoryScores = (...) => { ... };  // already exists privately, unchanged
```

Confirmed via search that both are currently used only inside this file — exporting them is
fully backward compatible and does not touch `getStage`, `calculateFlightScore`,
`getStrongestSignal`, or `getWarningLight`, all of which keep computing and returning exactly
what the live Scorecard result card already renders today.

### New — in a separate bounded module, `src/personalizedFlightPlan.js`

| New logic (per SPEC §6, §8, §9, §11) | Why it can't be reused as-is |
|---|---|
| Hard Override vs. Flag/Context (Step 1) | New input (`immediatePressure`) not read by the calculator at all today |
| Warning Light #1 **and** #2 ranked ordering | `getWarningLight` only ever returns the single lowest signal, as a label string, with no category key exposed |
| Stage-gate suppression (Wealth Fuel never first/second in Pre-Flight/Turbulence) | No such filter exists in the live code |
| Optional-objective tie-break (≤0.10 gap) | New input (`shortTermObjective`), new comparison logic |
| Deterministic Step-5 fallback → Ownership Mindset action | Existing fallback returns a different string for a different purpose (live briefing card), must not be repointed |
| Strong Signal "always show" + 5-way-tie resolution, exposed with its category identity | Existing `getStrongestSignal` returns a label only, not the category key the action-library mapping needs |
| Action-library mapping (6 rows: 5 signals + Ownership Mindset fallback) | New static data, not present anywhere in the repo |
| Do Now / This Payday / This Month copy | New, deterministic templates keyed off resolved Warning Light #1 + stage |
| 30-Day Mission text | New, one templated line per SPEC §10's worked examples |
| Workbook Connection routing | New — pulled directly from the action-library table, no separate logic |
| Calibration record derivation (pilot-only) | New — must be structurally incapable of receiving raw dollar values (see §6 below), not just "trusted" to omit them |

This keeps `flightScoreCalculator.js` as the single source of scoring truth and
`personalizedFlightPlan.js` as a pure, DOM-free, dependency-only-on-the-calculator module —
matching the existing module's own style (pure functions, no side effects, imported by
`main.js`).

---

## 4. Input Flow

### Existing (unchanged)

The 9 required financial fields (`income`, `needs`, `wants`, `savings`, `extraDebtPayment`,
`totalDebtBalance`, `emergencyFundSaved`, `emergencyFundGoal`, `investmentsCurrentValue`) are
already collected in `#score-form` in both `index.html` and `ffm-scorecard.html`, read via
`main.js`'s `getInputValues()`/`fields` array pattern, and passed straight into
`calculateFlightScore()` on submit. **Nothing about this changes.**

### New fields — recommended placement

**Append both new fields to the end of the existing `#score-form`, immediately before its
submit button — not a separate screen, not a post-Scorecard follow-up page.**

| New field | Type | Required? | Options |
|---|---|---|---|
| Immediate pressure | `<select>` | Required | Stable / Unexpected bill / Income disruption / Falling behind on a payment |
| Short-term objective | `<select>` | Optional | Stop the bleeding / Build a cushion / Get out of debt / Save more consistently / Start investing / *(default: no objective selected — maps directly to SPEC §6 Step 4's "omitted" branch)* |

Rationale for this placement over the alternatives:

1. **Same form, same submit, same state.** `main.js` already has one `submit` handler on
   `#score-form` that reads N fields into one values object. Adding 2 more `scoreForm.elements[...]`
   reads is a direct extension of an existing, proven pattern — not a rearchitecture, not a
   second data-collection step to keep in sync with the first.
2. **Trivially satisfies "never re-enter the 9 fields"** — there is no second form and no
   navigation away from the first, so nothing is ever re-asked.
3. **Matches SPEC §12's journey literally**: `Scorecard (existing, no gate) → Instant on-screen
   Flight Plan (client-side, no gate)`. One submit press produces the score, the stage, *and*
   the Flight Plan in the same render pass — no intermediate screen for the two new selects to
   gate.
4. Visually: a short "Before we personalize your plan" sub-heading inside the existing input
   panel, using the same `.field-control`/labeled-row styling already in `styles.css`, just with
   `<select>` instead of `<input type="number">` — no new CSS system, no new visual language.

### Validation impact

`validateInputs()` gains one more required check: immediate pressure must have an explicit
non-placeholder selection (a neutral "Select current pressure" placeholder option that fails
validation if left selected forces a conscious choice, matching "REQUIRED"). Short-term
objective needs **no** required-check — its default option *is* the legitimate "omitted" value
the SPEC's tie-break logic already has an explicit branch for.

### Both HTML files must move together

`index.html` and `ffm-scorecard.html` are near-duplicate (confirmed via `diff` — only
canonical-URL/OG-URL/form-action differ). Every field/markup change here must be applied to
**both** files identically, the same way today's `#score-form` already is kept identical
between them — this is an existing repo constraint, not a new risk introduced by this plan, but
worth stating explicitly since there is no templating system to enforce it automatically.

---

## 5. Client-Side Data Model

Five distinct objects, with an explicit line on what may vs. may never cross the network.

### 5.1 Raw Financial Inputs — **NEVER crosses the network**
```
{
  income, needs, wants, savings, extraDebtPayment, totalDebtBalance,
  emergencyFundSaved, emergencyFundGoal, investmentsCurrentValue,   // existing 9 fields
  immediatePressure,      // new required select value
  shortTermObjective,     // new optional select value (or "omitted")
}
```
Lives only in `scoreForm.elements[...]`/in-memory JS. Identical in kind to how the 9 existing
fields are already handled today — the two new fields join the same client-side-only category,
never appended to any fetch/XHR body anywhere in the codebase.

### 5.2 Derived Scorecard Data — **NEVER crosses the network** (unchanged from today)
The full return value of `calculateFlightScore()`: `score`, `stage`, `metrics`, `categoryScores`,
`briefing`. Already computed and rendered client-side only; this plan does not add any
transmission of this object either.

### 5.3 Personalized Flight Plan Result — **NEVER crosses the network** (rendered to DOM only)
```
{
  strongSignal: { category, label, isTieBreak },
  warningLights: [ { category, label, action, decisionPath }, { ... } ] | null,
  fallback: { action, note } | null,           // Step-5 case only, mutually exclusive with warningLights
  doNow, thisPayday, thisMonth,
  thirtyDayMission,
  workbookConnection: { tab, action },
  decisionPath: "HardOverride" | "FlagContext" | "NormalRanking" | "StageSuppression" | "ObjectiveTieBreak" | "Fallback",
}
```
This is generated by `personalizedFlightPlan.js`, held in a local JS variable, and rendered
directly into new/extended DOM nodes — the same pattern `renderResults()` already uses for the
Scorecard's own output. No part of this object is sent anywhere by default.

### 5.4 Retained Metadata — **email only crosses today; the rest is a permission ceiling, not a requirement**
Per SPEC §13's MAY/MUST-RETAIN table, score/stage/Warning-Light-#1-category labels *may* be
retained. But the live `submitLeadToMailerLite()` call today sends **only `email`** — no other
field. Recommendation (flagged as an explicit scope decision, not silently assumed): **V1 keeps
the MailerLite payload exactly as it is today (email only)** plus a new locally-recorded consent
flag/timestamp captured in the UI at the EMAIL MY FLIGHT PLAN step. Sending score/stage/Warning
Light labels to MailerLite as custom fields is *allowed* by the SPEC but is **not required by any
Acceptance Criterion in §16** — treating it as a smallest-footprint default keeps this
implementation from adding a new outbound data field that doesn't yet have an approved MailerLite
custom-field mapping, and can be added as a clearly-scoped follow-on if the Founder wants it.

| Datum | Crosses the network? |
|---|---|
| Email | **Yes** — to MailerLite, exactly as today |
| First name | Not currently collected; if added later, optional, same call |
| Consent flag + timestamp | Recorded client-side at minimum; MUST RETAIN per SPEC, but recommend this ride along with the existing MailerLite submission only if/when a custom-field mapping is explicitly approved — otherwise it is evidenced by the UI requiring an affirmative check before the existing submit path runs, satisfying Acceptance Criterion #4 without a payload change |
| Score, stage, Warning Light #1 category | **No, in V1 default** — permitted, not sent, per the scope decision above |
| The 9 financial fields, immediate pressure, short-term objective | **Never** — structurally excluded, see §5.1 |

### 5.5 Calibration Evidence — **NEVER transmitted; pilot-only, manual retrieval**
Per §11's MAY-contain schema (score, stage, Strong Signal category + tie-break flag, Warning
Light #1/#2 categories, the 5 normalized 0–1 relative scores, the decision-path enum, the
action-library id, Founder QA judgment, a scoped note, timestamp/test id) and MUST-NOT-contain
list (any dollar amount, ratio derived from a dollar amount, or raw financial-form payload).

Because §3 forbids new server-side storage, this record must not be transmitted anywhere —
recommend the calibration-record function is **structurally incapable** of receiving raw dollar
values as parameters at all (it takes only the already-reduced `PersonalizedFlightPlanResult`
plus the 5 relative scores, never `values`/`metrics`), so MUST-NOT-contain is enforced by
function signature, not by developer discipline alone. Retrieval for Founder QA during Batch
1/Batch 2 should be a manual, non-production-visible mechanism (e.g., a hidden debug affordance
gated behind a URL param or `localStorage` flag, never shown to a general pilot) — not a new
analytics event, not a new endpoint, deleted from scope entirely once the pilot's calibration
window ends per §11's retention rule.

---

## 6. Proposed File-Level Changes (summary)

| File | Change |
|---|---|
| `src/flightScoreCalculator.js` | Add two exports (`categoryMaximums`, `getRelativeCategoryScores`) — no logic changes |
| `src/personalizedFlightPlan.js` (new) | Pure, DOM-free module implementing §6 of the SPEC — Hard Override/Flag-Context, ranking, stage suppression, tie-break, fallback, Strong Signal, action library, cadence copy, 30-Day Mission, workbook routing, calibration-record derivation |
| `src/personalizedFlightPlan.test.js` (new) | Node built-in test runner (`node --test`) — zero new dependencies. Golden-value regression tests for all 4 SPEC §10 personas plus discrete tests for each boundary Acceptance Criterion (§16 items 5–11, 19–21) |
| `index.html`, `ffm-scorecard.html` | Add the 2 new select fields to `#score-form`; add the Flight Plan output section; add the distinct EMAIL MY FLIGHT PLAN consent checkbox — identical edits to both files |
| `src/main.js` | Extend field-reading/validation for the 2 new selects; call `personalizedFlightPlan.js` after `calculateFlightScore()` on submit; render its output; gate the existing MailerLite submit on the new consent checkbox |
| `src/analytics.js` | No required change for V1's minimal event set (optional follow-on: a `flight_plan_view` event, not required by any Acceptance Criterion) |
| `privacy.html` | One-line addition confirming Flight Plan inputs are calculated in-browser and never transmitted (SPEC §13/§20 Open Decision #1) |

---

## 7. Phased Implementation Order (safest → most visible)

1. **Phase 0 — additive exports only.** Export `categoryMaximums`/`getRelativeCategoryScores`
   from the existing calculator. Zero behavior change; verify the live site is unaffected.
2. **Phase 1 — pure logic, unwired.** Build `personalizedFlightPlan.js` complete, with its test
   file covering all 4 personas and all relevant Acceptance Criteria. Not imported by `main.js`
   yet — zero production risk, fully reviewable/testable in isolation.
3. **Phase 2 — input capture only.** Add the 2 new fields to both HTML files and extend
   `main.js`'s reading/validation. No new rendering yet.
4. **Phase 3 — render.** Wire the submit handler to call the new module and render its output
   (Score+Stage already renders today; add Strong Signal, both Warning Lights or the fallback,
   Do Now/This Payday/This Month, 30-Day Mission, Workbook Connection, both CTAs).
5. **Phase 4 — consent.** Add the distinct, unchecked-by-default consent statement at EMAIL MY
   FLIGHT PLAN; keep the MailerLite payload unchanged (email only) per §5.4's scope decision.
6. **Phase 5 — calibration (pilot-only).** Add the calibration-record function and a
   Founder-only, non-production-visible retrieval affordance, scoped to Batch 1/Batch 2.
7. **Phase 6 — docs.** Land the `privacy.html` one-line update.

Each phase is independently small, revertable, and testable before the next begins.

---

## 8. Risks

- **Two near-duplicate HTML files must move together** for every markup change (pre-existing
  repo constraint, no templating system) — mitigate by diffing before each commit, as verified
  in §1.
- **The lead-form/MailerLite path has a recent reliability history** ("Repair FFM free funnel
  reliability," "Fix safe lead form error message") — mitigate by keeping the new consent
  checkbox fully independent of the existing validated-email/`submitLeadToMailerLite` path in
  Phase 4; do not touch the MailerLite payload itself unless a future, separately-scoped change
  explicitly adds custom fields.
- **A required new select field adds friction to the Scorecard** — this is an approved,
  deliberate SPEC requirement (§5), not something engineering should silently soften; the
  neutral-placeholder pattern in §4 is the minimum friction consistent with "required."
- **PR #10 (the SPEC itself) is not yet merged** — this plan's file paths and section
  references assume PR #10 lands on `main` first; if it doesn't, the implementation PR will need
  to either wait or be based on PR #10's branch directly.
