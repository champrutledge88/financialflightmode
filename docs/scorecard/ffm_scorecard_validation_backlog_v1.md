# FFM Scorecard Validation Backlog v1

## Priority 1: Confirm Current Formula

- Extract all score calculations from the live code.
- Identify each input field.
- Identify point weights.
- Identify score caps.
- Identify status category logic.
- Identify recommendation logic.

## Priority 2: Fix Metric Labels

- Review any use of Debt-to-Income.
- Confirm whether the formula uses monthly debt payments or total debt balance.
- If total debt balance is used, change label to Debt Load.
- Only use Debt-to-Income if formal DTI is calculated.

## Priority 3: Validate Thresholds

Classify each scoring threshold as:

- Research-supported benchmark
- National reference data
- FFM methodology decision
- Behavioral design choice

## Priority 4: Test Household Scenarios

Run the formula against:

1. Negative cash flow household
2. Paycheck-to-paycheck household
3. No debt, no emergency fund household
4. High income, high debt household
5. Strong savings, weak cash flow household
6. One-month runway household
7. Three-month runway household
8. Strong Flight Mode household

## Priority 5: Keep Public Copy Simple

Confirm the result page shows:

- One score
- One status
- Short signal explanation
- Three next moves
- Education-only disclaimer

## Priority 6: Version Control

Create a changelog entry for every formula or label update.

Suggested format:

- Version
- Date
- Change made
- Reason for change
- Files changed
- Reviewer
