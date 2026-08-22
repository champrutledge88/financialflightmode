import assert from "node:assert/strict";
import test from "node:test";

import {
  actionLibrary,
  categoryMap,
  createAnalyticsPayload,
  createCalibrationRecord,
  createMailerLitePayload,
  educationGuardrail,
  generatePersonalizedFlightPlan,
} from "./personalizedFlightPlan.js";
import { calculateFlightScore, getRelativeCategoryScores } from "./flightScoreCalculator.js";

const personaValues = {
  Maya: {
    income: 3000, needs: 2200, wants: 650, savings: 150, extraDebtPayment: 0,
    totalDebtBalance: 14000, emergencyFundSaved: 500, emergencyFundGoal: 2000,
    investmentsCurrentValue: 0,
  },
  Jordan: {
    income: 4200, needs: 3200, wants: 1200, savings: 0, extraDebtPayment: 100,
    totalDebtBalance: 6000, emergencyFundSaved: 200, emergencyFundGoal: 2000,
    investmentsCurrentValue: 0,
  },
  Priya: {
    income: 6000, needs: 2800, wants: 1200, savings: 600, extraDebtPayment: 200,
    totalDebtBalance: 9000, emergencyFundSaved: 6000, emergencyFundGoal: 9000,
    investmentsCurrentValue: 8000,
  },
  Alex: {
    income: 8000, needs: 2600, wants: 1000, savings: 1600, extraDebtPayment: 0,
    totalDebtBalance: 0, emergencyFundSaved: 15000, emergencyFundGoal: 15000,
    investmentsCurrentValue: 40000,
  },
};

const derivedContextFromValues = (values) => {
  const result = calculateFlightScore(values);
  return {
    score: result.score,
    stageKey: result.stage.key,
    stageName: result.stage.name,
    relativeScores: getRelativeCategoryScores(result.categoryScores),
    pressureMetrics: {
      cashRemaining: result.metrics.cashRemaining,
      savingsRate: result.metrics.savingsRate,
      emergencyFundLevel: result.metrics.emergencyFundLevel,
    },
  };
};

const syntheticContext = ({
  stageKey = "flight",
  relativeScores = [
    ["cashRemaining", 1],
    ["savingsRate", 1],
    ["debtPressure", 1],
    ["emergencyFund", 1],
    ["investments", 1],
  ],
  pressureMetrics = { cashRemaining: 100, savingsRate: 0.1, emergencyFundLevel: 1 },
} = {}) => ({
  score: 80,
  stageKey,
  stageName: "Synthetic",
  relativeScores,
  pressureMetrics,
});

const warningCategories = (plan) => plan.warningLights?.map((warningLight) => warningLight.category);

const standardPlanSummary = {
  score: 82,
  stage: "Cruise Control",
  strongSignalCategory: "Cash Flow Control",
  warningLight1Category: "Savings System",
  warningLight2Category: "Emergency Runway",
  actionId: "savingsSystem",
  workbookTab: "Savings Tracker + Monthly Budget",
  workbookAction: "Savings System row",
  doNow: "Set up or confirm one automatic transfer from checking to savings for your next payday.",
  thisPayday: "Let that automatic transfer run without touching it.",
  thisMonth: "Keep the transfer running every payday this month, even if the amount is small.",
  thirtyDayMission: "Complete four consecutive automatic transfers to savings without skipping one.",
};

const calibrationInput = {
  score: 82,
  stage: "Cruise Control",
  strongSignalCategory: "Cash Flow Control",
  strongSignalTieBreak: false,
  warningLight1Category: "Savings System",
  warningLight2Category: "Emergency Runway",
  relativeScores: {
    cashFlowControl: 1,
    savingsSystem: 0.72,
    debtLoad: 0.75,
    emergencyRunway: 0.75,
    wealthFuel: 0.8,
  },
  decisionPath: "ObjectiveTieBreak",
  actionId: "savingsSystem",
  workbookTab: "Savings Tracker + Monthly Budget",
  workbookAction: "Savings System row",
  testId: "W1-PRIYA",
};

const assertPrimitive = (value) => {
  assert.ok(["string", "number", "boolean"].includes(typeof value));
  if (typeof value === "number") assert.equal(Number.isFinite(value), true);
};

