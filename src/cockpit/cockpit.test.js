import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { detectFormat, parseAmount, readStatement } from "./bankFormats.js";
import { BANK_HINTS, EXPORT_STEPS } from "./banks.js";
import { categorize, isSpending, merchantKey } from "./categorize.js";
import { parseCsv } from "./csv.js";
import { addDays, parseDate } from "./dates.js";
import { buildInsights, detectIncomeStreams, detectRecurring, flightStage } from "./insights.js";
import { MEDALS, evaluateMedals, newlyEarned, reviewStreak } from "./medals.js";
import { buildSampleStatement } from "./sampleData.js";
import { createStore, emptyState, exportBackup, importBackup, mergeImport, removeAccount, withCategories } from "./store.js";

const TODAY = "2026-10-24";
const DASHES = /[-‐-―−]/;

const categorized = (rows) => rows.map((row, index) => ({ id: String(index), accountId: "a", balance: null, bankCategory: "", ...row, category: categorize(row) }));

test("parseCsv handles quotes, escaped quotes, CRLF, and a byte order mark", () => {
  const rows = parseCsv('﻿Date,Description,Amount\r\n10/01/2026,"ACME, INC ""PAYROLL""",1200.00\r\n\r\n');
  assert.deepEqual(rows, [
    ["Date", "Description", "Amount"],
    ["10/01/2026", 'ACME, INC "PAYROLL"', "1200.00"],
  ]);
});

test("parseDate and parseAmount cover common bank styles", () => {
  assert.equal(parseDate("10/03/2026"), "2026-10-03");
  assert.equal(parseDate("1/3/26"), "2026-01-03");
  assert.equal(parseDate("2026-10-03"), "2026-10-03");
  assert.equal(parseDate("02/30/2026"), null);
  assert.equal(parseAmount("$1,234.56"), 123456);
  assert.equal(parseAmount("(12.50)"), -1250);
  assert.equal(parseAmount("-7.25"), -725);
  assert.equal(parseAmount("40.00 DR"), -4000);
  assert.equal(parseAmount("abc"), null);
});

test("recognizes Chase checking with signed amounts and balances", () => {
  const csv = `Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
DEBIT,10/02/2026,"STARBUCKS STORE 1234",-5.75,DEBIT_CARD,1994.25,
CREDIT,10/01/2026,"ACME PAYROLL PPD ID: 123",2000.00,ACH_CREDIT,2000.00,`;
  const result = readStatement(csv);
  assert.equal(result.format.id, "chase-checking");
  assert.deepEqual(result.transactions.map((item) => item.amount), [-575, 200000]);
  assert.equal(result.transactions[0].balance, 199425);
});

test("flips card exports that list purchases as positive", () => {
  const amex = readStatement(`Date,Description,Card Member,Account #,Amount
10/02/2026,WHOLE FOODS,J DOE,-12345,84.10
10/05/2026,AUTOPAY PAYMENT THANK YOU,J DOE,-12345,-300.00`);
  assert.equal(amex.format.id, "amex");
  assert.deepEqual(amex.transactions.map((item) => item.amount), [-8410, 30000]);

  const discover = readStatement(`Trans. Date,Post Date,Description,Amount,Category
10/02/2026,10/03/2026,SHELL OIL,41.00,Gasoline`);
  assert.equal(discover.format.id, "discover");
  assert.equal(discover.transactions[0].amount, -4100);
});

test("reads separate debit and credit columns", () => {
  const result = readStatement(`Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
2026-10-02,2026-10-03,1234,TARGET 0001,Merchandise,25.99,
2026-10-04,2026-10-04,1234,CAPITAL ONE AUTOPAY PYMT,Payment/Credit,,100.00`);
  assert.equal(result.format.id, "capital-one-card");
  assert.deepEqual(result.transactions.map((item) => item.amount), [-2599, 10000]);
});

test("reads Wells Fargo files that have no header row", () => {
  const result = readStatement(`"10/01/2026","-45.00","*","","KROGER #123"
"10/02/2026","1500.00","*","","DIRECT DEP ACME"`);
  assert.equal(result.format.id, "wells-fargo");
  assert.deepEqual(result.transactions.map((item) => item.amount), [-4500, 150000]);
});

