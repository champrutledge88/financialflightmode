import assert from "node:assert/strict";
import test from "node:test";
import { createPlanEmailHandler, validatePlanRequest, renderPlanEmail, PLAN_CONSENT_VERSION } from "../server/flight-plan-email.mjs";
import { createPlanEmailRequest, planConsentVersion } from "../src/planEmailRequest.js";
import { actionLibrary } from "../src/personalizedFlightPlan.js";

const time = Date.parse("2026-10-12T07:00:00.000Z");
const input = (changes = {}) => ({
  requestId: "12345678-1234-4123-8123-123456789abc", email: "test@example.com",
  consentVersion: PLAN_CONSENT_VERSION, consentTimestamp: new Date(time).toISOString(), consented: true,
  score: 71, stage: "cruise", strongSignalCategory: "Cash Flow Control",
  warningLight1Category: "Debt Load", warningLight2Category: "Savings System", actionId: "debtLoad", ...changes,
});
const env = { FFM_PLAN_EMAIL_ENABLED: "true", RESEND_API_KEY: "private-test-key", MAILERLITE_API_KEY: "private-test-key", FFM_PLAN_EMAIL_FROM: "FFM <hello@example.com>", FFM_PLAN_EMAIL_TEST_RECIPIENT: "test@example.com" };
const request = (body = input(), changes = {}) => new Request("https://ffm.example/api/email-flight-plan", {
  method: "POST", headers: { origin: "https://ffm.example", "content-type": "application/json" }, body: JSON.stringify(body), ...changes,
});
const result = (body, status = 200) => new Response(JSON.stringify(body), { status });

test("Browser request serializer strips raw amounts, copy, ratios, aliases and nested extra fields", () => {
  const a = actionLibrary.find(a => a.actionId === "debtLoad");
  const body = createPlanEmailRequest({ email: "test@example.com", consentTimestamp: new Date(time).toISOString(), requestId: input().requestId, planSummary: {
    ...input(), workbookTab: a.workbookTab, workbookAction: a.workbookAction,
    doNow: a.doNow, thisPayday: a.thisPayday, thisMonth: a.thisMonth, thirtyDayMission: a.thirtyDayMission,
    income: 99999, rawIncome: 99999, immediatePressure: "Unexpected bill", metrics: { savingsRate: 0.5 },
  } });
  assert.equal(planConsentVersion, PLAN_CONSENT_VERSION);
  assert.deepEqual(body, input());
});

test("Server rejects financial amounts, arbitrary copy and prototype keys rather than silently accepting them", () => {
  for (const extra of [{ income: 99999 }, { doNow: "Send money to an attacker" }, { metrics: {} }, JSON.parse('{"__proto__":{"polluted":true}}')]) {
    assert.throws(() => validatePlanRequest({ ...input(), ...extra }, time), /invalid_request/);
  }
  assert.equal({}.polluted, undefined);
});

test("Server rejects invalid consent, expired retry, future consent, invalid stage and nonfinite score", () => {
  for (const changes of [{ consented: false }, { consentVersion: "old" }, { consentTimestamp: "bad" }, { consentTimestamp: new Date(time - 24 * 3600000).toISOString() }, { consentTimestamp: new Date(time + 120000).toISOString() }, { stage: "__proto__" }, { score: Infinity }, { score: -1 }, { score: 100.5 }]) {
    assert.throws(() => validatePlanRequest(input(changes), time));
  }
});

test("Every approved action renders canonical workbook instructions and useful plain text", () => {
  for (const action of actionLibrary) {
    const fallback = action.actionId === "ownershipMindsetFallback";
    const plan = validatePlanRequest(input({ actionId: action.actionId, warningLight1Category: action.category, warningLight2Category: fallback ? "" : action.category === "Debt Load" ? "Savings System" : "Debt Load" }), time);
    const email = renderPlanEmail(plan, env.FFM_PLAN_EMAIL_FROM);
    assert.ok(email.text.includes(action.workbookTab));
    assert.ok(email.text.includes(action.workbookAction));
    assert.ok(email.text.includes(action.doNow));
    assert.ok(email.text.includes("https://financialflightmode.com/thank-you-download.html"));
    assert.equal(email.subject, "Your Personalized Flight Plan");
    assert.doesNotMatch(email.subject, /71|Cruise|test@example/);
    assert.equal(email.headers["X-FFM-Consent-Version"], PLAN_CONSENT_VERSION);
  }
});