test("reproduces SPEC Persona 1 Maya: Strong Signal, Hard Override, and ordered Warning Lights", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: derivedContextFromValues(personaValues.Maya),
    immediatePressure: "Stable",
    shortTermObjective: "",
  });

  assert.deepEqual(plan.strongSignal, {
    category: "Emergency Runway",
    actionId: "emergencyRunway",
    isTieBreak: false,
  });
  assert.equal(plan.decisionPath, "HardOverride");
  assert.deepEqual(warningCategories(plan), ["Cash Flow Control", "Debt Load"]);
  assert.equal(plan.doNow, actionLibrary[0].doNow);
  assert.deepEqual(plan.workbookConnection, {
    tab: "Monthly Budget + Dashboard",
    action: "Cash Flow Control row",
  });
});

test("reproduces SPEC Persona 2 Jordan: Strong Signal, forced cash Warning Light, and deterministic #2", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: derivedContextFromValues(personaValues.Jordan),
    immediatePressure: "Falling behind on a payment",
    shortTermObjective: "Get out of debt",
  });

  assert.deepEqual(plan.strongSignal, {
    category: "Debt Load",
    actionId: "debtLoad",
    isTieBreak: false,
  });
  assert.equal(plan.decisionPath, "HardOverride");
  assert.deepEqual(warningCategories(plan), ["Cash Flow Control", "Savings System"]);
  assert.equal(plan.thisPayday, actionLibrary[0].thisPayday);
});

test("reproduces SPEC Persona 3 Priya: objective breaks the close tie without changing Strong Signal", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: derivedContextFromValues(personaValues.Priya),
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  });

  assert.deepEqual(plan.strongSignal, {
    category: "Cash Flow Control",
    actionId: "cashFlowControl",
    isTieBreak: false,
  });
  assert.equal(plan.decisionPath, "ObjectiveTieBreak");
  assert.deepEqual(warningCategories(plan), ["Savings System", "Emergency Runway"]);
  assert.equal(plan.thirtyDayMission, actionLibrary[1].thirtyDayMission);
});

test("reproduces SPEC Persona 4 Alex: all-tied Strong Signal with Flag Context subordinate to fallback", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: derivedContextFromValues(personaValues.Alex),
    immediatePressure: "Unexpected bill",
    shortTermObjective: "",
  });

  assert.deepEqual(plan.strongSignal, {
    category: "Cash Flow Control",
    actionId: "cashFlowControl",
    isTieBreak: true,
  });
  assert.equal(plan.decisionPath, "Fallback");
  assert.equal(plan.warningLights, null);
  assert.deepEqual(plan.fallback, {
    actionId: "ownershipMindsetFallback",
    note: "You flagged an unexpected bill — your reserves look strong enough to absorb it. If this reflects a bigger recent change, retake this with updated numbers.",
  });
  assert.deepEqual(plan.workbookConnection, {
    tab: "Dashboard + Month-End Reset",
    action: "Ownership Mindset review",
  });
});

test("SPEC AC5: exactly-zero and negative cash always force Cash Flow Control first", () => {
  for (const name of ["Maya", "Jordan"]) {
    const plan = generatePersonalizedFlightPlan({
      derivedContext: derivedContextFromValues(personaValues[name]),
      immediatePressure: "Stable",
      shortTermObjective: "",
    });
    assert.equal(plan.decisionPath, "HardOverride", name);
    assert.equal(plan.warningLights[0].category, "Cash Flow Control", name);
  }
});

test("Hard Override takes precedence over a future fallback collision", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 1],
        ["savingsRate", 1],
        ["debtPressure", 1],
        ["emergencyFund", 1],
        ["investments", 1],
      ],
      pressureMetrics: { cashRemaining: 0, savingsRate: 0.1, emergencyFundLevel: 1 },
    }),
    immediatePressure: "Stable",
    shortTermObjective: "",
  });

  assert.equal(plan.decisionPath, "HardOverride");
  assert.notEqual(plan.warningLights, null);
  assert.equal(plan.warningLights[0].category, "Cash Flow Control");
});

test("Hard Override Warning Light #2 is the single mathematically weakest category and ignores the optional objective", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.9],
        ["savingsRate", 0.2],
        ["debtPressure", 0.3],
        ["emergencyFund", 0.25],
        ["investments", 0.4],
      ],
      pressureMetrics: { cashRemaining: 0, savingsRate: 0.1, emergencyFundLevel: 1 },
    }),
    immediatePressure: "Stable",
    shortTermObjective: "Build a cushion",
  });

  assert.deepEqual(warningCategories(plan), ["Cash Flow Control", "Savings System"]);
});

