import test from "node:test";
import assert from "node:assert/strict";
import { calculateFlightScore } from "./flightScoreCalculator.js";
import { buildFlightPlanReport } from "./flightPlanReport.js";

test("builds a complete 90-day report from scorecard results", () => {
  const result = calculateFlightScore({
    income: 4000, needs: 2200, wants: 700, savings: 200, extraDebtPayment: 100,
    totalDebtBalance: 12000, emergencyFundSaved: 1500, emergencyFundGoal: 6000,
    investmentsCurrentValue: 500,
  });
  const report = buildFlightPlanReport(result);

  assert.match(report.title, /Flight Plan$/);
  assert.equal(report.priorities.length, 3);
  assert.equal(report.targets.length, 4);
  assert.deepEqual(report.missions.map((mission) => mission.timeframe), [
    "Days 1–30 · Stabilize", "Days 31–60 · Strengthen", "Days 61–90 · Build",
  ]);
});

test("never presents negative targets", () => {
  const result = calculateFlightScore({
    income: 2000, needs: 2500, wants: 500, savings: 0, extraDebtPayment: 0,
    totalDebtBalance: 0, emergencyFundSaved: 5000, emergencyFundGoal: 3000,
    investmentsCurrentValue: 0,
  });
  const report = buildFlightPlanReport(result);
  assert.ok(report.targets.every(({ value }) => !value.includes("-$")));
});
