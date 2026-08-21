import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateFlightScore,
  categoryMaximums,
  getRelativeCategoryScores,
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
      stage: "turbulence",
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