test("Hard Override uses the Warning Light safety order only for an exact weakest-score tie", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.9],
        ["savingsRate", 0.2],
        ["debtPressure", 0.2],
        ["emergencyFund", 0.5],
        ["investments", 0.4],
      ],
      pressureMetrics: { cashRemaining: 0, savingsRate: 0.1, emergencyFundLevel: 1 },
    }),
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  });

  assert.deepEqual(warningCategories(plan), ["Cash Flow Control", "Debt Load"]);
});

test("SPEC AC6: uncorroborated pressure adds context without changing Warning Lights", () => {
  const derivedContext = syntheticContext({
    relativeScores: [
      ["cashRemaining", 0.3],
      ["savingsRate", 0.6],
      ["debtPressure", 0.9],
      ["emergencyFund", 0.5],
      ["investments", 0.8],
    ],
    pressureMetrics: { cashRemaining: 100, savingsRate: 0.05, emergencyFundLevel: 0.25 },
  });
  const stablePlan = generatePersonalizedFlightPlan({ derivedContext, immediatePressure: "Stable" });
  const flaggedPlan = generatePersonalizedFlightPlan({
    derivedContext,
    immediatePressure: "Income disruption",
  });

  assert.equal(flaggedPlan.decisionPath, "FlagContext");
  assert.notEqual(flaggedPlan.flagContextNote, null);
  assert.deepEqual(warningCategories(flaggedPlan), warningCategories(stablePlan));
});

test("corroborated non-Stable pressure forces Cash Flow Control before ordinary ranking", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.9],
        ["savingsRate", 0.2],
        ["debtPressure", 0.7],
        ["emergencyFund", 0.4],
        ["investments", 0.6],
      ],
      pressureMetrics: { cashRemaining: 100, savingsRate: 0.04, emergencyFundLevel: 0.5 },
    }),
    immediatePressure: "Income disruption",
    shortTermObjective: "Save more consistently",
  });

  assert.equal(plan.decisionPath, "HardOverride");
  assert.deepEqual(warningCategories(plan), ["Cash Flow Control", "Savings System"]);
});

test("SPEC AC7: the exact 0.10 adjacent gap honors the matching objective", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.2],
        ["savingsRate", 0.3],
        ["debtPressure", 0.8],
        ["emergencyFund", 0.9],
        ["investments", 0.7],
      ],
    }),
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  });

  assert.equal(plan.decisionPath, "ObjectiveTieBreak");
  assert.deepEqual(warningCategories(plan), ["Savings System", "Cash Flow Control"]);
});

test("Warning Light #2 re-runs the exact adjacent-pair procedure after #1 is removed", () => {
  const base = syntheticContext({
    relativeScores: [
      ["cashRemaining", 0.9],
      ["savingsRate", 0.38],
      ["debtPressure", 0.44],
      ["emergencyFund", 0.72],
      ["investments", 0.8],
    ],
  });
  const plan = generatePersonalizedFlightPlan({
    derivedContext: base,
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  });

  assert.deepEqual(warningCategories(plan), ["Savings System", "Debt Load"]);
  assert.notEqual(plan.warningLights[0].category, plan.warningLights[1].category);
});

test("SPEC AC7: an omitted or unrelated objective uses the fixed Warning Light safety order", () => {
  const derivedContext = syntheticContext({
    relativeScores: [
      ["cashRemaining", 0.7],
      ["savingsRate", 0.38],
      ["debtPressure", 0.44],
      ["emergencyFund", 0.72],
      ["investments", 0.8],
    ],
  });
  const omitted = generatePersonalizedFlightPlan({ derivedContext, immediatePressure: "Stable" });
  const unrelated = generatePersonalizedFlightPlan({
    derivedContext,
    immediatePressure: "Stable",
    shortTermObjective: "Start investing",
  });

  assert.deepEqual(warningCategories(omitted), ["Debt Load", "Savings System"]);
  assert.deepEqual(warningCategories(unrelated), warningCategories(omitted));
});

test("SPEC AC7: a gap above 0.10 selects the single weakest candidate without objective input", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.2],
        ["savingsRate", 0.5],
        ["debtPressure", 0.8],
        ["emergencyFund", 0.9],
        ["investments", 0.7],
      ],
    }),
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  });

  assert.equal(plan.decisionPath, "NormalRanking");
  assert.equal(plan.warningLights[0].category, "Cash Flow Control");
});

