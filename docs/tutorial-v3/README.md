# Matching v3 walkthrough in PR 23 preview

Scope: update the draft preview's existing tutorial MP4 and captions to the completed v3 delivery. Category inputs remain at source revision 0081c89f1f631a4a1040b37da2f0469cf65631cf. No unrelated UI, scoring, layout, poster, audio/style/timing or separate-film changes were made by this integration. The website worker copied the verified supplied files; it did not render another video.

MP4: c05cf6d83e9f828617607872a985c89b7e5b2c1dbf5c0800b114295fe1bc503a, 5,877,378 bytes, 134 seconds, 1920x1080, 30fps / 4020 frames. Captions: bb77b13e1513b632e7cef634b131b1705517203ad1808b9d4d98ee61082ea37e, 39 cues. The supplied source receipt records full decode and 26 sampled frame inspection. It documents current category captures and the truthful Stable + Save more consistently ending: 71 Cruise Control, 650 remaining, 100 savings action. File hashes were independently verified before copying.

Both MP4 and VTT references use brand-3 cache versions. Existing poster stays unchanged. Local Chromium playback tests pass at 390/760/1280: video initially paused, no autoplay, no initial MP4 request, preload none, playback/seek, 39 active/enabled caption cues, pause on close and no overflow/browser errors. The 73 unit tests pass. No fresh human listening or physical-device/VoiceOver audit is claimed.

## Production and rollback

Preview only; PR 23 remains draft and must not be merged or published without review. Production stays at 6870072bf3c5c8857872a07b992327a420830be9 with the old v2 MP4 SHA256 d4a884d5f01ecaa7001d267880feaaf61053a29771eb9c176c259291a6b9f9ee and 38-cue VTT SHA256 5b378ff91d9bdc919436a3a187c98255ae52672cbc73221ec3f916b6853da53c.

The parent of this integration commit is 0081c89f1f631a4a1040b37da2f0469cf65631cf. Reverting only the tutorial integration commit on the preview branch restores those v2 assets, original references and 38-cue test expectation while retaining the itemized-input implementation. Do not reset or force-push production. No rollback was needed or performed.
