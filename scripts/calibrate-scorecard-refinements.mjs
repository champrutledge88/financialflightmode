import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {calculateFlightScore,getRelativeCategoryScores} from '../src/flightScoreCalculator.js';
import {generatePersonalizedFlightPlan} from '../src/personalizedFlightPlan.js';
const base='e26b6569358fc906bc283e93d49d16f4b690bd92';
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show',`${base}:${path}`])).toString('base64'));
const old=await load('src/flightScoreCalculator.js'),oldPlan=await load('src/personalizedFlightPlan.js');
const baseline={income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500};
const fixtures=[
 ['Landing example',{income:4800,needs:2800,wants:750,savings:400,extraDebtPayment:200,totalDebtBalance:14500,minimumDebtPayment:500,emergencyFundSaved:3000,emergencyFundGoal:6000,investmentsCurrentValue:3500}],
 ['Fully assigned',{...baseline,savings:1150,minimumDebtPayment:500}],
 ['Savings transfer',{...baseline,savings:1000,minimumDebtPayment:500}],
 ['Income shortfall',{...baseline,income:4200,minimumDebtPayment:500}],
 ['Smaller emergency goal',{...baseline,emergencyFundGoal:2000,minimumDebtPayment:500}],
 ['Larger emergency goal',{...baseline,emergencyFundGoal:16000,minimumDebtPayment:500}],
 ['Large debt, low payments',{...baseline,totalDebtBalance:100000,minimumDebtPayment:300}],
 ['Smaller debt, high payments',{...baseline,totalDebtBalance:10000,minimumDebtPayment:2200}],
 ['Unknown required payments',{...baseline,minimumDebtPayment:null}],
 ['No debt, strong reserves',{...baseline,income:8000,needs:2600,wants:1000,savings:1600,extraDebtPayment:0,totalDebtBalance:0,minimumDebtPayment:null,emergencyFundSaved:15000,emergencyFundGoal:15000,investmentsCurrentValue:40000}],
];
const summarize=(r,relative,engine,legacy=false)=>{
 const p=engine({derivedContext:{stageKey:r.stage.key,relativeScores:relative(r.categoryScores),pressureMetrics:{cashRemaining:r.metrics.cashRemaining,savingsRate:r.metrics.savingsRate,emergencyFundLevel:legacy?r.metrics.emergencyFundLevel:r.metrics.emergencyRunwayLevel}},immediatePressure:'Stable',shortTermObjective:''});
 return {score:r.score,stage:r.stage.name,priority:p.warningLights?.[0]?.category||'Ownership Mindset',categories:r.categoryScores};
};
const results=fixtures.map(([name,input])=>({name,input,before:summarize(old.calculateFlightScore(input),old.getRelativeCategoryScores,oldPlan.generatePersonalizedFlightPlan,true),after:summarize(calculateFlightScore(input),getRelativeCategoryScores,generatePersonalizedFlightPlan)}));
writeFileSync('docs/scorecard-refinements/calibration.json',JSON.stringify({base,version:'FFM 2 review',results},null,2)+'\n');
writeFileSync('docs/scorecard-refinements/calibration.md',`# Scorecard calibration\n\nSynthetic examples only. Baseline: ${base}. New debt thresholds are provisional FFM education rules, not lending standards. Unknown required payments receive 8/20 provisional points and an explicit limited assessment.\n\n| Scenario | Before | After | Priority before | Priority after |\n|---|---|---|---|---|\n`+results.map(r=>`| ${r.name} | ${r.before.score} · ${r.before.stage} | ${r.after.score} · ${r.after.stage} | ${r.before.priority} | ${r.after.priority} |`).join('\n')+'\n');
console.log('Calibrated '+results.length+' synthetic households.');
