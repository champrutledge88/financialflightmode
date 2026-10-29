# Flight Path location marker review

Scope: user requested a clean jet or a simple location dot in the Flight Path card. Replaced the angular plane SVG with a 14px orange circular dot, charcoal border and restrained light outline. Its center sits at score percent of track width and exactly on the track midline. The reveal uses the same dot styling and center alignment. Title, stage bands, copy, colors, scoring and calculator behavior are unchanged.

The standalone HTML download and print snapshot do not contain the Flight Path marker component; their source and behavior are unchanged. No unrelated contrast, layout or deficit changes were made.

Verification: 69 existing Node tests pass. Marker browser checks pass for scores 0, 39, 40, 69, 70, 89, 90 and 100 at 390px and 1280px (16 positions), including circular dimensions, accessible score label, horizontal/vertical center within 0.6px and no page overflow. Reveal consistency passes at both widths. Screenshots visually inspected, including both endpoints. Existing Chromium scorecard regression passes at 390/760/1280 including keyboard, reveal, reduced motion and privacy checks.

Reproduce: `node --test`; `node scripts/verify-flight-path-marker.mjs`; `node scripts/verify-scorecard.mjs`. Optional SCORECARD_ORIGIN and SCORECARD_EVIDENCE_DIR target the preview and evidence folder. Boundary tests override only display fixture scores; calculator source is not changed.

Preview only. No production merge or deploy. No Safari takeover during the live review. Physical-device rendering and screen reader behavior are not newly verified by this scoped correction.
