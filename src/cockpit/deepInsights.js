import { CATEGORIES, displayMerchant, groupOf, isSpending, merchantKey } from "./categorize.js";
import { addDays, daysBetween, daysInMonth, monthKey, shiftMonth } from "./dates.js";

// Deeper analysis for the Insights screen. Pure functions over the same categorized
// transactions buildInsights uses, so every number stays on the device.

const sum = (values) => values.reduce((total, value) => total + value, 0);

export const PERIODS = Object.freeze([
  { key: "30", label: "30 Days", days: 30 },
  { key: "90", label: "90 Days", days: 90 },
  { key: "180", label: "6 Months", days: 182 },
]);

// Spending by category over a trailing window, with a per month figure.
export const categoryBreakdown = (transactions, today, days) => {
  const since = addDays(today, -(days - 1));
  const totals = {};
  for (const transaction of transactions) {
    if (transaction.date < since || transaction.date > today || !isSpending(transaction)) continue;
    totals[transaction.category] = (totals[transaction.category] ?? 0) - transaction.amount;
  }
  const total = sum(Object.values(totals));
  const perMonth = 30.4 / days;
  return {
    total,
    monthly: Math.round(total * perMonth),
    categories: Object.entries(totals)
      .map(([name, value]) => ({
        name,
        total: value,
        monthly: Math.round(value * perMonth),
        share: total ? value / total : 0,
        color: CATEGORIES[name]?.color ?? "#636366",
        group: groupOf(name),
      }))
      .sort((a, b) => b.total - a.total),
  };
};

// Bills land on one day, so projecting them from a partial month would mislead.
// Only everyday spending is paced.
const PACED = new Set(["Groceries", "Fuel", "Transportation", "Health", "Dining", "Coffee", "Shopping", "Entertainment", "Travel", "Personal Care", "Gifts and Giving", "Pets", "Cash and ATM", "Other"]);

// This month's pace per category against the average of the three months before it.
export const categoryChanges = (insights, today) => {
  const current = insights.currentMonth;
  if (!current) return [];
  const history = insights.months.filter((month) => month.key < current.key).slice(-3);
  if (!history.length) return [];
  const elapsed = Math.max(Number(today.slice(8, 10)) / daysInMonth(current.key), 0.2);
  const names = new Set([...Object.keys(current.byCategory), ...history.flatMap((month) => Object.keys(month.byCategory))]);
  return [...names]
    .filter((name) => PACED.has(name))
    .map((name) => {
      const average = sum(history.map((month) => month.byCategory[name] ?? 0)) / history.length;
      const projected = Math.round((current.byCategory[name] ?? 0) / elapsed);
      return { name, average: Math.round(average), projected, change: average ? projected / average - 1 : null, color: CATEGORIES[name]?.color ?? "#636366" };
    })
    .filter((entry) => entry.average >= 3000 && entry.change !== null && Math.abs(entry.projected - entry.average) >= 2000)
    .sort((a, b) => Math.abs(b.projected - b.average) - Math.abs(a.projected - a.average))
    .slice(0, 5);
};

// Cumulative spending through the month, compared with the typical month.
export const spendingPace = (transactions, insights, today) => {
  const current = monthKey(today);
  const history = insights.months.filter((month) => month.key < current).slice(-3).map((month) => month.key);
  const daily = (key) => {
    const days = Array(daysInMonth(key)).fill(0);
    for (const transaction of transactions) {
      if (monthKey(transaction.date) === key && isSpending(transaction)) days[Number(transaction.date.slice(8, 10)) - 1] -= transaction.amount;
    }
    let running = 0;
    return days.map((value) => (running += value));
  };
  const day = Number(today.slice(8, 10));
  const thisMonth = daily(current).slice(0, day);
  if (!history.length) return { thisMonth, typical: [], day, ahead: 0 };
  const curves = history.map(daily);
  const length = daysInMonth(current);
  const typical = Array.from({ length }, (_, index) => Math.round(sum(curves.map((curve) => curve[Math.min(index, curve.length - 1)])) / curves.length));
  return { thisMonth, typical, day, ahead: (thisMonth.at(-1) ?? 0) - (typical[day - 1] ?? 0) };
};

