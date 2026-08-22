export const categoryMap = Object.freeze({
  cashRemaining: "Cash Flow Control",
  savingsRate: "Savings System",
  debtPressure: "Debt Load",
  emergencyFund: "Emergency Runway",
  investments: "Wealth Fuel",
});

export const educationGuardrail =
  "Never recommend a security, lender, credit product, debt settlement provider, tax position, or legal action.";

const warningLightSafetyOrder = Object.freeze([
  "cashRemaining",
  "emergencyFund",
  "debtPressure",
  "savingsRate",
  "investments",
]);

const objectiveCategoryMap = Object.freeze({
  "Build a cushion": "emergencyFund",
  "Get out of debt": "debtPressure",
  "Save more consistently": "savingsRate",
  "Start investing": "investments",
  "Stop the bleeding": "cashRemaining",
});

const freezeAction = (entry) => Object.freeze(entry);

export const actionLibrary = Object.freeze([
  freezeAction({
    actionId: "cashFlowControl",
    categoryKey: "cashRemaining",
    category: "Cash Flow Control",
    doNow: "Open your budget and confirm every dollar of income, needs, and wants for this month.",
    thisPayday: "Before spending anything new, confirm this payday's bills are covered first.",
    thisMonth: "Find and close one spending leak so more of your income stays working for you.",
    thirtyDayMission: "Keep your monthly cash flow at zero or above for one full pay cycle.",
    workbookTab: "Monthly Budget + Dashboard",
    workbookAction: "Cash Flow Control row",
    emailSafe: true,
  }),
  freezeAction({
    actionId: "savingsSystem",
    categoryKey: "savingsRate",
    category: "Savings System",
    doNow: "Set up or confirm one automatic transfer from checking to savings for your next payday.",
    thisPayday: "Let that automatic transfer run without touching it.",
    thisMonth: "Keep the transfer running every payday this month, even if the amount is small.",
    thirtyDayMission: "Complete four consecutive automatic transfers to savings without skipping one.",
    workbookTab: "Savings Tracker + Monthly Budget",
    workbookAction: "Savings System row",
    emailSafe: true,
  }),
  freezeAction({
    actionId: "debtLoad",
    categoryKey: "debtPressure",
    category: "Debt Load",
    doNow: "Confirm your minimum payments and choose one balance to prioritize.",
    thisPayday: "Send any extra amount you can toward that one priority balance.",
    thisMonth: "Track your priority balance going down at least once this month.",
    thirtyDayMission: "Make one extra payment toward your priority balance beyond the minimum.",
    workbookTab: "Debt Snowball + Monthly Budget",
    workbookAction: "Debt Load row",
    emailSafe: true,
  }),
  freezeAction({
    actionId: "emergencyRunway",
    categoryKey: "emergencyFund",
    category: "Emergency Runway",
    doNow: "Set your next emergency fund target and confirm where that money will sit.",
    thisPayday: "Move a repeatable amount toward that target.",
    thisMonth: "Keep the contribution going every payday this month.",
    thirtyDayMission: "Grow your emergency fund by one repeatable contribution each payday this month.",
    workbookTab: "Savings Tracker + Dashboard",
    workbookAction: "Emergency Runway row",
    emailSafe: true,
  }),
  freezeAction({
    actionId: "wealthFuel",
    categoryKey: "investments",
    category: "Wealth Fuel",
    doNow: "Review your current investing or long-term saving contribution.",
    thisPayday: "Confirm that contribution processed as expected.",
    thisMonth: "Keep the contribution consistent every payday this month.",
    thirtyDayMission: "Maintain one repeatable investing or long-term saving contribution for a full month.",
    workbookTab: "Investment Tracker + Savings Rate",
    workbookAction: "Wealth Fuel row",
    emailSafe: true,
  }),
  freezeAction({
    actionId: "ownershipMindsetFallback",
    categoryKey: null,
    category: "Ownership Mindset",
    doNow: "Complete a Control Tower Review of your full dashboard before your next payday.",
    thisPayday: "Choose one area to optimize even though your numbers are already strong.",
    thisMonth: "Look for one way to increase income, investing, or ownership capacity.",
    thirtyDayMission: "Complete one full Control Tower Review and choose one growth priority for next month.",
    workbookTab: "Dashboard + Month-End Reset",
    workbookAction: "Ownership Mindset review",
    emailSafe: true,
  }),
]);

const actionByCategoryKey = Object.freeze(
  Object.fromEntries(actionLibrary.map((entry) => [entry.categoryKey, entry])),
);

const getAction = (categoryKey) => actionByCategoryKey[categoryKey];

