# Landing layout review, PR23

Preview only; based on d88eb338e245999cd2679a3ad2c6fe3e28606e6d. Production main remains 6870072bf3c5c8857872a07b992327a420830be9. No merge or production publication.

## Section map

Before: bold hero → Flight Notes / featured perspective → standalone Free Starter Kit strip → cockpit heading with collapsed walkthrough → input flow and report → How it works → trust badge → lead form → repeated kit promotion → About → trust points → disclaimer.

After: same bold hero → visible existing walkthrough → Mission: Cash Flow Control / Your Financial Cockpit → input flow and report → How it works → trust badge → lead form → About → trust points → disclaimer.

Flight Notes and article pages remain available through navigation. The redundant promotion immediately following the actual lead form is removed too. The old #starter-kit anchor now targets the actual offer at the form. Consent text, newsletter destination, lead handler and download assets are unchanged. The hero's secondary link now leads to the walkthrough. The video disclosure starts open on the landing page, remains keyboard collapsible, and still pauses on close. The separate scorecard entry page keeps its optional closed disclosure.

Actual rendered Starter Kit action controls: **4 before, 2 after**, at both 390 and 1280 widths. Before: header shortcut, free kit strip, signup submit, repeated promotion. After: header shortcut and signup submit. These counts exclude explanatory copy and the separate download destination. Two is an editorial choice that reduces repetition, not a measured conversion optimum.

Static layout is preferable here: the sequence itself explains watch → try → act. No new scroll animation, trapping, autoplay or dependency. Existing reduced motion remains honored. Mobile hero grid text previously clipped behind overflow:hidden; constrained the landing grid child and scaled its mobile heading so the existing bold hierarchy fits.

## Evidence

- before.json and verification.json: rendered section maps, CTA counts and layout/form/navigation checks.
- screenshots/: before/after desktop/mobile and video/cockpit views, also 760px after.
- video/verification.json: 390/760/1280 playback, 134s duration, 1920x1080, 39 showing caption cues, no autoplay or early MP4 loading, pause on close, no overflow/errors.
- checks/: original full suite outputs plus explicitly limited reruns.
- 73 unit tests passed. Release readability and flight-path-marker browser suites passed.
- Dedicated landing suite passed at 390/760/1280: section order, preserved hero, no clipping/overflow, keyboard disclosure, internal anchors, reduced motion, newsletter link, consent, invalid email, mocked provider failure/retry/success and redirect, download link.
- Category and final report suites originally stopped at Chromium's administrator restriction on file:// navigation. Temporary reruns rendered the exact downloaded HTML using setContent, preserving all content/print/flow assertions; these passed. This verifies exported content/print rendering, not OS file opening.
- Existing scorecard suite originally stopped at analytics delivery assertion because analytics requests are unavailable in this environment. Temporary rerun omitted only that network-delivery assertion; all other checks passed (25/71/100 fixtures, keyboard, Back, zero choices, reduced motion, storage, no-JS). Do not interpret the temporary log's network-check label as proof of delivery.
- No real signup/email was sent. Provider delivery, newsletter availability, physical-device Safari and VoiceOver remain unverified. Newsletter HTTP probe returned environment 403.

MP4 SHA256 c05cf6d83e9f828617607872a985c89b7e5b2c1dbf5c0800b114295fe1bc503a; captions SHA256 bb77b13e1513b632e7cef634b131b1705517203ad1808b9d4d98ee61082ea37e. Both unchanged from v3. Itemized inputs, single savings field, HYSA separation and financial calculations unchanged.

The unrelated unexpected-bill reassurance in personalizedFlightPlan.js remains unchanged, pending separate approval.
