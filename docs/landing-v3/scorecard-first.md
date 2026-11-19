# Scorecard-first layout follow-up

Mark requested the main content higher, then the how-to video link, then the scorecard. The page now presents:

1. Centered headline, short supporting copy, primary Start CTA.
2. Expandable how-to video link. Existing video, captions, controls and pause-on-close remain; the player is closed on arrival and does not autoplay.
3. Actual working Financial Cockpit scorecard and its calculated personal report.
4. Labeled illustrative report preview.
5. Three-step explanation.
6. Optional Starter Kit signup.
7. About, trust points, education disclaimer, footer.

Reduced header/hero spacing and compacted the scorecard introduction. At 390px wide: headline top 109px, main CTA top 299px, video link top 363px, scorecard top 407px, actual Start button bottom 722px. At 320px, actual Start ends at 870px. No horizontal overflow at 320/390/760/1280. The original colors, logo, runway, and centered identity remain.

No financial logic, application JavaScript, email wiring/automations, analytics, legal pages, downloads or video assets changed.

Validation: 73 Node tests; responsive/keyboard/CTA ordering and mocked signup tests at 320/390/760/1280; guided scorecard flows 25/71/100 with analytics privacy and no-JavaScript checks; existing video playback/captions/pause-on-close at 390/760/1280; exact deficit and saved report checks. Desktop and mobile screenshots were visually inspected. No real signup submitted.

Pre-correction production/rollback reference: `a88a177205ea7215cf816e2ff2584198be245255`. Its live HTML matched Git before editing, and no concurrent edits were present. Earlier pre-redesign reference remains `bf62fea67aa60661aa372bd0c39c9e655a2c54db`. Roll back via a normal revert commit through the existing Git-connected Netlify path; never reset or force push.
