import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFlightScore } from './flightScoreCalculator.js';
import { buildCheckVisuals, renderCheckVisual } from './checkVisuals.js';
const base={income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,minimumDebtPayment:500,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500};
const visuals=(changes={})=>buildCheckVisuals(calculateFlightScore({...base,...changes}));
test('visuals explain real ratios without mutating score or inputs',()=>{
 const result=calculateFlightScore(base),before=JSON.stringify(result),v=buildCheckVisuals(result);
 assert.equal(JSON.stringify(result),before);assert.equal(v.length,6);
 assert.equal(v[0].fill,5350/6000*100);assert.equal(v[0].marker,100);
 assert.match(v[1].label,/8.3%/);assert.equal(v[1].marker,50);
 assert.match(v[2].label,/8.3%/);assert.equal(v[2].fill,(500/6000)/.3*100);
 assert.match(v[3].label,/1.2 months/);assert.equal(v[4].kind,'status');assert.equal(v[5].kind,'status');
});
test('unknown debt and runway have no misleading zero bars',()=>{
 assert.equal(visuals({minimumDebtPayment:null})[2].active,null);
 assert.equal(visuals({needs:0,minimumDebtPayment:0})[3].active,null);
 assert.equal(visuals({totalDebtBalance:0})[2].kind,'status');
});
test('extreme and zero values stay finite, visible and honest',()=>{
 for(const changes of [{income:1},{income:0},{income:0,needs:0,wants:0,savings:0,extraDebtPayment:0,minimumDebtPayment:0},{savings:12000},{emergencyFundSaved:1e7},{minimumDebtPayment:3000}]){
  for(const v of visuals(changes)){
   if(v.kind==='meter'){assert.ok(Number.isFinite(v.fill)&&v.fill>=0&&v.fill<=100);assert.ok(Number.isFinite(v.marker)&&v.marker>=0&&v.marker<=100);}
   assert.doesNotMatch(renderCheckVisual(v),/NaN|Infinity/);
  }
 }
 const v=visuals({income:4200});assert.equal(v[0].fill,100);assert.ok(v[0].marker<100);assert.match(v[0].note,/over income/);
});
test('habit checks do not invent progress or return',()=>{
 const v=visuals({extraDebtPayment:0,investmentsCurrentValue:0});assert.equal(v[4].active,false);assert.equal(v[5].active,false);assert.match(v[5].note,/not investment return/);
 assert.match(visuals({totalDebtBalance:0})[4].note,/does not require/);
});
