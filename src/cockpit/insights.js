import { CATEGORIES, displayMerchant, groupOf, isIncome, isSpending, merchantKey } from "./categorize.js";
import { addDays, dayNumber, daysBetween, daysInMonth, monthKey, shiftMonth, weekday } from "./dates.js";

// Pure analytics over a person's own transactions. Amounts are integer cents, money out negative.
// Every number here is computed on the device from data the person imported.

const sum = (values) => values.reduce((total, value) => total + value, 0);
const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const variation = (values) => {
  if (values.length < 2) return 0;
  const mean = sum(values) / values.length;
  if (!mean) return 0;
  const variance = sum(values.map((value) => (value - mean) ** 2)) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
};

export const CADENCES = Object.freeze([
  { key: "weekly", label: "Weekly", days: 7, min: 6, max: 8 },
  { key: "biweekly", label: "Every two weeks", days: 14, min: 12, max: 16 },
  { key: "semimonthly", label: "Twice a month", days: 15, min: 13, max: 17 },
  { key: "monthly", label: "Monthly", days: 30, min: 26, max: 35 },
  { key: "quarterly", label: "Quarterly", days: 91, min: 85, max: 98 },
  { key: "annual", label: "Yearly", days: 365, min: 355, max: 375 },
]);

const cadenceFor = (intervals) => {
  const typical = median(intervals);
  const matches = CADENCES.filter((cadence) => typical >= cadence.min && typical <= cadence.max);
  if (!matches.length) return null;
  // Semimonthly pay alternates 13 to 17 day gaps; biweekly stays at exactly 14.
  if (matches.some((cadence) => cadence.key === "biweekly")) {
    const exact = intervals.filter((interval) => interval === 14).length / intervals.length;
    return exact >= 0.6 ? CADENCES[1] : CADENCES[2];
  }
  return matches[0];
};

