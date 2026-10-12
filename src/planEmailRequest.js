import { createMailerLitePayload } from "./personalizedFlightPlan.js?v=launch-funnel-2";

export const planConsentVersion = "ffm-plan-email-2026-10-12";

export function createPlanEmailRequest({ email, consentTimestamp, requestId, planSummary }) {
  const safe = createMailerLitePayload({ email, consentVersion: planConsentVersion, consentTimestamp, planSummary });
  return {
    requestId,
    email: safe.email,
    consentVersion: safe.consentVersion,
    consentTimestamp: safe.consentTimestamp,
    consented: true,
    score: safe.score,
    stage: safe.stage,
    strongSignalCategory: safe.strongSignalCategory,
    warningLight1Category: safe.warningLight1Category,
    warningLight2Category: safe.warningLight2Category,
    actionId: safe.actionId,
  };
}
