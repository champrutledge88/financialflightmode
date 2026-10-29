import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCategoryRows as sum} from './categoryInputs.js';
import {calculateFlightScore} from './flightScoreCalculator.js';
import {buildFlightReport} from './flightReport.js';
import {buildSnapshotHTML} from './flightSnapshot.js';
test('category cents totals, zeros, blank rows and removal stay exact',()=>{
 assert.equal(sum([{label:'A',amount:'.10'},{label:'B',amount:'.20'},{label:'Unused',amount:''}]).total,.3);
 assert.equal(sum([{label:'A',amount:'0'}]).total,0);
 assert.equal(sum([{label:'A',amount:''}]).valid,false);
 assert.equal(sum([]).valid,false);
 assert.equal(sum([{label:'Named custom row',amount:'',requireAmount:true}]).valid,false);
 assert.equal(sum([{label:'B',amount:'.20'}]).total,.2);
 for(const amount of ['-1','unknown','1.234','Infinity','1000000000001'])assert.equal(sum([{label:'A',amount}]).valid,false);
 assert.equal(sum([{label:'',amount:'5'}]).valid,false);
});
test('cash and HYSA never enter invested total or emergency balance',()=>{
 const s=sum([{kind:'roth',label:'Roth',amount:'1500.10'},{kind:'brokerage',label:'Brokerage',amount:'999.90'},{kind:'cash',label:'HYSA',amount:'4000'}],{accounts:true});
 assert.equal(s.total,2500);assert.equal(s.cashTotal,4000);assert.equal(s.details.length,2);assert.equal(s.cashAccounts.length,1);
 assert.equal(sum([{kind:'roth',label:'HYSA',amount:'4000'}],{accounts:true}).valid,false);
 assert.equal(sum([{kind:'cash',label:'',amount:'100'}],{accounts:true}).total,0);
 assert.equal(sum([{kind:'bad',label:'X',amount:'100'}],{accounts:true}).valid,false);
});
test('category fixture preserves production score and exact download breakdown',()=>{
 const needs=sum([{label:'Housing',amount:1800},{label:'Utilities',amount:250},{label:'Insurance',amount:150},{label:'Groceries',amount:700},{label:'Minimum debt payments',amount:500}]);
 const wants=sum([{label:'Dining out',amount:300},{label:'Subscriptions',amount:300},{label:'Shopping',amount:600}]);
 const investments=sum([{kind:'roth',label:'Roth',amount:1500},{kind:'brokerage',label:'Brokerage',amount:1000},{kind:'cash',label:'HYSA',amount:4000}],{accounts:true});
 const v={income:6000,needs:needs.total,wants:wants.total,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:investments.total};
 const result=calculateFlightScore(v);assert.equal(result.score,71);assert.equal(result.stage.name,'Cruise Control');assert.equal(result.values.emergencyFundSaved,4000);
 const r=buildFlightReport(result,{flightDate:'2026-10-29',shortTermObjective:'Save more consistently',inputBreakdown:{needs:needs.details,wants:wants.details,investments:investments.details,cashAccounts:investments.cashAccounts}});
 assert.equal(r.oneMove.text,'Move $100 of unassigned cash into savings on payday.');
 const html=buildSnapshotHTML(r);assert.match(html,/HYSA/);assert.match(html,/Cash accounts for reference only/);assert.match(html,/not added to your Step 7 emergency balance/);
 r.breakdown.needs[0].label='<script>alert(1)</script>';assert.doesNotMatch(buildSnapshotHTML(r),/<script/);
});
