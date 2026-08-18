# GA4 Verification Log

## FFM-EV-2026-08-18-02 — W8A-2 Controlled Lead Submission

Status: PASS

Method: Google Tag Assistant device scoped session with GA4 Realtime corroboration.

The authorized initial lead submission and the minimum repeat submission both reached `/thank-you.html`. The public form displayed the approved five message over ten day consent promise.

| Check | Result |
|---|---|
| `briefing_submit_start` received | PASS |
| `sign_up` received and counted as the key event | PASS |
| `briefing_submit_success` received | PASS |
| `thank_you_view` received | PASS |
| Event payload contains email, financial input, score, or stage data | PASS: none observed |
| Provider group assignment | PASS |
| Repeat submission creates a second workflow run | PASS: none observed |

GA4 Realtime received each successful flow event twice, once for each authorized submission. Detailed provider records, event payloads, and device data are retained only in the private record under `FFM-EV-2026-08-18-02`.

Limitations: this check does not establish inbox delivery, unsubscribe behavior, a new subscriber creation path, or controlled provider error behavior.
