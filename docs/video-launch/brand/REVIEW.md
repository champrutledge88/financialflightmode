# Financial Cockpit tutorial review

Built as a narrated worked example through the actual steps 1 through 9. The requested form order supplies the storyboard. All displayed source screens were captured from the Phase 2 branch, not recreated. Alternatives retained in STORYLINES.md: report first, and payday receipt.

Output: 1920 x 1080, 30 fps, 134 seconds. Voice: already installed local MLX Kokoro through VoiceStudio, generic default voice. Quiet bundled taps only, without a music bed. No paid providers or new speech models were used.

Verified: all 11 WAV chapters decode at 24 kHz mono, measured chapter lengths fit the timeline, local transcription confirms the illustrative inputs and score 71 Cruise Control, and source copy is free of dash punctuation. The transcription has a trailing silence hallucination after the last sentence; it is an ASR artifact, is not used as captions, and does not change the generated script or audio.

HyperFrames final check: zero errors and zero warnings in lint, runtime, layout, motion, contrast, craft and audio. Global motion assertions are enabled. Inspected full resolution opening, mortgage exclusion, ending, both runway closeups, and beat, seam and phone sheets. A separate fresh eyes review of the storyboard and three sheets found no P0 or P1 issues.

Fixes made: deferred click feedback until its cue; stabilized cursor press state under seeking; removed duplicate image nodes; lengthened the runway closeups to 2.6 seconds each. Appearance assertions allow 0.6 seconds because the craft seek grid quantizes first visibility; titles themselves cut directly with their scenes. No warning waivers or broad layout ignores were added. Only decorative cursor and tap graphics are excluded from layout audit.

Weakest shot: step 6 has the densest source helper copy. The narration and large left instruction explain the mortgage exclusion so that viewers do not depend on reading the small source text. This is a landscape tutorial; full screen or phone landscape playback is the intended reading size. A separate portrait cut has not been made.

Audio was decoded, measured and transcribed, not listened to by a human. Final MP4 verified: 134.0 seconds, 1920 x 1080, 30 fps, H.264 picture and AAC stereo audio. Decoded opening, runway, pressure, ending and final frames inspected. Final audio is measured at minus 16.8 LUFS and minus 1.8 dBTP with no clipping. The narrated tutorial is included in PR 22 through an optional native video player. Scoring, the lead form and email code are unchanged.

Export correction: the default hardware drawElement capture produced two corrupted static text labels in a closing frame that was correct in snapshots. Exported again with --experimental-fast-capture=false. Standard screenshot capture fixed the artifact; the final closing and last frames were inspected. The npm render script keeps this flag for future exports.

## Flight Mode brand revision

Founder selected Keep preview only. No merge or production publication is authorized.

Replaced the white split panel with a black canvas. Headlines use the same locally installed Impact italic uppercase style as the site, with Inter for body copy. Large orange figures and short instructions supply the hierarchy. Removed the small repeated illustrative footer and labeled examples at the top instead. The ending separates the 71 Cruise Control example from the $100 next action and pairs each with the actual product card. Narration, captions and 134 second timing remain unchanged.

Brand checks: zero errors and zero warnings in lint, runtime, layout, motion, contrast, craft and audio. Inspected beat, seam and 360 pixel phone sheets. Steps show real captured controls in order. No title crops, seam collisions or ambiguous objects found. Dense debt helper copy remains the weakest source panel; large instructions and narration carry its meaning. Landscape playback remains preferable on a phone. No portrait version or human listening review was performed.

Brand MP4 decoded and inspected at the opening, runway closeup, score, next move and last frame. Typography is intact. Verified 134 seconds, 1920 by 1080, 30 fps. Separate review found no P0 or P1 issues.