test("SPEC AC8: Pre-Flight and Turbulence suppress Wealth Fuel from both Warning Light slots", () => {
  for (const stageKey of ["preflight", "turbulence"]) {
    const plan = generatePersonalizedFlightPlan({
      derivedContext: syntheticContext({
        stageKey,
        relativeScores: [
          ["cashRemaining", 0.3],
          ["savingsRate", 0.4],
          ["debtPressure", 0.2],
          ["emergencyFund", 0.5],
          ["investments", 0],
        ],
      }),
      immediatePressure: "Stable",
    });

    assert.equal(plan.decisionPath, "StageSuppression", stageKey);
    assert.equal(warningCategories(plan).includes("Wealth Fuel"), false, stageKey);
  }
});

test("Cruise Control and Flight Mode retain Wealth Fuel eligibility", () => {
  for (const stageKey of ["cruise", "flight"]) {
    const plan = generatePersonalizedFlightPlan({
      derivedContext: syntheticContext({
        stageKey,
        relativeScores: [
          ["cashRemaining", 0.5],
          ["savingsRate", 0.6],
          ["debtPressure", 0.7],
          ["emergencyFund", 0.8],
          ["investments", 0],
        ],
      }),
      immediatePressure: "Stable",
    });

    assert.equal(plan.warningLights[0].category, "Wealth Fuel", stageKey);
  }
});

test("SPEC AC9 and AC11: Strong Signal is always present and uses the stable calculator tie order", () => {
  const lowTopPlan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.2],
        ["savingsRate", 0.1],
        ["debtPressure", 0.15],
        ["emergencyFund", 0.3],
        ["investments", 0],
      ],
    }),
    immediatePressure: "Stable",
  });
  const twoWayTiePlan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.8],
        ["savingsRate", 0.8],
        ["debtPressure", 0.5],
        ["emergencyFund", 0.6],
        ["investments", 0.7],
      ],
    }),
    immediatePressure: "Stable",
  });

  assert.deepEqual(lowTopPlan.strongSignal, {
    category: "Emergency Runway",
    actionId: "emergencyRunway",
    isTieBreak: false,
  });
  assert.deepEqual(twoWayTiePlan.strongSignal, {
    category: "Cash Flow Control",
    actionId: "cashFlowControl",
    isTieBreak: true,
  });
});

test("Strong Signal remains independent when it collides with a Warning Light", () => {
  const plan = generatePersonalizedFlightPlan({
    derivedContext: syntheticContext({
      relativeScores: [
        ["cashRemaining", 0.4],
        ["savingsRate", 0.4],
        ["debtPressure", 0.4],
        ["emergencyFund", 0.4],
        ["investments", 0.4],
      ],
    }),
    immediatePressure: "Stable",
  });

  assert.equal(plan.strongSignal.category, "Cash Flow Control");
  assert.equal(plan.warningLights[0].category, "Cash Flow Control");
});

test("SPEC AC10: every non-fallback plan has two distinct Warning Lights and fallback has none", () => {
  const plans = [
    generatePersonalizedFlightPlan({
      derivedContext: derivedContextFromValues(personaValues.Maya),
      immediatePressure: "Stable",
    }),
    generatePersonalizedFlightPlan({
      derivedContext: derivedContextFromValues(personaValues.Priya),
      immediatePressure: "Stable",
    }),
  ];

  for (const plan of plans) {
    assert.equal(plan.warningLights.length, 2);
    assert.notEqual(plan.warningLights[0].category, plan.warningLights[1].category);
  }

  const fallbackPlan = generatePersonalizedFlightPlan({
    derivedContext: derivedContextFromValues(personaValues.Alex),
    immediatePressure: "Stable",
  });
  assert.equal(fallbackPlan.warningLights, null);
  assert.equal(fallbackPlan.fallback.actionId, "ownershipMindsetFallback");
});

