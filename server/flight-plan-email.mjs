import { createHash } from "node:crypto";
import { actionLibrary, categoryMap } from "../src/personalizedFlightPlan.js";

export const PLAN_CONSENT_VERSION = "ffm-plan-email-2026-10-11";
const keys = ["requestId", "email", "consentVersion", "consentTimestamp", "consented", "score", "stage", "strongSignalCategory", "warningLight1Category", "warningLight2Category", "actionId"];
const categories = Object.values(categoryMap);
const stageNames = { preflight: "Pre-Flight", turbulence: "Turbulence", cruise: "Cruise Control", flight: "Flight Mode" };
const MAX_REQUEST_AGE = 23 * 60 * 60 * 1000;

export function validatePlanRequest(input, now = Date.now()) {
  if (!input || Array.isArray(input) || typeof input !== "object" ||
      Object.keys(input).length !== keys.length || keys.some(key => !Object.hasOwn(input, key))) throw new Error("invalid_request");
  if (typeof input.email !== "string" || input.email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(input.email)) throw new Error("invalid_email");
  if (typeof input.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new Error("invalid_request");
  const timestamp = typeof input.consentTimestamp === "string" ? Date.parse(input.consentTimestamp) : NaN;
  if (input.consented !== true || input.consentVersion !== PLAN_CONSENT_VERSION || !Number.isFinite(timestamp) || timestamp > now + 60000 || now - timestamp > MAX_REQUEST_AGE) throw new Error("invalid_consent");
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100 || typeof input.stage !== "string" || !Object.hasOwn(stageNames, input.stage) || !categories.includes(input.strongSignalCategory)) throw new Error("invalid_plan");
  const action = actionLibrary.find(entry => entry.actionId === input.actionId);
  if (!action || !action.emailSafe) throw new Error("invalid_plan");
  if (action.actionId === "ownershipMindsetFallback") {
    if (input.warningLight1Category !== "Ownership Mindset" || input.warningLight2Category !== "") throw new Error("invalid_plan");
  } else if (input.warningLight1Category !== action.category || !categories.includes(input.warningLight2Category) || input.warningLight1Category === input.warningLight2Category) throw new Error("invalid_plan");
  return Object.freeze({
    requestId: input.requestId, email: input.email.trim().toLowerCase(),
    consentVersion: PLAN_CONSENT_VERSION, consentTimestamp: new Date(timestamp).toISOString(),
    score: input.score, stage: stageNames[input.stage], strongSignalCategory: input.strongSignalCategory,
    warningLight1Category: input.warningLight1Category, warningLight2Category: input.warningLight2Category,
    action,
  });
}

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

export function renderPlanEmail(plan, from) {
  const entries = [
    ["Score", `${plan.score} out of 100`], ["Stage", plan.stage], ["Strong Signal", plan.strongSignalCategory],
    [plan.action.actionId === "ownershipMindsetFallback" ? "Next Priority" : "Warning Light 1", plan.warningLight1Category],
    ...(plan.warningLight2Category ? [["Warning Light 2", plan.warningLight2Category]] : []),
    ["Do Now", plan.action.doNow], ["This Payday", plan.action.thisPayday], ["This Month", plan.action.thisMonth],
    ["30-Day Mission", plan.action.thirtyDayMission], ["Workbook Connection", `${plan.action.workbookTab}\n${plan.action.workbookAction}`],
  ];
  const kitURL = "https://financialflightmode.com/thank-you-download.html";
  const footer = "Financial education only. Not personal financial, investment, tax, legal or debt advice. This is the single plan you requested. It does not enroll you in marketing or restart Pre Flight. To stop setup emails, use Unsubscribe in any Pre Flight email. For email preferences or help, contact hello@financialflightmode.com.";
  return {
    from, to: [plan.email], reply_to: "hello@financialflightmode.com", subject: "Your Personalized Flight Plan",
    text: `FINANCIAL FLIGHT MODE\nYour Personalized Flight Plan\n\n${entries.map(([title, value]) => `${title}\n${value}`).join("\n\n")}\n\nOpen your Starter Kit: ${kitURL}\n\n${footer}\nPrivacy: https://financialflightmode.com/privacy.html`,
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6"><main style="max-width:600px;margin:auto;padding:24px"><p style="color:#e95c03;font-weight:bold">FINANCIAL FLIGHT MODE</p><h1>Your Personalized Flight Plan</h1>${entries.map(([title, value]) => `<h2 style="font-size:18px">${escapeHTML(title)}</h2><p style="white-space:pre-line">${escapeHTML(value)}</p>`).join("")}<p><a href="${kitURL}">Open your Starter Kit</a></p><hr><p>${escapeHTML(footer)}</p><p><a href="https://financialflightmode.com/privacy.html">Privacy Policy</a></p></main></body></html>`,
    headers: { "X-FFM-Consent-Version": plan.consentVersion, "X-FFM-Consent-Timestamp": plan.consentTimestamp },
  };
}

