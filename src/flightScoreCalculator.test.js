import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFlightScore,
  categoryMaximums,
  getRelativeCategoryScores,
  getPriorityAlerts,
  getStage,
} from "./flightScoreCalculator.js";

const stableStageMetrics = {
  cashRemaining: 100,
  emergencyFundLevel: 0.25,
  savingsRate: 0.05,
};

test("preserves scorecard stage boundaries", () => {
  assert.equal(getStage({ score: 39, ...stableStageMetrics }).key, "preflight");
  assert.equal(getStage({ score: 40, ...stableStageMetrics }).key, "turbulence");
  assert.equal(getStage({ score: 69, ...stableStageMetrics }).key, "turbulence");
  assert.equal(getStage({ score: 70, ...stableStageMetrics }).key, "cruise");
  assert.equal(getStage({ score: 89, ...stableStageMetrics }).key, "cruise");
  assert.equal(getStage({ score: 90, ...stableStageMetrics }).key, "flight");
});

test("preserves representative existing Scorecard results", () => {
  const fixtures = [
    {
      name: "Maya",
      values: {
        income: 3000, needs: 2200, wants: 650, savings: 150, extraDebtPayment: 0,
        totalDebtBalance: 14000, emergencyFundSaved: 500, emergencyFundGoal: 2000,
        investmentsCurrentValue: 0,
      },
      score: 35,
      stage: "preflight",
      strongestSignal: "Emergency Runway",
      warningLight: "Investment Status",
    },
    {
      name: "Jordan",
      values: {
        income: 4200, needs: 3200, wants: 1200, savings: 0, extraDebtPayment: 100,
        totalDebtBalance: 6000, emergencyFundSaved: 200, emergencyFundGoal: 2000,
        investmentsCurrentValue: 0,
      },
      score: 25,
      stage: "preflight",
      strongestSignal: "Debt Load",
      warningLight: "Cash Remaining",
    },
    {
      name: "Priya",
      values: {
        income: 6000, needs: 2800, wants: 1200, savings: 600, extraDebtPayment: 200,
        totalDebtBalance: 9000, emergencyFundSaved: 6000, emergencyFundGoal: 9000,
        investmentsCurrentValue: 8000,
      },
      score: 82,
      stage: "cruise",
      strongestSignal: "Cash Remaining",
      warningLight: "Savings Rate",
    },
    {
      name: "Alex",
      values: {
        income: 8000, needs: 2600, wants: 1000, savings: 1600, extraDebtPayment: 0,
        totalDebtBalance: 0, emergencyFundSaved: 15000, emergencyFundGoal: 15000,
        investmentsCurrentValue: 40000,
      },
      score: 100,
      stage: "flight",
      strongestSignal: "Cash Remaining",
      warningLight: "Optimization Capacity",
    },
  ];

  for (const fixture of fixtures) {
    const result = calculateFlightScore(fixture.values);
    assert.equal(result.score, fixture.score, fixture.name);
    assert.equal(result.stage.key, fixture.stage, fixture.name);
    assert.equal(result.briefing.strongestSignal, fixture.strongestSignal, fixture.name);
    assert.equal(result.briefing.warningLight, fixture.warningLight, fixture.name);
  }
});

test("preserves existing Strong Signal stable tie order", () => {
  const result = calculateFlightScore({
    income: 8000,
    needs: 2600,
    wants: 1000,
    savings: 1600,
    extraDebtPayment: 0,
    totalDebtBalance: 0,
    emergencyFundSaved: 15000,
    emergencyFundGoal: 15000,
    investmentsCurrentValue: 40000,
  });

  assert.equal(result.briefing.strongestSignal, "Cash Remaining");
});