const stepOccurrences = (item, today, horizon) => {
  const dates = [];
  let date = item.nextDate;
  let guard = 0;
  while (date <= horizon && guard < 40) {
    if (date >= today) dates.push(date);
    if (["monthly", "quarterly"].includes(item.cadence.key)) {
      const key = shiftMonth(monthKey(date), item.cadence.key === "monthly" ? 1 : 3);
      const target = Number(item.lastDate.slice(8, 10));
      date = `${key}-${String(Math.min(target, daysInMonth(key))).padStart(2, "0")}`;
    } else {
      date = addDays(date, item.cadence.days);
    }
    guard += 1;
  }
  return dates;
};

// What is already scheduled for the next 30 days: expected paychecks and known bills.
export const outlook = (insights, today, days = 30) => {
  const horizon = addDays(today, days);
  const events = [];
  for (const stream of insights.incomeStreams) {
    for (const date of stepOccurrences(stream, today, horizon)) events.push({ date, name: stream.name, amount: stream.typicalAmount, kind: "income", category: "Paycheck" });
  }
  for (const bill of insights.recurring) {
    const kind = bill.category === "Saving and Investing" ? "saving" : "bill";
    for (const date of stepOccurrences(bill, today, horizon)) events.push({ date, name: bill.name, amount: -bill.typicalAmount, kind, category: bill.category });
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
  const income = sum(events.filter((event) => event.amount > 0).map((event) => event.amount));
  const bills = -sum(events.filter((event) => event.kind === "bill").map((event) => event.amount));
  const saving = -sum(events.filter((event) => event.kind === "saving").map((event) => event.amount));
  const flexible = insights.plan.dailyFlexible * days;
  return { days, events, income, bills, saving, flexible, net: income - bills - saving - flexible };
};

export const dailyStats = (transactions, today) => {
  const since = addDays(today, -89);
  const spending = transactions.filter((transaction) => transaction.date >= since && transaction.date <= today && isSpending(transaction));
  const byDay = new Map();
  for (const transaction of spending) byDay.set(transaction.date, (byDay.get(transaction.date) ?? 0) - transaction.amount);
  const firstDate = transactions.reduce((first, transaction) => (transaction.date < first ? transaction.date : first), today);
  const span = Math.max(1, Math.min(90, daysBetween(firstDate > since ? firstDate : since, today) + 1));
  const biggestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const largest = spending.reduce((best, transaction) => (!best || transaction.amount < best.amount ? transaction : best), null);

  const monthStart = `${monthKey(today)}-01`;
  let noSpendDays = 0;
  for (let day = monthStart; day <= today; day = addDays(day, 1)) if (!byDay.has(day)) noSpendDays += 1;

  return {
    averageDay: Math.round(sum([...byDay.values()]) / span),
    biggestDay: biggestDay ? { date: biggestDay[0], amount: biggestDay[1] } : null,
    largest: largest ? { name: displayMerchant(largest.description), amount: -largest.amount, date: largest.date } : null,
    noSpendDays,
    daysThisMonth: daysBetween(monthStart, today) + 1,
    perMonth: Math.round((spending.length / span) * 30.4),
  };
};

export const keepRateTrend = (insights) =>
  insights.months
    .filter((month) => month.key < monthKey(insights.today) && month.income > 0)
    .slice(-6)
    .map((month) => ({ key: month.key, rate: Math.max(-1, Math.min(1, (month.income - month.spending) / month.income)) }));

export const categoryDetail = (transactions, name, today) => {
  const items = transactions.filter((transaction) => transaction.category === name && transaction.amount < 0);
  const months = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const key = shiftMonth(monthKey(today), -offset);
    months.push({ key, total: -sum(items.filter((item) => monthKey(item.date) === key).map((item) => item.amount)) });
  }
  const complete = months.slice(0, -1).filter((month) => month.total > 0);
  const merchants = new Map();
  for (const item of items.filter((entry) => entry.date >= addDays(today, -89))) {
    const key = merchantKey(item.description);
    const entry = merchants.get(key) ?? { name: displayMerchant(item.description), total: 0, count: 0 };
    entry.total -= item.amount;
    entry.count += 1;
    merchants.set(key, entry);
  }
  return {
    name,
    color: CATEGORIES[name]?.color ?? "#636366",
    months,
    average: complete.length ? Math.round(sum(complete.map((month) => month.total)) / complete.length) : 0,
    merchants: [...merchants.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    recent: [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
  };
};