test("skips Bank of America summary lines above the header", () => {
  const result = readStatement(`Description,,Summary Amt.
Beginning balance as of 10/01/2026,,"1,000.00"

Date,Description,Amount,Running Bal.
10/01/2026,Beginning balance as of 10/01/2026,,"1,000.00"
10/02/2026,"NETFLIX.COM","-15.49","984.51"`);
  assert.equal(result.format.id, "bofa-checking");
  assert.equal(result.transactions.length, 1);
  assert.equal(result.skipped, 1);
});

test("uses a debit or credit indicator column when amounts are unsigned", () => {
  const result = readStatement(`Posting Date,Transaction Date,Amount,Credit Debit Indicator,Description
10/02/2026,10/02/2026,30.00,Debit,PUBLIX
10/03/2026,10/03/2026,900.00,Credit,DFAS PAY`);
  assert.equal(result.format.id, "navy-federal");
  assert.deepEqual(result.transactions.map((item) => item.amount), [-3000, 90000]);
});

test("generic files are detected and purchases are inverted only when the pattern is clear", () => {
  const signed = readStatement(`Date,Payee,Amount
2026-10-01,Grocer,-20.00
2026-10-02,Employer,500.00
2026-10-03,Cafe,-4.00`);
  assert.equal(signed.format.id, "generic");
  assert.equal(signed.inverted, false);

  const card = readStatement(`Date,Payee,Amount
2026-10-01,Grocer,20.00
2026-10-02,Cafe,4.00
2026-10-03,Fuel,30.00
2026-10-04,Payment Thank You,-54.00`);
  assert.equal(card.inverted, true);
  assert.equal(card.transactions[0].amount, -2000);
});

test("rejects files without dates and amounts", () => {
  assert.equal(detectFormat(parseCsv("hello,world\n1,2")), null);
  assert.equal(readStatement("hello,world").ok, false);
});

test("categorizes common merchants and respects learned rules", () => {
  assert.equal(categorize({ description: "DIRECT DEP ACME PAYROLL", amount: 100000 }), "Paycheck");
  assert.equal(categorize({ description: "STARBUCKS STORE 10294", amount: -500 }), "Coffee");
  assert.equal(categorize({ description: "NETFLIX.COM", amount: -1549 }), "Subscriptions");
  assert.equal(categorize({ description: "CHASE CREDIT CRD AUTOPAY", amount: -50000 }), "Card Payment");
  assert.equal(categorize({ description: "OVERDRAFT ITEM FEE", amount: -3500 }), "Fees and Interest");
  assert.equal(categorize({ description: "Current balance interest", amount: -100 }), "Other");
  const rule = { [merchantKey("JOE'S PLACE 123")]: "Dining" };
  assert.equal(categorize({ description: "JOE'S PLACE 456", amount: -900 }, rule), "Dining");
  assert.equal(merchantKey("STARBUCKS STORE 10294 SEATTLE WA"), merchantKey("STARBUCKS STORE 55555 SEATTLE WA"));
});

test("savings transfers and card payments are never counted as spending", () => {
  assert.equal(isSpending({ amount: -15000, category: "Saving and Investing" }), false);
  assert.equal(isSpending({ amount: -50000, category: "Card Payment" }), false);
  assert.equal(isSpending({ amount: -500, category: "Coffee" }), true);
});

const biweeklyHistory = () => {
  const rows = [];
  for (let date = "2026-06-05"; date <= TODAY; date = addDays(date, 14)) rows.push({ date, description: "DIRECT DEP NORTHWIND PAYROLL", amount: 200000 });
  for (const month of ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]) {
    rows.push({ date: `${month}-01`, description: "SUNRIDGE APTS RENT", amount: -140000 });
    rows.push({ date: `${month}-20`, description: "HULU 877", amount: -1799 });
    rows.push({ date: `${month}-12`, description: "STARBUCKS STORE 1", amount: -600 });
    rows.push({ date: `${month}-13`, description: "STARBUCKS STORE 2", amount: -650 });
  }
  return categorized(rows);
};

test("detects a biweekly paycheck and forecasts the next payday", () => {
  const [paycheck] = detectIncomeStreams(biweeklyHistory(), TODAY);
  assert.equal(paycheck.cadence.key, "biweekly");
  assert.equal(paycheck.typicalAmount, 200000);
  assert.equal(paycheck.lastDate, "2026-10-23");
  assert.equal(paycheck.nextDate, "2026-11-06");
});

