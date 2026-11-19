// Brand copy guard: publishable Financial Flight Mode copy must not contain
// hyphen or dash characters, and must use the approved product names.
// Code, URLs, file names, class names and other machine readable text are exempt.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { parse } from "acorn";
import { calculateFlightScore } from "../src/flightScoreCalculator.js";
import { buildFlightReport } from "../src/flightReport.js";
import { buildSnapshotHTML } from "../src/flightSnapshot.js";

const root = new URL("../", import.meta.url);
const DASH = /[-‐-―−]/;
const BANNED_NAMES = [
  [/Weekly Briefing/i, "Use the approved newsletter name: Control Tower Briefing"],
  [/Pre[\s-]?flight(?! Flight)/, "Use the approved capitalization: Pre Flight"],
];
const COPY_ATTRIBUTES = ["alt", "aria-label", "title", "placeholder", "aria-description"];
const COPY_META = /<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"\s+content="([^"]*)"/g;

const decode = (text) => text
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, "\"").replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, "\"")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

// Remove machine readable spans that may legitimately contain a hyphen.
const stripMachineText = (text) => text
  .replace(/\b(?:https?:\/\/|www\.)\S+/g, " ")
  .replace(/\b[\w.+]+@[\w-]+\.[\w.]+/g, " ")
  .replace(/@[A-Za-z0-9_]+/g, " ")
  .replace(/\b[\w-]+\.(?:html|zip|pdf|xlsx|csv|png|jpg|mp4)\b/g, " ");

function htmlToCopy(markup) {
  const cleaned = markup
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  const copy = [];
  for (const attr of COPY_ATTRIBUTES) {
    for (const match of cleaned.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, "g"))) copy.push(match[1]);
  }
  for (const match of markup.matchAll(COPY_META)) copy.push(match[1]);
  copy.push(...cleaned.replace(/<[^>]*>/g, "\n").split("\n"));
  const title = markup.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) copy.push(title[1]);
  return copy.map((line) => decode(line).replace(/\s+/g, " ").trim()).filter(Boolean);
}

function violations(lines) {
  const found = [];
  for (const line of lines) {
    const text = stripMachineText(line);
    if (DASH.test(text)) found.push(`dash: ${line}`);
    for (const [pattern, reason] of BANNED_NAMES) if (pattern.test(text)) found.push(`${reason}: ${line}`);
  }
  return [...new Set(found)];
}

const publicPages = (await readdir(root))
  .filter((name) => name.endsWith(".html") && !/^google[0-9a-f]+\.html$/.test(name));

test("public pages contain no dashes and only approved names in visible copy", async () => {
  assert.ok(publicPages.includes("index.html"));
  const found = [];
  for (const page of publicPages) {
    const markup = await readFile(new URL(page, root), "utf8");
    found.push(...violations(htmlToCopy(markup)).map((v) => `${page}: ${v}`));
  }
  assert.deepEqual(found, []);
});

// Interface copy written inside JavaScript (report layout, guided steps, labels).
const isProse = (text) => /\s/.test(text.trim()) && (/^[A-Z$0-9]/.test(text.trim()) || /[.!?,:]\s|[.!?]$/.test(text.trim()));
function sourceCopy(code) {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const copy = [];
  const visit = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "TemplateLiteral") {
      const joined = node.quasis.map((q) => q.value.cooked).join("0");
      if (/<[a-z]/i.test(joined)) copy.push(...htmlToCopy(joined));
      else if (isProse(joined) && !/[{};]/.test(joined)) copy.push(joined);
    } else if (node.type === "Literal" && typeof node.value === "string") {
      const value = node.value;
      if (/<[a-z]/i.test(value)) copy.push(...htmlToCopy(value));
      else if (isProse(value) && !/[{};<>="]/.test(value) && !/^[.#(@]/.test(value)) copy.push(value);
    }
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === "object" && key !== "quasis") visit(child);
    }
  };
  visit(ast);
  return copy;
}

// The scoring engine and Personalized Flight Plan library hold approved spec values
// (for example "Dashboard + Month-End Reset"). Their user facing output passes
// through the report builder, so the generated report test below guards it.
const ENGINE_DATA = new Set(["flightScoreCalculator.js", "personalizedFlightPlan.js"]);

test("interface copy in JavaScript contains no dashes and only approved names", async () => {
  const files = (await readdir(new URL("src/", root)))
    .filter((name) => name.endsWith(".js") && !name.endsWith(".test.js") && !ENGINE_DATA.has(name));
  const found = [];
  for (const file of files) {
    const code = await readFile(new URL(`src/${file}`, root), "utf8");
    found.push(...violations(sourceCopy(code)).map((v) => `src/${file}: ${v}`));
  }
  assert.deepEqual(found, []);
});

// Generated report copy across stages, pressures and objectives.
const households = {
  preflight: { income: 3000, needs: 2600, wants: 600, savings: 0, extraDebtPayment: 0, totalDebtBalance: 30000, emergencyFundSaved: 0, emergencyFundGoal: 9000, investmentsCurrentValue: 0 },
  turbulence: { income: 6000, needs: 3400, wants: 1200, savings: 500, extraDebtPayment: 250, totalDebtBalance: 18120, emergencyFundSaved: 4000, emergencyFundGoal: 8000, investmentsCurrentValue: 2500 },
  cruise: { income: 7000, needs: 3200, wants: 900, savings: 1200, extraDebtPayment: 400, totalDebtBalance: 4000, emergencyFundSaved: 12000, emergencyFundGoal: 18000, investmentsCurrentValue: 30000 },
  flight: { income: 9000, needs: 3500, wants: 1000, savings: 2500, extraDebtPayment: 0, totalDebtBalance: 0, emergencyFundSaved: 30000, emergencyFundGoal: 25000, investmentsCurrentValue: 150000 },
  deficit: { income: 4200, needs: 3200, wants: 1201, savings: 0, extraDebtPayment: 100, totalDebtBalance: 9000, emergencyFundSaved: 200, emergencyFundGoal: 6000, investmentsCurrentValue: 0 },
};
const pressures = ["Stable", "Unexpected bill", "Income disruption", "Falling behind on a payment"];
const objectives = ["", "Stop the bleeding", "Build a cushion", "Get out of debt", "Save more consistently", "Start investing"];

const collectStrings = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
};

test("generated Flight Report and download copy contain no dashes and only approved names", () => {
  const found = new Set();
  for (const [name, inputs] of Object.entries(households)) {
    for (const immediatePressure of pressures) {
      for (const shortTermObjective of objectives) {
        const report = buildFlightReport(calculateFlightScore(inputs), { flightDate: "2026-11-10", immediatePressure, shortTermObjective });
        const prose = collectStrings({ ...report, flightDate: "", nextCheckDate: "" }).filter(isProse);
        for (const v of violations([...prose, ...htmlToCopy(buildSnapshotHTML(report))])) found.add(`${name}: ${v}`);
      }
    }
  }
  assert.deepEqual([...found], []);
});
