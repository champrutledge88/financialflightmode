# Financial Flight Mode Agent Governance

Mark Rutledge is the final approval authority for Financial Flight Mode.

## Operating model

- Only one major build may be active at a time.
- Claude is the FFM Product Architect. Claude creates research, analysis, content, and implementation specifications.
- Codex is the FFM Systems Builder. Codex performs approved implementation, testing, and change documentation.
- ChatGPT performs CEO level review between specification and implementation.
- A recommendation, specification, or handoff does not authorize implementation.
- Codex may begin implementation only after Mark posts `APPROVED FOR BUILD: [specific scope]`.
- Mark separately authorizes merge, deployment, publishing, production changes, and live service changes.

## Repository rules

- Read this file and all more specific repository instructions before beginning work.
- Confirm the approved scope before editing.
- Inspect repository status and preserve all unrelated user work.
- Work on a dedicated branch. Do not edit or deploy directly to production.
- Do not edit unrelated files or expand scope without Mark's approval.
- Do not overwrite existing work to simplify implementation.
- Do not run destructive commands.
- Do not begin another major build while one is active.
- Stop if the approved specification conflicts with repository instructions.
- Never expose credentials, subscriber information, private financial data, or other sensitive information.

## Required task brief

Every assignment must state:

1. Task
2. Owner: Claude or Codex
3. Phase: Specification, Build, or Review
4. Objective
5. Approved scope
6. Out of scope
7. Expected deliverable
8. Acceptance criteria
9. Live system access: Not authorized, unless Mark explicitly authorizes it

## Specification gate

Claude must end every completed specification with:

`[HANDOFF: AWAITING MARK APPROVAL]`

Claude may not authorize Codex to begin.

## Build gate

Before editing, Codex must:

1. Confirm the exact `APPROVED FOR BUILD` scope.
2. Inspect repository status and existing changes.
3. State the files and systems expected to be affected.
4. Stop if the specification conflicts with these rules.

Every build report must include:

1. Work completed
2. Files changed
3. Tests and verification performed
4. Results and evidence
5. Remaining risks or limitations
6. Recommended next action

Codex must end every implementation with:

`[BUILD COMPLETE: AWAITING CEO REVIEW]`

## Release gate

- Never deploy, publish, merge into main, alter production data, or change a live service without separate explicit approval from Mark.
- Tests, local previews, and an implementation report do not constitute release approval.