test("returns calculator-authoritative relative category scores", () => {
  const relativeScores = getRelativeCategoryScores({
    cashRemaining: 10,
    savingsRate: 25,
    debtPressure: 15,
    emergencyFund: 5,
    investments: 8,
  });

  assert.deepEqual(relativeScores, [
    ["cashRemaining", 0.4],
    ["savingsRate", 1],
    ["debtPressure", 0.75],
    ["emergencyFund", 0.25],
    ["investments", 0.8],
  ]);
});

test("does not expose mutable shared category configuration", () => {
  assert.equal(Object.isFrozen(categoryMaximums), true);
  assert.throws(() => {
    categoryMaximums.cashRemaining = 999;
  }, TypeError);
  assert.equal(categoryMaximums.cashRemaining, 25);

  const categoryScores = {
    cashRemaining: 10,
    savingsRate: 25,
    debtPressure: 15,
    emergencyFund: 5,
    investments: 8,
  };
  const first = getRelativeCategoryScores(categoryScores);
  const second = getRelativeCategoryScores(categoryScores);

  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first[0]), true);
  assert.notStrictEqual(first, second);
  assert.throws(() => {
    first[0][1] = 999;
  }, TypeError);
  assert.deepEqual(getRelativeCategoryScores(categoryScores), first);
});

test("low scores always read as Pre Flight, never a harsher label", () => {
  for (const score of [0, 10, 25, 39]) {
    const stage = getStage({ score, cashRemaining: -500 });
    assert.equal(stage.key, "preflight", `score ${score}`);
    assert.equal(stage.name, "Pre Flight");
  }
});

test("weak savings or runway no longer change the stage", () => {
  assert.equal(getStage({ score: 35, cashRemaining: 200 }).key, "preflight");
  assert.equal(getStage({ score: 55, cashRemaining: 200 }).key, "turbulence");
  assert.equal(getStage({ score: 75, cashRemaining: 200 }).key, "cruise");
});

test("spending more than take home pay caps the stage at Turbulence", () => {
  assert.equal(getStage({ score: 75, cashRemaining: -1 }).key, "turbulence");
  assert.equal(getStage({ score: 95, cashRemaining: -1 }).key, "turbulence");
  assert.equal(getStage({ score: 45, cashRemaining: -1 }).key, "turbulence");
});

test("priority alerts flag savings, runway, and cash flow without relabeling the stage", () => {
  const alerts = getPriorityAlerts({ cashRemaining: -300, savingsRate: 0, emergencyFundLevel: 0.1 });
  assert.deepEqual(alerts.map((a) => a.key), ["cashFlow", "savingsRate", "emergencyFund"]);
  assert.equal(Object.isFrozen(alerts), true);
  assert.deepEqual(getPriorityAlerts({ cashRemaining: 100, savingsRate: 0.05, emergencyFundLevel: 0.25 }), []);
});

test("calculateFlightScore exposes the first priority alert in the briefing", () => {
  const jordan = calculateFlightScore({
    income: 4200, needs: 3200, wants: 1200, savings: 0, extraDebtPayment: 100,
    totalDebtBalance: 6000, emergencyFundSaved: 200, emergencyFundGoal: 2000,
    investmentsCurrentValue: 0,
  });
  assert.equal(jordan.stage.key, "preflight");
  assert.equal(jordan.briefing.priorityAlert.key, "cashFlow");
  assert.equal(jordan.briefing.priorityAlerts.length, 3);

  const lowSaver = calculateFlightScore({
    income: 5000, needs: 3000, wants: 1500, savings: 100, extraDebtPayment: 0,
    totalDebtBalance: 0, emergencyFundSaved: 2000, emergencyFundGoal: 6000,
    investmentsCurrentValue: 0,
  });
  assert.equal(lowSaver.briefing.priorityAlert.key, "savingsRate");
});

test("publishable alert copy contains no dash characters", () => {
  const alerts = getPriorityAlerts({ cashRemaining: -1, savingsRate: 0, emergencyFundLevel: 0 });
  for (const alert of alerts) {
    assert.equal(/[-\u2013\u2014]/.test(alert.message + alert.label), false, alert.key);
  }
});
