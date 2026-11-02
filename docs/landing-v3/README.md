# Approved landing V3 release

The landing page now follows the approved centered black/orange runway concept: a concise hero, labeled illustrative report, three steps, and an optional Starter Kit signup. Both primary links reach the real scorecard. The secondary link opens the existing captioned walkthrough without autoplay. The full personal report appears after calculation; the standalone scorecard entry remains unchanged.

The real MailerLite form, endpoint, consent sequence, separate newsletter, redirect, download, legal pages, calculations, analytics event schema, and video assets are preserved. Small print is larger than the mock for readability. The decorative mock menu is omitted; secondary navigation remains in the footer. The production scorecard, video, About section, and legal content follow the landing sections.

## Validation

- 73 Node tests pass. No build or lint script exists; this is a static site.
- Landing regression at 320, 390, 760 and 1280: no overflow, early mobile CTA, illustrative labeling, all anchor targets, keyboard navigation, reduced motion, optional consent, and mocked signup failure/retry/success.
- Existing guided scorecard regression: representative scores 25/71/100, keyboard/Back/edit, validation, analytics privacy/network capture, no-JavaScript safeguards, reduced motion, no browser errors.
- Exact $10 negative cash flow in report and saved download; action/save shortcuts and 6.52:1 header button contrast.
- Itemized needs/wants/investments, HYSA separation, cents/removal, private labels and exported breakdown preserved.
- Offline HTML export opens without network requests; print entry and PDF rendering pass.
- Existing 134-second video plays and seeks at 390/760/1280, with 39 caption cues, no preload/autoplay, and pause on close.

All financial values used for QA were synthetic. Signup responses were intercepted locally; no real subscriber or email was created. Actual email receipt, physical phones, VoiceOver and physical printing remain unverified. A design rating is subjective, not conversion evidence.

## Release and rollback

Pre-release main: `bf62fea67aa60661aa372bd0c39c9e655a2c54db`.
Use the existing Git-connected Netlify deployment. Branch protection and active branch rules were empty when checked. Do not force push or alter protections. If rollback is needed, revert this release commit with a normal commit and push through the same deployment path, then verify the live site. No rollback has been performed.
