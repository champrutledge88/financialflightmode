import { createMailerLitePayload } from "./personalizedFlightPlan.js?v=refinements-2";

// EMAIL MY FLIGHT PLAN (engineering plan §11 W3B). Separate from the Starter Kit #lead-form.
// Posts only the §9 allowlist to the Personalized Flight Plan form; raw financial inputs never leave the browser.
export const FLIGHT_PLAN_ACCOUNT_ID = "2411474";
export const FLIGHT_PLAN_FORM_ID = "196466826286204872";
export const FLIGHT_PLAN_ENDPOINT = `https://assets.mailerlite.com/jsonp/${FLIGHT_PLAN_ACCOUNT_ID}/forms/${FLIGHT_PLAN_FORM_ID}/subscribe`;
export const FLIGHT_PLAN_CONSENT_VERSION = "ffm-plan-email-v1-2026-11-17";
export const FLIGHT_PLAN_CONSENT_TEXT = "I'd like to receive my Flight Plan and future FFM education by email.";

const fieldNames = Object.freeze({
  consentVersion: "flight_plan_consent_version",
  consentTimestamp: "flight_plan_consent_timestamp",
  score: "flight_plan_score",
  stage: "flight_plan_stage",
  strongSignalCategory: "flight_plan_strong_signal",
  warningLight1Category: "flight_plan_warning_light_1",
  warningLight2Category: "flight_plan_warning_light_2",
  actionId: "flight_plan_action_id",
  workbookTab: "flight_plan_workbook_tab",
  workbookAction: "flight_plan_workbook_action",
  doNow: "flight_plan_do_now",
  thisPayday: "flight_plan_this_payday",
  thisMonth: "flight_plan_this_month",
  thirtyDayMission: "flight_plan_thirty_day_mission",
});

// Defense in depth: emailed copy comes from the action library, which never contains amounts.
const hasMoneyValue = (value) => typeof value === "string" && /[$€£]|\d[\d,]*\.\d{2}\b/.test(value);

export const buildFlightPlanFormBody = ({ email, consentTimestamp, emailPlan }) => {
  const payload = createMailerLitePayload({
    email,
    consentVersion: FLIGHT_PLAN_CONSENT_VERSION,
    consentTimestamp,
    planSummary: emailPlan,
  });
  const body = new URLSearchParams({ "fields[email]": payload.email });
  Object.entries(fieldNames).forEach(([key, field]) => {
    const value = payload[key];
    if (hasMoneyValue(value)) throw new TypeError(`${key} must not contain a financial amount.`);
    body.append(`fields[${field}]`, String(value));
  });
  // Each new plan starts a fresh 7 day check-in, so the previous Do Now answer is reset.
  body.append("fields[flight_plan_do_now_status]", "pending");
  body.append("ml-submit", "1");
  body.append("anticsrf", "true");
  return body;
};

export const submitFlightPlanEmail = async ({ email, emailPlan, fetchImpl = fetch, now = () => new Date() }) => {
  const body = buildFlightPlanFormBody({ email, consentTimestamp: now().toISOString(), emailPlan });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetchImpl(FLIGHT_PLAN_ENDPOINT, {
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      signal: controller.signal,
    });
    const data = await response.json();
    if (data?.success) return data;
    throw new Error("provider_error");
  } finally {
    clearTimeout(timeout);
  }
};
