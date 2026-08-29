import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const script = await readFile(new URL("../src/main.js", import.meta.url), "utf8");

const aboutMarkup = index.match(/<section class="about-section"[\s\S]*?<\/section>/)?.[0] ?? "";

test("Version C appears after the email form and final Starter Kit call to action", () => {
  const emailPosition = index.indexOf('id="flight-briefing-form"');
  const starterKitPosition = index.indexOf('id="starter-kit"');
  const aboutPosition = index.indexOf('id="about"');
  const trustPosition = index.indexOf('class="trust-section"');

  assert.ok(emailPosition > -1);
  assert.ok(starterKitPosition > emailPosition);
  assert.ok(aboutPosition > starterKitPosition);
  assert.ok(trustPosition > aboutPosition);
});

test("Version C uses semantic structure and the approved copy baseline", () => {
  assert.match(aboutMarkup, /aria-labelledby="about-title"/);
  assert.match(aboutMarkup, /<h2 id="about-title">Your Money Needs A Flight Plan\.<\/h2>/);
  assert.match(aboutMarkup, /<div class="about-story"/);
  assert.equal((aboutMarkup.match(/<article aria-labelledby=/g) ?? []).length, 4);
  assert.match(aboutMarkup, /Take The Free Scorecard/);
  assert.match(aboutMarkup, /@MarkFlightMode/);
});

test("About copy matches the founder approved purpose, mission, lifestyle, and community statements", () => {
  const paragraphs = [...aboutMarkup.matchAll(/<(?:p|h[23])[^>]*>([\s\S]*?)<\/(?:p|h[23])>/g)]
    .map((match) => match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
  assert.deepEqual(paragraphs.slice(0, 17), [
    "About Financial Flight Mode",
    "Your Money Needs A Flight Plan.",
    "Financial Flight Mode is a financial education and lifestyle brand for everyday people who want more control, clarity, and confidence with money.",
    "We connect practical tools with repeatable habits so you can understand your numbers, choose your next action, and build a system that fits your life.",
    "Why FFM Was Created",
    "FFM was created to make financial education useful in everyday life. Knowing what you should do is one thing. Having a practical way to do it, payday after payday, is another.",
    "Our purpose is to help close that gap without shame, complicated language, or promises of overnight wealth.",
    "Our Mission",
    "Help everyday people take ownership of their financial lives through practical education, clear systems, and consistent action.",
    "More Than A Budget",
    "Financial Flight Mode is not about looking rich. It is about knowing where you stand, preparing for setbacks, and directing your money toward what matters.",
    "Control. Clarity. Confidence. Discipline. Ownership.",
    "These are habits to practice, not a status to display.",
    "What We Are Building Together",
    "We are building a community where people can learn, share progress, and encourage consistent financial habits.",
    "Our aim is a culture where asking questions is welcomed, progress matters more than comparison, and financial responsibility becomes part of everyday life.",
    "Stop Drifting. Start Flying.",
  ]);
});

test("visitor facing About copy contains no dash punctuation", () => {
  const visibleCopy = aboutMarkup.replace(/<[^>]*>/g, " ");
  assert.doesNotMatch(visibleCopy, /[-\u2010-\u2015]/);
});

test("About links are post conversion, descriptive, and safe", () => {
  assert.match(aboutMarkup, /href="#scorecard" data-about-scorecard-cta/);
  assert.match(aboutMarkup, /href="https:\/\/x\.com\/MarkFlightmode"/);
  assert.match(aboutMarkup, /target="_blank" rel="noopener noreferrer" data-x-link="about"/);
  assert.doesNotMatch(aboutMarkup, /primary-button/);
});

test("About styling uses responsive grids, touch targets, focus states, and the approved orange", () => {
  assert.match(styles, /\.about-story[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.about-scorecard-link[\s\S]*min-height: 44px/);
  assert.match(styles, /\.about-social a[\s\S]*min-height: 44px/);
  assert.match(styles, /\.about-scorecard-link:focus-visible/);
  assert.match(styles, /#e95c03/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.about-story[\s\S]*grid-template-columns: 1fr/);
});

test("approved About analytics events are wired", () => {
  assert.match(script, /trackEvent\("about_section_view"\)/);
  assert.match(script, /trackEvent\("about_scorecard_cta_click", \{ link_location: "about" \}\)/);
  assert.match(script, /trackEvent\("x_profile_click", \{ link_location: link\.dataset\.xLink \}\)/);
  assert.match(script, /aboutObserver\.disconnect\(\)/);
});

const aboutScript = script.slice(script.indexOf('const aboutSection = document.querySelector("#about");'));

test("About impression is recorded once and click events retain their approved parameters", () => {
  const events = [];
  const listeners = {};
  const section = {};
  let notify;
  let disconnects = 0;
  const scorecard = { addEventListener: (name, handler) => { listeners.scorecard = handler; } };
  const social = { dataset: { xLink: "about" }, addEventListener: (name, handler) => { listeners.social = handler; } };
  runInNewContext(aboutScript, {
    document: {
      querySelector: (selector) => selector === "#about" ? section : scorecard,
      querySelectorAll: () => [social],
    },
    IntersectionObserver: class {
      constructor(handler) { notify = handler; }
      observe(target) { assert.equal(target, section); }
      disconnect() { disconnects += 1; }
    },
    trackEvent: (name, parameters = {}) => events.push([name, JSON.parse(JSON.stringify(parameters))]),
  });
  notify([{ isIntersecting: false }]);
  assert.equal(events.length, 0);
  notify([{ isIntersecting: true }, { isIntersecting: true }]);
  notify([{ isIntersecting: true }]);
  listeners.scorecard();
  listeners.social();
  assert.equal(disconnects, 1);
  assert.deepEqual(events, [
    ["about_section_view", {}],
    ["about_scorecard_cta_click", { link_location: "about" }],
    ["x_profile_click", { link_location: "about" }],
  ]);
});

test("About analytics tolerate missing markup and unavailable IntersectionObserver", () => {
  assert.doesNotThrow(() => runInNewContext(aboutScript, {
    document: { querySelector: () => null, querySelectorAll: () => [] },
    trackEvent: () => assert.fail("No event should be emitted without About markup"),
  }));
  const listeners = [];
  assert.doesNotThrow(() => runInNewContext(aboutScript, {
    document: {
      querySelector: (selector) => selector === "#about" ? {} : { addEventListener: (name, handler) => listeners.push(handler) },
      querySelectorAll: () => [],
    },
    trackEvent: () => {},
  }));
  assert.equal(listeners.length, 1);
});
