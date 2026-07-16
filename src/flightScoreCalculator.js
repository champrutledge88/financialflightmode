export const STAGES = {
  preflight: {
    key: "preflight",
    name: "Pre-Flight",
    message: "Start with the baseline numbers. Your first move is getting the cockpit ready before the next payday.",
    nextAction:
      "Enter your baseline budget, confirm income and bills, and identify the first number that needs attention.",
    starterSection: "Know Your Numbers + Monthly Budget",
  },
  turbulence: {
    key: "turbulence",
    name: "Turbulence",
    message:
      "You are not behind. You are getting your signal. Start by stabilizing the cockpit before trying to build wealth.",
    nextAction:
      "Complete your Monthly Budget, identify 1-3 spending leaks, and choose one debt or cash-flow pressure point to address this week.",
    starterSection: "Spending Leak Audit + Payday Pre-Flight Checklist",
  },
  cruise: {
    key: "cruise",
    name: "Cruise Control",
    message:
      "You've created breathing room and started building your foundation. Your next mission is to strengthen your emergency fund, reduce debt, and make your progress repeatable.",
    nextAction:
      "Automate savings, review your emergency runway, and choose one number to improve before the next payday.",
    starterSection: "Dashboard Signals + Recommended Rhythm",
  },
  flight: {
    key: "flight",
    name: "Flight Mode",
    message:
      "You are in command. Keep the cockpit running, optimize your system, and use stable cash flow to build long-term options.",
    nextAction:
      "Review your full dashboard, increase income or investing capacity, and schedule your next month-end reset.",
    starterSection: "Next Flight Path + Monthly Flight Checklist",
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const cleanNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const scoreCashRemaining = (cashRemaining, income) => {
  if (cashRemaining < 0 || income <= 0) return 0;
  const ratio = cashRemaining / income;
  if (ratio < 0.05) return 10;
  if (ratio < 0.1) return 18;
  return 25;
};

const scoreSavingsRate = (savingsRate) => {
  if (savingsRate < 0.05) return 5;
  if (savingsRate < 0.1) return 12;
  if (savingsRate < 0.15) return 18;
  if (savingsRate < 0.2) return 22;
  return 25;
};

const scoreDebtPressure = (totalDebtBalance, income, extraDebtPayment) => {
  if (totalDebtBalance <= 0) return 20;
  if (income <= 0) return 3;

  const ratio = totalDebtBalance / income;
  let score = 3;
  if (ratio <= 1) score = 18;
  else if (ratio <= 2) score = 14;
  else if (ratio <= 4) score = 8;

  const paymentBonus = extraDebtPayment > 0 ? clamp(extraDebtPayment / Math.max(income * 0.05, 1), 0, 1) * 3 : 0;
  return Math.min(20, Math.round(score + paymentBonus));
};

const scoreEmergencyFund = (emergencyFundLevel) => {
  if (emergencyFundLevel <= 0) return 0;
  if (emergencyFundLevel < 0.25) return 5;
  if (emergencyFundLevel < 0.5) return 10;
  if (emergencyFundLevel < 0.75) return 15;
  if (emergencyFundLevel < 1) return 18;
  return 20;
};

const scoreInvestmentStatus = (investmentsCurrentValue) => {
  if (investmentsCurrentValue <= 0) return 0;
  if (investmentsCurrentValue < 500) return 3;
  if (investmentsCurrentValue < 2500) return 5;
  if (investmentsCurrentValue < 10000) return 8;
  return 10;
};

export const getInvestmentLabel = (investmentsCurrentValue) => {
  if (investmentsCurrentValue <= 0) return "No Fuel";
  if (investmentsCurrentValue < 500) return "Ignition";
  if (investmentsCurrentValue < 2500) return "Building";
  if (investmentsCurrentValue < 10000) return "Building";
  return "Command";
};

export const getStage = ({ score, cashRemaining, savingsRate, emergencyFundLevel }) => {
  const hasCriticalCashFailure = cashRemaining < 0;

  if (score >= 90) return STAGES.flight;
  if (score >= 70 && !hasCriticalCashFailure) return STAGES.cruise;
  if (score >= 40 || hasCriticalCashFailure || savingsRate < 0.05 || emergencyFundLevel < 0.25) return STAGES.turbulence;
  return STAGES.preflight;
};

const signalLabels = {
  cashRemaining: "Cash Remaining",
  savingsRate: "Savings Rate",
  debtPressure: "Debt Load",
  emergencyFund: "Emergency Runway",
  investments: "Investment Status",
};

const categoryMaximums = {
  cashRemaining: 25,
  savingsRate: 25,
  debtPressure: 20,
  emergencyFund: 20,
  investments: 10,
};

const getRelativeCategoryScores = (categoryScores) =>
  Object.entries(categoryScores).map(([key, value]) => [
    key,
    value / categoryMaximums[key],
  ]);

const getStrongestSignal = (categoryScores) =>
  signalLabels[
    getRelativeCategoryScores(categoryScores).sort((a, b) => b[1] - a[1])[0][0]
  ];

const getWarningLight = (categoryScores) => {
  const relativeScores = getRelativeCategoryScores(categoryScores);
  const lowestScore = relativeScores.sort((a, b) => a[1] - b[1])[0];

  if (lowestScore[1] >= 0.9) return "Optimization Capacity";

  return signalLabels[lowestScore[0]];
};

export const calculateFlightScore = (inputValues) => {
  const values = {
    income: cleanNumber(inputValues.income),
    needs: cleanNumber(inputValues.needs),
    wants: cleanNumber(inputValues.wants),
    savings: cleanNumber(inputValues.savings),
    extraDebtPayment: cleanNumber(inputValues.extraDebtPayment),
    totalDebtBalance: cleanNumber(inputValues.totalDebtBalance),
    emergencyFundSaved: cleanNumber(inputValues.emergencyFundSaved),
    emergencyFundGoal: cleanNumber(inputValues.emergencyFundGoal),
    investmentsCurrentValue: cleanNumber(inputValues.investmentsCurrentValue),
  };

  const cashRemaining = values.income - values.needs - values.wants - values.savings - values.extraDebtPayment;
  const savingsRate = values.income > 0 ? values.savings / values.income : 0;
  const debtToIncome = values.income > 0 ? values.totalDebtBalance / values.income : 0;
  const emergencyFundLevel =
    values.emergencyFundGoal > 0 ? values.emergencyFundSaved / values.emergencyFundGoal : 0;

  const categoryScores = {
    cashRemaining: scoreCashRemaining(cashRemaining, values.income),
    savingsRate: scoreSavingsRate(savingsRate),
    debtPressure: scoreDebtPressure(values.totalDebtBalance, values.income, values.extraDebtPayment),
    emergencyFund: scoreEmergencyFund(emergencyFundLevel),
    investments: scoreInvestmentStatus(values.investmentsCurrentValue),
  };

  const score = clamp(
    Object.values(categoryScores).reduce((total, item) => total + item, 0),
    0,
    100,
  );

  const metrics = {
    cashRemaining,
    savingsRate,
    debtToIncome,
    emergencyFundLevel,
    investmentStatus: getInvestmentLabel(values.investmentsCurrentValue),
  };

  const stage = getStage({
    score,
    cashRemaining,
    savingsRate,
    emergencyFundLevel,
  });

  return {
    values,
    score,
    stage,
    metrics,
    categoryScores,
    briefing: {
      stage: stage.name,
      message: stage.message,
      strongestSignal: getStrongestSignal(categoryScores),
      warningLight: getWarningLight(categoryScores),
      sevenDayAction: stage.nextAction,
      starterSection: stage.starterSection,
    },
  };
};