test("detects monthly bills but not everyday habits", () => {
  const recurring = detectRecurring(biweeklyHistory(), TODAY);
  const names = recurring.map((item) => item.category);
  assert.ok(names.includes("Housing"));
  assert.ok(names.includes("Subscriptions"));
  assert.ok(!names.includes("Coffee"));
  const rent = recurring.find((item) => item.category === "Housing");
  assert.equal(rent.nextDate, "2026-11-01");
  assert.equal(rent.cadence.key, "monthly");
});

test("Safe to Spend subtracts bills due before payday and the cushion", () => {
  const insights = buildInsights({
    transactions: biweeklyHistory(),
    today: TODAY,
    balanceOverride: { amount: 250000, date: TODAY, source: "manual" },
    cushion: 10000,
  });
  assert.equal(insights.plan.nextPayday, "2026-11-06");
  assert.deepEqual(insights.plan.billsDue.map((bill) => bill.category), ["Housing"]);
  assert.equal(insights.plan.safeToSpend, 250000 - 140000 - 10000);
  assert.equal(insights.plan.perDay, Math.floor(100000 / 13));
});

test("a newer statement balance beats an older manual balance", () => {
  const rows = biweeklyHistory().map((row) => ({ ...row, balance: row.date === "2026-10-23" ? 5000 : null }));
  const insights = buildInsights({ transactions: rows, today: TODAY, balanceOverride: { amount: 99999, date: "2026-10-01", source: "manual" } });
  assert.equal(insights.plan.balance.amount, 5000);
});

test("flight stage follows the Financial Flight Mode journey", () => {
  const base = { range: { days: 120 }, feeMonths: 0, negativeMonths: 0, monthsCounted: 3 };
  assert.equal(flightStage({ ...base, range: { days: 10 }, averages: { net: 0, savingsRate: 0 } }).key, "preflight");
  assert.equal(flightStage({ ...base, averages: { net: -100, savingsRate: 0 } }).key, "turbulence");
  assert.equal(flightStage({ ...base, averages: { net: 100, savingsRate: 0.05 } }).key, "cruise");
  assert.equal(flightStage({ ...base, averages: { net: 100, savingsRate: 0.2 } }).key, "flight");
});

test("sample data produces a full, believable picture", () => {
  const { state } = mergeImport(emptyState(), { accountName: "Sample", format: { id: "sample", name: "Sample", kind: "checking" }, transactions: buildSampleStatement(TODAY), importedAt: TODAY });
  const insights = buildInsights({ transactions: withCategories(state), today: TODAY });
  assert.equal(insights.paycheck.cadence.key, "biweekly");
  assert.ok(insights.recurring.length >= 8);
  assert.ok(insights.monthsCounted >= 5);
  assert.ok(insights.warningLights.some((light) => light.id === "fees"));
  assert.ok(insights.plan.safeToSpend !== null);
});

test("weekly review streak counts consecutive weeks", () => {
  assert.equal(reviewStreak([], TODAY), 0);
  assert.equal(reviewStreak(["2026-10-24", "2026-10-15", "2026-10-06"], TODAY), 3);
  assert.equal(reviewStreak(["2026-10-15", "2026-10-06"], TODAY), 2);
  assert.equal(reviewStreak(["2026-10-24", "2026-10-01"], TODAY), 1);
});

test("medals earn tiers and report what was newly earned", () => {
  const insights = { today: TODAY, range: { days: 100 }, months: [], monthsCounted: 0, averages: { savingsRate: 0 }, cycles: [] };
  const medals = evaluateMedals({ insights, activity: { imports: 3, audits: 0, reviews: [], accounts: 1, rules: 0 } });
  assert.equal(medals.length, MEDALS.length);
  assert.equal(medals.find((medal) => medal.id === "preflight").tier, "silver");
  assert.equal(medals.find((medal) => medal.id === "logbook").tier, "silver");
  assert.equal(medals.find((medal) => medal.id === "auditor").tier, null);
  const earned = newlyEarned([{ id: "preflight", tier: "bronze" }], medals);
  assert.ok(earned.some((medal) => medal.id === "preflight"));
  assert.ok(!newlyEarned(medals, medals).length);
});

