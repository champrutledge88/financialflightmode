import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateFlightScore} from './flightScoreCalculator.js';
import {buildFlightReport} from './flightReport.js';
import {buildSnapshotHTML} from './flightSnapshot.js';
import {actionLibrary} from './personalizedFlightPlan.js';
const base={income:6000,needs:3000,wants:1000,savings:600,extraDebtPayment:0,totalDebtBalance:24000,minimumDebtPayment:600,emergencyFundSaved:6000,emergencyFundGoal:9000,investmentsCurrentValue:3000};
const calculate=(changes={})=>calculateFlightScore({...base,...changes});
const report=(changes={})=>buildFlightReport(calculate(changes),{flightDate:'2026-11-04'});
test('assigning surplus never reduces affordability points and fully assigned is covered',()=>{
 for(const allocation of [0,100,500,1400]) {
  const r=calculate({savings:600+allocation});assert.equal(r.categoryScores.cashRemaining,25);
 }
 const r=report({savings:2000});assert.match(r.summary,/every dollar is assigned/);
 assert.match(r.plan.thisPayday,/before adding/);assert.equal(r.oneMove.text,r.plan.doNow);
 assert.equal(calculate({savings:2000.01}).categoryScores.cashRemaining,0);
});
test('personal emergency goal cannot change score, stage, warning priority or runway',()=>{
 const first=report({emergencyFundGoal:1000});
 for(const goal of [0,3000,6000,24000,100000]) {
  const r=report({emergencyFundGoal:goal});assert.equal(r.score,first.score);assert.equal(r.stage.key,first.stage.key);
  assert.deepEqual(r.plan.warningLights,first.plan.warningLights);assert.equal(r.runway.monthsCovered,2);
 }
 assert.notEqual(report({emergencyFundGoal:3000}).runway.goalProgress,report({emergencyFundGoal:12000}).runway.goalProgress);
});
test('runway points follow a fixed three month benchmark and do not assume protection with zero needs',()=>{
 for(const [months,points] of [[0,0],[.01,5],[.75,10],[1.5,15],[2.25,18],[3,20],[6,20]]) {
  assert.equal(calculate({emergencyFundSaved:3000*months}).categoryScores.emergencyFund,points);
 }
 const r=calculate({needs:0,emergencyFundSaved:200000});assert.equal(r.categoryScores.emergencyFund,0);assert.equal(r.metrics.runwayMonths,null);
});
test('debt points depend on required payment share, not balance size or extra payments',()=>{
 for(const [payment,points] of [[0,20],[600,20],[600.01,14],[1200,14],[1200.01,8],[2100,8],[2100.01,3]]) {
  const r=calculate({minimumDebtPayment:payment});assert.equal(r.categoryScores.debtPressure,points);
  assert.equal(calculate({minimumDebtPayment:payment,totalDebtBalance:200000,extraDebtPayment:200}).categoryScores.debtPressure,points);
 }
 assert.equal(calculate({totalDebtBalance:0,minimumDebtPayment:null}).categoryScores.debtPressure,20);
});
test('missing required payments are explicitly limited and never masquerade as confirmed zero',()=>{
 for(const value of [undefined,null,'']) {
  const r=report({minimumDebtPayment:value});assert.equal(r.debtAssessmentLimited,true);assert.match(r.readouts[2].text,/limited/);
  assert.match(buildSnapshotHTML(r),/Debt assessment limited/);
 }
 assert.equal(report({minimumDebtPayment:0}).debtAssessmentLimited,false);
});
test('minimum debt payment is a breakdown of needs and is not deducted twice',()=>{
 assert.equal(calculate({minimumDebtPayment:500}).metrics.cashRemaining,calculate({minimumDebtPayment:1500}).metrics.cashRemaining);
 assert.equal(calculate().metrics.cashRemaining,1400);
});
test('screen and standalone report share the same reason and complete canonical action',()=>{
 for(const input of [{},{needs:5000},{savings:2000},{minimumDebtPayment:null},{savings:300,emergencyFundSaved:0}]) {
  const r=report(input),html=buildSnapshotHTML(r);assert.equal(r.oneMove.text,r.plan.doNow);
  for(const text of [r.oneMove.text,r.reason,r.plan.thisPayday,r.plan.thirtyDayMission]) assert.ok(html.includes(text));
  assert.doesNotMatch(html,/<script|<form|<iframe|https?:\/\//i);
 }
 assert.equal(actionLibrary[1].thirtyDayMission,'Complete your planned savings transfer on each payday this month.');
});
test('negative cash retains stage safeguard regardless of investment balance',()=>{
 const r=report({needs:6000,savings:2000,investmentsCurrentValue:200000});
 assert.ok(['preflight','turbulence'].includes(r.stage.key));assert.equal(r.plan.warningLights[0],'Cash Flow Control');
 assert.match(r.plan.thisPayday,/essential bills/);
});