const getFlagContextNote = (immediatePressure) => {
  if (immediatePressure === "Unexpected bill") {
    return "You flagged an unexpected bill — your reserves look strong enough to absorb it. If this reflects a bigger recent change, retake this with updated numbers.";
  }

  return "You flagged current pressure, but your current scorecard signals do not show an objective fragility signal. If this reflects a bigger recent change, retake this with updated numbers.";
};

const selectAdjacentPairCandidate = (candidates, shortTermObjective) => {
  const ranked = candidates.slice().sort((left, right) => left[1] - right[1]);
  const [first, second] = ranked;
  const gap = second[1] - first[1];
  const objectiveCategory = objectiveCategoryMap[shortTermObjective];
  const isTie = gap <= 0.1;
  const isObjectiveTieBreak =
    isTie && (objectiveCategory === first[0] || objectiveCategory === second[0]);

  let selected = first;
  if (isObjectiveTieBreak) {
    selected = objectiveCategory === first[0] ? first : second;
  } else if (isTie) {
    selected = [first, second].sort(
      (left, right) =>
        warningLightSafetyOrder.indexOf(left[0]) - warningLightSafetyOrder.indexOf(right[0]),
    )[0];
  }

  const selectedIndex = candidates.indexOf(selected);
  candidates.splice(selectedIndex, 1);

  return { selected, isObjectiveTieBreak };
};

const selectHardOverrideSecondCandidate = (candidates) => {
  const weakestScore = Math.min(...candidates.map(([, score]) => score));
  const exactWeakestCandidates = candidates.filter(([, score]) => score === weakestScore);
  const selected = exactWeakestCandidates.sort(
    (left, right) =>
      warningLightSafetyOrder.indexOf(left[0]) - warningLightSafetyOrder.indexOf(right[0]),
  )[0];

  candidates.splice(candidates.indexOf(selected), 1);
  return selected;
};

const toWarningLight = (categoryKey) => {
  const action = getAction(categoryKey);
  return { category: action.category, actionId: action.actionId };
};

const toPlanResult = ({ strongSignal, decisionPath, warningLights, fallback, flagContextNote, action }) => ({
  strongSignal,
  decisionPath,
  warningLights,
  fallback,
  flagContextNote,
  doNow: action.doNow,
  thisPayday: action.thisPayday,
  thisMonth: action.thisMonth,
  thirtyDayMission: action.thirtyDayMission,
  workbookConnection: {
    tab: action.workbookTab,
    action: action.workbookAction,
  },
});

export const generatePersonalizedFlightPlan = ({
  derivedContext,
  immediatePressure,
  shortTermObjective,
}) => {
  const { relativeScores, stageKey, pressureMetrics } = derivedContext;
  const strongest = relativeScores.slice().sort((left, right) => right[1] - left[1])[0];
  const strongestScore = strongest[1];
  const strongSignalAction = getAction(strongest[0]);
  const strongSignal = {
    category: categoryMap[strongest[0]],
    actionId: strongSignalAction.actionId,
    isTieBreak: relativeScores.filter(([, score]) => score === strongestScore).length > 1,
  };
  const fallbackApplies = relativeScores.every(([, score]) => score >= 0.9);
  const hasPressure = immediatePressure !== "Stable";
  const hasObjectiveFragility =
    pressureMetrics.savingsRate < 0.05 || pressureMetrics.emergencyFundLevel < 0.25;
  const isHardOverride =
    pressureMetrics.cashRemaining <= 0 || (hasPressure && hasObjectiveFragility);
  const flagContextNote = hasPressure && !isHardOverride ? getFlagContextNote(immediatePressure) : null;

  if (fallbackApplies && !isHardOverride) {
    const action = getAction(null);
    return toPlanResult({
      strongSignal,
      decisionPath: "Fallback",
      warningLights: null,
      fallback: { actionId: action.actionId, note: flagContextNote },
      flagContextNote,
      action,
    });
  }

  const candidates = relativeScores.slice();
  const stageSuppressesWealthFuel = stageKey === "preflight" || stageKey === "turbulence";
  let firstSelection;
  let secondSelection;
  if (isHardOverride) {
    const forcedIndex = candidates.findIndex(([categoryKey]) => categoryKey === "cashRemaining");
    candidates.splice(forcedIndex, 1);
    firstSelection = { selected: ["cashRemaining"], isObjectiveTieBreak: false };
  }

  if (stageSuppressesWealthFuel) {
    const investmentsIndex = candidates.findIndex(([categoryKey]) => categoryKey === "investments");
    if (investmentsIndex !== -1) candidates.splice(investmentsIndex, 1);
  }

  if (isHardOverride) {
    secondSelection = { selected: selectHardOverrideSecondCandidate(candidates), isObjectiveTieBreak: false };
  } else {
    firstSelection = selectAdjacentPairCandidate(candidates, shortTermObjective);
    secondSelection = selectAdjacentPairCandidate(candidates, shortTermObjective);
  }

  const firstCategoryKey = firstSelection.selected[0];
  const secondCategoryKey = secondSelection.selected[0];
  const action = getAction(firstCategoryKey);
  const decisionPath = isHardOverride
    ? "HardOverride"
    : firstSelection.isObjectiveTieBreak || secondSelection.isObjectiveTieBreak
      ? "ObjectiveTieBreak"
      : stageSuppressesWealthFuel
        ? "StageSuppression"
        : flagContextNote
          ? "FlagContext"
          : "NormalRanking";

  return toPlanResult({
    strongSignal,
    decisionPath,
    warningLights: [toWarningLight(firstCategoryKey), toWarningLight(secondCategoryKey)],
    fallback: null,
    flagContextNote,
    action,
  });
};

