# Approved production release preparation · October 29, 2026

Mark explicitly approved going live with the existing landing page changes and current Financial Cockpit Walkthrough. No social posting is authorized. Release is through existing PR 22 and the connected Netlify Git deployment; do not substitute a different video.

## Final bounded corrections

- A $10 deficit now says Find $10, with exact cents, rather than adding an unexplained $25 buffer. No scoring or stage math changed.
- Small header CTA uses black text on the existing orange; measured contrast 6.52:1 at mobile and desktop.
- Next move and save controls moved immediately after the score/instrument overview, before long detail cards. Two accessible shortcuts at the report header jump directly to them. Existing design and report content retained.
- Clarify that financial answers stay in browser memory, while existing usage analytics include derived stage and broad score range. Privacy policy describes those categories and excludes exact scores, amounts, pressure and objective. Analytics collection and event schema are unchanged.

## Validation

70 Node tests pass. Responsive Chromium guided-flow/privacy regression passes at 390/760/1280. Export/edit tests pass, including offline standalone HTML, print entry, date/input summary, tiny-cash boundaries and both no-JavaScript entry points. New release checks pass at 390/1280 for exact $10 deficit in result and downloaded report, 6.52:1 header CTA contrast, early placement and working shortcuts, current privacy disclosure, no overflow and no browser errors. The current synthetic A4 export was rendered and visually inspected on two pages.

The network regression was corrected to avoid mistaking GA's automatic engagement timer for a synthetic dollar value when the numbers coincidentally match. Every outgoing parameter name and serialized financial field is still checked; custom event values are checked against entered amounts. No analytics collection changed.

Existing tutorial verified at 390/760/1280: 134 seconds, 1920x1080, 38 caption cues enabled, playback and seek work, paused on close, preload none, no initial MP4 download or autoplay sound, no overflow/browser errors. MP4 SHA256: dd4a884d5f01ecaa7001d267880feaaf61053a29771eb9c176c259291a6b9f9ee. Captions SHA256: 5b378ff91d9bdc919436a3a187c98255ae52672cbc73221ec3f916b6853da53c. Assets unchanged from the reviewed branch. Starter Kit ZIP CRC passes (3 entries); production URLs must be checked after deployment.

## Previous production and rollback

Previous main: 5fa264d29c30eff8b9a0e27d14c4bd84d7957226. Previous public asset fingerprints are in previous-production.json. Preserve this commit in Git history. If release verification fails, restore the previous Netlify production deployment if available, or revert the release merge commit with first parent (`git revert -m 1 MERGE_SHA`) through a corrective PR and deploy. Do not reset or force push main. No rollback has been performed. Record the actual merge/deployment identifiers after release.

No real financial answers, email leads or financial transactions were submitted. Native Safari is reserved for the separate video worker and live review. Physical devices, VoiceOver, actual printer and manual Safari print dialog remain unverified. A 4.7 rating is a target, not an earned claim.