const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

async function limitedJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_request");
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new Error("invalid_request"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createPlanEmailHandler({ env = process.env, fetcher = fetch, now = () => Date.now() } = {}) {
  return async request => {
    const scopeConfigured = env.FFM_PLAN_EMAIL_PUBLIC_ENABLED === "true" || Boolean(env.FFM_PLAN_EMAIL_TEST_RECIPIENT);
    const configured = env.FFM_PLAN_EMAIL_ENABLED === "true" && scopeConfigured && Boolean(env.RESEND_API_KEY && env.MAILERLITE_API_KEY && env.FFM_PLAN_EMAIL_FROM);
    if (request.method === "GET") return json(200, { available: configured });
    if (request.method !== "POST") return json(405, { error: "method_not_allowed" });
    if (!configured) return json(503, { error: "not_configured" });
    if (request.headers.get("origin") !== new URL(request.url).origin) return json(403, { error: "invalid_origin" });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json(415, { error: "invalid_request" });
    let plan;
    try { plan = validatePlanRequest(await limitedJSON(request), now()); }
    catch { return json(400, { error: "invalid_request" }); }
    if (env.FFM_PLAN_EMAIL_PUBLIC_ENABLED !== "true" && plan.email !== env.FFM_PLAN_EMAIL_TEST_RECIPIENT?.trim().toLowerCase()) return json(403, { error: "test_only" });

    try {
      // Batch lookup keeps the email out of the outbound request URL and never mutates subscriber status.
      const suppression = await fetcher("https://connect.mailerlite.com/api/batch", {
        method: "POST", headers: { Authorization: `Bearer ${env.MAILERLITE_API_KEY}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ requests: [{ method: "GET", path: `api/subscribers/${encodeURIComponent(plan.email)}` }] }),
        signal: AbortSignal.timeout(6000),
      });
      if (!suppression.ok) return json(503, { error: "provider_unavailable" });
      const lookup = (await suppression.json()).responses?.[0];
      if (lookup?.code === 200) {
        if (lookup.body?.data?.status !== "active") return json(409, { error: "email_preferences" });
      } else if (lookup?.code !== 404) return json(503, { error: "provider_unavailable" });

      // The provider atomically deduplicates a retry for 24 hours; requests expire before that window.
      const key = createHash("sha256").update(`${plan.email}:${plan.requestId}`).digest("hex");
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `ffm-plan/${key}` },
        body: JSON.stringify(renderPlanEmail(plan, env.FFM_PLAN_EMAIL_FROM)), signal: AbortSignal.timeout(10000),
      });
      if (response.status === 429) return json(429, { error: "rate_limited" });
      if (response.status === 409) return json(409, { error: "request_conflict" });
      if (!response.ok || !(await response.json()).id) return json(502, { error: "send_failed" });
      return json(202, { accepted: true });
    } catch { return json(503, { error: "provider_unavailable" }); }
  };
}