const assertPrimitive = (value, field) => {
  if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) {
    throw new TypeError(`${field} must be a finite primitive value.`);
  }
};

const assertFiniteScore = (score) => {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("score must be a finite number from 0 through 100.");
  }
};

export const createMailerLitePayload = ({ email, consentVersion, consentTimestamp, planSummary }) => {
  const {
    score,
    stage,
    strongSignalCategory,
    warningLight1Category,
    warningLight2Category,
    actionId,
    workbookTab,
    workbookAction,
    doNow,
    thisPayday,
    thisMonth,
    thirtyDayMission,
  } = planSummary;

  assertPrimitive(email, "email");
  assertPrimitive(consentVersion, "consentVersion");
  assertPrimitive(consentTimestamp, "consentTimestamp");
  assertFiniteScore(score);
  [
    [stage, "stage"],
    [strongSignalCategory, "strongSignalCategory"],
    [warningLight1Category, "warningLight1Category"],
    [warningLight2Category, "warningLight2Category"],
    [actionId, "actionId"],
    [workbookTab, "workbookTab"],
    [workbookAction, "workbookAction"],
    [doNow, "doNow"],
    [thisPayday, "thisPayday"],
    [thisMonth, "thisMonth"],
    [thirtyDayMission, "thirtyDayMission"],
  ].forEach(([value, field]) => assertPrimitive(value, field));

  return {
    email,
    consentVersion,
    consentTimestamp,
    score,
    stage,
    strongSignalCategory,
    warningLight1Category,
    warningLight2Category,
    actionId,
    workbookTab,
    workbookAction,
    doNow,
    thisPayday,
    thisMonth,
    thirtyDayMission,
  };
};

export const createAnalyticsPayload = (
  eventName,
  { stage, strongSignalCategory, warningLight1Category, decisionPath },
) => {
  [
    [eventName, "eventName"],
    [stage, "stage"],
    [strongSignalCategory, "strongSignalCategory"],
    [warningLight1Category, "warningLight1Category"],
    [decisionPath, "decisionPath"],
  ].forEach(([value, field]) => assertPrimitive(value, field));

  return {
    eventName,
    parameters: { stage, strongSignalCategory, warningLight1Category, decisionPath },
  };
};

const calibrationRelativeScoreKeys = Object.freeze([
  "cashFlowControl",
  "savingsSystem",
  "debtLoad",
  "emergencyRunway",
  "wealthFuel",
]);

const toCalibrationRelativeScores = (relativeScores) => {
  const values = calibrationRelativeScoreKeys.map((key) => relativeScores[key]);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new RangeError("relativeScores must contain five finite values from 0 through 1.");
  }

  const [cashFlowControl, savingsSystem, debtLoad, emergencyRunway, wealthFuel] = values;
  return { cashFlowControl, savingsSystem, debtLoad, emergencyRunway, wealthFuel };
};

export const createCalibrationRecord = ({
  score,
  stage,
  strongSignalCategory,
  strongSignalTieBreak,
  warningLight1Category,
  warningLight2Category,
  relativeScores,
  decisionPath,
  actionId,
  workbookTab,
  workbookAction,
  testId,
}) => {
  assertFiniteScore(score);
  [
    [stage, "stage"],
    [strongSignalCategory, "strongSignalCategory"],
    [strongSignalTieBreak, "strongSignalTieBreak"],
    [warningLight1Category, "warningLight1Category"],
    [warningLight2Category, "warningLight2Category"],
    [decisionPath, "decisionPath"],
    [actionId, "actionId"],
    [workbookTab, "workbookTab"],
    [workbookAction, "workbookAction"],
    [testId, "testId"],
  ].forEach(([value, field]) => assertPrimitive(value, field));

  return {
    score,
    stage,
    strongSignalCategory,
    strongSignalTieBreak,
    warningLight1Category,
    warningLight2Category,
    relativeScores: toCalibrationRelativeScores(relativeScores),
    decisionPath,
    actionId,
    workbookTab,
    workbookAction,
    testId,
  };
};