test("SPEC AC12 and AC14: the six immutable action entries have exact workbook routes and safe fixed copy", () => {
  const expectedRoutes = [
    ["cashFlowControl", "Monthly Budget + Dashboard", "Cash Flow Control row"],
    ["savingsSystem", "Savings Tracker + Monthly Budget", "Savings System row"],
    ["debtLoad", "Debt Snowball + Monthly Budget", "Debt Load row"],
    ["emergencyRunway", "Savings Tracker + Dashboard", "Emergency Runway row"],
    ["wealthFuel", "Investment Tracker + Savings Rate", "Wealth Fuel row"],
    ["ownershipMindsetFallback", "Dashboard + Month-End Reset", "Ownership Mindset review"],
  ];

  assert.equal(actionLibrary.length, 6);
  assert.equal(Object.isFrozen(actionLibrary), true);
  assert.deepEqual(
    actionLibrary.map(({ actionId, workbookTab, workbookAction }) => [actionId, workbookTab, workbookAction]),
    expectedRoutes,
  );
  for (const entry of actionLibrary) {
    assert.equal(Object.isFrozen(entry), true);
    assert.equal(entry.emailSafe, true);
    for (const field of ["doNow", "thisPayday", "thisMonth", "thirtyDayMission"]) {
      assert.equal(typeof entry[field], "string");
      assert.notEqual(entry[field], "");
    }
  }
  assert.equal(
    educationGuardrail,
    "Never recommend a security, lender, credit product, debt settlement provider, tax position, or legal action.",
  );
});

test("category map is exact and immutable", () => {
  assert.deepEqual(categoryMap, {
    cashRemaining: "Cash Flow Control",
    savingsRate: "Savings System",
    debtPressure: "Debt Load",
    emergencyFund: "Emergency Runway",
    investments: "Wealth Fuel",
  });
  assert.equal(Object.isFrozen(categoryMap), true);
  assert.throws(() => {
    categoryMap.cashRemaining = "Changed";
  }, TypeError);
});

test("MailerLite serializer fuzz test has the exact approved flat allowlist", () => {
  const planSummary = Object.assign(Object.create({ rawIncome: "INHERITED_RAW" }), standardPlanSummary, {
    income: "FORBIDDEN_INCOME",
    formValues: { income: "FORBIDDEN_NESTED" },
    _income: "FORBIDDEN_ALIAS",
  });
  Object.defineProperty(planSummary, "__proto__", { value: "FORBIDDEN_PROTO", enumerable: true });
  const input = Object.assign(Object.create({ needs: "INHERITED_NEEDS" }), {
    email: "pilot@example.com",
    consentVersion: "v1",
    consentTimestamp: "2026-08-21T00:00:00.000Z",
    planSummary,
    immediatePressure: "FORBIDDEN_PRESSURE",
    shortTermObjective: "FORBIDDEN_OBJECTIVE",
  });
  const payload = createMailerLitePayload(input);

  assert.deepEqual(Object.keys(payload), [
    "email", "consentVersion", "consentTimestamp", "score", "stage", "strongSignalCategory",
    "warningLight1Category", "warningLight2Category", "actionId", "workbookTab", "workbookAction",
    "doNow", "thisPayday", "thisMonth", "thirtyDayMission",
  ]);
  assert.equal(Object.getPrototypeOf(payload), Object.prototype);
  assert.equal(Object.hasOwn(payload, "__proto__"), false);
  Object.values(payload).forEach(assertPrimitive);
  assert.equal(JSON.stringify(payload).includes("FORBIDDEN"), false);
});

test("MailerLite serializer rejects nested approved fields rather than returning nested output", () => {
  assert.throws(
    () =>
      createMailerLitePayload({
        email: "pilot@example.com",
        consentVersion: "v1",
        consentTimestamp: "2026-08-21T00:00:00.000Z",
        planSummary: { ...standardPlanSummary, doNow: { rawIncome: "hidden" } },
      }),
    TypeError,
  );
});

test("Analytics serializer fuzz test has the exact categorical allowlist and documented nested shape", () => {
  const categoricalParams = Object.assign(Object.create({ email: "INHERITED_EMAIL" }), {
    stage: "Cruise Control",
    strongSignalCategory: "Cash Flow Control",
    warningLight1Category: "Savings System",
    decisionPath: "ObjectiveTieBreak",
    rawIncome: "FORBIDDEN_INCOME",
    formValues: { income: "FORBIDDEN_NESTED" },
  });
  Object.defineProperty(categoricalParams, "__proto__", { value: "FORBIDDEN_PROTO", enumerable: true });
  const payload = createAnalyticsPayload("personalized_plan_view", categoricalParams);

  assert.deepEqual(Object.keys(payload), ["eventName", "parameters"]);
  assert.deepEqual(Object.keys(payload.parameters), [
    "stage", "strongSignalCategory", "warningLight1Category", "decisionPath",
  ]);
  assert.equal(Object.getPrototypeOf(payload), Object.prototype);
  assert.equal(Object.getPrototypeOf(payload.parameters), Object.prototype);
  assert.equal(Object.hasOwn(payload.parameters, "__proto__"), false);
  assertPrimitive(payload.eventName);
  Object.values(payload.parameters).forEach(assertPrimitive);
  assert.equal(JSON.stringify(payload).includes("FORBIDDEN"), false);
});

