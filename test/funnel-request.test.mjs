import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
const requestCode = main.slice(main.indexOf("const extractMailerLiteError"), main.indexOf('scoreForm.addEventListener("submit"'));

function requestHarness(fetchImplementation, abortImmediately = false) {
  const timers = [];
  const cleared = [];
  const submit = runInNewContext(`${requestCode}\nsubmitLeadToMailerLite;`, {
    MAILERLITE_ENDPOINT: "https://provider.example/subscribe",
    URLSearchParams,
    AbortController,
    fetch: fetchImplementation,
    setTimeout: (callback, duration) => {
      timers.push(duration);
      if (abortImmediately) callback();
      return 1;
    },
    clearTimeout: id => cleared.push(id),
  });
  return { submit, timers, cleared };
}

test("Starter Kit request sends email only and clears its timeout after success", async () => {
  const harness = requestHarness(async (url, options) => {
    assert.equal(url, "https://provider.example/subscribe");
    assert.equal(options.method, "POST");
    assert.deepEqual([...options.body.entries()], [
      ["fields[email]", "test@example.com"], ["ml-submit", "1"], ["anticsrf", "true"],
    ]);
    return { ok: true, json: async () => ({ success: true }) };
  });
  await harness.submit({ email: "test@example.com", income: 12345, score: 71 });
  assert.deepEqual(harness.timers, [15000]);
  assert.deepEqual(harness.cleared, [1]);
});

test("HTTP failure cannot be mistaken for success even with a success-shaped body", async () => {
  const harness = requestHarness(async () => ({ ok: false, json: async () => ({ success: true }) }));
  await assert.rejects(harness.submit({ email: "test@example.com" }), /Provider request failed/);
  assert.deepEqual(harness.cleared, [1]);
});

test("Provider rejection leaves the request retryable and clears its timer", async () => {
  const harness = requestHarness(async () => ({ ok: true, json: async () => ({ success: false, errors: { fields: { email: ["Invalid email"] } } }) }));
  await assert.rejects(harness.submit({ email: "test@example.com" }), /Invalid email/);
  assert.deepEqual(harness.cleared, [1]);
});

test("Invalid provider JSON cannot be interpreted as a successful signup", async () => {
  const harness = requestHarness(async () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } }));
  await assert.rejects(harness.submit({ email: "test@example.com" }), /Invalid JSON/);
  assert.deepEqual(harness.cleared, [1]);
});

test("Timed out request aborts and preserves the AbortError for the UI", async () => {
  const harness = requestHarness(async (url, options) => {
    assert.equal(options.signal.aborted, true);
    const error = new Error("Aborted");
    error.name = "AbortError";
    throw error;
  }, true);
  await assert.rejects(harness.submit({ email: "test@example.com" }), { name: "AbortError" });
  assert.deepEqual(harness.cleared, [1]);
});
