import { CATEGORIES, groupOf, isIncome, isSpending, merchantKey } from "./categorize.js";
import { daysBetween, daysInMonth, monthKey, shiftMonth } from "./dates.js";

// Planning and reporting: budgets, goals, and the Reports library. Pure functions over
// data the person entered or imported, so every figure stays on the device.

const sum = (values) => values.reduce((total, value) => total + value, 0);
const monthEnd = (key) => `${key}-${String(daysInMonth(key)).padStart(2, "0")}`;

// ---------- Budgets ----------

const BUDGETABLE_GROUPS = new Set(["essentials", "lifestyle", "financial"]);

// Bills land once a month, so a partial month says nothing about where they will finish.
const FIXED = new Set(["Housing", "Debt Payment", "Insurance", "Utilities", "Phone and Internet", "Subscriptions", "Childcare"]);

// Suggest a monthly budget per category from the last three full months, rounded up to $10.
export const suggestBudgets = (months, today) => {
  const history = months.filter((month) => month.key < monthKey(today)).slice(-3);
  if (!history.length) return {};
  const names = new Set(history.flatMap((month) => Object.keys(month.byCategory)));
  const suggestions = {};
  for (const name of names) {
    if (!BUDGETABLE_GROUPS.has(groupOf(name)) || name === "Fees and Interest") continue;
    const average = sum(history.map((month) => month.byCategory[name] ?? 0)) / history.length;
    if (average < 1000) continue;
    suggestions[name] = Math.ceil(average / 1000) * 1000;
  }
  return suggestions;
};

export const budgetStatus = (budgets, transactions, today) => {
  const key = monthKey(today);
  const start = `${key}-01`;
  const end = monthEnd(key);
  const day = Number(today.slice(8, 10));
  const length = daysInMonth(key);
  const daysLeft = Math.max(1, length - day + 1);
  const spentBy = {};
  for (const transaction of transactions) {
    if (transaction.date < start || transaction.date > today || !isSpending(transaction)) continue;
    spentBy[transaction.category] = (spentBy[transaction.category] ?? 0) - transaction.amount;
  }

  const items = Object.entries(budgets)
    .filter(([, amount]) => amount > 0)
    .map(([category, budget]) => {
      const spent = spentBy[category] ?? 0;
      const remaining = budget - spent;
      const projected = FIXED.has(category) ? spent : Math.round((spent / day) * length);
      let status = "onTrack";
      if (spent > budget) status = "over";
      else if (projected > budget * 1.05) status = "watch";
      return {
        category,
        color: CATEGORIES[category]?.color ?? "#636366",
        budget,
        spent,
        remaining,
        remainingShare: budget ? Math.max(0, remaining / budget) : 0,
        usedShare: budget ? spent / budget : 0,
        perDay: Math.max(0, Math.floor(remaining / daysLeft)),
        projected,
        status,
      };
    })
    .sort((a, b) => b.usedShare - a.usedShare);

  const totalBudget = sum(items.map((item) => item.budget));
  const totalSpent = sum(items.map((item) => item.spent));
  return {
    month: key,
    start,
    end,
    daysLeft,
    elapsedShare: day / length,
    items,
    totalBudget,
    totalSpent,
    totalRemaining: totalBudget - totalSpent,
    perDay: Math.max(0, Math.floor((totalBudget - totalSpent) / daysLeft)),
    onTrack: items.filter((item) => item.status === "onTrack").length,
  };
};

// How many budgets finished last month at or under their amount.
export const budgetsKeptLastMonth = (budgets, months, today) => {
  const last = months.find((month) => month.key === shiftMonth(monthKey(today), -1));
  if (!last) return 0;
  return Object.entries(budgets).filter(([category, amount]) => amount > 0 && (last.byCategory[category] ?? 0) <= amount).length;
};

// ---------- Goals ----------

export const goalSaved = (goal) => sum((goal.deposits ?? []).map((deposit) => deposit.amount));