test("Analytics serializer rejects nested categorical fields", () => {
  assert.throws(
    () =>
      createAnalyticsPayload("personalized_plan_view", {
        stage: "Cruise Control",
        strongSignalCategory: { hidden: "raw" },
        warningLight1Category: "Savings System",
        decisionPath: "NormalRanking",
      }),
    TypeError,
  );
});

test("SPEC AC19: calibration serializer fuzz test has only the MAY-contain fields and normalized public scores", () => {
  const relativeScores = Object.assign(Object.create({ cashRemaining: 999999 }), calibrationInput.relativeScores, {
    rawIncome: 999999,
    sixthScore: 0.5,
  });
  Object.defineProperty(relativeScores, "__proto__", { value: "FORBIDDEN_PROTO", enumerable: true });
  const input = Object.assign(Object.create({ wants: 999999 }), calibrationInput, {
    relativeScores,
    income: 999999,
    formValues: { income: 999999 },
    _income: 999999,
  });
  const record = createCalibrationRecord(input);

  assert.deepEqual(Object.keys(record), [
    "score", "stage", "strongSignalCategory", "strongSignalTieBreak", "warningLight1Category",
    "warningLight2Category", "relativeScores", "decisionPath", "actionId", "workbookTab",
    "workbookAction", "testId",
  ]);
  assert.deepEqual(Object.keys(record.relativeScores), [
    "cashFlowControl", "savingsSystem", "debtLoad", "emergencyRunway", "wealthFuel",
  ]);
  assert.equal(Object.getPrototypeOf(record), Object.prototype);
  assert.equal(Object.getPrototypeOf(record.relativeScores), Object.prototype);
  assert.equal(Object.hasOwn(record.relativeScores, "__proto__"), false);
  Object.entries(record)
    .filter(([key]) => key !== "relativeScores")
    .forEach(([, value]) => assertPrimitive(value));
  Object.values(record.relativeScores).forEach((value) => {
    assert.equal(Number.isFinite(value), true);
    assert.ok(value >= 0);
    assert.ok(value <= 1);
  });
  assert.equal(JSON.stringify(record).includes("999999"), false);
});

test("SPEC AC19: calibration serializer rejects missing, non-finite, and out-of-range normalized scores", () => {
  const invalidRelativeScores = [
    { ...calibrationInput.relativeScores, wealthFuel: undefined },
    { ...calibrationInput.relativeScores, debtLoad: Number.NaN },
    { ...calibrationInput.relativeScores, emergencyRunway: Infinity },
    { ...calibrationInput.relativeScores, savingsSystem: -0.01 },
    { ...calibrationInput.relativeScores, cashFlowControl: 1.01 },
  ];

  for (const relativeScores of invalidRelativeScores) {
    assert.throws(() => createCalibrationRecord({ ...calibrationInput, relativeScores }), RangeError);
  }
});

test("SPEC AC20 and AC21: engine and calibration serialization are pure with no mutable delivered-plan or pilot state", () => {
  const request = {
    derivedContext: derivedContextFromValues(personaValues.Priya),
    immediatePressure: "Stable",
    shortTermObjective: "Save more consistently",
  };
  const firstPlan = generatePersonalizedFlightPlan(request);
  const beforeRecord = structuredClone(firstPlan);
  const record = createCalibrationRecord(calibrationInput);
  const secondPlan = generatePersonalizedFlightPlan(request);

  assert.deepEqual(firstPlan, beforeRecord);
  assert.deepEqual(secondPlan, firstPlan);
  assert.equal(Object.hasOwn(record, "founderJudgment"), false);
  assert.equal(Object.hasOwn(record, "note"), false);
  assert.equal(Object.hasOwn(record, "batch"), false);
  assert.equal(Object.hasOwn(record, "checkpoint"), false);
});
