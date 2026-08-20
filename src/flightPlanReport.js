const dollars = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const formatDollars = (value) => dollars.format(Math.max(0, Math.round(value)));

const priorityLibrary = {
  cashRemaining: {
    title: "Create monthly breathing room",
    action: "Review needs and wants, then assign every available dollar before the next payday.",
  },
  savingsRate: {
    title: "Strengthen your savings rhythm",
    action: "Choose a realistic automatic transfer and treat it like a recurring monthly bill.",
  },
  debtPressure: {
    title: "Reduce debt pressure",
    action: "List balances and minimums, keep every account current, and direct extra payments to one priority balance.",
  },
  emergencyFund: {
    title: "Extend your emergency runway",
    action: "Keep emergency savings separate and fund the next runway milestone before expanding lifestyle spending.",
  },
  investments: {
    title: "Build your investing starting point",
    action: "After near-term stability is covered, review available workplace plans and low-cost diversified options.",
  },
};

const maximums = {
  cashRemaining: 25,
  savingsRate: 25,
  debtPressure: 20,
  emergencyFund: 20,
  investments: 10,
};

const getRankedPriorities = (categoryScores) =>
  Object.entries(categoryScores)
    .sort(([keyA, valueA], [keyB, valueB]) => valueA / maximums[keyA] - valueB / maximums[keyB])
    .slice(0, 3)
    .map(([key]) => priorityLibrary[key]);

export const buildFlightPlanReport = (result) => {
  const { values, metrics, stage } = result;
  const monthlyExpenses = values.needs + values.wants;
  const runwayGap = Math.max(values.emergencyFundGoal - values.emergencyFundSaved, 0);
  const availableCash = Math.max(metrics.cashRemaining, 0);
  const suggestedSavings = Math.max(values.savings, Math.min(values.income * 0.1, values.savings + availableCash * 0.5));
  const suggestedDebtPayment = values.totalDebtBalance > 0
    ? values.extraDebtPayment + availableCash * 0.5
    : 0;

  return {
    title: `Your ${stage.name} Flight Plan`,
    summary: stage.message,
    priorities: getRankedPriorities(result.categoryScores),
    targets: [
      { label: "Monthly spending plan", value: formatDollars(monthlyExpenses) },
      { label: "Suggested monthly savings pace", value: formatDollars(suggestedSavings) },
      { label: "Emergency runway remaining", value: formatDollars(runwayGap) },
      { label: "Potential monthly debt payment", value: formatDollars(suggestedDebtPayment) },
    ],
    missions: [
      {
        timeframe: "Days 1–30 · Stabilize",
        action: `${result.briefing.sevenDayAction} Complete four Weekly Money Resets and record what changed.`,
      },
      {
        timeframe: "Days 31–60 · Strengthen",
        action: `Automate your chosen savings amount, monitor the ${result.briefing.warningLight.toLowerCase()} signal, and make one adjustment.`,
      },
      {
        timeframe: "Days 61–90 · Build",
        action: "Review the full dashboard, compare it with today's baseline, and set the next quarterly mission.",
      },
    ],
  };
};
