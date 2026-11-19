import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFlightScore } from './flightScoreCalculator.js';
import { buildFlightReport } from './flightReport.js';
import { actionLibrary } from './personalizedFlightPlan.js';
import {
  buildFlightPlanFormBody, submitFlightPlanEmail, FLIGHT_PLAN_ENDPOINT, FLIGHT_PLAN_CONSENT_VERSION,
} from './flightPlanEmail.js';

const base = { income: 6000, needs: 3400, wants: 1200, savings: 500, extraDebtPayment: 250, totalDebtBalance: 18120, emergencyFundSaved: 4000, emergencyFundGoal: 8000, investmentsCurrentValue: 2500 };
const scenarios = {
  overBudget: { income: 3000, needs: 2900, wants: 600, savings: 100 },
  smallTransfer: { income: 5000, needs: 2500, wants: 1000, savings: 100, emergencyFundSaved: 300 },
  fullyAssigned: { income: 5000, needs: 3000, wants: 1500, savings: 250, extraDebtPayment: 250 },
  flightMode: { income: 9000, needs: 2600, wants: 900, savings: 2000, extraDebtPayment: 0, totalDebtBalance: 0, emergencyFundSaved: 30000, emergencyFundGoal: 15000, investmentsCurrentValue: 90000 },
  base: {},
};
const reportFor = changes => buildFlightReport(calculateFlightScore({ ...base, ...changes }), { flightDate: '2026-11-17', immediatePressure: 'Stable', shortTermObjective: '' });
const allowedKeys = ['fields[email]', 'fields[flight_plan_consent_version]', 'fields[flight_plan_consent_timestamp]', 'fields[flight_plan_score]',
  'fields[flight_plan_stage]', 'fields[flight_plan_strong_signal]', 'fields[flight_plan_warning_light_1]', 'fields[flight_plan_warning_light_2]',
  'fields[flight_plan_action_id]', 'fields[flight_plan_workbook_tab]', 'fields[flight_plan_workbook_action]', 'fields[flight_plan_do_now]',
  'fields[flight_plan_this_payday]', 'fields[flight_plan_this_month]', 'fields[flight_plan_thirty_day_mission]', 'ml-submit', 'anticsrf'];
const libraryCopy = new Set(actionLibrary.flatMap(a => [a.doNow, a.thisPayday, a.thisMonth, a.thirtyDayMission, a.workbookTab, a.workbookAction].map(t => t.replace(/[-–—]/g, ' '))));

for (const [name, changes] of Object.entries(scenarios)) {
  test(`email body for ${name} sends only the allowlist and approved library copy`, () => {
    const report = reportFor(changes);
    const body = buildFlightPlanFormBody({ email: 'pilot@example.com', consentTimestamp: '2026-11-17T12:00:00.000Z', emailPlan: report.emailPlan });
    assert.deepEqual([...body.keys()], allowedKeys);
    assert.equal(body.get('fields[flight_plan_consent_version]'), FLIGHT_PLAN_CONSENT_VERSION);
    assert.equal(body.get('fields[flight_plan_score]'), String(report.score));
    for (const key of ['do_now', 'this_payday', 'this_month', 'thirty_day_mission', 'workbook_tab', 'workbook_action']) {
      assert.ok(libraryCopy.has(body.get(`fields[flight_plan_${key}]`)), `${key} must come from the action library`);
    }
    const sent = body.toString();
    assert.equal(/%24|\$/.test(sent), false, 'no currency symbol may be sent');
    for (const [field, amount] of Object.entries({ ...base, ...changes })) {
      if (amount >= 100) assert.equal(sent.includes(String(amount)), false, `${field} must never be sent`);
    }
  });
}

test('on screen moves with dollar amounts are never reused for email', () => {
  const report = reportFor(scenarios.overBudget);
  assert.match(report.oneMove.text, /\$/);
  assert.equal(report.emailPlan.doNow.includes('$'), false);
});

test('submit posts to the Personalized Flight Plan form and surfaces provider failures', async () => {
  const emailPlan = reportFor({}).emailPlan;
  let call;
  await submitFlightPlanEmail({ email: 'pilot@example.com', emailPlan, fetchImpl: async (url, init) => { call = { url, init }; return { json: async () => ({ success: true }) }; } });
  assert.equal(call.url, FLIGHT_PLAN_ENDPOINT);
  assert.equal(call.init.method, 'POST');
  await assert.rejects(submitFlightPlanEmail({ email: 'pilot@example.com', emailPlan, fetchImpl: async () => ({ json: async () => ({ success: false }) }) }), /provider_error/);
});

test('a financial amount slipped into plan copy is rejected before sending', () => {
  const emailPlan = { ...reportFor({}).emailPlan, doNow: 'Move $250 to savings.' };
  assert.throws(() => buildFlightPlanFormBody({ email: 'pilot@example.com', consentTimestamp: '2026-11-17T12:00:00.000Z', emailPlan }), /financial amount/);
});
