import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {buildSnapshotHTML} from '../src/flightSnapshot.js';
import {calculateFlightScore} from '../src/flightScoreCalculator.js';
import {buildFlightReport} from '../src/flightReport.js';
const out=process.env.SCORECARD_EVIDENCE_DIR||'docs/scorecard-refinements/evidence';await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:process.env.FFM_SINGLE_PROCESS?['--single-process','--no-zygote','--in-process-gpu']:[]});
const checks=[];
const base={income:6000,needs:3400,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,minimumDebtPayment:500,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500};
try{
 const p=await b.newPage();
 for(const [name,changes,pressure] of [['baseline',{},'Stable'],['large-values',{income:1e12,needs:3e11,wants:1e11,savings:1e11,extraDebtPayment:1e11,totalDebtBalance:1e12,minimumDebtPayment:2e11,emergencyFundSaved:1e12,emergencyFundGoal:1e12,investmentsCurrentValue:1e12},'Unexpected bill'],['deficit',{income:4200,needs:4000,wants:1200,savings:2000,minimumDebtPayment:null},'Falling behind on a payment'],['no-needs',{needs:0,minimumDebtPayment:0},'Income disruption']]) {
  const report=buildFlightReport(calculateFlightScore({...base,...changes}),{flightDate:'2026-11-04',immediatePressure:pressure,shortTermObjective:'Save more consistently'});
  report.breakdown={needs:Array.from({length:20},()=>({label:'Category nickname '.repeat(5),amount:100})),wants:[],investments:[],cashAccounts:[]};
  await p.setContent(buildSnapshotHTML(report));
  for(const format of ['A4','Letter']){
   const file=`${out}/pagination-${name}-${format}.pdf`;await p.pdf({path:file,format,printBackground:true});
   const info=execFileSync('pdfinfo',[file],{encoding:'utf8'});const count=Number(info.match(/Pages:\s+(\d+)/)[1]);assert.equal(count,2,`${name}/${format}`);
   const page2=execFileSync('pdftotext',['-f','2','-l','2',file,'-'],{encoding:'utf8'});assert.match(page2,/Reflect on/);assert.match(page2,/What will I adjust before the next payday/);
   checks.push({name,format,pages:count,reflectOnPage2:true});
  }
 }
 await writeFile(`${out}/pagination-verification.json`,JSON.stringify({checks},null,2)+'\n');console.log(JSON.stringify(checks,null,2));
}finally{await b.close();}