test("importing the same statement twice adds nothing new", () => {
  const transactions = [
    { date: "2026-10-01", description: "COFFEE", amount: -500 },
    { date: "2026-10-01", description: "COFFEE", amount: -500 },
  ];
  const format = { id: "generic", name: "Other", kind: "unknown" };
  const first = mergeImport(emptyState(), { accountName: "Checking", format, transactions, importedAt: TODAY });
  assert.equal(first.added, 2);
  const second = mergeImport(first.state, { accountName: "Checking", format, transactions, importedAt: TODAY });
  assert.equal(second.added, 0);
  assert.equal(second.duplicates, 2);
  assert.equal(second.state.transactions.length, 2);
  assert.equal(removeAccount(second.state, "checking").transactions.length, 0);
});

test("store survives broken storage and backups round trip", () => {
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const store = createStore(storage);
  const state = { ...emptyState(), overrides: { cafe: "Coffee" } };
  assert.ok(store.save(state));
  assert.deepEqual(store.load().overrides, { cafe: "Coffee" });
  memory.set("ffm.cockpit.v1", "{not json");
  assert.deepEqual(store.load(), emptyState());
  assert.deepEqual(createStore(null).load(), emptyState());
  assert.deepEqual(importBackup(exportBackup(state)).overrides, { cafe: "Coffee" });
  assert.throws(() => importBackup('{"app":"other"}'));
});

test("customer facing copy avoids hyphen and dash characters", () => {
  const strings = [...EXPORT_STEPS, ...Object.values(BANK_HINTS)];
  const insights = buildInsights({ transactions: biweeklyHistory(), today: TODAY });
  strings.push(insights.stage.reason, insights.nextMove, insights.strongSignal.title, insights.strongSignal.detail);
  for (const light of insights.warningLights) strings.push(light.title, light.detail, light.action);
  for (const medal of MEDALS) strings.push(medal.name, medal.description, ...medal.tiers);
  for (const value of strings) assert.ok(!DASHES.test(value), `Dash found in: ${value}`);

  const html = readFileSync(new URL("../../cockpit.html", import.meta.url), "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ");
  assert.ok(!DASHES.test(html), "Dash found in cockpit.html visible text");
});

