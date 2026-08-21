# FFM Personalized Flight Plan V1 — Engineering Implementation Plan

Phase: PLAN CLOSURE (Revision 3)
Author role: Senior Product Engineer / Technical Architect
Status: Revision 3 — closes the three remaining P1 findings and two cleanup items from the
independent Codex PLAN Re-Review verdict **PASS WITH CHANGES — REVISE PLAN** on Revision 2 (all
P0 findings already closed). Planning document only. No production code, no calculator-formula
changes, no redesign of the approved product. The approved product SPEC (Revision 4, PR #10)
remains controlling authority; nothing in this revision reopens it.

---

## Revision 3 — PLAN Closure

| Finding | Resolution | Status |
|---|---|---|
| Warning Light #2 sequencing | Explicit select → remove → repeat process, formalized as one reusable Adjacent-Pair Selection Procedure applied twice (§6.1), plus a fully worked 3-candidate close-tie example | RESOLVED |
| Strong Signal collision | Independent selection confirmed as SPEC-supported; the prior "optional Founder decision" statement removed (§6.3) | RESOLVED |
| Fixed action library | Six exact, immutable, implementation-ready entries added with full Do Now/This Payday/This Month/30-Day Mission copy (§7) | RESOLVED |
| Test command | `node --test src/` (invalid — verified to error) replaced with `node --test`, empirically verified on Node v22.22.2; no Node 18 assumption remains (§14) | RESOLVED |
| Email error analytics | `personalized_plan_email_error` approved explicitly as a fourth, equal technical observability event, not a lesser add-on (§13) | RESOLVED |
| Nested serializer validation | Exact nested-shape/range/prototype-pollution tests added for all three serializers (§9) | RESOLVED |

---

## Revision 2 — Codex PLAN Review Resolution Log

| # | Finding area | Plan section(s) changed | Status |
|---|---|---|---|
| 1 | Baseline state conflated the PLAN branch head with `main`'s SHA | §1 | Resolved |
| 2 | PR #10 / PR #11 sequencing undefined | §2 | Resolved |
| 3 | Scorecard export mutability / raw `values` leakage into the new module | §4, §5 | Resolved |
| 4 | New module contract (own/must-not-own, interfaces) undefined | §5 | Resolved |
| 5 | Personalization algorithm order-of-operations undefined | §6 | Resolved |
| 6 | Category map not explicit/immutable; two distinct tie orders not distinguished | §6.2 | Resolved |
| 7 | Action library not a defined data contract | §7 | Resolved |
| 8 | Input-integration edge cases (placeholder, blank objective, route parity, `scorecard_start`) unaddressed | §8 | Resolved |
| 9 | Privacy enforcement was descriptive, not structural | §9 | Resolved |
| 10 | No explicit network boundary matrix | §10 | Resolved |
| 11 | Email delivery assumed MailerLite could send the actual plan, ungated | §11, Founder decision | Resolved |
| 12 | Calibration model risked a new backend/URL-carried-diagnostics surface | §12 | Resolved |
| 13 | Analytics event set unapproved / risked duplicating existing funnel events | §13 | Resolved |
| 14 | No automated test infrastructure plan; Node PATH assumption undocumented | §14 | Resolved |
| 15 | Duplicate-route parity not required as an explicit check | §15 | Resolved |
| 16 | `privacy.html`/`terms.html`/disclaimer scope undefined | §16 | Resolved |
| 17 | Phases were broad, not work packages with acceptance criteria | §17 (W0–W6) | Resolved |
| 18 | No explicit scope guards | §18 | Resolved |

---

## Founder Decision — Email Architecture (binding on this revision)

**EMAIL MY FLIGHT PLAN must deliver the actual Personalized Flight Plan** — not a generic
Starter Kit reminder, not a generic follow-up, not a resource-only email. MailerLite (or another
approved mechanism) may receive only a strict allowlist of derived, non-raw fields needed to
render the approved plan: email, consent version, consent timestamp, score (only if actually
required by the template), stage, Strong Signal category, Warning Light #1/#2 categories, the
approved action-library id, the approved workbook route, and the approved deterministic Do
Now/This Payday/This Month/30-Day Mission copy. Transmitted copy must come exclusively from the
bounded action library (§7) and must never interpolate a raw financial value. This plan
implements that decision via a **gated, two-part email work package** (§11, W3A/W3B): provider
capability is verified read-only before any send-path code is written, and if MailerLite cannot
meet the bar, the plan stops at the email gate rather than substituting a generic reminder or
silently introducing a backend.

---

## 1. Corrected Baseline State

Revision 1 incorrectly implied the PLAN branch head shared `main`'s SHA at time of writing. Corrected, with each ref distinguished explicitly:

| Ref | SHA | Note |
|---|---|---|
| `origin/main` (base) | `fc8ba670443b05061bc93bf67acf01995ad8a4a9` | "Repair FFM free funnel reliability and verification" — the pre-SPEC base this plan and PR #10 both branched from |
| PR #10 head (`claude/ffm-repo-kb-access-tfk9a7`) | `725b62375198511bbda987ef04ca14560117d94b` | The approved SPEC (Revision 4), open/draft, not merged. Base = `fc8ba670...`, `mergeable_state: clean` |
| PR #11 head (`claude/ffm-flight-plan-engineering-s3hfhp`, this branch) | `dba09aa38301663cd291db03a36f00b1360bd261` (Revision 1 commit) | This Revision 2 adds a new commit on top; the head SHA will change again once pushed. Base = `fc8ba670...`, same as PR #10's base — the two PRs are currently siblings off the same commit, not stacked |

These are three distinct commits. PR #11's branch head is **never** the same value as `origin/main`'s tip once any commit is added to it — Revision 1's phrasing implying otherwise is corrected here. Working tree remains clean; no branch switch or merge was performed to write this revision (SPEC content was read via `git show origin/claude/ffm-repo-kb-access-tfk9a7:<path>`, read-only).

---

## 2. Required PR #10 / PR #11 Sequence

This exact sequence governs everything after this document is revised:

1. Revise PR #11 per this Codex PLAN review (this document).
2. Independent Codex re-review of the revised PR #11.
3. Founder authorizes the PR #10 (SPEC) merge.
4. Merge approved SPEC PR #10 into `main`.
5. Rebase (or recreate) PR #11 onto the resulting `main` — the SPEC files then exist alongside this plan in the same tree for the first time.
6. Correct any resulting SHA/source references in this plan (the §1 table above will need a new `origin/main` SHA and a new PR #11 head SHA at that point).
7. Codex verifies the rebased PR #11 head and confirms plan content did not drift during the rebase.
8. Founder separately authorizes the PR #11 (engineering plan) merge.
9. Merge the approved engineering PLAN into `main`.
10. Create the implementation branch from the resulting `main`.
11. BUILD begins only from that authoritative source-of-truth state.

**BUILD must never begin from the current pre-SPEC `main` (`fc8ba670...`).** No step in this
plan authorizes skipping ahead of this sequence; this document itself only completes step 1.

---

## 3. Architectural Principle — Confirmed Compliant (unchanged from Revision 1)

No backend, functions directory, accounts, Plaid, brokerage, credit-report, or subscription
infrastructure exists in the repo today (confirmed by inspection of `netlify.toml` and the full
`src/` tree). The only outbound network call anywhere in the funnel is the existing
`submitLeadToMailerLite()` POST in `src/main.js`, sending `email` only. This plan adds zero new
infrastructure — only additive client-side JS, two new form fields, new rendering, and (pending
the Founder's email decision and W3A verification) a second, separate MailerLite send path.

---

## 4. Scorecard Reuse / Immutability

`src/flightScoreCalculator.js`'s formulas, `getStage`, `calculateFlightScore`, `getStrongestSignal`,
and `getWarningLight` are **not modified**. The only change is two additive, safe-by-construction exports:

- **`categoryMaximums`** — exported as `Object.freeze({ cashRemaining: 25, savingsRate: 25,
  debtPressure: 20, emergencyFund: 20, investments: 10 })`. A single frozen reference; freezing
  at definition makes mutation throw in strict mode / silently no-op otherwise, so no caller can
  corrupt the shared object.
- **`getRelativeCategoryScores`** — exported unchanged in logic, but its return value is wrapped
  so every call returns a **freshly frozen** array of frozen `[key, value]` pairs
  (`Object.freeze(pairs.map(Object.freeze))`... conceptually: freeze each tuple, then freeze the
  array). It already constructs a new array per call (no shared-reference risk); the added freeze
  is defense-in-depth so a consuming module cannot mutate a value in place and affect a later read.

Both are additive exports only — nothing existing is removed, renamed, or changed in behavior.
Confirmed via search that both are currently used only internally to this file, so exporting them
is fully backward compatible.

**No raw `values` object crosses into the new module.** `calculateFlightScore()`'s return value
contains a `values` field holding the 9 raw dollar inputs — that field, and the full result
object that contains it, is never passed to `personalizedFlightPlan.js`. Instead, `main.js`
(the integration point) constructs a **narrowed derived context** containing only what the
algorithm in §6 structurally requires:

```
DerivedContext = {
  score: number,                                   // from calculateFlightScore().score
  stageKey: "preflight" | "turbulence" | "cruise" | "flight",   // from .stage.key
  stageName: string,                                // from .stage.name, display only
  relativeScores: [[key, ratio], ...],              // from the exported getRelativeCategoryScores(.categoryScores), frozen
  pressureMetrics: {                                // the ONLY three metrics fields the algorithm needs — not the full .metrics object
    cashRemaining: number,
    savingsRate: number,
    emergencyFundLevel: number,
  },
}
```

This excludes `values` entirely, excludes `metrics.debtToIncome` and `metrics.investmentStatus`
(not needed by the algorithm), and excludes the raw `categoryScores` sub-points (the algorithm
operates only on `relativeScores`, never on raw 0–25/0–20/0–10 point totals). `cashRemaining`,
`savingsRate`, and `emergencyFundLevel` are **derived metrics required by SPEC §6 Step 1's
Hard-Override rule**, not raw form input — they are structurally necessary for the module to run
its own algorithm and remain 100% client-side; the boundary they must never cross is the
*network* boundary (enforced in §9's serializers), not the module's own input contract.

---

## 5. New Module Contract — `src/personalizedFlightPlan.js`

A pure, deterministic, DOM-free module — same style as `flightScoreCalculator.js`.

**MAY own:**
- Building/consuming the narrowed `DerivedContext` (§4)
- Pressure evaluation (Hard Override / Flag-Context)
- Relative priority ordering, stage sequencing/suppression, objective tie-break
- Warning Light selection, Strong Signal mapping
- Fixed action-library lookup (§7)
- Do Now / This Payday / This Month / 30-Day Mission copy selection (fixed templates, no interpolation of raw values — see §7)
- Workbook routing
- The three allowlisted serializer functions (§9) — pure data-shaping, no I/O
- Sanitized calibration-record creation (§12)

**MUST NOT own:**
- Scorecard scoring formulas or stage calculation (owned exclusively by `flightScoreCalculator.js`)
- MailerLite network calls (the actual `fetch`) — owned by `main.js`
- Analytics calls (the actual `gtag`/`trackEvent` invocation) — owned by `main.js`/`analytics.js`
- DOM rendering — owned by `main.js`
- Open-ended AI generation
- User persistence of any kind

**Conceptual interface:**

```
generatePersonalizedFlightPlan({ derivedContext, immediatePressure, shortTermObjective })
  → PersonalizedFlightPlanResult {
      strongSignal: { category, actionId, isTieBreak },
      decisionPath: "HardOverride" | "FlagContext" | "NormalRanking"
                   | "StageSuppression" | "ObjectiveTieBreak" | "Fallback",
      warningLights: [ { category, actionId }, { category, actionId } ] | null,
      fallback: { actionId: "ownershipMindsetFallback", note?: string } | null,   // mutually exclusive with warningLights
      flagContextNote: string | null,      // present when pressure was Flag/Context, independent of fallback/warningLights
      doNow, thisPayday, thisMonth, thirtyDayMission,   // strings, from the action-library entry for Warning Light #1 (or the fallback entry)
      workbookConnection: { tab, action },
    }

createMailerLitePayload({ email, consentVersion, consentTimestamp, planSummary }) → allowlisted object   // §9
createAnalyticsPayload(eventName, categoricalParams) → allowlisted object                                // §9
createCalibrationRecord({ ...engine-derived fields only... }) → allowlisted object                       // §9, §12
```

No file outside `personalizedFlightPlan.js` computes Warning Lights, Strong Signal, tie-breaks,
stage suppression, or action-library lookups — `main.js` only calls the module and renders/sends
its output.

---

## 6. Exact Personalization Algorithm (order-of-operations contract)

BUILD must follow this order exactly; nothing here is left to be invented during implementation.

1. **Build `DerivedContext`** (§4) from `calculateFlightScore()`'s output — score, stage key/name, `relativeScores` via the exported `getRelativeCategoryScores`, and the three pressure metrics.
2. **Compute relative scores** — already done in step 1 via the calculator-authoritative helper; no re-derivation.
3. **Select Strong Signal independently**, before anything else and unaffected by pressure/fallback/stage: sort `relativeScores` descending using the same stable-sort behavior as the existing `getStrongestSignal` (`Array.prototype.sort` is stable; ties preserve `Object.entries` insertion order). Take index `[0]`; map its key to a public category via the §6.2 map. Set `isTieBreak = true` if more than one entry shares the top value. **This selection is never revisited by any later step** — SPEC's own Persona 2 and Persona 4 show Strong Signal surfacing independently of Warning Light/fallback outcomes.
4. **Fallback check**: if all five `relativeScores` are `>= 0.90`, set `fallbackApplies = true` (Ownership Mindset). Strong Signal from step 3 is retained regardless.
   - *Structural note for BUILD*: under the current scoring formula, `cashRemaining <= 0` always yields a `cashRemaining` relative score of `0.4` or lower (`scoreCashRemaining` returns `0` or `10`, never enough for `>= 0.90`), so `fallbackApplies` and a Hard Override on `cashRemaining` cannot co-occur today. If a future formula change ever made this possible, **Hard Override must take precedence over the fallback** — safety before optimization. This precedence rule must be implemented even though it is currently unreachable.
5. **Determine pressure state**:
   - `cashRemaining <= 0` → **Hard Override**.
   - else if `immediatePressure !== "Stable"` and (`savingsRate < 0.05` or `emergencyFundLevel < 0.25`) → **Hard Override**.
   - else if `immediatePressure !== "Stable"` (uncorroborated) → **Flag/Context** (sets `flagContextNote`, changes no ranking).
   - else → no flag.
6. **If `fallbackApplies`** (step 4): stop here. Output `{ strongSignal, fallback: { actionId: "ownershipMindsetFallback", note: flagContextNote ?? null }, warningLights: null, decisionPath: "Fallback" }`. (This is Persona 4's case: Flag/Context is real but subordinate to the fallback.)
7. **Else, build the Warning Light candidate set** = all 5 `relativeScores` entries.
8. **Stage-gate suppression**: if `stageKey` is `preflight` or `turbulence`, remove `investments` (Wealth Fuel) from candidacy entirely — it is never eligible for Warning Light #1 or #2 in these stages (4 candidates remain, only 2 are needed, so this is a hard exclusion, not a soft demotion).
9. **If Hard Override**: force Warning Light #1 = `cashRemaining` (Cash Flow Control) regardless of its relative rank; remove it from the candidate set (it is never passed into the procedure below). Warning Light #2 is then selected by running the **Adjacent-Pair Selection Procedure** (§6.1) exactly once against the remaining eligible candidates — the ordinary process, not a special case.
10. **Else (Flag/Context or no flag)**: run the **Adjacent-Pair Selection Procedure** (§6.1) once against the full eligible (stage-suppressed) candidate list to select Warning Light #1, then run it a **second time, unmodified**, against whatever remains to select Warning Light #2.
11. **Guarantee two distinct Warning Lights** — structurally guaranteed, not a runtime branch: the Adjacent-Pair Selection Procedure always removes its selected candidate from the list before it is ever run again, so the same category can never be selected twice, whether Warning Light #2 follows a Hard-Override-forced Warning Light #1 or a normally-selected one. Verified by an automated invariant test across the full fixture matrix (§14).
12. **Strong Signal / Warning Light collision — confirmed independent, no product decision required.** See §6.3.

---

## 6.1 Adjacent-Pair Selection Procedure (exact, executable — used identically for Warning Light #1, Warning Light #2, and Warning Light #2-after-Hard-Override)

This is the **one** procedure steps 9 and 10 above call — it is defined once here and never
redefined per slot. BUILD needs no additional interpretation to make Warning Light selection
executable.

**Inputs:** the current eligible candidate list (already stage-suppressed, and already excluding
any category forced/removed by a Hard Override), and `shortTermObjective`.

1. Sort the current candidate list ascending by relative score (weakest first).
2. Compare **only** the first two entries — the two weakest remaining candidates.
3. If their relative-score gap is `<= 0.10`:
   a. If `shortTermObjective` is present and maps to one of these two candidates' categories, select that candidate.
   b. Otherwise (objective omitted, or it maps to neither of the two candidates), select whichever of the two appears first in the fixed **Warning Light safety-sequence order**: `Cash Flow Control > Emergency Runway > Debt Load > Savings System > Wealth Fuel` (§6.2 — distinct from the Strong Signal tie order).
4. Else (gap `> 0.10`): select the first entry (the single weakest candidate) — no tie-break input is consulted; `shortTermObjective` is irrelevant when there is no tie.
5. **Remove** the selected candidate from the candidate list. Its slot (Warning Light #1 or #2) is now finalized. If this is the first run for the current plan (selecting Warning Light #1), the procedure is called again against the now-shorter list to select Warning Light #2; if this is the second run, selection is complete.

### Worked example — 3-candidate close tie, no Hard Override, objective changes Warning Light #1

Eligible candidate list (post stage-suppression, 3 candidates shown for clarity): **Savings
System** (relative `0.38`), **Debt Load** (relative `0.44`), **Emergency Runway** (relative
`0.72`).

**Selecting Warning Light #1:**
1. Ascending order: `[Savings System (0.38), Debt Load (0.44), Emergency Runway (0.72)]`.
2. Compare the first two: Savings System vs. Debt Load. Gap = `0.44 − 0.38 = 0.06`, which is `<= 0.10` → tied.
3. Tie-break:
   - **If `shortTermObjective` = "Save more consistently"** (maps to Savings System): Savings System is selected as Warning Light #1. This is the case where an objective **changes** the outcome — without it, the fixed safety-sequence order (`Cash Flow Control > Emergency Runway > Debt Load > Savings System > Wealth Fuel`) would have picked **Debt Load** instead, since Debt Load precedes Savings System in that order.
   - **If the objective is omitted, or maps to neither Savings System nor Debt Load**: Debt Load is selected as Warning Light #1 (the safety-sequence default).
4. Take the objective-present branch for the rest of this example: Warning Light #1 = **Savings System**. Remove it from the candidate list.

**Selecting Warning Light #2** (procedure run a second time, unmodified):
1. Remaining candidate list: `[Debt Load (0.44), Emergency Runway (0.72)]`.
2. Compare the first two (the only two remaining): gap = `0.72 − 0.44 = 0.28`, which is `> 0.10` → no tie.
3. No objective is consulted (rule 4 above). Select the single weakest remaining candidate: **Debt Load**.
4. Warning Light #2 = **Debt Load**. Remove it; selection is complete.

This demonstrates the full contract: the identical procedure fills both slots one after another;
an optional objective can only ever change which candidate wins a *tied* slot, never the
procedure itself; and nothing here required Warning Light #2's selection to be re-derived from
first principles — it simply re-runs the same rule against a shorter list.

---

## 6.2 Category Map (immutable, exact current calculator keys)

```
export const categoryMap = Object.freeze({
  cashRemaining:  "Cash Flow Control",
  savingsRate:    "Savings System",
  debtPressure:   "Debt Load",
  emergencyFund:  "Emergency Runway",
  investments:    "Wealth Fuel",
});
```

This is a **new, separate map local to `personalizedFlightPlan.js`** — it does not touch or
replace the existing private `signalLabels` map inside `flightScoreCalculator.js`, which still
feeds the live Scorecard result card's own `#strongestSignal`/`#warningLight` text exactly as it
does today.

**Two distinct fixed orders exist — BUILD must not conflate them:**

| Order | Used for | Sequence |
|---|---|---|
| **Strong Signal tie order** | Resolving an all/multi-way tie at the *top* of `relativeScores` (§6 step 3) | Cash Flow Control > Savings System > Debt Load > Emergency Runway > Wealth Fuel *(= the category object's literal key insertion order: `cashRemaining, savingsRate, debtPressure, emergencyFund, investments`)* |
| **Warning Light safety-sequence order** | Resolving a `<= 0.10` tie at the *bottom* when the optional objective is omitted or doesn't match either tied category (§6.1) | Cash Flow Control > Emergency Runway > Debt Load > Savings System > Wealth Fuel |

---

## 6.3 Strong Signal / Warning Light Collision Policy — Confirmed Independent, No Founder Decision Required

Codex determined: **the approved SPEC supports independent selection — no Founder decision is
required.** This revision removes Revision 2's statement that the Founder must decide whether
Strong Signal should be excluded from Warning Light candidacy. Stated explicitly, for BUILD:

- Strong Signal (§6 step 3) is computed **independently** from Warning Light selection (§6.1) —
  both operate over the same `relativeScores` array, using opposite sort directions, but neither
  selection consults or excludes the other.
- Strong Signal is **not** automatically excluded from Warning Light candidacy. No filter that
  removes the Strong Signal category from the Warning Light candidate list exists or is added by
  this plan.
- In a fully-tied, below-`0.90` profile (not the §6 step 4 fallback case), the same public
  category may theoretically be named as **both** Strong Signal and a Warning Light — a direct,
  deterministic consequence of the approved math (a stable ascending sort and a stable descending
  sort of an all-equal array both place the first-key-order entry at position `0`), not an
  engineering-invented exclusion filter.
- This is consistent with the approved SPEC, which never states or implies a mutual-exclusion
  rule between Strong Signal and Warning Light selection.
- **No product amendment or Founder decision is required.** BUILD must not invent an exclusion
  rule that the SPEC does not contain.

---

## 7. Action Library Data Contract

An immutable, deterministic structure — exactly **six** fixed entries, no runtime LLM generation,
no arbitrary free-text creation, no alternative versions per category. Each entry's shape:

```
{
  actionId: string,                 // stable identifier
  categoryKey: string | null,       // the internal flightScoreCalculator.js key, or null for the fallback (not a ranked signal)
  category: string,                 // public label from categoryMap (or "Ownership Mindset")
  doNow: string,
  thisPayday: string,
  thisMonth: string,
  thirtyDayMission: string,
  workbookTab: string,
  workbookAction: string,
  emailSafe: true,                  // always true in V1 — see the no-interpolation rule below
}
```

The shared, single `educationGuardrail` constant ("never recommend a security, lender, credit
product, debt settlement provider, tax position, or legal action") is referenced once by the
disclaimer rendering and is **not** duplicated per entry.

**Resolved implementation detail — no raw-value interpolation, on-screen or emailed.** SPEC §10's
worked persona examples illustrate the ranking math with hand-computed dollar/percentage figures
in the prose (e.g., "~$1,000 to reach 100% of your emergency fund goal"), but SPEC §8's actual
Required Result row only requires "one measurable mission... carrying its own explicit,
self-checkable success condition" — it does not mandate a dollar figure in the rendered text. To
satisfy the Founder's decision that "any transmitted plan copy... MUST NOT interpolate
user-specific raw financial values" *and* to keep on-screen and emailed copy identical (simpler,
lower-risk, no second copy variant to maintain), every entry's copy below is **behavioral, not
numeric** and carries `emailSafe: true` unconditionally — the same string renders on screen and
is the one sent by `createMailerLitePayload` (§9). This is a resolved engineering default within
the SPEC's own text (§8 never required a number), not a reopening of product content.

### The Six Fixed V1 Entries

Each entry's `doNow` is drawn directly from SPEC §8's restored action library's "Approved First
Action"; `workbookTab`/`workbookAction` reproduce SPEC §8's exact workbook control; `thisPayday`,
`thisMonth`, and `thirtyDayMission` translate that same approved intent into the smallest bounded
cadence copy consistent with SPEC §9's Do Now/This Payday/This Month framework (Do Now =
completable today; This Payday = tied to the next paycheck cycle; This Month = the behavior that
needs to become consistent) — one exact entry per category, no alternates.

**1. Cash Flow Control** (`categoryKey: "cashRemaining"`)
- `actionId`: `"cashFlowControl"`
- `doNow`: "Open your budget and confirm every dollar of income, needs, and wants for this month."
- `thisPayday`: "Before spending anything new, confirm this payday's bills are covered first."
- `thisMonth`: "Find and close one spending leak so more of your income stays working for you."
- `thirtyDayMission`: "Keep your monthly cash flow at zero or above for one full pay cycle."
- `workbookTab` / `workbookAction`: "Monthly Budget + Dashboard" / "Cash Flow Control row"

**2. Savings System** (`categoryKey: "savingsRate"`)
- `actionId`: `"savingsSystem"`
- `doNow`: "Set up or confirm one automatic transfer from checking to savings for your next payday."
- `thisPayday`: "Let that automatic transfer run without touching it."
- `thisMonth`: "Keep the transfer running every payday this month, even if the amount is small."
- `thirtyDayMission`: "Complete four consecutive automatic transfers to savings without skipping one."
- `workbookTab` / `workbookAction`: "Savings Tracker + Monthly Budget" / "Savings System row"

**3. Debt Load** (`categoryKey: "debtPressure"`)
- `actionId`: `"debtLoad"`
- `doNow`: "Confirm your minimum payments and choose one balance to prioritize."
- `thisPayday`: "Send any extra amount you can toward that one priority balance."
- `thisMonth`: "Track your priority balance going down at least once this month."
- `thirtyDayMission`: "Make one extra payment toward your priority balance beyond the minimum."
- `workbookTab` / `workbookAction`: "Debt Snowball + Monthly Budget" / "Debt Load row"

**4. Emergency Runway** (`categoryKey: "emergencyFund"`)
- `actionId`: `"emergencyRunway"`
- `doNow`: "Set your next emergency fund target and confirm where that money will sit."
- `thisPayday`: "Move a repeatable amount toward that target."
- `thisMonth`: "Keep the contribution going every payday this month."
- `thirtyDayMission`: "Grow your emergency fund by one repeatable contribution each payday this month."
- `workbookTab` / `workbookAction`: "Savings Tracker + Dashboard" / "Emergency Runway row"

**5. Wealth Fuel** (`categoryKey: "investments"`)
- `actionId`: `"wealthFuel"`
- `doNow`: "Review your current investing or long-term saving contribution."
- `thisPayday`: "Confirm that contribution processed as expected."
- `thisMonth`: "Keep the contribution consistent every payday this month."
- `thirtyDayMission`: "Maintain one repeatable investing or long-term saving contribution for a full month."
- `workbookTab` / `workbookAction`: "Investment Tracker + Savings Rate" / "Wealth Fuel row"

**6. Ownership Mindset — fallback** (`categoryKey: null` — not a ranked signal; used only when SPEC §6 Step 5 / this plan's §6 step 4 fallback applies)
- `actionId`: `"ownershipMindsetFallback"`
- `doNow`: "Complete a Control Tower Review of your full dashboard before your next payday."
- `thisPayday`: "Choose one area to optimize even though your numbers are already strong."
- `thisMonth`: "Look for one way to increase income, investing, or ownership capacity."
- `thirtyDayMission`: "Complete one full Control Tower Review and choose one growth priority for next month."
- `workbookTab` / `workbookAction`: "Dashboard + Month-End Reset" / "Ownership Mindset review"

None of the six entries names a security, a specific lender, a credit product, a tax position, a
legal action, or a debt settlement provider, and none contains open-ended AI content or a
user-specific dollar interpolation — each is a single, fixed, deterministic V1 choice with no
alternate version. **Founder review of this exact copy happens at the existing W1 authorization
gate (§17) before production implementation — that review is not a blocker to PLAN approval.**

---

## 8. Input Integration

Unchanged from Revision 1's recommendation — append both new fields to the end of the existing
`#score-form`, before its submit button, on **both** `index.html` and `ffm-scorecard.html`. No
site-wide form refactor.

Explicit requirements added in this revision:

- **Immediate pressure placeholder cannot submit.** The `<select>` defaults to a neutral,
  non-selectable-as-final placeholder (e.g. "Select current pressure"); `validateInputs()` in
  `main.js` gains a check rejecting the placeholder value, exactly like the existing income
  check already rejects `<= 0`.
- **Short-term objective may be genuinely blank.** Its default option represents "no objective
  selected" and maps directly to SPEC §6 Step 4's "omitted" branch — no separate null-handling
  path is needed.
- **Scorecard inputs are never re-entered** — both new fields live inside the same `#score-form`
  and are read via the same single submit handler that already reads the 9 existing fields.
- **`scorecard_start` behavior is explicitly unchanged**: the existing listener fires
  `trackScorecardStart()` only on `event.target.matches("input")` — the two new fields are
  `<select>` elements, which this selector does not match. A user who only touches the two new
  selects (without touching any number field) will not trigger `scorecard_start` before
  submitting. This is documented here as an accepted, minor edge case rather than a silent
  behavior change; extending the listener to also match `select` is explicitly **out of scope**
  for V1 unless the Founder asks for it separately, since it would alter the existing funnel's
  definition of "start."
- **Both production routes receive equivalent fields and behavior.** `/` (`index.html`) and
  `/ffm-scorecard.html` must be edited identically for every new field, section, and script
  change — verified per §15.

---

## 9. Structural Privacy Enforcement (allowlisted serializers)

Enforcement is structural, not just documented: each serializer builds a **new object literal**
from **explicitly named parameters**, never spreads an unsafe parent object, and is covered by an
automated fuzz test asserting no forbidden key can survive serialization even if one is
(accidentally or maliciously) passed in.

```
createMailerLitePayload({ email, consentVersion, consentTimestamp, planSummary }) {
  // planSummary is itself already a pre-reduced object — never the full
  // DerivedContext or PersonalizedFlightPlanResult. Destructure explicitly:
  const { score, stage, strongSignalCategory, warningLight1Category, warningLight2Category,
          actionId, workbookTab, workbookAction, doNow, thisPayday, thisMonth, thirtyDayMission }
        = planSummary;
  return { email, consentVersion, consentTimestamp, score /* only if template requires it */,
           stage, strongSignalCategory, warningLight1Category, warningLight2Category,
           actionId, workbookTab, workbookAction, doNow, thisPayday, thisMonth, thirtyDayMission };
  // Never: `{ ...planSummary }`, never `{ ...formValues }`, never the raw metrics object.
}

createAnalyticsPayload(eventName, { stage, strongSignalCategory, warningLight1Category, decisionPath }) {
  return { eventName, parameters: { stage, strongSignalCategory, warningLight1Category, decisionPath } };
  // Never: email, never a dollar amount, never a ratio.
}

createCalibrationRecord({ score, stage, strongSignalCategory, strongSignalTieBreak,
                           warningLight1Category, warningLight2Category, relativeScores,
                           decisionPath, actionId, workbookTab, workbookAction, testId }) {
  // relativeScores is reshaped into an explicit, fixed-shape object — never passed through as
  // whatever shape the caller happened to have — keyed by the five approved public categories:
  const { cashFlowControl, savingsSystem, debtLoad, emergencyRunway, wealthFuel } = relativeScores;
  return { score, stage, strongSignalCategory, strongSignalTieBreak, warningLight1Category,
           warningLight2Category,
           relativeScores: { cashFlowControl, savingsSystem, debtLoad, emergencyRunway, wealthFuel },
           decisionPath, actionId, workbookTab, workbookAction, testId };
  // `founderJudgment` and `note` are NOT produced here — see §12, they are the Founder's own
  // manual notes, never generated or stored by this function.
}
```

**Required automated tests** (§14) — strengthened in this revision beyond a flat key-set check:

For **every** serializer:
- Construct a fuzz-input object containing every field on the MUST-NOT-send list (§10) *plus*
  every allowed field, call the serializer, and assert the returned object's key set is **exactly**
  the documented allowlist — no forbidden top-level key survives.
- Attempt a prototype-pollution-style input (e.g., a `__proto__`/`constructor.prototype` key, or
  an input object built via `Object.create()` with polluted inherited properties) and assert the
  returned object's own prototype is unaffected and no such key appears as an own property —
  proving construction is safe even against adversarial input shapes, not just missing fields.
- Assert the returned object contains **no unexpected nested object** — `createMailerLitePayload`
  and `createAnalyticsPayload` return flat structures by design; a test asserting every value is a
  primitive (string/number/boolean), except where a nested shape is explicitly documented, catches
  an accidental object/array leaking through.
- Attempt passing a forbidden raw value under a different/alias key name (e.g., `rawIncome`,
  `_income`, `formValues`) and assert it never appears anywhere in the output, proving the
  allowlist is enforced by explicit destructuring, not by name-matching that an alias could evade.

**Additional required tests specific to `createCalibrationRecord`'s `relativeScores`:**
- The returned `relativeScores` object contains **exactly** the five approved public-category
  keys (`cashFlowControl`, `savingsSystem`, `debtLoad`, `emergencyRunway`, `wealthFuel`) — no more,
  no fewer, and never a raw internal calculator key (`cashRemaining`, etc.) at this boundary.
- Every one of the five values is a **finite** number (`Number.isFinite`).
- Every one of the five values is `>= 0`.
- Every one of the five values is `<= 1`.
- A fuzz input supplying a sixth key, a missing key, a `NaN`/`Infinity` value, or a value outside
  `[0, 1]` on `relativeScores` is rejected or stripped, never passed through silently.

---

## 10. Network Boundary Matrix

| Class | Fields | Crosses network? |
|---|---|---|
| **Client only — never transmitted** | All 9 raw financial inputs; `immediatePressure`; `shortTermObjective`; `cashRemaining`; `savingsRate`; `debtToIncome`/debt ratio; `emergencyFundLevel`; raw `categoryScores` point values | **Never** |
| **Email provider (MailerLite)** | Only the Founder-approved allowlist in §9's `createMailerLitePayload`: email, consent version, consent timestamp, score (only if actually required), stage, Strong Signal category, Warning Light #1/#2 categories, action-library id, workbook tab/action, Do Now/This Payday/This Month/30-Day Mission copy | Yes — allowlist only, gated on W3A capability verification (§11) |
| **Analytics (GA4)** | Event names + the categorical, non-financial parameters in §9's `createAnalyticsPayload` (stage, Strong Signal category, Warning Light #1 category, decision path) | Yes — allowlist only |
| **Calibration** | The engine-derived fields in §9's `createCalibrationRecord` (score, stage, Strong Signal category + tie flag, Warning Light #1/#2 categories, the 5 *normalized 0–1* relative scores keyed by public category — never a raw internal calculator key, §9, decision path, action id, workbook route, test id) | **Never transmitted** — console-only, manual Founder capture (§12) |
| **URLs / subject lines / logs** | — | **Never**, for any field above except the analytics allowlist through GA4's own standard event pipeline |

---

## 11. Email Delivery Work Package (replaces the Revision 1 email-only assumption)

**W3A — MailerLite Capability Verification** (read-only / controlled-configuration verification;
no code merged to a production send path; no configuration mutation without Founder
authorization):

Determine, and record a PASS/FAIL/BLOCKED verdict for each:
1. Can existing MailerLite support actual Personalized Flight Plan delivery using approved custom fields?
2. Can deterministic plan copy or approved identifiers be merged into the email template?
3. What exact custom fields would be required?
4. How long are those fields retained by the provider?
5. Can they be cleared/overwritten if required?
6. How are existing subscribers handled (avoiding the duplicate-enrollment issue the existing Starter Kit flow already guards against)?
7. What triggers the automation?
8. Does updating an existing subscriber's custom fields retrigger an unwanted automation?
9. How is duplicate enrollment prevented for this new send path specifically?
10. How is unsubscribe respected?
11. Can consent version/timestamp be retained as required by SPEC §13?
12. How does a provider failure surface to the user and to analytics?

Per `docs/funnel/README.md`'s evidence classification, MailerLite workflow/automation internals
are **Private Information Only** — the detailed findings belong in the approved private record
(`docs/projects/core-funnel-reliability-gate/`), not committed verbatim to this repo. Only a
sanitized PASS/FAIL/BLOCKED summary, using the existing `FFM-EV-YYYY-MM-DD-NN` convention already
established in `docs/funnel/ga4-verification-log.md`, belongs in the public repo.

**W3B — Email Architecture Implementation** — only proceeds if W3A returns sufficient
capability. Defines exact fields/payload (§9's allowlist), the email template, subject line
(no financial data), trigger, automation, consent storage, duplicate-enrollment behavior,
unsubscribe behavior, provider-failure error state, and a tested rollback procedure. **EMAIL MY
FLIGHT PLAN is a new, separate form and (very likely) a separate MailerLite group/automation from
the existing `#lead-form`/"Send Me The Starter Kit" flow** — the existing flow's 5-message
Pre-Flight sequence is about the Starter Kit generically and must not be conflated with, or
repurposed for, sending an individual's plan content. The existing lead-form is a protected scope
guard (§18) and is not touched by W3B.

**If W3A is insufficient:** **STOP AT EMAIL GATE.** Output `EMAIL DELIVERY ARCHITECTURE BLOCKED`.
Do not relabel the existing generic Starter Kit reminder as EMAIL MY FLIGHT PLAN. Do not
introduce a backend without a separate, explicit Founder architecture decision. Return the
conflict to the Founder.

---

## 12. Calibration Model — Manual Founder Capture, No New Infrastructure

No production debug endpoint, hidden server endpoint, database, persistent calibration service,
or public URL parameter carrying diagnostics is introduced.

Because `createCalibrationRecord` (§9) already produces a fully sanitized object (no dollar
figures, no raw form payload — only the SPEC §11 MAY-contain fields), the **entire calibration
mechanism is a single `console.info`/`console.table` emission** of that object, made by `main.js`
immediately after a plan renders — visible only in a browser's own DevTools console during a
pilot test session (e.g., the Founder present or screen-sharing with the tester), never rendered
to the page DOM, never gated by a URL parameter or feature flag, and requiring no server. Because
the emitted object is already stripped of anything sensitive, there is no privacy cost to it
firing unconditionally rather than being gated to a "pilot mode" — gating would itself require a
new flag/config surface this plan is trying to avoid. This is deleted (the single `console.info`
call site removed) in a follow-up cleanup commit once Batch 2 concludes, per SPEC §11's retention
rule that calibration evidence is temporary and scoped to the pilot's calibration window.

Pilot procedure (unchanged from the approved SPEC §15, restated for BUILD):
1. User receives the untouched, fully self-service plan — nothing about the delivered plan is ever edited.
2. Founder reads the sanitized derived output from the console during/after the session.
3. Founder manually records, in their own private notes (not in this codebase): stage, Strong Signal, Warning Light #1/#2, the five normalized relative scores, decision path, action id, workbook route, QA judgment (correct/questionable/incorrect), and an optional brief engine-reasoning note.
4. No raw input is ever recorded, because none is ever produced by `createCalibrationRecord` in the first place.
5. Engine Failure Rate is calculated after Batch 1: `<= 1/5` → proceed to Batch 2; `>= 2/5` → stop, fix the flagged rule, re-verify against the four SPEC §10 personas, then resume.

---

## 13. Analytics

**The four approved V1 Flight Plan events** — all equal, first-class events, not three "real"
events plus an afterthought:

| Event | Purpose |
|---|---|
| `personalized_plan_view` | The plan rendered on screen (product interaction) |
| `personalized_plan_email_start` | The EMAIL MY FLIGHT PLAN send was initiated (product interaction) |
| `personalized_plan_email_success` | The send completed successfully (product interaction) |
| `personalized_plan_email_error` | **Technical observability only** — the send failed |

**`personalized_plan_email_error` is explicitly a fourth, equal event in this set, not a lesser
add-on.** Its purpose is narrow and stated precisely: it exists **only** to detect a
provider/send failure on the new EMAIL MY FLIGHT PLAN path (mirroring, but distinct from, the
existing Starter Kit lead-form's own `briefing_submit_error`). It is **not** a new product
interaction to analyze funnel behavior with — it is diagnostic. It **must carry no email
address, raw financial data, ratio, plan narrative, or other sensitive payload**; at most it may
carry a single allowlisted categorical error class (e.g., `"timeout"` / `"provider_error"`, the
same two classes the existing `briefing_submit_error` already uses) if useful for triage.

**Removed from scope** (per Revision 2's review): `starter_kit_open`, `plan_action_acknowledged`
— not introduced unless a later, explicit product requirement calls for them.

**Existing funnel events are unchanged**: `scorecard_start`, `scorecard_complete`,
`briefing_view`, `briefing_submit_start/success/error`, `sign_up` all continue to fire exactly as
they do today, verified via a GA4 Realtime check (§17 W4) following the existing
`docs/funnel/ga4-verification-log.md` methodology. The existing Funnel Activation error/success
events are not touched, renamed, or repurposed by any of the four events above.

All four events go through the allowlisted `createAnalyticsPayload` serializer (§9) — no ad hoc
`trackEvent(...)` call site outside that path is permitted for Flight Plan events.

---

## 14. Minimal Automated Test Infrastructure

**Adopt Node's built-in test runner** (`node --test`) — zero external testing dependencies. A
minimal root `package.json` is added:

```json
{
  "name": "financialflightmode",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

`"type": "module"` is required because the existing `src/` files already use ESM
`import`/`export` syntax; Node's test runner needs this (or `.mjs` files) to parse them directly.
No `"build"` script is defined, and this package.json intentionally declares nothing that would
give Netlify's build image a reason to run anything beyond serving the static tree — **this must
be verified, not assumed**: W0's acceptance criteria (§17) require confirming, via the same
Netlify PR deploy-preview check-runs already visible on this repo's PRs ("Redirect rules",
"Header rules", "Pages changed"), that introducing `package.json` does not change the deploy
behavior. If Netlify's build image auto-detects the file and attempts an `npm install`/build step
that didn't run before, that must be caught here and resolved (e.g., an explicit empty `[build]
command` in `netlify.toml`) before this package.json merges to `main`.

**Corrected, empirically-verified test command.** Revision 2's documented command,
`node --test src/`, **is invalid** — verified in this planning environment: Node treats a bare
directory argument to `--test` as a module specifier to *execute*, not a search path, and it
fails immediately with `Error: Cannot find module '.../src'` (`MODULE_NOT_FOUND`), exit code `1`.
The corrected command is **`node --test`, with no path argument, run from the repository root**.
This was verified to work correctly: a test file placed at `src/sample.test.js` was
automatically and recursively discovered by Node's own default test-file glob with zero
additional configuration, and passed. This plan no longer relies on any unverified assumption
about `node --test`'s argument handling.

**Test discovery convention.** Test files are named `<subject-module>.test.js` and live directly
alongside the module they cover inside `src/` (e.g., `src/flightScoreCalculator.test.js`,
`src/personalizedFlightPlan.test.js`) — this matches Node's built-in default discovery pattern
for `*.test.js` files anywhere in the project tree, confirmed working by the verification above.
No test-path configuration, glob, or additional tooling is required.

**Exact commands:**
- **Local**: `node --test` (run from the repository root), or `npm test` once `package.json` is present — both invoke the identical command.
- **CI / reviewer**: the same `npm test` (or `node --test`), run from the repository root, with no other setup beyond having Node installed.

**Documented, tested Node runtime — no Node 18 assumption.** This environment resolves `node` at
`/opt/node22/bin/node` via an explicit `PATH` entry, not a system-default location.
- **Tested major version**: Node **v22** (exact patch verified: **v22.22.2**). `node --test`
  was empirically exercised on this exact version, per the verification above.
- **Minimum supported version**: **not asserted.** Node 18 was never tested in this environment,
  and this plan does not claim compatibility with it or any version below the tested v22.22.2
  baseline — Revision 2's `engines.node: ">=18"` assumption is removed rather than carried
  forward unverified. `package.json` intentionally omits an `engines` field for the same reason:
  asserting a floor this plan cannot verify would reintroduce the same problem this revision is
  closing. If a lower bound is verified later (e.g., against whatever Node version a CI runner
  actually provides), `engines.node` can be added at that point to enforce it.
- BUILD must confirm `node --test` runs correctly on the exact Node version available in
  whatever local/CI environment executes W0 (§17) before treating any version as supported —
  plain `node` is not guaranteed to resolve to the same binary in every shell (e.g., a minimal
  non-interactive shell that doesn't source the profile that adds `/opt/node22/bin` to `PATH`).

**Required test matrix** (mapped to this repo's actual fixtures):

| Category | Fixtures |
|---|---|
| Existing Scorecard regression | Score boundaries 39/40, 69/70, 89/90; SPEC §10's four persona score/stage pairs (35/Pre-Flight, 25/Turbulence, 82/Cruise Control, 100/Flight Mode) unchanged pre/post the new exports |
| Pressure | Persona 2 (negative cash, `-$300`), Persona 1 (exact-zero cash, `$0`), a corroborated-pressure fixture (`savingsRate < 0.05` or `emergencyFundLevel < 0.25` + non-Stable), Persona 4 (uncorroborated pressure → Flag/Context) |
| Stage sequencing | Pre-Flight and Turbulence fixtures with Wealth Fuel as the mathematically weakest signal, confirming it never appears as Warning Light #1/#2; Cruise Control and Flight Mode fixtures confirming Wealth Fuel *is* eligible there |
| Tie logic | Persona 3 (`0.03` gap, `<= 0.10`), a `> 0.10` fixture (no tie-break applied), objective-matches-tied-pair, objective-omitted, objective-maps-to-neither-tied-category (falls back to the same safety-sequence order as omitted) |
| Strong Signal | Persona 3 (unique max), a new synthetic two-way-tied-but-not-all-five fixture, Persona 4 (all-five tie, resolves to Cash Flow Control), a new synthetic all-five-tied-but-below-0.90 fixture exercising the §6.3 collision policy |
| Warning Lights | Persona 1/2 (Hard Override forces Cash Flow Control as #1), deterministic #2 selection, an always-distinct assertion run across the full fixture set |
| Action library | All five signal entries plus the Ownership Mindset fallback present with every required field non-empty |
| Privacy serializers | `createMailerLitePayload`, `createAnalyticsPayload`, `createCalibrationRecord` fuzz-tests (§9) — no forbidden key ever survives serialization |

---

## 15. Duplicate Route Parity

`index.html` and `ffm-scorecard.html` both remain in scope; **V1 does not refactor this
duplication**. Every Personalized Flight Plan markup/script change must be applied identically to
both files. Parity is verified with the same `diff` check already used to confirm today's baseline
duplication (Revision 1 confirmed the only current differences are canonical URL, Open Graph URL,
structured-data `@id`/URL, and the `#score-form` `action` attribute) — any *new* difference found
in a post-change diff, beyond those four pre-existing, intentional ones, is a failure that blocks
the relevant W-package (§17).

---

## 16. Privacy / Terms / Disclaimer

**`privacy.html`** — BUILD + pilot-launch requirement. Must explicitly state: raw financial
inputs remain client-side; the Personalized Flight Plan calculation remains client-side; exactly
what derived, non-raw information may be sent by email (cross-referencing §10's allowlist) and to
whom; consent behavior and consent-metadata retention; calibration evidence handling (temporary,
pilot-only, deleted at the end of the calibration window, never a persistent profile); and the
existing analytics boundary language, extended to cover the new events (§13). **Must not**
reintroduce Revision-2-era (of the SPEC's own revision history) temporary raw-financial-data
retention language — the current, simpler "never transmitted" model stands.

**`terms.html`** — no change required unless BUILD introduces a materially different service or
new defined term; not anticipated by this plan.

**Flight Plan disclaimer** — BUILD requirement. The existing education-only disclaimer language
(already used by the Scorecard) must also appear on the rendered Personalized Flight Plan output
itself, not only on `privacy.html`.

---

## 17. Work Packages (W0–W6)

### W0 — Baseline / Test Runtime
- **Objective**: reproducible automated testing, zero behavior change to the live site.
- **Likely files**: `package.json` (new), `src/flightScoreCalculator.js` (two additive exports only), `src/flightScoreCalculator.test.js` (new).
- **Dependencies**: none.
- **Acceptance criteria**: `npm test`/`node --test` passes locally with the documented Node version; Netlify PR deploy-preview check-runs (Redirect rules / Header rules / Pages changed) remain successful and unchanged after adding `package.json`; existing Scorecard regression fixtures (§14) match exactly before and after the export change.
- **Test evidence**: `node --test` output attached to the PR; linked Netlify check-run results.
- **Rollback**: revert the single commit; no production surface exists yet.
- **Founder authorization gate**: none required (no behavior change).

### W1 — Pure Personalized Flight Plan Engine
- **Objective**: implement `src/personalizedFlightPlan.js` fully per §5–§9, unimported by any production file, fully covered by §14's test matrix.
- **Likely files**: `src/personalizedFlightPlan.js` (new), `src/personalizedFlightPlan.test.js` (new).
- **Dependencies**: W0.
- **Acceptance criteria**: all four SPEC §10 personas reproduced exactly; every SPEC §16 acceptance criterion in the 5–11 and 19–21 range has a corresponding passing test; the three serializer fuzz-tests pass; the module contains no `document`, `fetch`, `gtag`, or `window` reference (grep-verified).
- **Test evidence**: full test-suite output; a table mapping each covered SPEC §16 acceptance criterion to its test name.
- **Rollback**: revert the module and its test file.
- **Founder authorization gate**: none required for the logic itself (inert until W2). The Founder reviews the six fixed action-library entries' exact copy (§7) at this gate before production implementation proceeds to W2 — that review is not a blocker to PLAN approval itself.

### W2 — Two-Route UI Integration
- **Objective**: wire the module into both live routes; add the two new inputs; render the Flight Plan output and disclaimer.
- **Likely files**: `index.html`, `ffm-scorecard.html`, `src/main.js`, `styles.css` (only if new elements need styling beyond existing patterns).
- **Dependencies**: W1.
- **Acceptance criteria**: routes are byte-equivalent in new markup/behavior except the four pre-existing intentional differences (§15); immediate-pressure placeholder cannot submit; short-term objective may be blank; `scorecard_start` firing behavior is unchanged and documented (§8); passes on current mobile Safari, mobile Chrome, desktop Chrome, desktop Safari; the rendered plan shows Score+Stage, Strong Signal, Warning Light #1/#2 (or the fallback), Do Now/This Payday/This Month, 30-Day Mission, Workbook Connection, both CTAs, and the education-only disclaimer.
- **Test evidence**: route diff showing only the four pre-approved differences; 4-browser manual QA checklist.
- **Rollback**: revert the file diffs; W1's module is unaffected.
- **Founder authorization gate**: **yes** — first Founder-visible render of the on-screen plan; sign-off required before W3.

### W3 — Email Delivery + Consent (§11)
- **W3A — MailerLite Capability Verification**: read-only/controlled-config investigation, sanitized public `FFM-EV-YYYY-MM-DD-NN` summary + full private-record detail. **Founder authorization gate: mandatory** before any configuration mutation.
- **W3B — Implementation** (only if W3A sufficient): new, separate EMAIL MY FLIGHT PLAN form/handler using the §9 allowlist; existing `#lead-form` untouched. **Founder authorization gate: mandatory** before general pilot use.
- **If W3A insufficient**: STOP AT EMAIL GATE — output `EMAIL DELIVERY ARCHITECTURE BLOCKED`, return to Founder.
- **Dependencies**: W2 (W3A), W3A PASS (W3B).
- **Acceptance criteria / test evidence / rollback**: see §11.

### W4 — Analytics
- **Objective**: add all four approved Flight Plan events (§13) — `personalized_plan_view`, `personalized_plan_email_start`, `personalized_plan_email_success`, and the technical-observability `personalized_plan_email_error` — all through the allowlisted serializer; leave existing funnel events untouched.
- **Likely files**: `src/main.js`.
- **Dependencies**: W2 (view event); W3B (email events).
- **Acceptance criteria**: existing funnel events verified unchanged via a GA4 Realtime check; new events carry only allowlisted categorical parameters (serializer fuzz-test applied at each call site).
- **Test evidence**: new `FFM-EV-YYYY-MM-DD-NN` entry in `docs/funnel/ga4-verification-log.md`.
- **Rollback**: revert new `trackEvent(...)` call sites.
- **Founder authorization gate**: none beyond the standing privacy-copy rule.

### W5 — Calibration + Privacy
- **Objective**: wire the console-only calibration emission (§12); update `privacy.html` (§16).
- **Likely files**: `src/main.js`, `privacy.html`.
- **Dependencies**: W2.
- **Acceptance criteria**: calibration record fields match SPEC §11's MAY-contain list exactly (re-verified fuzz-test at the call site); `privacy.html` covers every item in §16; no Revision-2-style persistent retention language reintroduced.
- **Test evidence**: manual read-through checklist against SPEC §13/§16 items 15–16, 19–20.
- **Rollback**: revert the `privacy.html` copy and the single console-emission call site.
- **Founder authorization gate**: **yes** — before Batch 1 begins.

### W6 — Full QA / Regression
- **Objective**: end-to-end verification gate before Batch 1 pilot recruitment.
- **Likely files**: none (verification only).
- **Dependencies**: W0–W5 complete.
- **Acceptance criteria**: both routes on all 4 required browsers; existing Starter Kit path unaffected; new EMAIL MY FLIGHT PLAN path verified end-to-end with real content (not a generic reminder); duplicate-subscriber and unsubscribe checks pass; existing funnel GA4 events unchanged; `privacy.html` reviewed; a manual raw-value-leak inspection of every outbound network request (MailerLite body, GA4 payloads) during a full test run, layered on top of the automated serializer fuzz-tests.
- **Test evidence**: consolidated `FFM-EV-YYYY-MM-DD-NN` QA record (public summary + private detail).
- **Rollback**: n/a — failures route back to the relevant W-package.
- **Founder authorization gate**: **yes, mandatory** — final go/no-go before Batch 1.

---

## 18. Scope Guards

**Protect unchanged, unless a documented blocker requires Founder approval:**
Scorecard formulas; Scorecard stage thresholds; the recent Funnel Activation reliability fixes;
the existing 5-email MailerLite Starter Kit sequence; existing unsubscribe behavior; Starter Kit
download; existing funnel GA4 events; `netlify.toml`'s existing redirects; all unrelated public
pages (`terms.html`, `404.html`, `thank-you-download.html`, `thank-you.html`).

**Heightened review:**
`src/flightScoreCalculator.js` (additive-only exports); new `src/personalizedFlightPlan.js`;
`src/main.js`; `src/analytics.js`; `index.html`; `ffm-scorecard.html`; `privacy.html`; `styles.css`
(only if the new UI requires it); the new minimal test/`package.json` files — specifically
including verification that adding `package.json` does not change Netlify's build behavior
(§14/W0), which Revision 1 did not flag as a risk.

---

## 19. Risks (carried over / updated from Revision 1)

- Two near-duplicate HTML files must move together for every change — mitigated by the explicit parity check in §15.
- The lead-form/MailerLite path has a recent reliability history — mitigated by keeping EMAIL MY FLIGHT PLAN a fully separate form/handler from the existing `#lead-form` (§11).
- A required new select field adds friction — an approved, deliberate SPEC requirement, not something to soften.
- **New in this revision**: introducing a root `package.json` for testing could unintentionally change Netlify's build behavior — mitigated by explicit deploy-preview verification in W0.
- **New in this revision**: PR #10 is still not merged as of this writing — this plan's sequencing (§2) exists specifically to prevent BUILD from starting on the wrong base.