const groupByMerchant = (transactions) => {
  const groups = new Map();
  for (const transaction of transactions) {
    const key = merchantKey(transaction.description);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(transaction);
  }
  for (const list of groups.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return groups;
};

const nextOccurrence = (lastDate, cadence, today) => {
  let next = addDays(lastDate, cadence.days);
  if (cadence.key === "monthly") next = sameDayNextMonth(lastDate, 1);
  if (cadence.key === "quarterly") next = sameDayNextMonth(lastDate, 3);
  let guard = 0;
  while (next < today && guard < 120) {
    next = ["monthly", "quarterly"].includes(cadence.key)
      ? sameDayNextMonth(next, cadence.key === "monthly" ? 1 : 3)
      : addDays(next, cadence.days);
    guard += 1;
  }
  return next;
};

const sameDayNextMonth = (isoDay, months) => {
  const key = shiftMonth(monthKey(isoDay), months);
  const day = Math.min(Number(isoDay.slice(8, 10)), daysInMonth(key));
  return `${key}-${String(day).padStart(2, "0")}`;
};

// Detect repeating deposits: the paycheck is the stream with the most total money.
export const detectIncomeStreams = (transactions, today) => {
  const deposits = transactions.filter((transaction) => transaction.amount > 0 && groupOf(transaction.category) === "income" && transaction.category !== "Refund");
  const streams = [];
  for (const [key, list] of groupByMerchant(deposits)) {
    if (list.length < 3) continue;
    const intervals = list.slice(1).map((item, index) => daysBetween(list[index].date, item.date)).filter((gap) => gap > 2);
    if (intervals.length < 2) continue;
    const cadence = cadenceFor(intervals);
    if (!cadence || dayNumber(today) - dayNumber(list.at(-1).date) > cadence.days * 2.5) continue;
    const amounts = list.slice(-6).map((item) => item.amount);
    if (variation(amounts) > 0.35) continue;
    streams.push({
      key,
      name: displayMerchant(list.at(-1).description),
      cadence,
      typicalAmount: Math.round(median(amounts)),
      lastDate: list.at(-1).date,
      nextDate: nextOccurrence(list.at(-1).date, cadence, addDays(today, 1)),
      count: list.length,
      monthlyEquivalent: Math.round((median(amounts) * 30.4) / cadence.days),
      dates: list.map((item) => item.date),
    });
  }
  return streams.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
};

// Everyday habits repeat too, but they are choices, not bills.
const HABIT_CATEGORIES = ["Dining", "Coffee", "Groceries", "Fuel", "Shopping", "Cash and ATM", "Entertainment", "Personal Care", "Travel"];
const PACEABLE_CATEGORIES = new Set(["Groceries", "Fuel", ...HABIT_CATEGORIES]);

// Detect bills and subscriptions: the same merchant, a steady amount, a steady rhythm.
export const detectRecurring = (transactions, today) => {
  const outflows = transactions.filter((transaction) => isSpending(transaction) || transaction.category === "Saving and Investing" && transaction.amount < 0);
  const recurring = [];
  for (const [key, list] of groupByMerchant(outflows)) {
    if (list.length < 2) continue;
    const intervals = list.slice(1).map((item, index) => daysBetween(list[index].date, item.date)).filter((gap) => gap > 3);
    if (!intervals.length) continue;
    const cadence = cadenceFor(intervals);
    if (!cadence || cadence.key === "weekly" && list.length < 4) continue;
    if (list.length === 2 && !["monthly", "annual", "quarterly"].includes(cadence.key)) continue;
    const amounts = list.slice(-6).map((item) => Math.abs(item.amount));
    const steady = variation(amounts) <= 0.2;
    const category = list.at(-1).category;
    const naturallyVariable = ["Utilities", "Phone and Internet"].includes(category);
    if (!steady && !(naturallyVariable && variation(amounts) <= 0.45)) continue;
    if (HABIT_CATEGORIES.includes(category)) continue;
    if (dayNumber(today) - dayNumber(list.at(-1).date) > cadence.days * 2 + 7) continue;
    const typical = Math.round(median(amounts));
    recurring.push({
      key,
      name: displayMerchant(list.at(-1).description),
      category,
      cadence,
      typicalAmount: typical,
      lastDate: list.at(-1).date,
      nextDate: nextOccurrence(list.at(-1).date, cadence, today),
      annualCost: Math.round((typical * 365) / cadence.days),
      isSubscription: category === "Subscriptions",
      count: list.length,
    });
  }
  return recurring.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
};

export const summarizeMonths = (transactions) => {
  const months = new Map();
  for (const transaction of transactions) {
    const key = monthKey(transaction.date);
    if (!months.has(key)) months.set(key, { key, income: 0, spending: 0, saved: 0, fees: 0, byCategory: {}, count: 0 });
    const month = months.get(key);
    month.count += 1;
    if (isIncome(transaction)) month.income += transaction.amount;
    if (isSpending(transaction)) {
      month.spending += -transaction.amount;
      month.byCategory[transaction.category] = (month.byCategory[transaction.category] ?? 0) - transaction.amount;
    }
    if (transaction.category === "Saving and Investing") month.saved -= transaction.amount;
    if (transaction.category === "Fees and Interest" && transaction.amount < 0) month.fees -= transaction.amount;
  }
  return [...months.values()]
    .map((month) => ({ ...month, net: month.income - month.spending }))
    .sort((a, b) => a.key.localeCompare(b.key));
};

const coverage = (transactions) => {
  if (!transactions.length) return { first: null, last: null, days: 0 };
  const dates = transactions.map((transaction) => transaction.date).sort();
  return { first: dates[0], last: dates.at(-1), days: daysBetween(dates[0], dates.at(-1)) + 1 };
};

// Completed months only, so a half month never drags an average down.
const completeMonths = (months, range, today) =>
  months.filter((month) => {
    const start = `${month.key}-01`;
    const end = `${month.key}-${String(daysInMonth(month.key)).padStart(2, "0")}`;
    return range.first <= addDays(start, 3) && range.last >= addDays(end, -3) && end < today;
  });

const latestBalance = (transactions) => {
  const withBalance = transactions.filter((transaction) => Number.isInteger(transaction.balance));
  if (!withBalance.length) return null;
  const last = withBalance.reduce((latest, item) => (item.date >= latest.date ? item : latest));
  return { amount: last.balance, date: last.date, source: "statement" };
};

export const buildPaydayPlan = ({ transactions, recurring, paycheck, today, balance, cushion = 0 }) => {
  const nextPayday = paycheck?.nextDate ?? null;
  const horizon = nextPayday ?? addDays(today, 14);
  const daysLeft = Math.max(1, daysBetween(today, horizon));
  const billsDue = recurring.filter((bill) => bill.nextDate >= today && bill.nextDate < horizon);
  const billsTotal = sum(billsDue.map((bill) => bill.typicalAmount));

  const recurringKeys = new Set(recurring.map((bill) => bill.key));
  const lookback = addDays(today, -90);
  const flexible = transactions.filter(
    (transaction) => isSpending(transaction) && transaction.date >= lookback && transaction.date <= today && !recurringKeys.has(merchantKey(transaction.description)),
  );
  const flexibleDays = Math.max(1, Math.min(90, daysBetween(coverage(transactions).first ?? today, today) + 1));
  const dailyFlexible = Math.round(-sum(flexible.map((transaction) => transaction.amount)) / flexibleDays);

  let cycle = null;
  if (paycheck && paycheck.lastDate <= today) {
    const length = Math.max(1, daysBetween(paycheck.lastDate, horizon));
    const spent = -sum(flexible.filter((transaction) => transaction.date >= paycheck.lastDate).map((transaction) => transaction.amount));
    cycle = {
      start: paycheck.lastDate,
      length,
      elapsedShare: Math.min(1, daysBetween(paycheck.lastDate, today) / length),
      flexibleSpent: spent,
      flexibleTypical: dailyFlexible * length,
      spentShare: dailyFlexible ? Math.min(1.5, spent / (dailyFlexible * length)) : 0,
    };
  }

  const plan = { nextPayday, daysLeft, billsDue, billsTotal, dailyFlexible, projectedFlexible: dailyFlexible * daysLeft, cushion, balance, cycle };
  if (!balance) return { ...plan, safeToSpend: null, perDay: null, projectedLanding: null };

  const safeToSpend = balance.amount - billsTotal - cushion;
  return {
    ...plan,
    safeToSpend,
    perDay: Math.floor(Math.max(0, safeToSpend) / daysLeft),
    projectedLanding: safeToSpend - dailyFlexible * daysLeft,
  };
};

// How each completed pay cycle went: what came in, what went out, how fast it went.
export const analyzePayCycles = (transactions, paycheck) => {
  if (!paycheck || paycheck.dates.length < 2) return [];
  const cycles = [];
  for (let index = 0; index < paycheck.dates.length - 1; index += 1) {
    const start = paycheck.dates[index];
    const end = paycheck.dates[index + 1];
    const inCycle = transactions.filter((transaction) => transaction.date >= start && transaction.date < end);
    const income = sum(inCycle.filter(isIncome).map((transaction) => transaction.amount));
    const spendingItems = inCycle.filter(isSpending);
    const spending = -sum(spendingItems.map((transaction) => transaction.amount));
    const firstThree = -sum(spendingItems.filter((transaction) => daysBetween(start, transaction.date) < 3).map((transaction) => transaction.amount));
    cycles.push({ start, end, income, spending, net: income - spending, frontLoad: spending ? firstThree / spending : 0, length: daysBetween(start, end) });
  }
  return cycles.slice(-8);
};

const byWeekday = (transactions, since) => {
  const totals = Array(7).fill(0);
  for (const transaction of transactions) {
    if (transaction.date >= since && isSpending(transaction)) totals[weekday(transaction.date)] -= transaction.amount;
  }
  return totals;
};

const topMerchants = (transactions, since, limit = 6) => {
  const totals = new Map();
  for (const transaction of transactions) {
    if (transaction.date < since || !isSpending(transaction)) continue;
    const key = merchantKey(transaction.description);
    const entry = totals.get(key) ?? { key, name: displayMerchant(transaction.description), total: 0, count: 0, category: transaction.category };
    entry.total -= transaction.amount;
    entry.count += 1;
    totals.set(key, entry);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, limit);
};

const formatShare = (value) => `${Math.round(value * 100)}%`;

// Flight stage mirrors the Financial Flight Mode journey. It is an indicator built from
// the person's own history, never a judgment and never investment advice.
export const flightStage = ({ range, averages, feeMonths, negativeMonths, monthsCounted }) => {
  if (range.days < 30 || !monthsCounted) {
    return { key: "preflight", name: "Pre Flight", reason: "Import at least one full month so Cockpit can read your pattern." };
  }
  if (averages.net < 0 || negativeMonths / monthsCounted >= 0.5 || feeMonths / monthsCounted >= 0.5) {
    return { key: "turbulence", name: "Turbulence", reason: "Spending is catching up with income or fees keep showing up. Stabilize the cockpit first." };
  }
  if (averages.savingsRate < 0.1) {
    return { key: "cruise", name: "Cruise Control", reason: "You keep more than you spend. Next, make saving automatic and repeatable." };
  }
  return { key: "flight", name: "Flight Mode", reason: "You consistently keep at least 10% of what comes in. Keep the system running." };
};

const buildWarningLights = ({ transactions, today, averages, recurring, cycles, months, currentMonth }) => {
  const lights = [];
  const last90 = addDays(today, -90);
  const fees = transactions.filter((transaction) => transaction.category === "Fees and Interest" && transaction.amount < 0 && transaction.date >= last90);
  if (fees.length) {
    lights.push({
      id: "fees",
      level: "red",
      title: "Fees and interest are leaking cash",
      detail: `${fees.length} ${fees.length === 1 ? "charge" : "charges"} in the last 90 days.`,
      amount: -sum(fees.map((fee) => fee.amount)),
      action: "Find the cause of the most recent fee and set one guardrail so it does not repeat this month.",
    });
  }

  if (averages.net < 0) {
    lights.push({
      id: "negativeNet",
      level: "red",
      title: "Spending is running ahead of income",
      detail: "Your average month spends more than it brings in.",
      amount: -averages.net,
      action: "Pick the largest flexible category and set a weekly limit for it before next payday.",
    });
  }

  const subscriptions = recurring.filter((item) => item.isSubscription);
  if (subscriptions.length >= 3) {
    lights.push({
      id: "subscriptions",
      level: "amber",
      title: `${subscriptions.length} subscriptions on autopilot`,
      detail: "Recurring charges are easy to forget.",
      amount: sum(subscriptions.map((item) => item.annualCost)),
      amountLabel: "per year",
      action: "Open the list and cancel one you would not sign up for again today.",
    });
  }

  const frontLoaded = cycles.filter((cycle) => cycle.frontLoad >= 0.4);
  if (cycles.length >= 3 && frontLoaded.length / cycles.length >= 0.5) {
    lights.push({
      id: "paydaySurge",
      level: "amber",
      title: "Payday surge",
      detail: `In ${frontLoaded.length} of your last ${cycles.length} pay cycles, 40% or more of spending happened in the first three days.`,
      action: "Give every dollar a job before payday so the first three days follow the plan.",
    });
  }

  if (currentMonth && months.length >= 2) {
    const history = months.filter((month) => month.key !== currentMonth.key).slice(-3);
    const elapsed = Math.min(1, Number(today.slice(8, 10)) / daysInMonth(currentMonth.key));
    const spikes = Object.entries(currentMonth.byCategory)
      .filter(([category]) => PACEABLE_CATEGORIES.has(category))
      .map(([category, spent]) => {
        const average = sum(history.map((month) => month.byCategory[category] ?? 0)) / Math.max(history.length, 1);
        return { category, spent, average, pace: average ? spent / (average * Math.max(elapsed, 0.25)) : 0 };
      })
      .filter((entry) => entry.average >= 5000 && entry.spent > entry.average * 0.6 && entry.pace >= 1.3)
      .sort((a, b) => b.spent - b.average - (a.spent - a.average));
    if (spikes.length) {
      const spike = spikes[0];
      lights.push({
        id: "categorySpike",
        level: "amber",
        title: `${spike.category} is running hot`,
        detail: `This month is pacing at ${formatShare(spike.pace)} of your usual ${spike.category.toLowerCase()} spending.`,
        amount: spike.spent,
        action: `Hold ${spike.category.toLowerCase()} to what is already spent until next payday.`,
      });
    }
  }

  return lights;
};

const buildStrongSignal = ({ averages, monthsCounted, months, feeMonths, cycles }) => {
  if (!monthsCounted) return null;
  const positiveMonths = months.filter((month) => month.net > 0).length;
  if (averages.savingsRate >= 0.1) {
    return { title: `You keep ${formatShare(averages.savingsRate)} of what comes in`, detail: "That margin is what builds runway." };
  }
  if (feeMonths === 0 && monthsCounted >= 2) {
    return { title: "No fees or interest across your history", detail: "Every dollar you earn is working for you, not the bank." };
  }
  const greenCycles = cycles.filter((cycle) => cycle.net >= 0).length;
  if (cycles.length && greenCycles / cycles.length >= 0.5) {
    return { title: `${greenCycles} of ${cycles.length} pay cycles ended in the green`, detail: "Build on what is already working." };
  }
  if (positiveMonths) {
    return { title: `${positiveMonths} ${positiveMonths === 1 ? "month" : "months"} with more coming in than going out`, detail: "Proof you can do it. Now make it the pattern." };
  }
  return { title: "You are looking at your real numbers", detail: "Most people never do. This is the first move." };
};

const nextMove = (warningLights, stage, plan) => {
  if (warningLights.length) return warningLights[0].action;
  if (plan.safeToSpend !== null && plan.projectedLanding < 0) return "Your current pace lands short before payday. Trim flexible spending to stay above zero.";
  if (stage.key === "preflight") return "Import more history so Cockpit can learn your paydays and bills.";
  if (stage.key === "cruise") return "Choose a set amount to move to savings the day your paycheck lands.";
  return "Run your weekly review and correct one thing.";
};

export const buildInsights = ({ transactions, today, balanceOverride = null, cushion = 0 }) => {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const range = coverage(sorted);
  const months = summarizeMonths(sorted);
  const counted = range.first ? completeMonths(months, range, today) : [];
  const basis = counted.length ? counted : months.slice(-1);
  const monthsCounted = counted.length;

  const income = basis.length ? sum(basis.map((month) => month.income)) / basis.length : 0;
  const spending = basis.length ? sum(basis.map((month) => month.spending)) / basis.length : 0;
  const saved = basis.length ? sum(basis.map((month) => month.saved)) / basis.length : 0;
  const averages = {
    income: Math.round(income),
    spending: Math.round(spending),
    net: Math.round(income - spending),
    saved: Math.round(saved),
    savingsRate: income > 0 ? Math.max(0, (income - spending) / income) : 0,
  };

  const incomeStreams = detectIncomeStreams(sorted, today);
  const paycheck = incomeStreams[0] ?? null;
  const recurring = detectRecurring(sorted, today);
  const statementBalance = latestBalance(sorted);
  // The newest known balance wins: a fresh statement beats an older manual entry.
  const balance = balanceOverride && (!statementBalance || balanceOverride.date >= statementBalance.date) ? balanceOverride : statementBalance;
  const plan = buildPaydayPlan({ transactions: sorted, recurring, paycheck, today, balance, cushion });
  const cycles = analyzePayCycles(sorted, paycheck);

  const currentMonth = months.find((month) => month.key === monthKey(today)) ?? null;
  const feeMonths = counted.filter((month) => month.fees > 0).length;
  const negativeMonths = counted.filter((month) => month.net < 0).length;
  const stage = flightStage({ range, averages, feeMonths, negativeMonths, monthsCounted });

  const since90 = addDays(today, -90);
  const categoryTotals = {};
  for (const transaction of sorted) {
    if (transaction.date >= since90 && isSpending(transaction)) {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] ?? 0) - transaction.amount;
    }
  }
  const categories = Object.entries(categoryTotals)
    .map(([name, total]) => ({ name, total, monthly: Math.round(total / 3), color: CATEGORIES[name]?.color ?? "#636366", group: groupOf(name) }))
    .sort((a, b) => b.total - a.total);

  const groupTotals = {};
  for (const category of categories) groupTotals[category.group] = (groupTotals[category.group] ?? 0) + category.total;

  const warningLights = buildWarningLights({ transactions: sorted, today, averages, recurring, cycles, months, currentMonth });
  const strongSignal = buildStrongSignal({ averages, monthsCounted, months: counted, feeMonths, cycles });

  return {
    today,
    range,
    staleDays: range.last ? daysBetween(range.last, today) : null,
    months,
    monthsCounted,
    averages,
    incomeStreams,
    paycheck,
    recurring,
    subscriptions: recurring.filter((item) => item.isSubscription),
    plan,
    cycles,
    stage,
    categories,
    groupTotals,
    weekdays: byWeekday(sorted, since90),
    merchants: topMerchants(sorted, since90),
    currentMonth,
    warningLights,
    strongSignal,
    nextMove: nextMove(warningLights, stage, plan),
    statementBalance,
    feeMonths,
    negativeMonths,
  };
};