test("Service is unavailable without private configuration and never contacts providers", async () => {
  const handler = createPlanEmailHandler({ env: {}, fetcher: () => assert.fail("Must not contact a provider"), now: () => time });
  assert.deepEqual(await (await handler(new Request("https://ffm.example/api/email-flight-plan"))).json(), { available: false });
  assert.equal((await handler(request())).status, 503);
});

test("Service rejects foreign origins, wrong methods, oversized requests and malformed JSON before provider calls", async () => {
  const handler = createPlanEmailHandler({ env, fetcher: () => assert.fail("Must not contact a provider"), now: () => time });
  assert.equal((await handler(request(input(), { headers: { origin: "https://attacker.example", "content-type": "application/json" } }))).status, 403);
  assert.equal((await handler(new Request("https://ffm.example/api/email-flight-plan", { method: "DELETE" }))).status, 405);
  assert.equal((await handler(request(input(), { body: "x".repeat(5000) }))).status, 400);
  assert.equal((await handler(request(input(), { body: "{" }))).status, 400);
  assert.equal((await handler(request(input(), { headers: { origin: "https://ffm.example", "content-type": "text/plain" } }))).status, 415);
});

test("Pilot mode allows only the configured test recipient", async () => {
  const handler = createPlanEmailHandler({ env, fetcher: () => assert.fail("Must not send to other recipients"), now: () => time });
  assert.equal((await handler(request(input({ email: "other@example.com" })))).status, 403);
});

test("Paused, unconfirmed, bounced and junk subscribers are suppressed without reactivation", async () => {
  for (const status of ["unsubscribed", "unconfirmed", "bounced", "junk"]) {
    const calls = [];
    const handler = createPlanEmailHandler({ env, now: () => time, fetcher: async (url, options) => {
      calls.push(url);
      assert.equal(options.method, "POST");
      const lookup = JSON.parse(options.body);
      assert.equal(lookup.requests[0].method, "GET");
      return result({ responses: [{ code: 200, body: { data: { status } } }] });
    } });
    const response = await handler(request());
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "email_preferences" });
    assert.deepEqual(calls, ["https://connect.mailerlite.com/api/batch"]);
  }
});

test("Suppression service failure closes the send path and hides provider internals", async () => {
  const handler = createPlanEmailHandler({ env, now: () => time, fetcher: async () => result({ secret: "provider-secret" }, 401) });
  const response = await handler(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret/);
});

test("First and updated plans send distinct immutable content; retry uses the same opaque idempotency key", async () => {
  const calls = [];
  const sent = new Map();
  const handler = createPlanEmailHandler({ env, now: () => time, fetcher: async (url, options) => {
    assert.doesNotMatch(url, /test@example/);
    if (url.includes("mailerlite")) return result({ responses: [{ code: 404 }] });
    const body = JSON.parse(options.body);
    const key = options.headers["Idempotency-Key"];
    calls.push({ key, body });
    if (!sent.has(key)) sent.set(key, body);
    return result({ id: "private-provider-id" });
  } });
  assert.equal((await handler(request())).status, 202);
  assert.equal((await handler(request())).status, 202);
  const updated = input({ requestId: "12345678-1234-4123-8123-123456789abd", score: 100, stage: "flight", actionId: "ownershipMindsetFallback", warningLight1Category: "Ownership Mindset", warningLight2Category: "" });
  assert.equal((await handler(request(updated))).status, 202);
  assert.equal(sent.size, 2);
  assert.equal(calls[0].key, calls[1].key);
  assert.notEqual(calls[0].key, calls[2].key);
  assert.doesNotMatch(calls[0].key, /test@example|71|Cruise/);
  assert.ok(calls[0].body.text.includes("Confirm your minimum payments"));
  assert.ok(calls[2].body.text.includes("Weekly Control Tower Review"));
});

test("Provider acceptance, conflicts, rate limits and ambiguous failures produce distinct safe results", async () => {
  for (const [status, body, expected] of [[202, { id: "private-id" }, 202], [409, {}, 409], [429, {}, 429], [500, { message: "private-provider-details" }, 502], [200, {}, 502]]) {
    const handler = createPlanEmailHandler({ env, now: () => time, fetcher: async url => url.includes("mailerlite") ? result({ responses: [{ code: 200, body: { data: { status: "active" } } }] }) : result(body, status) });
    const response = await handler(request());
    assert.equal(response.status, expected);
    assert.doesNotMatch(await response.text(), /private-id|private-provider/);
  }
});
