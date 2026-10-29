# Itemized scorecard input preview

Follow-up to released production merge 6870072bf3c5c8857872a07b992327a420830be9. This expanded interaction is preview only and needs review. Production, the exact approved 134 second tutorial and the separate film task are unchanged. Do not merge or replace the tutorial until the refreshed captures have been checked.

## Choices implemented

Step 2 starts with Housing (rent or mortgage), Utilities, Insurance, Groceries and Minimum debt payments. Each has one monthly amount box and an accessible minus control to remove it. Add category creates a named custom row. Step 3 starts with Dining out, Optional subscriptions and Shopping and uses the same controls. Totals update at the bottom and Continue remains the explicit next-step action. Essential subscriptions belong in needs; minimum payments are not repeated in the separate extra-debt step.

Monthly savings remains one input. Step 8 starts with Roth IRA and Brokerage investment rows and permits more current account balances. Types include Roth, other retirement, brokerage, other investments, and cash/high yield savings. Optional nicknames never request account numbers. Invested amounts alone feed the existing investment aggregate. Cash/HYSA has a separate reference total, is excluded from invested value and is not added to Step 7. The visitor includes the emergency portion once in Step 7. Obvious cash labels entered under an investment type are rejected until classified as cash. No bank connections, account syncing or score methodology changes.

Unused default rows may remain blank. At least one explicit amount (including zero) is required; named custom rows or named accounts require an amount or removal. Negative, unknown and excess-decimal values block Continue. Integer cents keep totals exact. Remove recalculates immediately; removing all rows requires adding an explicit entry. Enter moves through row controls and leaves Continue as a deliberate action. Back/edit/recalculate preserve category state. Up to 20 rows per section keeps this a bounded scorecard.

Labels and entered values remain browser memory only. They are absent from event parameters, URLs and captured outgoing requests. The local report and offline HTML/print snapshot include the entered breakdown and clearly separate reference cash from investments and emergency cash. No persistent history or financial backend was added.

## Verified fixture for the walkthrough owner

Use walkthrough-fixture.json exactly. Needs 1800+250+150+700+500 = 3400. Wants 300+300+600 = 1200. Roth 1500 + brokerage 1000 = 2500 invested. Optional HYSA reserve 4000 is reference only and can represent the same 4000 already entered in Step 7; it does not raise either scored balance. Monthly savings stays 500.

With income 6000, extra debt 250, debt balance 18120, emergency cash 4000, goal 8000, pressure Stable and objective **Save more consistently**, actual result is **71 / Cruise Control**, cash left 650 and **Move $100 into savings**, lifting the savings rate to 10.0%. The 3-month suggestion chip displays **$10,200**; the fixture's entered goal remains **$8,000**. Do not confuse displayed suggestion with selected input.

**Ending caveat:** choosing **Build a cushion** with the same numbers keeps score 71 but the unchanged approved engine prioritizes **Debt Load**, with “Confirm your minimum payments and choose one balance to prioritize.” Retaining the $100 savings ending therefore requires the Save more consistently choice to be shown truthfully in the Step 9 capture, or the ending to be refreshed. Do not force the calculation to match old video copy. No tutorial render was started here.

## Validation and limits

73 unit tests pass, including blank/zero/negative/cents, classification, label escaping and unchanged 71 fixture. Existing flow/privacy regression passes at 390/760/1280 with scores 25,71,100; prior export/edit/no-JS and release-readability tests pass using the new rows. Dedicated feature browser checks at 390/1280 cover each total, add/remove, all-removed deliberate zero, named blank errors, keyboard, Back/edit, single savings input, HYSA exclusion and unchanged emergency balance, download breakdown and absence of private account/category labels from captured requests. Full synthetic itemized print output was rendered on 3 legible pages and visually inspected. No physical-device/VoiceOver or manual Safari print validation is claimed.

One final local browser run encountered a startup timeout in its last fresh context; readiness was made explicit and the full suite rerun. Inspect verification.json for the current completed run. No production source or scoring engine was changed to accommodate tests.

## Preview tutorial update

The completed matching v3 tutorial and its 39-cue captions were subsequently integrated into this draft preview. See ../tutorial-v3/README.md for hashes, validation and the asset-only rollback. Production keeps v2 until the expanded UI and matching tutorial are reviewed.