export const goalProjection = (goal, { monthlyMargin = 0, today }) => {
  const saved = goalSaved(goal);
  const remaining = Math.max(0, goal.target - saved);
  const progress = goal.target ? Math.min(1, saved / goal.target) : 0;
  const deposits = [...(goal.deposits ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  // Pace: the person's own deposit rhythm once there is one, otherwise their monthly margin.
  let monthlyPace = 0;
  let paceSource = "none";
  if (deposits.length >= 2) {
    const span = Math.max(30, daysBetween(deposits[0].date, today));
    monthlyPace = Math.round((saved / span) * 30.4);
    paceSource = "deposits";
  } else if (monthlyMargin > 0) {
    monthlyPace = Math.round(monthlyMargin * 0.5);
    paceSource = "margin";
  }

  const monthsToGo = remaining === 0 ? 0 : monthlyPace > 0 ? Math.ceil(remaining / monthlyPace) : null;
  const eta = monthsToGo === null ? null : monthsToGo === 0 ? today : `${shiftMonth(monthKey(today), monthsToGo)}-01`;

  let neededMonthly = null;
  if (goal.targetDate && remaining > 0) {
    const monthsLeft = Math.max(1, Math.round(daysBetween(today, goal.targetDate) / 30.4));
    neededMonthly = Math.ceil(remaining / monthsLeft);
  }

  return { saved, remaining, progress, monthlyPace, paceSource, monthsToGo, eta, neededMonthly, complete: remaining === 0 };
};

// ---------- Reports ----------

export const spendingByCategoryForMonth = (transactions, key) => {
  const previous = shiftMonth(key, -1);
  const totals = {};
  const prior = {};
  for (const transaction of transactions) {
    if (!isSpending(transaction)) continue;
    const month = monthKey(transaction.date);
    if (month === key) totals[transaction.category] = (totals[transaction.category] ?? 0) - transaction.amount;
    if (month === previous) prior[transaction.category] = (prior[transaction.category] ?? 0) - transaction.amount;
  }
  const total = sum(Object.values(totals));
  const priorTotal = sum(Object.values(prior));
  return {
    key,
    total,
    priorTotal,
    change: priorTotal ? total / priorTotal - 1 : null,
    categories: Object.entries(totals)
      .map(([name, value]) => ({
        name,
        total: value,
        share: total ? value / total : 0,
        prior: prior[name] ?? 0,
        change: prior[name] ? value / prior[name] - 1 : null,
        color: CATEGORIES[name]?.color ?? "#636366",
      }))
      .sort((a, b) => b.total - a.total),
  };
};

export const incomeVsExpense = (months) =>
  months.map((month) => ({ key: month.key, income: month.income, spending: month.spending, net: month.income - month.spending, saved: month.saved }));

export const livingCosts = (months, today) => {
  const history = months.filter((month) => month.key < monthKey(today)).slice(-6);
  const essentials = {};
  for (const month of history) {
    for (const [name, value] of Object.entries(month.byCategory)) {
      if (groupOf(name) === "essentials" || name === "Debt Payment") essentials[name] = (essentials[name] ?? 0) + value;
    }
  }
  const count = history.length || 1;
  const categories = Object.entries(essentials)
    .map(([name, value]) => ({ name, monthly: Math.round(value / count), color: CATEGORIES[name]?.color ?? "#636366" }))
    .sort((a, b) => b.monthly - a.monthly);
  const monthly = sum(categories.map((item) => item.monthly));
  return {
    months: history.length,
    monthly,
    categories,
    trend: history.map((month) => ({
      key: month.key,
      total: sum(Object.entries(month.byCategory).filter(([name]) => groupOf(name) === "essentials" || name === "Debt Payment").map(([, value]) => value)),
    })),
  };
};

export const subscriptionInsights = (transactions, subscriptions, today) => {
  const year = today.slice(0, 4);
  const lastYear = String(Number(year) - 1);
  const rows = subscriptions.map((subscription) => {
    const charges = transactions.filter((transaction) => transaction.amount < 0 && merchantKey(transaction.description) === subscription.key);
    const total = (filter) => 0 - sum(charges.filter(filter).map((transaction) => transaction.amount));
    return {
      key: subscription.key,
      name: subscription.name,
      category: subscription.category,
      typicalAmount: subscription.typicalAmount,
      cadence: subscription.cadence,
      thisYear: total((transaction) => transaction.date.startsWith(year)),
      lastYear: total((transaction) => transaction.date.startsWith(lastYear)),
      lifetime: total(() => true),
      annualCost: subscription.annualCost,
      since: charges.reduce((first, transaction) => (transaction.date < first ? transaction.date : first), today),
      charges: charges.length,
    };
  });
  return {
    rows: rows.sort((a, b) => b.annualCost - a.annualCost),
    thisYear: sum(rows.map((row) => row.thisYear)),
    lastYear: sum(rows.map((row) => row.lastYear)),
    lifetime: sum(rows.map((row) => row.lifetime)),
    annual: sum(rows.map((row) => row.annualCost)),
  };
};

// Year to date actuals plus the person's own monthly averages for the months that remain.
export const yearEndProjection = (transactions, averages, today) => {
  const year = today.slice(0, 4);
  const ytd = transactions.filter((transaction) => transaction.date.startsWith(year) && transaction.date <= today);
  const income = sum(ytd.filter(isIncome).map((transaction) => transaction.amount));
  const spending = -sum(ytd.filter(isSpending).map((transaction) => transaction.amount));
  const monthsLeft = 12 - Number(today.slice(5, 7)) + (1 - Number(today.slice(8, 10)) / daysInMonth(monthKey(today)));
  const projectedIncome = Math.round(income + averages.income * monthsLeft);
  const projectedSpending = Math.round(spending + averages.spending * monthsLeft);
  const firstDate = ytd.reduce((first, transaction) => (transaction.date < first ? transaction.date : first), today);
  return {
    year,
    ytd: { income, spending, net: income - spending },
    monthsLeft: Math.round(monthsLeft * 10) / 10,
    projected: { income: projectedIncome, spending: projectedSpending, net: projectedIncome - projectedSpending },
    partialYear: firstDate > `${year}-01-15`,
    coverageStart: firstDate,
  };
};

export const REPORTS = Object.freeze([
  { id: "categories", title: "Spending by Category", copy: "Where each month went, compared with the month before.", icon: "insights" },
  { id: "incomeExpense", title: "Income vs Expense", copy: "What came in, what went out, and what stayed.", icon: "activity" },
  { id: "subscriptions", title: "Subscription Insights", copy: "This year, last year, and everything you have paid.", icon: "calendar" },
  { id: "yearEnd", title: "Year End Projection", copy: "Where this year lands if your pattern holds.", icon: "spark" },
  { id: "livingCosts", title: "Monthly Living Costs", copy: "What it costs to keep the lights on each month.", icon: "bank" },
]);
