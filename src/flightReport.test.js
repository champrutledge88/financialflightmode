import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFlightScore, categoryMaximums, STAGES } from './flightScoreCalculator.js';
import { buildFlightReport } from './flightReport.js';
const base = { income: 6000, needs: 3400, wants: 1200, savings: 500, extraDebtPayment: 250, totalDebtBalance: 18120, emergencyFundSaved: 4000, emergencyFundGoal: 8000, investmentsCurrentValue: 2500 };
const report = (changes = {}) => buildFlightReport(calculateFlightScore({ ...base, ...changes }), { flightDate: '2026-10-28' });

test('report reads authoritative scores and stages without mutating the result', () => {
  const result = calculateFlightScore(base), before = JSON.stringify(result);
  const r = buildFlightReport(result, { flightDate: new Date(2026, 9, 28) });
  assert.equal(r.score, result.score); assert.equal(r.stage.key, result.stage.key);
  assert.equal(JSON.stringify(result), before);
  assert.equal(r.flightDate, 'Oct 28, 2026'); assert.equal(r.nextCheckDate, 'Nov 27, 2026');
  assert.equal(r.oneMove.starterSection, result.briefing.starterSection);
});
test('instruments use ordered relative category ratings, words, tones, rounding and clamps', () => {
  for (const [relative, rating, word, tone] of [[0,1,'Warning','warning'],[.4,2,'Watch','warning'],[.5,3,'Steady','watch'],[.8,4,'Solid','good'],[1,5,'Strong','good'],[2,5,'Strong','good'],[-1,1,'Warning','warning']]) {
    const result = calculateFlightScore(base);
    result.categoryScores = Object.fromEntries(Object.entries(categoryMaximums).map(([key, max]) => [key, relative * max]));
    const r = buildFlightReport(result, { flightDate: '2026-10-28' });
    assert.deepEqual(r.instruments.map(i => i.label), ['Cash Flow','Savings Rate','Debt Load','Runway','Investing Fuel']);
    r.instruments.forEach(i => { assert.equal(i.rating,rating); assert.equal(i.word,word); assert.equal(i.tone,tone); });
  }
});
test('paycheck mix shows income shares and unassigned cash', () => {
  const r = report(); assert.equal(r.paycheckMix.overBy, 0); assert.equal(r.paycheckMix.unassigned, 650);
  assert.deepEqual(r.paycheckMix.shares.map(s => s.percent), [57,20,8,4,11]);
});
test('negative cash uses total outflow shares, omits unassigned, and rounds gap up', () => {
  const r = report({ income: 4200, needs: 3200, wants: 1201, savings: 0, extraDebtPayment: 100 });
  assert.equal(r.paycheckMix.overBy, 301); assert.equal(r.paycheckMix.shares.length, 4);
  assert.equal(r.paycheckMix.shares[0].percent, 71);
  assert.equal(r.checks[0].state,'no'); assert.equal(r.checks[0].answer,'Over');
  assert.equal(r.oneMove.text,'Find $325 to close the gap before your next payday.');
  assert.match(r.readouts[0].text,/Over by \$301/);
  assert.equal(r.warningLights[0], calculateFlightScore({ ...base, income: 4200, needs: 3200, wants: 1201 }).briefing.priorityAlerts[0].message);
});
test('check thresholds include savings, debt, runway, extra payments and investments', () => {
  for (const [rate,state,answer] of [[.1,'yes','Yes'],[.05,'partial','Almost'],[.049,'no','Not yet']]) {
    const c=report({savings:6000*rate}).checks[1]; assert.equal(c.state,state); assert.equal(c.answer,answer);
  }
  for (const [ratio,state,answer] of [[0,'yes','No debt'],[2,'yes','Yes'],[4,'partial','Close'],[4.01,'no','Not yet']]) {
    const c=report({totalDebtBalance:6000*ratio}).checks[2]; assert.equal(c.state,state); assert.equal(c.answer,answer);
  }
  for (const [months,state] of [[1,'yes'],[.5,'partial'],[.49,'no']]) assert.equal(report({ emergencyFundSaved:3400*months }).checks[3].state,state);
  assert.equal(report({totalDebtBalance:0,extraDebtPayment:0}).checks[4].answer,'No debt');
  assert.equal(report({extraDebtPayment:0}).checks[4].state,'no'); assert.equal(report().checks[4].state,'yes');
  assert.equal(report({investmentsCurrentValue:0}).checks[5].state,'no'); assert.equal(report().checks[5].answer,'Started');
  assert.equal(report({income:5350}).checks[0].state,'yes');
});
test('runway rounds months, keeps goal months, caps display at six, and handles zero needs', () => {
  for (const [months,zone] of [[.99,'Thin'],[1,'Building'],[2.99,'Building'],[3,'Cleared'],[12,'Cleared']]) {
    const r=report({emergencyFundSaved:3400*months}); assert.equal(r.runway.zone,zone); assert.equal(r.runway.scaleMonths,Math.min(6,months));
  }
  assert.equal(report().runway.monthsCovered,1.2); assert.equal(report().runway.goalMonths,8000/3400);
  assert.equal(report({needs:0,emergencyFundSaved:1}).checks[3].state,'yes');
  assert.equal(report({needs:0,emergencyFundSaved:0}).checks[3].state,'no');
  assert.equal(report({needs:0,emergencyFundSaved:1}).runway.monthsCovered,6);
  assert.equal(report({needs:0,emergencyFundSaved:0,emergencyFundGoal:0}).runway.goalMonths,0);
});
test('lights prioritize alerts, then no checks, then partial checks and cap at three', () => {
  const r=report(); assert.equal(r.greenLights.length,3); assert.equal(r.warningLights.length,2);
  assert.equal(r.warningLights[0],r.checks[1].sentence); assert.equal(r.warningLights[1],r.checks[2].sentence);
  const p=report({investmentsCurrentValue:0}); assert.equal(p.warningLights[0],p.checks[5].sentence);
  assert.equal(report({income:1,emergencyFundSaved:0,savings:0}).warningLights.length,3);
  assert.equal(report({totalDebtBalance:0,savings:1200,wants:1000,emergencyFundSaved:15000}).warningLights.length,0);
});
test('one move rounds available transfer down with minimum 25 and projected savings rate', () => {
  assert.equal(report().oneMove.text,'Move $100 of unassigned cash into savings on payday.');
  assert.equal(report().oneMove.followLine,'That lifts your savings rate to 10.0%.');
  const tiny = report({needs:4240, wants:1200, savings:300, extraDebtPayment:250});
  assert.match(tiny.oneMove.text,/\$25/);
  assert.match(report({needs:4279, wants:1200,savings:250,extraDebtPayment:250}).oneMove.text,/\$25/);
  assert.match(report({savings:0, needs:5700,wants:0,extraDebtPayment:0}).oneMove.text,/\$300/);
});
test('one move uses stage nextAction at 10 percent savings or zero cash', () => {
  assert.equal(report({savings:600}).oneMove.text,STAGES.cruise.nextAction);
  assert.equal(report({income:5350}).oneMove.text,STAGES.turbulence.nextAction.replace('1-3','1 to 3').replace('cash-flow','cash flow'));
});
test('dates cross month and year boundaries using local calendar dates', () => {
  const r=buildFlightReport(calculateFlightScore(base),{flightDate:'2026-12-15'}); assert.equal(r.nextCheckDate,'Jan 14, 2027');
});
test('every generated sentence is free of dash characters and negative currency', () => {
  const walk = value => {
    if (typeof value === 'string') { assert.doesNotMatch(value,/[-–—]/); assert.doesNotMatch(value,/-\$/); }
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  for (const values of [{}, {income:4200, needs:3200, wants:1200,savings:0,extraDebtPayment:100, emergencyFundSaved:200, investmentsCurrentValue:0}, {savings:1200,totalDebtBalance:0,emergencyFundSaved:20000}, {income:1}, {needs:0,emergencyFundSaved:0}]) walk(report(values));
});