test("deeper insights: breakdown, pace, outlook, daily stats, and category detail", async () => {
  const { categoryBreakdown, categoryChanges, categoryDetail, dailyStats, keepRateTrend, outlook, spendingPace } = await import("./deepInsights.js");
  const { state } = mergeImport(emptyState(), { accountName: "Sample", format: { id: "sample", name: "Sample", kind: "checking" }, transactions: buildSampleStatement(TODAY), importedAt: TODAY });
  const transactions = withCategories(state);
  const insights = buildInsights({ transactions, today: TODAY });

  const breakdown = categoryBreakdown(transactions, TODAY, 90);
  assert.equal(breakdown.categories[0].name, "Housing");
  assert.ok(Math.abs(breakdown.categories.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-9);
  assert.ok(!breakdown.categories.some((item) => item.name === "Saving and Investing"));

  for (const change of categoryChanges(insights, TODAY)) {
    assert.ok(!["Housing", "Debt Payment", "Insurance", "Utilities", "Subscriptions"].includes(change.name), `${change.name} should not be paced`);
  }

  const pace = spendingPace(transactions, insights, TODAY);
  assert.equal(pace.thisMonth.length, 24);
  assert.equal(pace.typical.length, 31);

  const ahead = outlook(insights, TODAY);
  assert.ok(ahead.events.every((event) => event.date >= TODAY && event.date <= addDays(TODAY, 30)));
  assert.equal(ahead.events.filter((event) => event.kind === "income").length, 2);
  assert.ok(ahead.events.some((event) => event.kind === "saving"));
  assert.equal(ahead.net, ahead.income - ahead.bills - ahead.saving - ahead.flexible);

  const daily = dailyStats(transactions, TODAY);
  assert.ok(daily.averageDay > 0 && daily.noSpendDays <= daily.daysThisMonth);

  assert.ok(keepRateTrend(insights).every((item) => item.key < "2026-10"));

  const housing = categoryDetail(transactions, "Housing", TODAY);
  assert.equal(housing.months.length, 6);
  assert.equal(housing.average, 145000);
});

test("test CSV round trips through the real import path", async () => {
  const { buildTestCsv } = await import("./sampleData.js");
  const result = readStatement(buildTestCsv(TODAY));
  assert.equal(result.format.id, "chase-checking");
  assert.equal(result.transactions.length, buildSampleStatement(TODAY).length);
  assert.equal(result.skipped, 0);
});

test("planning: budgets suggest from history and pace everyday spending only", async () => {
  const { budgetStatus, budgetsKeptLastMonth, suggestBudgets } = await import("./planning.js");
  const { state } = mergeImport(emptyState(), { accountName: "Sample", format: { id: "sample", name: "Sample", kind: "checking" }, transactions: buildSampleStatement(TODAY), importedAt: TODAY });
  const transactions = withCategories(state);
  const insights = buildInsights({ transactions, today: TODAY });

  const suggestions = suggestBudgets(insights.months, TODAY);
  assert.equal(suggestions.Housing, 145000);
  assert.ok(!("Fees and Interest" in suggestions), "fees are never budgeted");
  assert.ok(!("Saving and Investing" in suggestions));
  assert.ok(Object.values(suggestions).every((value) => value % 1000 === 0));

  const status = budgetStatus(suggestions, transactions, TODAY);
  const housing = status.items.find((item) => item.category === "Housing");
  assert.equal(housing.status, "onTrack", "a paid bill is not flagged as pacing high");
  assert.equal(status.daysLeft, 8);
  assert.equal(status.totalRemaining, status.totalBudget - status.totalSpent);
  for (const item of status.items) assert.equal(item.perDay, Math.max(0, Math.floor(item.remaining / status.daysLeft)));

  const over = budgetStatus({ Coffee: 100 }, transactions, TODAY).items[0];
  assert.equal(over.status, "over");
  assert.ok(budgetsKeptLastMonth(suggestions, insights.months, TODAY) >= 1);
});

test("planning: goal projections use deposits first, then margin, and never promise", async () => {
  const { goalProjection, goalSaved } = await import("./planning.js");
  const goal = { target: 100000, targetDate: "2027-04-24", deposits: [{ date: "2026-07-24", amount: 20000 }, { date: "2026-09-24", amount: 20000 }] };
  assert.equal(goalSaved(goal), 40000);
  const paced = goalProjection(goal, { monthlyMargin: 50000, today: TODAY });
  assert.equal(paced.paceSource, "deposits");
  assert.equal(paced.progress, 0.4);
  assert.equal(paced.neededMonthly, 10000);
  assert.ok(paced.eta > TODAY);

  const fresh = goalProjection({ target: 60000, deposits: [] }, { monthlyMargin: 20000, today: TODAY });
  assert.equal(fresh.paceSource, "margin");
  assert.equal(fresh.monthlyPace, 10000);
  assert.equal(fresh.monthsToGo, 6);

  const unknown = goalProjection({ target: 60000, deposits: [] }, { monthlyMargin: 0, today: TODAY });
  assert.equal(unknown.eta, null);
  assert.equal(goalProjection({ target: 500, deposits: [{ date: TODAY, amount: 900 }] }, { today: TODAY }).complete, true);
});

test("reports: category month comparison, living costs, subscriptions, and year end", async () => {
  const { incomeVsExpense, livingCosts, spendingByCategoryForMonth, subscriptionInsights, yearEndProjection } = await import("./planning.js");
  const { state } = mergeImport(emptyState(), { accountName: "Sample", format: { id: "sample", name: "Sample", kind: "checking" }, transactions: buildSampleStatement(TODAY), importedAt: TODAY });
  const transactions = withCategories(state);
  const insights = buildInsights({ transactions, today: TODAY });

  const september = spendingByCategoryForMonth(transactions, "2026-09");
  assert.equal(september.categories[0].name, "Housing");
  assert.equal(september.categories[0].change, 0);
  assert.ok(Math.abs(september.categories.reduce((sum, item) => sum + item.share, 0) - 1) < 1e-9);

  const living = livingCosts(insights.months, TODAY);
  assert.ok(living.categories.some((item) => item.name === "Housing" && item.monthly === 145000));
  assert.ok(!living.categories.some((item) => ["Dining", "Coffee", "Shopping"].includes(item.name)));

  const subs = subscriptionInsights(transactions, insights.subscriptions, TODAY);
  assert.equal(subs.lastYear, 0);
  assert.ok(Object.is(subs.rows[0].lastYear, 0), "no negative zero in the report");
  assert.equal(subs.lifetime, subs.thisYear);

  const year = yearEndProjection(transactions, insights.averages, TODAY);
  assert.equal(year.partialYear, true);
  assert.ok(year.projected.income > year.ytd.income);
  assert.equal(incomeVsExpense(insights.months).length, insights.months.length);
});
